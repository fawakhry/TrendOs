const ENTITY_BUILDERS = [
  ['customers', customerStatement],
  ['orders', orderStatement],
  ['messages', messageStatement],
  ['conversations', conversationStatement]
];

function text(value) {
  return String(value == null ? '' : value).trim();
}

function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

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

function configuredOrigins(env) {
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : ['https://fawakhry.github.io'];
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-migration-secret',
    vary: 'Origin'
  };
}

function authorized(request, env) {
  const expected = text(env.MIGRATION_SECRET);
  const supplied = text(request.headers.get('x-migration-secret'));
  return !!expected && supplied === expected;
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

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function sourceCount(body, name, fallback) {
  const map = body && body.sourceRowCounts && typeof body.sourceRowCounts === 'object'
    ? body.sourceRowCounts
    : {};
  const n = Number(map[name]);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
}

function completionNote(body, name, importedRows, sourceRows) {
  return JSON.stringify({
    kind: 'normalized-live-sync-v1',
    syncRunId: text(body.syncRunId),
    entity: name,
    sourceRowCount: sourceRows,
    importedRows,
    final: true,
    note: text(body.note)
  });
}

export function isNormalizedImportPath(path) {
  return path === '/v1/import/batch';
}

export async function handleNormalizedImportRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405, cors);
  if (!authorized(request, env)) {
    return json({ success: false, message: 'Unauthorized import', schemaMutationFree: true }, 401, cors);
  }

  try {
    const body = await request.json();
    const syncFinal = body.syncFinal !== false;
    const syncRunId = text(body.syncRunId);
    if (!syncFinal && !syncRunId) {
      return json({ success: false, message: 'syncRunId is required for non-final chunks' }, 400, cors);
    }

    const counts = {};
    const completedEntities = [];
    const statements = [];

    for (const [name, builder] of ENTITY_BUILDERS) {
      if (!hasOwn(body, name)) continue;
      const rows = Array.isArray(body[name]) ? body[name] : [];
      const entityStatements = rows.map((row) => builder(env, row)).filter(Boolean);
      if (entityStatements.length !== rows.length) {
        return json({
          success: false,
          message: `Normalized ${name} chunk contains invalid source rows`,
          entity: name,
          sourceRows: rows.length,
          validRows: entityStatements.length,
          freshnessAdvanced: false
        }, 422, cors);
      }
      counts[name] = entityStatements.length;
      statements.push(...entityStatements);

      if (syncFinal) {
        const sourceRows = sourceCount(body, name, rows.length);
        statements.push(env.DB.prepare(
          'INSERT INTO migration_runs (entity, row_count, note) VALUES (?, ?, ?)'
        ).bind(name, sourceRows, completionNote(body, name, entityStatements.length, sourceRows)));
        completedEntities.push(name);
      }
    }

    if (!Object.keys(counts).length) {
      return json({ success: false, message: 'At least one normalized entity array is required' }, 400, cors);
    }

    if (statements.length) await env.DB.batch(statements);

    return json({
      success: true,
      imported: counts,
      sync: {
        runId: syncRunId,
        final: syncFinal,
        freshnessAdvanced: syncFinal,
        completedEntities
      }
    }, 200, cors);
  } catch (err) {
    return json({ success: false, message: err && err.message ? err.message : String(err) }, 500, cors);
  }
}
