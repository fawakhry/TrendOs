import assert from 'node:assert/strict';
import {
  inspectServiceOrdersCatalog,
  mapServiceOrdersRows,
  handleEdgeOrdersServiceReadRequest,
  SERVICE_ORDERS_READ_PATH
} from '../src/edge-orders-service-read-v1.mjs';
import { issueOrdersEdgeToken } from '../src/edge-orders-read-v1.mjs';

const SECRET = 'service-test-secret-123456789';
const NOW = Date.UTC(2026, 8, 13, 18, 0, 0);

const headers = [
  'رقم الأوردر','كود الأوردر','تاريخ الإنشاء','اسم الشات / المكتب','اسم المسؤول','رقم العميل','رقم عميل خارجي','نوع العميل',
  'القسم الرئيسي','وصف مختصر','الأولوية','الحالة العامة','آخر تحديث','عدد البنود','بنود جاهزة','بنود غير جاهزة','تسليم جزئي؟',
  'الكيان المنفذ الرئيسي','ملاحظات','تاريخ الاستلام','تاريخ التسليم المتوقع','مصدر الطلب','نوع إدخال العميل','علامة العميل الخارجي'
];

function row(rowNumber, values) {
  return { rowNumber, values: values.slice(), display: values.map((v) => String(v == null ? '' : v)) };
}
function values(overrides = {}) {
  const v = Array(headers.length).fill('');
  const set = (name, value) => { v[headers.indexOf(name)] = value; };
  set('رقم الأوردر', overrides.orderId || '5001');
  set('كود الأوردر', overrides.orderCode || overrides.orderId || '5001');
  set('اسم الشات / المكتب', overrides.customer || 'عميل');
  set('رقم العميل', overrides.phone || '01012345678');
  set('القسم الرئيسي', overrides.department || 'طباعة');
  set('وصف مختصر', overrides.summary || 'شغل');
  set('الأولوية', overrides.priority || 'عادي');
  set('الحالة العامة', overrides.status || 'طلب جديد');
  set('آخر تحديث', overrides.updated || '2026-09-13T17:55:00.000Z');
  set('عدد البنود', overrides.lineCount == null ? '1' : overrides.lineCount);
  set('ملاحظات', overrides.notes || '');
  set('تاريخ الاستلام', overrides.received || '9/13/2026');
  set('تاريخ التسليم المتوقع', overrides.expected || '9/15/2026');
  set('مصدر الطلب', overrides.source || 'داخلي');
  set('نوع إدخال العميل', overrides.entryType === undefined ? 'مسجل' : overrides.entryType);
  return v;
}

{
  const mapped = mapServiceOrdersRows(headers, [
    row(2, values({ orderId: 'LEGACY', entryType: '', source: '' })),
    row(3, values({ orderId: '5001', priority: 'عادي', updated: '2026-09-13T17:00:00.000Z' })),
    row(4, values({ orderId: '5002', priority: 'عاجل', updated: '2026-09-12T17:00:00.000Z' })),
    row(5, values({ orderId: '5003', status: 'تم التسليم' })),
    row(6, values({ orderId: 'CW-PROD-QUAL-1', status: 'cloud-qualification', priority: 'qualification', entryType: '', source: '' }))
  ]);
  assert.deepEqual(mapped.map((x) => x.orderId), ['5002','5001','CW-PROD-QUAL-1']);
  assert.equal(mapped[1].lineId, '01012345678');
  assert.equal(mapped[1].customerPhone, '01012345678');
  assert.equal(mapped[1].status, 'طلب جديد');
  console.log('SERVICE_MODERN_SHAPE_FILTER=PASS');
}

{
  const fresh = inspectServiceOrdersCatalog({
    status: 'ready', rowCount: 514, sourceLastRow: 514, sourceLastCol: 67,
    syncedAt: '2026-09-13 17:55:00', note: 'TrendOS orders live sync V2 quota-aware'
  }, NOW, 600);
  assert.equal(fresh.ready, true);
  const stale = inspectServiceOrdersCatalog({
    status: 'ready', rowCount: 514, sourceLastRow: 514, sourceLastCol: 67,
    syncedAt: '2026-09-13 17:40:00', note: 'TrendOS orders live sync V2 quota-aware'
  }, NOW, 600);
  assert.equal(stale.ready, false);
  assert.equal(stale.fresh, false);
  const parityBad = inspectServiceOrdersCatalog({
    status: 'ready', rowCount: 513, sourceLastRow: 514, sourceLastCol: 67,
    syncedAt: '2026-09-13 17:55:00', note: 'TrendOS orders live sync V2 quota-aware'
  }, NOW, 600);
  assert.equal(parityBad.ready, false);
  assert.equal(parityBad.parity, false);
  console.log('SERVICE_FRESHNESS_FAIL_CLOSED=PASS');
}

function dbMock({ stale = false } = {}) {
  const catalog = {
    headersJson: JSON.stringify(headers), sourceLastRow: 3, sourceLastCol: headers.length,
    rowCount: 3, status: 'ready', syncedAt: stale ? '2020-01-01 00:00:00' : new Date().toISOString(),
    note: 'TrendOS orders live sync V2 quota-aware'
  };
  const rows = [
    row(1, headers),
    row(2, values({ orderId: '6001', priority: 'عاجل' })),
    row(3, values({ orderId: '6002', priority: 'عادي' }))
  ];
  let writes = 0;
  return {
    get writes() { return writes; },
    prepare(sql) {
      const normalized = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE)\b/.test(normalized)) writes += 1;
      return {
        bind() {
          return {
            first: async () => ({ ...catalog }),
            all: async () => ({ results: rows.map((r) => ({
              rowNumber: r.rowNumber,
              valuesJson: JSON.stringify(r.values),
              displayJson: JSON.stringify(r.display)
            })) })
          };
        }
      };
    }
  };
}

async function edgeToken(screens) {
  return issueOrdersEdgeToken({ sub: 'qa', role: 'admin', department: '', screens }, SECRET, Math.floor(Date.now()/1000), 600);
}

{
  const db = dbMock();
  const token = await edgeToken(['service']);
  const request = new Request('https://worker.example'+SERVICE_ORDERS_READ_PATH+'?screen=service&page=1&pageSize=100&statusFilter=__ACTIVE__', {
    headers: { authorization: 'Bearer '+token }
  });
  const response = await handleEdgeOrdersServiceReadRequest(request, { DB: db, EDGE_SESSION_SECRET: SECRET, EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS: '600' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.dataSource, 'd1-edge-orders-service-v1');
  assert.equal(body.pagination.totalRows, 2);
  assert.equal(body.rows.length, 2);
  assert.equal(db.writes, 0);
  console.log('SERVICE_READ_ONLY_HANDLER=PASS');
}

{
  const db = dbMock();
  const token = await edgeToken(['service']);
  const request = new Request('https://worker.example'+SERVICE_ORDERS_READ_PATH+'?screen=service&statusFilter=__DEBT__', {
    headers: { authorization: 'Bearer '+token }
  });
  const response = await handleEdgeOrdersServiceReadRequest(request, { DB: db, EDGE_SESSION_SECRET: SECRET });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.fallback, 'apps-script');
  assert.equal(db.writes, 0);
  console.log('SERVICE_DEBT_FALLBACK=PASS');
}

{
  const db = dbMock({ stale: true });
  const token = await edgeToken(['service']);
  const request = new Request('https://worker.example'+SERVICE_ORDERS_READ_PATH+'?screen=service&statusFilter=__ACTIVE__', {
    headers: { authorization: 'Bearer '+token }
  });
  const response = await handleEdgeOrdersServiceReadRequest(request, { DB: db, EDGE_SESSION_SECRET: SECRET });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.fallback, 'apps-script');
  assert.equal(body.code, 'stale-orders-mirror');
  assert.equal(db.writes, 0);
  console.log('SERVICE_STALE_FALLBACK=PASS');
}

{
  const db = dbMock();
  const token = await edgeToken(['print']);
  const request = new Request('https://worker.example'+SERVICE_ORDERS_READ_PATH+'?screen=service', {
    headers: { authorization: 'Bearer '+token }
  });
  const response = await handleEdgeOrdersServiceReadRequest(request, { DB: db, EDGE_SESSION_SECRET: SECRET });
  assert.equal(response.status, 403);
  assert.equal(db.writes, 0);
  console.log('SERVICE_SCREEN_AUTH=PASS');
}

console.log('T11_SERVICE_D1_READ_CONTRACT=PASS');
