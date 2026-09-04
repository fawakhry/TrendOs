import { verifyEdgeSessionToken } from './edge-gateway.mjs';

const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

let schemaReadyPromise = null;

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

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
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
  return configured.length ? configured : DEFAULT_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-idempotency-key',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function bearerToken(request) {
  const header = text(request.headers.get('Authorization'));
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function writeEnabled(env) {
  return String(env.TRENDOS_CLOUD_WRITE_V1_ENABLED || '').toLowerCase() === 'true';
}

async function requireCloudWriteAuth(request, env) {
  const verified = await verifyEdgeSessionToken(bearerToken(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) {
    return {
      ok: false,
      response: json({ success: false, message: 'Unauthorized cloud write session', code: verified.reason }, 401, corsHeaders(request, env))
    };
  }
  return { ok: true, session: verified.payload };
}

async function ensureCloudWriteSchema(env) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const ddl = [
        `CREATE TABLE IF NOT EXISTS cloud_write_events (
          idempotency_key TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'd1_committed',
          actor TEXT NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          result_json TEXT NOT NULL DEFAULT '{}',
          sheets_status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          note TEXT NOT NULL DEFAULT ''
        )`,
        `CREATE INDEX IF NOT EXISTS idx_cloud_write_events_entity
          ON cloud_write_events(entity_type, entity_id, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_cloud_write_events_sheets_status
          ON cloud_write_events(sheets_status, updated_at DESC)`,
        `CREATE TABLE IF NOT EXISTS cloud_write_outbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_key TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_error TEXT NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(event_key) REFERENCES cloud_write_events(idempotency_key) ON DELETE CASCADE
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_write_outbox_event_unique
          ON cloud_write_outbox(event_key, operation)`,
        `CREATE INDEX IF NOT EXISTS idx_cloud_write_outbox_pending
          ON cloud_write_outbox(status, next_attempt_at, id)`
      ];
      for (const sql of ddl) await env.DB.prepare(sql).run();
      return true;
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

function stableRequestKey(request, body) {
  const headerKey = text(request.headers.get('x-idempotency-key'));
  const bodyKey = text(body.clientRequestId || body.idempotencyKey || body.requestId);
  const key = headerKey || bodyKey;
  if (!key) return '';
  return key.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 160);
}

function generatedOrderId() {
  return `CW-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function normalizeOrderBody(body, session) {
  const orderId = text(body.orderId || body.order_id || body['رقم الأوردر'] || generatedOrderId());
  const customerPhone = cleanPhone(body.customerPhone || body.phone || body['رقم الهاتف'] || body['رقم العميل الأساسي']);
  const customerName = text(body.customerName || body.name || body['اسم العميل'] || body['اسم الشات / المكتب']);
  const nowIso = new Date().toISOString();

  return {
    orderId,
    customerPhone,
    customerName,
    status: text(body.status || body.orderStatus || body['الحالة العامة'] || body['الحالة']) || 'cloud-draft',
    department: text(body.department || body['القسم']),
    priority: text(body.priority || body['الأولوية']),
    expectedDelivery: text(body.expectedDelivery || body['تاريخ التسليم المتوقع'] || body['الوقت المتوقع']),
    total: numberOrNull(body.total ?? body['الإجمالي']),
    remaining: numberOrNull(body.remaining ?? body['المتبقي'] ?? body['الباقي']),
    createdAt: text(body.createdAt || body['تاريخ الطلب']) || nowIso,
    updatedAt: nowIso,
    actor: text(session && session.sub),
    raw: {
      ...body,
      _cloudWriteV1: true,
      _cloudActor: text(session && session.sub),
      _cloudReceivedAt: nowIso
    }
  };
}

async function existingEvent(env, key) {
  return env.DB.prepare(`
    SELECT idempotency_key AS idempotencyKey,
           entity_type AS entityType,
           entity_id AS entityId,
           operation,
           status,
           actor,
           result_json AS resultJson,
           sheets_status AS sheetsStatus,
           created_at AS createdAt,
           updated_at AS updatedAt
      FROM cloud_write_events
     WHERE idempotency_key = ?
     LIMIT 1
  `).bind(key).first();
}

async function existingOrder(env, orderId) {
  return env.DB.prepare(`
    SELECT order_id AS orderId
      FROM orders
     WHERE order_id = ?
     LIMIT 1
  `).bind(orderId).first();
}

async function createCloudOrder(request, env, session) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    return json({ success: false, message: 'Invalid JSON body' }, 400, corsHeaders(request, env));
  }

  const requestKey = stableRequestKey(request, body);
  if (!requestKey) {
    return json({ success: false, message: 'clientRequestId or x-idempotency-key is required' }, 400, corsHeaders(request, env));
  }
  const idempotencyKey = `order:create:${requestKey}`;

  const previous = await existingEvent(env, idempotencyKey);
  if (previous) {
    return json({
      success: true,
      idempotent: true,
      event: previous,
      result: JSON.parse(previous.resultJson || '{}'),
      sheetsSync: previous.sheetsStatus || 'pending',
      dataSource: 'd1-cloud-write-v1'
    }, 200, corsHeaders(request, env));
  }

  const order = normalizeOrderBody(body, session);
  if (!order.orderId) return json({ success: false, message: 'orderId is required' }, 400, corsHeaders(request, env));

  const conflict = await existingOrder(env, order.orderId);
  if (conflict) {
    return json({
      success: false,
      message: 'Order already exists in D1; refusing non-idempotent overwrite',
      orderId: order.orderId
    }, 409, corsHeaders(request, env));
  }

  const eventResult = {
    orderId: order.orderId,
    status: order.status,
    customerPhone: order.customerPhone,
    customerName: order.customerName,
    updatedAt: order.updatedAt
  };
  const payloadJson = JSON.stringify(order.raw);
  const resultJson = JSON.stringify(eventResult);

  const statements = [];
  if (order.customerPhone) {
    statements.push(env.DB.prepare(`
      INSERT INTO customers (phone, customer_name, updated_at, raw_json)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(phone) DO UPDATE SET
        customer_name = CASE WHEN excluded.customer_name <> '' THEN excluded.customer_name ELSE customers.customer_name END,
        updated_at = CURRENT_TIMESTAMP,
        raw_json = excluded.raw_json
    `).bind(order.customerPhone, order.customerName, payloadJson));
  }

  statements.push(env.DB.prepare(`
    INSERT INTO orders (
      order_id, customer_phone, customer_name, status, department, priority,
      expected_delivery, total, remaining, created_at, updated_at, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(
    order.orderId,
    order.customerPhone,
    order.customerName,
    order.status,
    order.department,
    order.priority,
    order.expectedDelivery,
    order.total,
    order.remaining,
    order.createdAt,
    payloadJson
  ));

  statements.push(env.DB.prepare(`
    INSERT INTO cloud_write_events (
      idempotency_key, entity_type, entity_id, operation, status,
      actor, payload_json, result_json, sheets_status, created_at, updated_at, note
    ) VALUES (?, 'order', ?, 'create', 'd1_committed', ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
  `).bind(
    idempotencyKey,
    order.orderId,
    order.actor,
    payloadJson,
    resultJson,
    'D1 authoritative shadow write; Sheets sync pending'
  ));

  statements.push(env.DB.prepare(`
    INSERT INTO cloud_write_outbox (
      event_key, entity_type, entity_id, operation, status,
      attempts, next_attempt_at, payload_json, created_at, updated_at
    ) VALUES (?, 'order', ?, 'upsert_order_to_sheets', 'pending', 0, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(idempotencyKey, order.orderId, payloadJson));

  await env.DB.batch(statements);

  return json({
    success: true,
    idempotent: false,
    order: eventResult,
    event: {
      idempotencyKey,
      entityType: 'order',
      entityId: order.orderId,
      operation: 'create',
      status: 'd1_committed',
      actor: order.actor,
      sheetsStatus: 'pending'
    },
    sheetsSync: 'pending',
    dataSource: 'd1-cloud-write-v1'
  }, 201, corsHeaders(request, env));
}

async function listOutbox(request, env) {
  const url = new URL(request.url);
  const status = text(url.searchParams.get('status')) || 'pending';
  const limit = clampInt(url.searchParams.get('limit'), 50, 1, 200);
  const result = await env.DB.prepare(`
    SELECT id,
           event_key AS eventKey,
           entity_type AS entityType,
           entity_id AS entityId,
           operation,
           status,
           attempts,
           next_attempt_at AS nextAttemptAt,
           last_error AS lastError,
           created_at AS createdAt,
           updated_at AS updatedAt
      FROM cloud_write_outbox
     WHERE status = ?
     ORDER BY id ASC
     LIMIT ?
  `).bind(status, limit).all();
  return json({ success: true, outbox: result.results || [] }, 200, corsHeaders(request, env));
}

async function cloudWriteHealth(request, env) {
  await ensureCloudWriteSchema(env);
  let database = false;
  let pendingOutbox = 0;
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first();
    database = !!(row && Number(row.ok) === 1);
    const pending = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM cloud_write_outbox WHERE status = 'pending'"
    ).first();
    pendingOutbox = Number((pending && pending.count) || 0);
  } catch (err) {
    database = false;
  }

  return json({
    success: database,
    service: 'trendos-cloud-write-v1',
    database,
    enabled: writeEnabled(env),
    authConfigured: !!text(env.EDGE_SESSION_SECRET),
    writesAccepted: database && writeEnabled(env) && !!text(env.EDGE_SESSION_SECRET),
    pendingOutbox,
    cutover: false,
    sheetsAuthoritative: true,
    time: new Date().toISOString()
  }, database ? 200 : 503, corsHeaders(request, env));
}

export function isCloudWritePath(path) {
  return path === '/v1/cloud/write/health' ||
    path === '/v1/cloud/write/outbox' ||
    path === '/v1/cloud/orders';
}

export async function handleCloudWriteRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && path === '/v1/cloud/write/health') {
      // Await inside the try/catch so asynchronous schema/DB failures are converted
      // into the normal fail-closed JSON 500 response instead of escaping the Worker.
      return await cloudWriteHealth(request, env);
    }

    await ensureCloudWriteSchema(env);

    if (!writeEnabled(env)) {
      return json({
        success: false,
        message: 'Cloud write lane is installed but disabled',
        enabled: false,
        cutover: false
      }, 423, cors);
    }

    const auth = await requireCloudWriteAuth(request, env);
    if (!auth.ok) return auth.response;

    if (request.method === 'POST' && path === '/v1/cloud/orders') {
      return await createCloudOrder(request, env, auth.session);
    }

    if (request.method === 'GET' && path === '/v1/cloud/write/outbox') {
      return await listOutbox(request, env);
    }

    return json({ success: false, message: 'Cloud write route not found' }, 404, cors);
  } catch (err) {
    return json({ success: false, message: err && err.message ? err.message : String(err) }, 500, cors);
  }
}
