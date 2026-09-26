import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {issueOrdersEdgeToken} from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {createT12ProductionCanary,readT12ProductionCanaryOrder} from '../cloudflare-d1/src/t12-production-create-canary.mjs';
import {handleT12ProductionCreateCanaryRequest,isT12ProductionCreateCanaryPath} from '../cloudflare-d1/src/t12-production-create-canary-handler.mjs';
const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0005_t12_production_create_canary.sql',import.meta.url),'utf8');
const prod=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
const wr=fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');
assert.equal(prod.includes('t12-production-create-canary-handler'),true);
assert.match(prod,/isT12ProductionCreateCanaryPath/);
assert.match(wr,/TRENDOS_T12_PROD_CREATE_CANARY_ENABLED = "false"/);
assert.equal(/\b(?:DROP|DELETE|ALTER)\b/i.test(schema),false);
assert(isT12ProductionCreateCanaryPath('/v1/t12/orders/create-canary'));
class Stmt{constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}bind(...p){this.params=p;return this;}async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}async all(){return {results:this.db.raw.prepare(this.sql).all(...this.params)}}async run(){return this.db.raw.prepare(this.sql).run(...this.params);}}
class D1{constructor(){this.raw=new DatabaseSync(':memory:');this.raw.exec('PRAGMA foreign_keys=ON;');this.raw.exec(schema);this.raw.prepare('UPDATE t12_prod_create_control SET canary_remaining=1 WHERE singleton=1').run();this.turn=Promise.resolve();this.failAt=0;this.ambiguous=false;}prepare(sql){return new Stmt(this,sql);}async batch(ss){let release;const prev=this.turn;this.turn=new Promise(r=>release=r);await prev;try{this.raw.exec('BEGIN IMMEDIATE');try{for(let i=0;i<ss.length;i++){if(this.failAt===i+1)throw Error('SIM_FAIL');await ss[i].run();}this.raw.exec('COMMIT');}catch(e){try{this.raw.exec('ROLLBACK');}catch{}throw e;}if(this.ambiguous)throw Error('SIM_LOST_ACK');}finally{release();}}count(t){return Number(this.raw.prepare('SELECT COUNT(*) n FROM '+t).get().n);}control(){const x=this.raw.prepare('SELECT next_order_number nextNo,canary_remaining remaining FROM t12_prod_create_control').get();return {nextNo:Number(x.nextNo),remaining:Number(x.remaining)};}}
const gates={mode:'production-canary-one-shot',allowProductionCanaryMutation:true,ownerFreshStartApproved:true,googleHistoricalBackfillRequired:false,recurringMirrorWriterFenced:true};
const actor='admin-owner';
const input=(key='cld1_1790000010000_PRODCANARY_1234567890123456',qty=1)=>({clientRequestId:key,customerMode:'خارجي / عابر',externalCustomerId:'999001',customerName:'T12 CANARY CUSTOMER',customerPhone:'01000000000',department:'طباعة',itemName:'T12 CANARY ITEM',qty,priority:'عادي',status:'طلب جديد',source:'T12 Production Canary'});
{
 const db=new D1(),first=await createT12ProductionCanary(db,input(),actor,gates);
 assert.equal(first.success,true);assert.equal(first.orderId,'4322');assert.deepEqual(first.lineIds,['4322-01']);assert.deepEqual(db.control(),{nextNo:4323,remaining:0});
 const replay=await createT12ProductionCanary(db,input(),actor,gates);assert.equal(replay.success,true);assert.equal(replay.idempotent,true);assert.deepEqual(db.control(),{nextNo:4323,remaining:0});
 const second=await createT12ProductionCanary(db,input('cld1_1790000010001_PRODCANARY_1234567890123457'),actor,gates);assert.equal(second.reason,'production-canary-budget-exhausted');
 const read=await readT12ProductionCanaryOrder(db,'4322');assert.equal(read.success,true);assert.equal(read.lines[0].lineId,'4322-01');
}
for(let failAt=1;failAt<=6;failAt++){const db=new D1();db.failAt=failAt;const r=await createT12ProductionCanary(db,input(),actor,gates);assert.equal(r.success,false);assert.equal(r.reason,'transaction-outcome-unknown-no-retry');assert.deepEqual(db.control(),{nextNo:4322,remaining:1});assert.equal(db.count('t12_prod_orders'),0);}
{
 const db=new D1();db.ambiguous=true;const r=await createT12ProductionCanary(db,input(),actor,gates);assert.equal(r.success,true);assert.equal(r.ambiguousAckRecovered,true);assert.equal(r.orderId,'4322');
}
{
 const db=new D1();const rs=await Promise.all([createT12ProductionCanary(db,input(),actor,gates),createT12ProductionCanary(db,input(),actor,gates)]);assert.equal(rs.every(x=>x.success),true);assert.equal(new Set(rs.map(x=>x.orderId)).size,1);assert.equal(db.count('t12_prod_orders'),1);
}
{
 const db=new D1(),env={DB:db,EDGE_SESSION_SECRET:'unit-secret',CORS_ORIGINS:'https://fawakhry.github.io',TRENDOS_T12_PROD_CREATE_CANARY_ENABLED:'false'};
 let req=new Request('https://x/v1/t12/orders/create-canary',{method:'POST'});let res=await handleT12ProductionCreateCanaryRequest(req,env);assert.equal(res.status,423);
 env.TRENDOS_T12_PROD_CREATE_CANARY_ENABLED='true';
 req=new Request('https://x/v1/t12/orders/create-canary',{method:'POST',headers:{'content-type':'application/json','x-t12-canary-confirm':'4322'},body:JSON.stringify(input())});res=await handleT12ProductionCreateCanaryRequest(req,env);assert.equal(res.status,401);
 const token=await issueOrdersEdgeToken({sub:'admin-owner',role:'admin',department:'',screens:['service','print','laser','press','']},'unit-secret',Math.floor(Date.now()/1000),600);
 req=new Request('https://x/v1/t12/orders/create-canary',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json','x-t12-canary-confirm':'4322'},body:JSON.stringify(input())});res=await handleT12ProductionCreateCanaryRequest(req,env);assert.equal(res.status,201);assert.equal((await res.json()).orderId,'4322');
}
console.log('T12 Production CREATE canary isolated PASS');
