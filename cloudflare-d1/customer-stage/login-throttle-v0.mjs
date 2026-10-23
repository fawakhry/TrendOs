/*
 * Isolated customer STAGE ONLY Durable Object rate limiter.
 * One singleton SQLite-backed DO serializes both IP and portal-code HMAC
 * counters in one atomic transaction. No PII, password, IP or portal code
 * stored here. NOT imported by production Worker. No public DO route.
 */
export const CUSTOMER_STAGE_RATE_POLICY_V0 = Object.freeze({
  policy:'customer-login-dual-v0', windowMs:15*60*1000,
  maxPortalAttempts:5, maxIpAttempts:30,
  sourceOnly:true, stageOnly:true, productionEnabled:false
});
const PATH='/internal/customer-login-rate/reserve';
const HEX64=/^[a-f0-9]{64}$/;
const reply=(status,data)=>new Response(JSON.stringify(data),{
  status,headers:{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff'}
});
const SQL_CREATE=`CREATE TABLE IF NOT EXISTS customer_login_rate_stage_v0 (
  rate_key TEXT PRIMARY KEY,
  window_id INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  last_seen_ms INTEGER NOT NULL
)`;
const SQL_SELECT='SELECT window_id AS windowId,hits FROM customer_login_rate_stage_v0 WHERE rate_key=?';
const SQL_UPSERT=`INSERT INTO customer_login_rate_stage_v0
  (rate_key,window_id,hits,last_seen_ms) VALUES (?,?,?,?)
  ON CONFLICT(rate_key) DO UPDATE SET window_id=excluded.window_id,
  hits=excluded.hits,last_seen_ms=excluded.last_seen_ms`;
const SQL_PRUNE='DELETE FROM customer_login_rate_stage_v0 WHERE last_seen_ms<?';

function qualified(input){
  return input&&typeof input==='object'&&!Array.isArray(input)&&
    Object.keys(input).length===2&&
    input.policy===CUSTOMER_STAGE_RATE_POLICY_V0.policy&&
    Array.isArray(input.keys)&&input.keys.length===2&&
    input.keys.every(k=>typeof k==='string'&&HEX64.test(k))&&
    input.keys[0]!==input.keys[1];
}
/**
 * Called INSIDE ctx.storage.transactionSync(...). Any read/write error
 * aborts both keys and the outer HTTP handler returns 503 (fail closed).
 * Rejected attempts do not change either counter. Counter reset is by
 * fixed 15-minute window; hard ceilings apply across all DO instances
 * using this same singleton ID.
 */
export function reserveCustomerLoginAttemptStageV0(sql,input,nowMs){
  if(!qualified(input)||!Number.isSafeInteger(nowMs)||nowMs<=0)
    throw new TypeError('invalid-stage-login-throttle-arguments');
  sql.exec(SQL_CREATE);
  const windowId=Math.floor(nowMs/CUSTOMER_STAGE_RATE_POLICY_V0.windowMs);
  const keys=['portal:'+input.keys[0],'ip:'+input.keys[1]];
  const limits=[CUSTOMER_STAGE_RATE_POLICY_V0.maxPortalAttempts,
    CUSTOMER_STAGE_RATE_POLICY_V0.maxIpAttempts];
  const counts=[];
  for(let i=0;i<keys.length;i++){
    const row=sql.exec(SQL_SELECT,keys[i]).one();
    const count=row&&row.windowId===windowId?row.hits:0;
    if(!Number.isSafeInteger(count)||count<0)
      throw new TypeError('invalid-stage-throttle-counter');
    counts.push(count);
  }
  if(counts.some((count,i)=>count>=limits[i]))
    return {allowed:false,persisted:true};
  // Both counters update under the same explicit SQL transaction.
  for(let i=0;i<keys.length;i++)
    sql.exec(SQL_UPSERT,keys[i],windowId,counts[i]+1,nowMs);
  // Expiry cleanup stores no person-specific data, only HMAC counters.
  sql.exec(SQL_PRUNE,nowMs-24*60*60*1000);
  return {allowed:true,persisted:true};
}
export class CustomerLoginThrottleStageV0 {
  constructor(ctx){ this.ctx=ctx; }
  async fetch(request){
    try{
      const url=new URL(request.url);
      if(url.pathname!==PATH||url.search||request.method!=='POST')
        return reply(404,{allowed:false,persisted:false});
      if(request.headers.get('Content-Type')!=='application/json')
        return reply(415,{allowed:false,persisted:false});
      const length=request.headers.get('Content-Length');
      if(length&&(!/^\\d+$/.test(length)||Number(length)>512))
        return reply(413,{allowed:false,persisted:false});
      const raw=await request.text();
      if(typeof raw!=='string'||raw.length>512)
        return reply(413,{allowed:false,persisted:false});
      let input;
      try{input=JSON.parse(raw);}catch{return reply(400,{allowed:false,persisted:false});}
      if(!qualified(input))return reply(400,{allowed:false,persisted:false});
      const storage=this.ctx&&this.ctx.storage;
      if(!storage||!storage.sql||typeof storage.transactionSync!=='function')
        return reply(503,{allowed:false,persisted:false});
      const result=storage.transactionSync(
        ()=>reserveCustomerLoginAttemptStageV0(storage.sql,input,Date.now()));
      return reply(200,result);
    }catch{
      return reply(503,{allowed:false,persisted:false});
    }
  }
}
/**
 * Real Stage Worker binding adapter. No caller-supplied gate or mock can
 * grant a login from the Worker env. Missing/unready namespace => null,
 * so original login HTTP handler denies BEFORE touching D1.
 */
export function createCustomerStageDurableRateGateV0(env){
  const ns=env&&env.CUSTOMER_LOGIN_RATE_STAGE_V0;
  if(!ns||typeof ns.idFromName!=='function'||typeof ns.get!=='function')
    return null;
  return Object.freeze({
    async reserveMany(input){
      if(!qualified(input))throw new TypeError('invalid-stage-throttle-request');
      const id=ns.idFromName('singleton-customer-native-login-stage-v0');
      const stub=ns.get(id);
      if(!stub||typeof stub.fetch!=='function')
        throw new TypeError('stage-rate-namespace-unavailable');
      const response=await stub.fetch('https://stage-do.internal'+PATH,{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(input)
      });
      if(!response||response.status!==200||response.ok!==true)
        throw new TypeError('stage-rate-not-confirmed');
      const raw=await response.text();
      if(typeof raw!=='string'||raw.length>256)
        throw new TypeError('stage-rate-invalid-response');
      const data=JSON.parse(raw);
      if(!data||data.persisted!==true||typeof data.allowed!=='boolean'||
        Object.keys(data).length!==2)
        throw new TypeError('stage-rate-unqualified-response');
      return {allowed:data.allowed,persisted:true};
    }
  });
}
