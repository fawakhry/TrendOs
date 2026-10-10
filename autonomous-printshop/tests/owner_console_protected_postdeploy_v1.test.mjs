import assert from 'node:assert/strict';
import { PRIVATE_ROUTES, verifyProtectedOwnerConsoleV1 } from '../core/owner-console-protected-postdeploy-v1.mjs';

const origin = 'https://autonomous-printshop-dashboard.trendmall-contact.workers.dev/';
const clientId = 'test-client-id';
const clientSecret = 'synthetic-client-secret';
const health = { success: true, service: 'autonomous-printshop-dashboard',
  mode: 'READ_ONLY_OWNER_EXCEPTION_CONSOLE', businessWrites: false, employeeAssignment: false };
const state = { success: true, mode: 'CONTROL_TOWER_SHADOW', writesAccepted: false,
  d1Mutation: false, employeeAssignment: false, employees: { blockers: { control: { mode: 'SHADOW' } } },
  ownerExceptionModel: { authorityBoundaries: { commsSend: false } },
  finance: { credentials: 'MUST_NOT_LOG' }, customer: { secret: 'MUST_NOT_LOG' } };
const html = '<h1>مركز إدارة المطبعة الذاتية</h1><p>قرارات تحتاج تدخلك</p><p>رسائل تنتظر رد</p>';
const response = (status, data = '', headers = {}) => new Response(typeof data === 'string' ? data : JSON.stringify(data), {
  status, headers: data && typeof data === 'object' ? { 'content-type': 'application/json', ...headers } : headers
});
function mock({ anonymousStatus = 403, authStatus = 200, authBody = {}, failRoute = '', redirect = false } = {}) {
  const requests = [];
  async function fetchImpl(url, opts) {
    const path = url.pathname;
    const authed = opts.headers?.has('CF-Access-Client-Secret') || false;
    requests.push({ path, authed, method: opts.method, redirect: opts.redirect,
      hasTokenHeaders: authed && opts.headers.has('CF-Access-Client-Id') });
    if (path === failRoute && (authed || failRoute === '/api/state')) throw Error('leaking-private-error-customer-MUST_NOT_LOG');
    if (!authed) return redirect ? response(302, '', { location: 'https://company.cloudflareaccess.com/cdn-cgi/access/login' }) : response(anonymousStatus, '');
    const data = authBody[path] ?? (path === '/health' ? health : path === '/state' ? state : html);
    return response(authStatus, data);
  }
  return { fetchImpl, requests };
}
let attempted = 0;
const noNetwork = async () => { attempted++; throw Error('unexpected network'); };
assert.equal((await verifyProtectedOwnerConsoleV1({clientId, fetchImpl:noNetwork})).code,'SERVICE_AUTH_NOT_CONFIGURED');
assert.equal((await verifyProtectedOwnerConsoleV1({clientId, clientSecret, origin:'https://some-staging.workers.dev/', fetchImpl:noNetwork})).code,'UNAPPROVED_ORIGIN');
assert.equal((await verifyProtectedOwnerConsoleV1({clientId, clientSecret:'bad\r\nheader', fetchImpl:noNetwork})).code,'SERVICE_AUTH_NOT_CONFIGURED');
assert.equal(attempted,0);

const m = mock();
const good = await verifyProtectedOwnerConsoleV1({origin, clientId, clientSecret, fetchImpl:m.fetchImpl});
assert.equal(good.success,true);
assert.equal(good.checked,9);
assert.deepEqual(m.requests.map(r=>r.path), [...PRIVATE_ROUTES,'/health','/state','/']);
assert.equal(m.requests.filter(r=>r.authed).length,3);
assert.ok(m.requests.every(r=>r.method==='GET'&&r.redirect==='manual'));
assert.ok(m.requests.slice(0,6).every(r=>!r.authed));
assert.ok(m.requests.slice(6).every(r=>r.hasTokenHeaders));
assert.doesNotMatch(JSON.stringify(good), /MUST_NOT_LOG|test-client-id|synthetic-client-secret/);

const redirectGood=await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,fetchImpl:mock({redirect:true}).fetchImpl});
assert.equal(redirectGood.success,true);
for (const anonymousStatus of [200, 404, 500]) {
  const result=await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,fetchImpl:mock({anonymousStatus}).fetchImpl});
  assert.equal(result.code,'ANONYMOUS_ACCESS_NOT_DENIED');
  assert.equal(result.checked,1);
}
for (const authStatus of [302, 401, 403, 500]) {
  assert.equal((await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,fetchImpl:mock({authStatus}).fetchImpl})).code,'AUTHORIZED_READ_NOT_OK');
}
assert.equal((await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,
  fetchImpl:mock({authBody:{'/health':{...health,businessWrites:true}}}).fetchImpl})).code,'HEALTH_BOUNDARY_INVALID');
assert.equal((await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,
  fetchImpl:mock({authBody:{'/state':{...state,employeeAssignment:true}}}).fetchImpl})).code,'SHADOW_BOUNDARY_INVALID');
assert.equal((await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,
  fetchImpl:mock({authBody:{'/':'missing-owner-markers'}}).fetchImpl})).code,'OWNER_PAGE_INVALID');
assert.equal((await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,
  fetchImpl:mock({failRoute:'/api/state'}).fetchImpl})).code,'ANONYMOUS_PROBE_FAILED');
for(const failRoute of ['/health','/state']){
  const x=await verifyProtectedOwnerConsoleV1({origin,clientId,clientSecret,fetchImpl:mock({failRoute}).fetchImpl});
  assert.equal(x.code,'AUTHORIZED_PROBE_FAILED');
  assert.doesNotMatch(JSON.stringify(x),/MUST_NOT_LOG|test-client-id|synthetic-client-secret/);
}
console.log('AP092_PROTECTED_ACCESS_ANON_DENIAL_AND_SERVICE_AUTH=PASS');
console.log('AP092_PROTECTED_ACCESS_FAIL_CLOSED_PRIVATE_OUTPUT=PASS');
console.log('PRODUCTION_HTTP_REQUESTS=0; CREDENTIALS_REAL=0');
