import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { handleEdgeOrders02CRCanaryRequest, isEdgeOrders02CRPath } from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';

const LINES_NOTE = 'TrendOS orders live sync V2 quota-aware';
const ENRICHMENT_NOTE = 'PERF-CF-02CR enrichment live sync V1';

function row(rowNumber, values) {
  return { rowNumber, valuesJson: JSON.stringify(values), displayJson: JSON.stringify(values) };
}

const lineHeaders = [
  'رقم الأوردر','كود الأوردر','اسم الشات / المكتب','اسم المسؤول','القسم','رقم البند','اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟','آخر تحديث','ملاحظات','x15','x16','رقم العميل','مكبس حراري','ملاحظات المديونية'
];
const lineData = ['5001','5001','عميل اختبار','','طباعة','5001-01','مج','1','وائل','عادي','طلب جديد','','2026/09/06','','','','','لا',''];
const customerHeaders = ['اسم الشات / المكتب','رقم العميل الأساسي','رقم إضافي','مديونية','ملاحظات المديونية'];
const customerData = ['عميل اختبار','01011111111','','350','مراجعة حساب'];
const restrictionHeaders = ['ID','اسم العميل','رقم العميل','منع فعال؟','سبب المنع','صالح حتى'];
const restrictionData = ['R1','عميل اختبار','','نعم','مراجعة المديونية','2099/12/31'];

function mirror(headers, data, note) {
  return {
    catalog: {
      headersJson: JSON.stringify(headers),
      sourceLastRow: 2,
      sourceLastCol: headers.length,
      rowCount: 2,
      status: 'ready',
      syncedAt: '2026-09-06 01:00:00',
      note
    },
    rows: [row(1, headers), row(2, data)]
  };
}

function fakeEnv(overrides = {}) {
  const mirrors = {
    'بنود الأوردرات': mirror(lineHeaders, lineData, LINES_NOTE),
    'العملاء': mirror(customerHeaders, customerData, ENRICHMENT_NOTE),
    'عملاء منع التسليم بالمديونية': mirror(restrictionHeaders, restrictionData, ENRICHMENT_NOTE),
    ...(overrides.mirrors || {})
  };
  return {
    EDGE_SESSION_SECRET: 'test-secret-02cr',
    DB: {
      prepare(sql) {
        const isCatalog = /FROM\s+sheet_catalog/i.test(sql);
        const isRows = /FROM\s+sheet_rows/i.test(sql);
        return {
          bind(sheetName) {
            return {
              async first() {
                if (!isCatalog) return null;
                return mirrors[sheetName] ? { ...mirrors[sheetName].catalog } : null;
              },
              async all() {
                if (!isRows) return { results: [] };
                return { results: mirrors[sheetName] ? mirrors[sheetName].rows.map((x) => ({ ...x })) : [] };
              }
            };
          }
        };
      }
    }
  };
}

assert.equal(isEdgeOrders02CRPath('/v1/edge/orders/02cr/page'), true);
assert.equal(isEdgeOrders02CRPath('/v1/edge/orders/page'), false);

const token = await issueOrdersEdgeToken({ sub:'tester', role:'print', department:'طباعة', screens:['print'] }, 'test-secret-02cr', Math.floor(Date.now()/1000), 600);
async function call(query, env = fakeEnv()) {
  const req = new Request('https://example.test/v1/edge/orders/02cr/page?screen=print&page=1&pageSize=20' + (query ? '&' + query : ''), {
    method:'GET', headers:{ authorization:'Bearer ' + token, origin:'https://fawakhry.github.io' }
  });
  const res = await handleEdgeOrders02CRCanaryRequest(req, env);
  return { res, body: await res.json() };
}

const main = await call('');
assert.equal(main.res.status, 200);
const body = main.body;
assert.equal(body.success, true);
assert.equal(body.version, 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY');
assert.equal(body.rows.length, 1);
assert.equal(body.rows[0].orderId, '5001');
assert.equal(body.rows[0].lineId, '5001-01');
assert.equal(body.rows[0].customerPhone, '01011111111');
assert.equal(body.rows[0].debtAmount, 350);
assert.equal(body.rows[0].deliveryDebtRestricted, true);
assert.equal(body.rows[0].debtRestrictionReason, 'مراجعة المديونية');
assert.equal(body.rows[0].debtNotes, 'مراجعة حساب');
assert.equal(body.statusCounts['طلب جديد'], 1);
assert.equal(body.statusOrderCounts['طلب جديد'], 1);
assert.equal(body.pagination.totalRows, 1);
assert.equal(body.activeSummaryCounts.total, 1);
assert.equal(body.activeSummaryCounts.orderCount, 1);
assert.equal(body.mirrors.length, 3);

assert.equal((await call('query=5001')).body.pagination.totalRows, 1);
const notFound = (await call('query=NOTFOUND')).body;
assert.equal(notFound.pagination.totalRows, 0);
assert.equal(notFound.activeSummaryCounts.total, 1, 'global active summary must not collapse with page/search filtering');
assert.equal((await call('statusFilter=__ACTIVE__')).body.pagination.totalRows, 1);
assert.equal((await call('statusFilter=تم%20التسليم')).body.pagination.totalRows, 0);
assert.equal((await call('priorityFilter=عاجل')).body.pagination.totalRows, 0);
assert.equal((await call('priorityFilter=عادي')).body.pagination.totalRows, 1);
assert.equal((await call('heatPressFilter=only')).body.pagination.totalRows, 0);
assert.equal((await call('heatPressFilter=without')).body.pagination.totalRows, 1);

const debtReq = new Request('https://example.test/v1/edge/orders/02cr/page?screen=print&statusFilter=__DEBT__', {
  method:'GET', headers:{ authorization:'Bearer ' + token }
});
const debtRes = await handleEdgeOrders02CRCanaryRequest(debtReq, fakeEnv());
assert.equal(debtRes.status, 409);
assert.equal((await debtRes.json()).fallback, 'apps-script');

const staleCustomers = mirror(customerHeaders, customerData, 'old-full-mirror');
const staleRes = await call('', fakeEnv({ mirrors:{ 'العملاء':staleCustomers } }));
assert.equal(staleRes.res.status, 503);
assert.equal(staleRes.body.fallback, 'apps-script');

const wrongLines = mirror(lineHeaders, lineData, ENRICHMENT_NOTE);
const wrongLinesRes = await call('', fakeEnv({ mirrors:{ 'بنود الأوردرات':wrongLines } }));
assert.equal(wrongLinesRes.res.status, 503, '02CR must not accept ownership of the Orders V2 line mirror');

const unauth = await handleEdgeOrders02CRCanaryRequest(new Request('https://example.test/v1/edge/orders/02cr/page?screen=print'), fakeEnv());
assert.equal(unauth.status, 401);

console.log('PERF_CF_02CR_OPERATIONAL_CANARY_CONTRACT_PASS');
