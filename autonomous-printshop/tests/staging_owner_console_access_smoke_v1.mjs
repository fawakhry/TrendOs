// AP-084: opt-in read-only smoke test for an isolated, access-protected Staging origin.
// Never sends credentials, follows redirects or logs response bodies.
import assert from 'node:assert/strict';

const raw=process.env.AUTONOMOUS_PRINTSHOP_STAGING_URL;
assert.ok(raw,'AUTONOMOUS_PRINTSHOP_STAGING_URL is required; no implicit endpoint');
const base=new URL(raw);
const host=base.hostname.toLowerCase();
assert.equal(base.protocol,'https:','Only HTTPS Staging is permitted');
assert.ok(!base.username&&!base.password&&!base.search&&!base.hash,'No credentials or URL parameters');
assert.equal(base.pathname,'/','Use only the Staging origin, ending in /');
assert.notEqual(host,'autonomous-printshop-dashboard.trendmall-contact.workers.dev','Production is forbidden');
assert.notEqual(host,'trendos-d1-api.trendmall-contact.workers.dev','Production API is forbidden');
assert.match(host,/(^|[.-])(stage|staging|preview)([.-]|$)/i,'Explicit Staging/preview hostname is required');

function accessRedirect(response){
  if(![301,302,303,307,308].includes(response.status))return false;
  const location=response.headers.get('location')||'';
  try{
    const destination=new URL(location,base);
    return destination.protocol==='https:'&&
      (destination.hostname.endsWith('.cloudflareaccess.com')||
       (destination.hostname===host&&destination.pathname.startsWith('/cdn-cgi/access/')));
  }catch{return false;}
}

// Unauthenticated clients must not fetch HTML or JSON from a private owner console.
for(const path of ['/state','/api/state','/owner','/manager-center']){
  const response=await fetch(new URL(path,base),{
    method:'GET',redirect:'manual',cache:'no-store',
    headers:{accept:path.includes('state')?'application/json':'text/html'},
    signal:AbortSignal.timeout(12000)
  });
  try{
    assert.ok([401,403].includes(response.status)||accessRedirect(response),
      `${path} is not protected by a qualifying Access response (HTTP ${response.status})`);
    console.log(`ACCESS_DENIES_ANONYMOUS ${path} HTTP_${response.status}=PASS`);
  }finally{await response.body?.cancel();}
}
console.log('STAGING_OWNER_CONSOLE_ANONYMOUS_DENIAL=PASS');
console.log('READ_ONLY_GETS_ONLY=YES; BODIES_LOGGED=NO; PRODUCTION_REQUESTS=NO');
