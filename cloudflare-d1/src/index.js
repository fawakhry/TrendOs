const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const allowed = configured.length ? configured : DEFAULT_ORIGINS;
  const isAllowed = allowed.includes(origin);
  return {
    'access-control-allow-origin': isAllowed ? origin : allowed[0],
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-migration-secret,authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  return digits;
}

function clampInt(value, fallback, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function requireMigrationSecret(request, env) {
  const expected = String(env.MIGRATION_SECRET || '').trim();
  const supplied = String(request.headers.get('x-migration-secret') || '').trim();
  return !!expected && supplied === expected;
}

async function getHealth(env) {
  const row = await env.DB.prepare('SELECT 1 AS ok').first();
  return {
    success: true,
    service: 'trendos-d1',
    database: !!(row && row.ok === 1),
    time: new Date().toISOString()
  };
}

async function getOrderById(env, orderId) {
  return env.DB.prepare(`
    SELECT order_id AS orderId,
           customer_phone AS customerPhone,
           customer_name AS customerName,
           status,
           department,
           priority,
           expected_delivery AS expectedDelivery,
           total,
           remaining,
           created_at AS createdAt,
           updated_at AS updatedAt
      FROM orders
     WHERE order_id = ?
     LIMIT 1
  `).bind(String(orderId || '').trim()).first();
}

async function listOrders(env, url) {
  const phone = cleanPhone(url.searchParams.get('phone'));
  const status = String(url.searchParams.get('status') || '').trim();
  const limit = clampInt(url.searchParams.get('limit'), 50, 1, 200);
  let sql = `
    SELECT order_id AS orderId,
           customer_phone AS customerPhone,
           customer_name AS customerName,
           status,
           department,
           priority,
           expected_delivery AS expectedDelivery,
           total,
           remaining,
           created_at AS createdAt,
           updated_at AS updatedAt
      FROM orders
     WHERE 1=1`;
  const params = [];
  if (phone) {
    sql += ' AND customer_phone = ?';
    params.push(phone);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY updated_at DESC LIMIT ?';
  params.push(limit);
  const result = await env.DB.prepare(sql).bind(...params).all();
  return result.results || [];
}

async function getCustomer(env, phone) {
  return env.DB.prepare(`
    SELECT phone,
           customer_name AS customerName,
           customer_code AS customerCode,
           whatsapp_id AS whatsappId,
           updated_at AS updatedAt
      FROM customers
     WHERE phone = ?
     LIMIT 1
  `).bind(cleanPhone(phone)).first();
}

async function listMessages(env, url) {
  const phone = cleanPhone(url.searchParams.get('phone'));
  if (!phone) throw new Error('phone is required');
  const limit = clampInt(url.searchParams.get('limit'), 100, 1, 300);
  const result = await env.DB.prepare(`
    SELECT id,
           phone,
           customer_name AS customerName,
           order_id AS orderId,
           direction,
           text,
           at,
           source,
           send_status AS sendStatus,
           meta_id AS metaId,
           needs_manager AS needsManager,
           reason,
           by_user AS byUser
      FROM messages
     WHERE phone = ?
     ORDER BY at DESC
     LIMIT ?
  `).bind(phone, limit).all();
  return (result.results || []).reverse();
}

async function listInbox(env, url) {
  const limit = clampInt(url.searchParams.get('limit'), 80, 1, 200);
  const result = await env.DB.prepare(`
    SELECT phone,
           customer_name AS customerName,
           order_id AS orderId,
           status,
           last_message AS lastMessage,
           last_at AS lastAt,
           direction,
           needs_manager AS needsManager,
           reason,
           owner
      FROM conversations
     ORDER BY last_at DESC
     LIMIT ?
  `).bind(limit).all();
  return result.results || [];
}

function customerStatement(env, row) {
  const phone = cleanPhone(row.phone || row.customerPhone || row['الهاتف']);
  if (!phone) return null;
  const name = String(row.customerName || row.name || row['اسم العميل'] || '');
  const code = String(row.customerCode || row['كود العميل'] || '');
  const wa = String(row.whatsappId || row.wa_id || '');
  return env.DB.prepare(`
    INSERT INTO customers (phone, customer_name, customer_code, whatsapp_id, updated_at, raw_json)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(phone) DO UPDATE SET
      customer_name = excluded.customer_name,
      customer_code = excluded.customer_code,
      whatsapp_id = excluded.whatsapp_id,
      updated_at = CURRENT_TIMESTAMP,
      raw_json = excluded.raw_json
  `).bind(phone, name, code, wa, JSON.stringify(row));
}

function orderStatement(env, row) {
  const orderId = String(row.orderId || row.order_id || row['رقم الأوردر'] || '').trim();
  if (!orderId) return null;
  const phone = cleanPhone(row.customerPhone || row.phone || row['رقم الهاتف'] || row['رقم العميل الأساسي']);
  const name = String(row.customerName || row['اسم العميل'] || row['اسم الشات / المكتب'] || '');
  const status = String(row.status || row.orderStatus || row['الحالة العامة'] || row['الحالة'] || '');
  const department = String(row.department || row['القسم'] || '');
  const priority = String(row.priority || row['الأولوية'] || '');
  const expected = String(row.expectedDelivery || row['تاريخ التسليم المتوقع'] || row['الوقت المتوقع'] || '');
  const total = numberOrNull(row.total ?? row['الإجمالي']);
  const remaining = numberOrNull(row.remaining ?? row['المتبقي'] ?? row['الباقي']);
  const createdAt = String(row.createdAt || row['تاريخ الطلب'] || '');
  return env.DB.prepare(`
    INSERT INTO orders (
      order_id, customer_phone, customer_name, status, department, priority,
      expected_delivery, total, remaining, created_at, updated_at, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(order_id) DO UPDATE SET
      customer_phone = excluded.customer_phone,
      customer_name = excluded.customer_name,
      status = excluded.status,
      department = excluded.department,
      priority = excluded.priority,
      expected_delivery = excluded.expected_delivery,
      total = excluded.total,
      remaining = excluded.remaining,
      created_at = CASE WHEN excluded.created_at <> '' THEN excluded.created_at ELSE orders.created_at END,
      updated_at = CURRENT_TIMESTAMP,
      raw_json = excluded.raw_json
  `).bind(orderId, phone, name, status, department, priority, expected, total, remaining, createdAt, JSON.stringify(row));
}

function messageStatement(env, row) {
  const id = String(row.id || row.ID || '').trim();
  const phone = cleanPhone(row.phone || row['الهاتف']);
  if (!id || !phone) return null;
  const metaId = String(row.metaId || row['Meta Message ID'] || '');
  return env.DB.prepare(`
    INSERT INTO messages (
      id, phone, customer_name, order_id, direction, text, at, source,
      send_status, meta_id, needs_manager, reason, by_user, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      phone = excluded.phone,
      customer_name = excluded.customer_name,
      order_id = excluded.order_id,
      direction = excluded.direction,
      text = excluded.text,
      at = excluded.at,
      source = excluded.source,
      send_status = excluded.send_status,
      meta_id = excluded.meta_id,
      needs_manager = excluded.needs_manager,
      reason = excluded.reason,
      by_user = excluded.by_user,
      raw_json = excluded.raw_json
  `).bind(
    id,
    phone,
    String(row.customerName || row['اسم العميل'] || ''),
    String(row.orderId || row['رقم الأوردر'] || ''),
    String(row.direction || row['الاتجاه'] || 'in'),
    String(row.text || row['النص'] || ''),
    String(row.at || row['الوقت'] || new Date().toISOString()),
    String(row.source || row['المصدر'] || 'TrendOS'),
    String(row.sendStatus || row['حالة الإرسال'] || ''),
    metaId,
    row.needsManager === true || row.needsManager === 'نعم' || row['يحتاج مدير؟'] === 'نعم' ? 1 : 0,
    String(row.reason || row['سبب التصعيد'] || ''),
    String(row.byUser || row['بواسطة'] || ''),
    JSON.stringify(row)
  );
}

function conversationStatement(env, row) {
  const phone = cleanPhone(row.phone || row['الهاتف']);
  if (!phone) return null;
  return env.DB.prepare(`
    INSERT INTO conversations (
      phone, customer_name, order_id, status, last_message, last_at,
      direction, needs_manager, reason, owner, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE SET
      customer_name = excluded.customer_name,
      order_id = excluded.order_id,
      status = excluded.status,
      last_message = excluded.last_message,
      last_at = excluded.last_at,
      direction = excluded.direction,
      needs_manager = excluded.needs_manager,
      reason = excluded.reason,
      owner = excluded.owner,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    phone,
    String(row.customerName || row['اسم العميل'] || ''),
    String(row.orderId || row['رقم الأوردر'] || ''),
    String(row.status || row['الحالة'] || ''),
    String(row.lastMessage || row['آخر رسالة'] || ''),
    String(row.lastAt || row['آخر وقت'] || new Date().toISOString()),
    String(row.direction || row['آخر اتجاه'] || 'in'),
    row.needsManager === true || row.needsManager === 'نعم' || row['يحتاج مدير؟'] === 'نعم' ? 1 : 0,
    String(row.reason || row['سبب التصعيد'] || ''),
    String(row.owner || row['المسؤول'] || '')
  );
}

async function importBatch(request, env) {
  if (!requireMigrationSecret(request, env)) {
    return { response: json({ success: false, message: 'Unauthorized import' }, 401), counts: null };
  }
  const body = await request.json();
  const groups = [
    ['customers', customerStatement],
    ['orders', orderStatement],
    ['messages', messageStatement],
    ['conversations', conversationStatement]
  ];
  const counts = {};

  for (const [name, builder] of groups) {
    const rows = Array.isArray(body[name]) ? body[name] : [];
    const statements = rows.map((row) => builder(env, row)).filter(Boolean);
    counts[name] = statements.length;
    if (statements.length) {
      await env.DB.batch(statements);
      await env.DB.prepare(
        'INSERT INTO migration_runs (entity, row_count, note) VALUES (?, ?, ?)'
      ).bind(name, statements.length, String(body.note || '')).run();
    }
  }

  return { response: null, counts };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (request.method === 'GET' && path === '/health') {
        return json(await getHealth(env), 200, cors);
      }

      if (request.method === 'GET' && path.startsWith('/v1/orders/')) {
        const orderId = decodeURIComponent(path.slice('/v1/orders/'.length));
        const order = await getOrderById(env, orderId);
        return order ? json({ success: true, order }, 200, cors) : json({ success: false, message: 'Order not found' }, 404, cors);
      }

      if (request.method === 'GET' && path === '/v1/orders') {
        return json({ success: true, orders: await listOrders(env, url) }, 200, cors);
      }

      if (request.method === 'GET' && path === '/v1/customer') {
        const customer = await getCustomer(env, url.searchParams.get('phone'));
        return customer ? json({ success: true, customer }, 200, cors) : json({ success: false, message: 'Customer not found' }, 404, cors);
      }

      if (request.method === 'GET' && path === '/v1/messages') {
        return json({ success: true, messages: await listMessages(env, url) }, 200, cors);
      }

      if (request.method === 'GET' && path === '/v1/inbox') {
        return json({ success: true, conversations: await listInbox(env, url) }, 200, cors);
      }

      if (request.method === 'POST' && path === '/v1/import/batch') {
        const imported = await importBatch(request, env);
        if (imported.response) {
          const headers = new Headers(imported.response.headers);
          Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
          return new Response(imported.response.body, { status: imported.response.status, headers });
        }
        return json({ success: true, imported: imported.counts }, 200, cors);
      }

      return json({ success: false, message: 'Not found' }, 404, cors);
    } catch (err) {
      return json({ success: false, message: err && err.message ? err.message : String(err) }, 500, cors);
    }
  }
};
