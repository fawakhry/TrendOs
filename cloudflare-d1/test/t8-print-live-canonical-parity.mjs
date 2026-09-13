import assert from 'node:assert/strict';

const base = String(process.env.PROD_URL || '').trim();
const apps = String(process.env.APPS_SCRIPT_URL || '').trim();
const username = String(process.env.QUALIFY_USERNAME || '').trim();
const password = String(process.env.QUALIFY_PASSWORD || '');
const EPOCH = Date.UTC(1899, 11, 30);
const DAY = 24 * 60 * 60 * 1000;

function text(value) { return String(value == null ? '' : value).trim(); }
function canonicalLineId(orderId, lineId) {
  const order = text(orderId);
  const line = text(lineId);
  if (!/^\d{3,6}$/.test(order) || !/^\d{5,8}$/.test(line)) return line;
  const serial = Number(line);
  if (!Number.isSafeInteger(serial) || serial <= 0) return line;
  const d = new Date(EPOCH + serial * DAY);
  if (!Number.isFinite(d.getTime())) return line;
  const year = String(d.getUTCFullYear());
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (year !== order || day !== 1 || month < 1 || month > 12) return line;
  return `${order}-${String(month).padStart(2, '0')}`;
}
function key(row) {
  return [text(row && row.orderId), canonicalLineId(row && row.orderId, row && row.lineId), text(row && row.status)].join('|');
}
async function request(url, options = {}) {
  const started = Date.now();
  const response = await fetch(url, { cache: 'no-store', redirect: 'follow', ...options });
  const ms = Date.now() - started;
  const raw = await response.text();
  let body = {};
  try { body = JSON.parse(raw || '{}'); } catch {}
  return { status: response.status, body, ms };
}
async function login() {
  for (let n = 1; n <= 4; n += 1) {
    const response = await request(apps, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const token = text(response.body && response.body.user && response.body.user.token);
    if (response.status === 200 && response.body.success === true && token) {
      console.log(`::add-mask::${token}`);
      return token;
    }
  }
  throw new Error('fresh login failed');
}
async function edgeSession() {
  for (let n = 1; n <= 4; n += 1) {
    const token = await login();
    const response = await request(`${base}/v1/edge/orders/session`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ username, token })
    });
    console.log(`T8_PRINT_SESSION_ATTEMPT=${n} STATUS=${response.status} MS=${response.ms}`);
    if (response.status === 200 && response.body.success === true && response.body.edgeToken) {
      console.log(`::add-mask::${text(response.body.edgeToken)}`);
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('stable edge session unavailable');
}
async function authoritativePrint() {
  for (let n = 1; n <= 4; n += 1) {
    const token = await login();
    const response = await request(apps, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getRowsPageV1931', username, token, screen: 'print', page: '1', pageSize: '100', statusFilter: '__ACTIVE__' })
    });
    console.log(`T8_PRINT_APPS_ATTEMPT=${n} STATUS=${response.status} MS=${response.ms} SUCCESS=${response.body && response.body.success === true}`);
    if (response.status === 200 && response.body.success === true) return response;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('stable authoritative print read unavailable');
}

assert.ok(base && apps && username && password, 'qualification environment incomplete');
const session = await edgeSession();
const edgeToken = text(session.body.edgeToken);
const query = new URLSearchParams({ screen: 'print', page: '1', pageSize: '100', statusFilter: '__ACTIVE__' });
const d1 = await request(`${base}/v1/edge/orders/02cr/page?${query}`, { headers: { accept: 'application/json', authorization: `Bearer ${edgeToken}` } });
assert.equal(d1.status, 200, `D1 HTTP ${d1.status}`);
assert.equal(d1.body.success, true, 'D1 read failed');
const authoritative = await authoritativePrint();
const d1Keys = (d1.body.rows || []).map(key).sort();
const appKeys = (authoritative.body.rows || []).map(key).sort();
assert.deepEqual(d1Keys, appKeys, 'canonical print identity parity mismatch');
assert.equal(Number(d1.body.pagination && d1.body.pagination.totalRows), Number(authoritative.body.pagination && authoritative.body.pagination.totalRows), 'print totalRows mismatch');
for (const name of ['بنود الأوردرات', 'العملاء', 'عملاء منع التسليم بالمديونية']) {
  const mirror = (d1.body.mirrors || []).find((item) => text(item && item.sheetName) === name);
  assert.ok(mirror, `missing mirror ${name}`);
  assert.equal(text(mirror.status), 'ready');
  assert.equal(Number(mirror.rowCount || 0), Number(mirror.sourceLastRow || 0));
}
console.log(`T8_PRINT_CANONICAL_PARITY=PASS rows=${d1Keys.length} d1Ms=${d1.ms} appsMs=${authoritative.ms} sessionMs=${session.ms}`);
