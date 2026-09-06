import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const previewUrl = String(process.env.PREVIEW_URL || '').replace(/\/+$/, '');
const secret = String(process.env.EDGE_SESSION_SECRET || '');

assert.match(previewUrl, /^https:\/\//, 'PREVIEW_URL must be HTTPS');
assert.ok(secret, 'EDGE_SESSION_SECRET is required');

const endpoint = `${previewUrl}/v1/edge/orders/02cr/page?screen=service&page=1&pageSize=1&statusFilter=__ACTIVE__`;

function issueToken(subject) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'trendos-orders-edge',
    sub: subject,
    role: 'admin',
    department: 'إدارة',
    screens: ['service'],
    iat: now,
    exp: now + 180,
    jti: `ci-02cu-${crypto.randomUUID()}`
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `v1.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

function parseUtc(value) {
  let raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)) raw = `${raw.replace(' ', 'T')}Z`;
  const ms = Date.parse(raw);
  assert.ok(Number.isFinite(ms), 'mirror timestamp must parse');
  return ms;
}

function ageSeconds(mirror) {
  return Math.max(0, Math.round((Date.now() - parseUtc(mirror.syncedAt)) / 1000));
}

async function jsonFetch(url, init) {
  const response = await fetch(url, { redirect: 'follow', ...init });
  const raw = await response.text();
  let body = {};
  try { body = JSON.parse(raw || '{}'); }
  catch { throw new Error(`Preview returned invalid JSON with HTTP ${response.status}`); }
  return { response, body };
}

const anonymous = await jsonFetch(endpoint, { method: 'GET', headers: { accept: 'application/json' } });
assert.equal(anonymous.response.status, 401, 'anonymous 02CR read must fail closed');
assert.equal(anonymous.body.success, false);
console.log('ANONYMOUS_02CR_FAIL_CLOSED=PASS');

async function qualify(subject) {
  const token = issueToken(subject);
  const { response, body } = await jsonFetch(endpoint, {
    method: 'GET',
    headers: { accept: 'application/json', authorization: `Bearer ${token}` }
  });

  assert.equal(response.status, 200, `qualified 02CR preview read HTTP ${response.status}`);
  assert.equal(body.success, true, '02CR preview read must succeed');
  assert.equal(body.version, 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY');
  assert.ok(!body.fallback, 'qualified 02CR preview read must not fall back');
  assert.ok(Array.isArray(body.rows), 'rows contract must remain present');

  const mirrors = Array.isArray(body.mirrors) ? body.mirrors : [];
  const findMirror = (name) => mirrors.find((item) => String(item && item.sheetName || '').trim() === name);
  const lines = findMirror('بنود الأوردرات');
  const customers = findMirror('العملاء');
  const restrictions = findMirror('عملاء منع التسليم بالمديونية');
  assert.ok(lines && customers && restrictions, 'required 02CR mirror metadata must be present');

  const linesAge = ageSeconds(lines);
  const customersAge = ageSeconds(customers);
  const restrictionsAge = ageSeconds(restrictions);
  assert.ok(linesAge > 300, 'QUALIFICATION_NOT_EXERCISED: Lines became physically fresh');
  assert.ok(customersAge <= 300, 'customer enrichment must remain physically fresh');
  assert.ok(restrictionsAge <= 300, 'debt-restriction enrichment must remain physically fresh');

  const proof = body.logicalFreshness;
  assert.ok(proof, 'logical freshness proof is required for stale Lines');
  assert.equal(proof.ok, true);
  assert.equal(proof.mode, 'verified-idle-source-unchanged');
  assert.deepEqual(proof.failedChecks, []);
  assert.ok(Number(proof.ageSeconds) <= Number(proof.maxAgeSeconds), 'logical freshness proof must be within its bounded age');

  const proofLines = proof.source && proof.source.lines;
  assert.ok(proofLines, 'Lines source proof must be present');
  assert.equal(proofLines.displayHashPresent, true);
  assert.equal(Number(proofLines.sourceLastRow), Number(lines.sourceLastRow));
  assert.equal(Number(proofLines.sourceLastCol), Number(lines.sourceLastCol));

  return {
    version: body.version,
    returnedRowCount: body.rows.length,
    linesAgeSeconds: linesAge,
    customerAgeSeconds: customersAge,
    restrictionAgeSeconds: restrictionsAge,
    logicalMode: proof.mode,
    logicalAgeSeconds: Number(proof.ageSeconds),
    logicalMaxAgeSeconds: Number(proof.maxAgeSeconds),
    linesSourceLastRow: Number(lines.sourceLastRow),
    linesSourceLastCol: Number(lines.sourceLastCol)
  };
}

const first = await qualify('ci-02cu-02cr-idle-qualify');
console.log('LIVE_02CR_DUAL_SIGNAL=PASS');
console.log(`SAFE_METADATA=${JSON.stringify(first)}`);

const second = await qualify('ci-02cu-02cr-repeat');
console.log('REPEAT_LIVE_02CR_DUAL_SIGNAL=PASS');
console.log(`REPEAT_SAFE_METADATA=${JSON.stringify({
  linesAgeSeconds: second.linesAgeSeconds,
  logicalMode: second.logicalMode,
  logicalAgeSeconds: second.logicalAgeSeconds,
  logicalMaxAgeSeconds: second.logicalMaxAgeSeconds
})}`);
