/**
 * SERVER-68: authentic Wrangler local runtime smoke, synthetic SQLite D1 + DO.
 * Requires Node 22 + Wrangler CLI on CI runner. NEVER targets Cloudflare.
 * No real customer data, credentials, production URL, remote Worker or deploy.
 */
import {spawn, spawnSync} from 'node:child_process';
import {createHmac, createHash} from 'node:crypto';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const CFG='cloudflare-d1/wrangler.server68-local-runtime.toml';
const FIXTURE='tests/fixtures/server68_local_mirror_fixture.sql';
const PORT=8795,HOST='http://127.0.0.1:'+PORT;
const METADATA='SYNTHETIC_SERVER68_META_KEY_abcdefghijklmnopqrstuvwxyz_123456789';
const PARITY='SYNTHETIC_SERVER68_PARITY_KEY_abcdefghijklmnopqrstuvwxyz_12345678';
const MACHINE_TOKEN='SYNTHETIC_SERVER69_PRINTSHOP_READ_ONLY_TOKEN_0123456789_ABC';
const tmp=mkdtempSync(path.join(tmpdir(),'server68-wrangler-local-'));
let worker=null,finished=false,stdout='',stderr='';
function assert(cond,msg){if(!cond)throw new Error(msg);}
function cli(args){
  const result=spawnSync('npx',['--yes','wrangler@4.149.0',...args],{
    stdio:'pipe',encoding:'utf8',timeout:180000
  });
  assert(result.status===0,'LOCAL_WRANGLER_CLI_FAILED '+args[0]+': '+String(result.stderr||result.stdout).slice(-1500));
}
async function response(url,opts={},expected=200){
  const res=await fetch(HOST+url,{...opts,signal:AbortSignal.timeout(6000)});
  const body=await res.json().catch(()=>({}));
  assert(res.status===expected,'HTTP_EXPECTED_'+expected+'_ACTUAL_'+res.status+' route '+url+' body '+JSON.stringify(body).slice(0,300));
  return body;
}
function sign(route,{principal='trendos_mirror_metadata',secret=METADATA,nonce='N'.repeat(24),offset=0}={}){
  const url=new URL(HOST+route),stamp=String(Math.floor(Date.now()/1000)+offset);
  const msg=['GET',url.pathname,url.search,stamp,nonce,principal].join('\n');
  const digest=createHmac('sha256',secret).update(msg).digest('hex');
  return {method:'GET',headers:{
    'x-trendos-read-principal':principal,
    'x-trendos-read-timestamp':stamp,
    'x-trendos-read-nonce':nonce,
    'x-trendos-read-signature':digest
  }};
}
async function waitReady(){
  let last='';
  for(let i=0;i<80;i++){
    if(worker.exitCode!==null)throw Error('LOCAL_WORKER_TERMINATED '+stderr.slice(-1400));
    try {
      const r=await fetch(HOST+'/v1/service/mirror/stats',{signal:AbortSignal.timeout(600)});
      if(r.status===401 || r.status===404 || r.status===503)return;
      last='HTTP '+r.status;
    }catch(err){last=String(err.message).slice(0,150);}
    await new Promise(resolve=>setTimeout(resolve,400));
  }
  throw Error('LOCAL_WORKER_NOT_READY '+last+' '+stderr.slice(-1300));
}
async function test(){
  // Prepare fixture through Wrangler LOCAL D1; isolated per invocation.
  cli(['d1','execute','trendos-server68-offline-fixture','--local','--config',CFG,
    '--persist-to',tmp,'--file',FIXTURE]);
  const now=Date.now();
  const machineDigest=createHash('sha256').update(MACHINE_TOKEN).digest('hex');
  worker=spawn('npx',['--yes','wrangler@4.149.0','dev','--local','--ip','127.0.0.1','--port',String(PORT),
    '--config',CFG,'--persist-to',tmp,
    '--var','MIRROR_SERVICE_READ_ENABLED:true',
    '--var','MIRROR_METADATA_READ_ENABLED:true',
    '--var','MIRROR_PARITY_READ_ENABLED:true',
    '--var','MIRROR_METADATA_READ_HMAC_SECRET:'+METADATA,
    '--var','MIRROR_PARITY_READ_HMAC_SECRET:'+PARITY,
    '--var','TRENDOSSHOP_SERVICE_READ_ENABLED:true',
    '--var','TRENDOSSHOP_READER_PRINCIPAL:trendosshop_order_reader',
    '--var','TRENDOSSHOP_READER_TOKEN_SHA256_HEX:'+machineDigest,
    '--var','TRENDOSSHOP_READER_ISSUED_AT_MS:'+String(now-60000),
    '--var','TRENDOSSHOP_READER_EXPIRES_AT_MS:'+String(now+7*60*1000)
  ],{detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env,CI:'true'}});
  worker.stdout.on('data',data=>{stdout+=data.toString();stdout=stdout.slice(-6000);});
  worker.stderr.on('data',data=>{stderr+=data.toString();stderr=stderr.slice(-6000);});
  await waitReady();

  const stats='/v1/service/mirror/stats';
  await response(stats,{},401);
  await response(stats,{headers:{Origin:'https://fawakhry.github.io'}},403);
  await response('/v1/mirror/sheets',{},403);
  await response('/v1/service/mirror/sheet?name='+encodeURIComponent('غير موجود'),{},403);

  const valid=sign(stats);
  const first=await response(stats,valid,200);
  assert(first.success===true && first.stats?.rowCount===2,'SYNTHETIC_STATS_MISMATCH');
  const replay=await response(stats,valid,409);
  assert(replay.code==='request-replay-denied','LOCAL_DO_REPLAY_NOT_ENFORCED');

  const wrongRole=sign(stats,{principal:'trendos_mirror_parity',secret:PARITY,nonce:'Q'.repeat(24)});
  await response(stats,wrongRole,401);
  const expired=sign(stats,{nonce:'E'.repeat(24),offset:-90});
  await response(stats,expired,401);

  const route='/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=10&offset=0';
  const parity=sign(route,{principal:'trendos_mirror_parity',secret:PARITY,nonce:'P'.repeat(24)});
  const row=await response(route,parity,200);
  assert(row.sheet?.rows?.length===1 && row.sheet.rows[0].display?.[0]==='FAKE-ORDER-0001','SYNTHETIC_ROW_MISMATCH');
  await response(route,parity,409);
  await response('/v1/service/mirror/sheet?name='+encodeURIComponent('الأوردرات')+'&limit=101',parity,403);

  // SERVER-69: existing *machine* reader, not manager UI or R5 metadata.
  // These two synthetic department lines must never expose customer/finance data
  // or trigger a print/laser job. Real Ubuntu and equipment remain offline.
  const machine='/v1/printshop/service/orders/page';
  const printUrl=machine+'?screen=print&page=1&pageSize=10';
  const laserUrl=machine+'?screen=laser&page=1&pageSize=10';
  await response(printUrl,{},401);
  await response(printUrl,{headers:{Authorization:'Bearer WRONG_FAKE_TOKEN_123456789012345678901234567890'}},401);
  await response(printUrl,{headers:{Origin:'https://fawakhry.github.io',Authorization:'Bearer '+MACHINE_TOKEN}},403);
  await response(machine+'?screen=accounting',{headers:{Authorization:'Bearer '+MACHINE_TOKEN}},403);
  await response(machine+'?screen=print&page=2',{headers:{Authorization:'Bearer '+MACHINE_TOKEN}},403);
  const authorized={headers:{Authorization:'Bearer '+MACHINE_TOKEN},method:'GET'};
  const printing=await response(printUrl,authorized,200);
  const lasering=await response(laserUrl,authorized,200);
  assert(printing.mode==='read-only' && lasering.mode==='read-only','MACHINE_NOT_READONLY');
  assert(printing.rows?.length===1 && printing.rows[0]?.lineId==='DEMO-LINE-PRINT','PRINT_SCOPE_MISMATCH');
  assert(lasering.rows?.length===1 && lasering.rows[0]?.lineId==='DEMO-LINE-LASER','LASER_SCOPE_MISMATCH');
  for(const packet of [printing,lasering]){
    for(const row of packet.rows){
      assert(Object.keys(row).sort().join(',')==='lineId,orderId,quantity,screen,serviceCode,status','MACHINE_ROW_LEAK');
      assert(!('customerPhone' in row) && !('customer' in row) && !('debtAmount' in row),'CUSTOMER_FIELDS_EXPOSED');
    }
  }
  await response(printUrl,{method:'POST',headers:{Authorization:'Bearer '+MACHINE_TOKEN}},405);
  process.stdout.write('SERVER69_LOCAL_MACHINE_READER=PASS; PRINT_LASER_SCOPES=PASS; NO_CUSTOMER_FIELDS=TRUE; NO_EQUIPMENT=TRUE\\n');

  process.stdout.write('SERVER68_LOCAL_REAL_WORKER=PASS; SQLITE_D1_SYNTHETIC=PASS; DO_NONCE_REPLAY=PASS; AUTH_DENY=PASS; NO_REMOTE_DEPLOY=TRUE\n');
  finished=true;
}
try {await test();}
catch(e){process.stderr.write('SERVER68_LOCAL_SMOKE_FAILED: '+e.message+'\n'+stderr.slice(-2400)+'\n');process.exitCode=1;}
finally {
  if(worker?.pid){try{process.kill(-worker.pid,'SIGTERM');}catch{try{worker.kill('SIGTERM');}catch{}}}
  rmSync(tmp,{recursive:true,force:true});
}
