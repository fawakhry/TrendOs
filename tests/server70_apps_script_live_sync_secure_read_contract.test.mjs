/** SERVER-70 Apps Script live-sync source contract in VM, no Google/Cloudflare APIs.
 * Simulates only metadata GET/diagnostics, never stage/promote/POST or data writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
import {readFileSync} from 'node:fs';

const BASE='https://apps-script-offline.invalid';
const META_KEY='SYNTHETIC_SERVER70_METADATA_ONLY_HMAC_abcdef0123456789';
const SOURCES=[
  'cloudflare-d1/D1_Full_Migration.gs',
  'cloudflare-d1/D1_Orders_Live_Sync.gs',
  'cloudflare-d1/D1_Mirror_Service_Read_V1.gs'
];
function sandbox({optIn=false,hasSigner=true,hasSecret=true,
                  httpCode=200,capabilitySupported=true}={}){
  const calls=[];let nonceSerial=0;
  const cfg={
    D1_API_URL:BASE,
    D1_MIGRATION_SECRET:'SYNTHETIC_MIGRATION_SECRET_FOR_LEGACY_CONFIG_ONLY',
    D1_MIRROR_SERVICE_READ_V1_ENABLED:optIn?'true':'false',
    D1_MIRROR_METADATA_HMAC_SECRET:hasSecret?META_KEY:'',
    D1_ORDERS_LIVE_SYNC_ENABLED_V1:'0'
  };
  const props={
    getProperty:k=>cfg[k]??'',
    setProperty:()=>{throw Error('SCRIPT_PROPERTY_WRITE_FORBIDDEN')},
    deleteProperty:()=>{throw Error('SCRIPT_PROPERTY_DELETE_FORBIDDEN')}
  };
  const context=createContext({
    PropertiesService:{getScriptProperties:()=>props},
    ScriptApp:{getProjectTriggers:()=>[]},
    Utilities:{
      getUuid:()=>String(++nonceSerial).padStart(8,'0')+'-aaaa-bbbb-cccc-abcdef123456',
      computeHmacSha256Signature:(payload,key)=>
        Array.from(createHmac('sha256',key).update(payload).digest(),byte=>byte>127?byte-256:byte),
    },
    UrlFetchApp:{fetch:(url,options)=>{
      calls.push({url,options});
      const u=new URL(url);
      if(u.hostname!=='apps-script-offline.invalid')throw Error('REAL_NETWORK_NOT_ALLOWED');
      if(options.method!=='get')throw Error('SYNTHETIC_READ_ONLY_FIXTURE');
      const payload=u.pathname.endsWith('/capabilities')?{
        success:httpCode===200,capabilities:{
          schemaMutationFree:true,
          atomicSupported:capabilitySupported,missingTables:[]
        }
      }:{
        success:httpCode===200,stats:{rowCount:0,sheetCount:0},sheets:[]
      };
      return{
        getResponseCode:()=>httpCode,
        getContentText:()=>JSON.stringify(payload)
      };
    }},
    Date,Math,JSON,Object,Array,String,Number,
  });
  SOURCES.filter(x=>hasSigner||!x.includes('D1_Mirror_Service_Read_V1.gs')).forEach(p=>
    runInContext(readFileSync(p,'utf8'),context,{filename:p})
  );
  return{context,calls,cfg};
}
function signedCall(c,kind){
  const u=new URL(c.url),h=c.options.headers;
  assert.equal(u.pathname,'/v1/service/mirror/'+kind);
  assert.equal(c.options.method,'get');
  assert.equal(c.options.followRedirects,false);
  assert.equal(h['x-trendos-read-principal'],'trendos_mirror_metadata');
  assert.ok(/^[a-f0-9]{64}$/.test(h['x-trendos-read-signature']));
  const message=['GET',u.pathname,u.search,
    h['x-trendos-read-timestamp'],h['x-trendos-read-nonce'],
    'trendos_mirror_metadata'].join('\n');
  assert.equal(h['x-trendos-read-signature'],
    createHmac('sha256',META_KEY).update(message).digest('hex'));
  assert.equal(h.Authorization,undefined);
  assert.equal(h['x-migration-secret'],undefined);
}
test('metadata capability check signs SERVER-67 route when explicitly opted in',()=>{
  const x=sandbox({optIn:true});
  const capabilities=x.context.d1OrdersLiveSyncCapabilities_();
  assert.equal(capabilities.atomicSupported,true);
  assert.equal(x.calls.length,1);
  signedCall(x.calls[0],'capabilities');
});
test('the actual Live Sync status function uses only signed capability/stats metadata reads when opted in',()=>{
  const x=sandbox({optIn:true});
  const status=x.context.getD1OrdersLiveSyncStatus();
  assert.equal(status.enabled,false);
  assert.equal(status.triggerCount,0);
  assert.equal(status.capabilityError,'');
  assert.equal(status.capabilities.capabilities.atomicSupported,true);
  assert.equal(status.mirror.success,true);
  assert.equal(x.calls.length,2);
  signedCall(x.calls[0],'capabilities');
  signedCall(x.calls[1],'stats');
  assert.notEqual(x.calls[0].options.headers['x-trendos-read-nonce'],
                  x.calls[1].options.headers['x-trendos-read-nonce']);
});
test('opt-in OFF explicitly preserves existing legacy endpoints (NOT rollout-safe)',()=>{
  const x=sandbox();
  const st=x.context.getD1OrdersLiveSyncStatus();
  assert.equal(st.enabled,false);
  assert.deepEqual(x.calls.map(v=>new URL(v.url).pathname),[
    '/v1/mirror/capabilities','/v1/mirror/stats'
  ]);
  assert.ok(x.calls.every(v=>v.options.headers===undefined));
  assert.ok(x.calls.every(v=>v.options.method==='get'));
});
test('signed flag ON with missing signer fails before UrlFetchApp sends anything',()=>{
  const x=sandbox({optIn:true,hasSigner:false});
  assert.throws(()=>x.context.d1OrdersLiveSyncCapabilities_(),/SERVER67_SIGNER_NOT_INSTALLED/);
  assert.equal(x.calls.length,0);
});
test('signed flag ON without service secret refuses all HTTP calls',()=>{
  const x=sandbox({optIn:true,hasSecret:false});
  assert.throws(()=>x.context.d1OrdersLiveSyncCapabilities_(),/SERVER67_SERVICE_SECRET_MISSING/);
  assert.equal(x.calls.length,0);
});
test('signed service 403 fails closed, never sends legacy requests as fallback',()=>{
  const x=sandbox({optIn:true,httpCode:403});
  assert.throws(()=>x.context.d1OrdersLiveSyncCapabilities_(),/SERVER67_MIRROR_SERVICE_HTTP_403/);
  assert.equal(x.calls.length,1);
  signedCall(x.calls[0],'capabilities');
});
test('signed capability probe refuses mutation-capable or atomic-unready responses',()=>{
  const x=sandbox({optIn:true,capabilitySupported:false});
  assert.throws(()=>x.context.d1OrdersLiveSyncCapabilities_(),/D1 atomic staging schema is not ready/);
  assert.equal(x.calls.length,1);
  signedCall(x.calls[0],'capabilities');
});
test('disabled sync diagnostics are read-only, source-backed, never trigger or import',()=>{
  const x=sandbox({optIn:true});
  const st=x.context.getD1OrdersLiveSyncStatus();
  assert.equal(st.healthyConfiguration,false);
  assert.equal(st.enabled,false);
  assert.equal(x.calls.filter(c=>c.options.method!=='get').length,0);
  assert.ok(x.calls.every(c=>!c.url.includes('/v1/import/')));
  assert.ok(x.calls.every(c=>!c.url.includes('/v1/admin/')));
});
