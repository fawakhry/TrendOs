import assert from 'node:assert/strict';
import prod from '../cloudflare-d1/production-shadow/index.js';

const req=new Request('https://trendos-d1-api.trendmall-contact.workers.dev/v1/edge/customers/search?q=test',{
  method:'GET',
  headers:{Origin:'https://fawakhry.github.io'}
});
const res=await prod.fetch(req,{
  CORS_ORIGINS:'https://fawakhry.github.io',
  EDGE_SESSION_SECRET:'test-secret',
  TRENDOS_PRODUCTION_SHADOW_V2_ENABLED:'true'
},{});
const body=await res.json();
assert.equal(res.status,401);
assert.equal(body.success,false);
assert.match(String(body.message||''),/Unauthorized customer search/);
console.log('T12 A51 production-shadow customer route integration: PASS');
