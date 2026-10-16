import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { handleEmployeeCoreNativeRequest } from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import { cloudAuthTokenFingerprint } from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const SECRET='fake-only-native-session-secret',TOKEN='fake-only-session-token',USERNAME='fixture-manager';

function env(){
  const e={EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',
    DB:{prepare(sql){
      return {bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM employee_auth_sessions_v1 s')){
            const hash=await cloudAuthTokenFingerprint(USERNAME,TOKEN,e);
            return this.args[1]===hash?{canonicalUsername:USERNAME,role:'admin',active:1,
              sessionVersion:1,currentSessionVersion:1,expiresAtMs:Date.now()+60000,screensJson:'[]'}:null;
          }
          if(sql.includes('FROM employee_core_control_v1'))return {mode:'GENERAL',dataVersion:1};
          if(sql.includes('COUNT(*) AS n'))return {n:0};
          return null;
        },
        async all(){return {results:[]};},
        async run(){return {success:true};}
      };
    }}
  };return e;
}
test('manager API does not fabricate healthy duplicates or empty notifications',async()=>{
  const request=new Request('https://unit.invalid/v1/employee/core',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({action:'getTrendMasterCenterV1931',username:USERNAME})});
  const res=await handleEmployeeCoreNativeRequest(request,env());
  assert.equal(res.status,200);
  const out=await res.json();
  assert.equal(out.success,true);
  assert.equal(out.system.duplicateHealthy,null);
  assert.equal(out.system.duplicateEvidence,'UNKNOWN');
  assert.equal(out.system.duplicateGroups,null);
  assert.equal(out.messageQueue,null);
  assert.equal(out.messageQueueEvidence,'UNAVAILABLE');
  assert.equal(out.dayClose,null);
  assert.equal(out.dayCloseEvidence,'UNAVAILABLE');
});
test('manager UI renders unavailable instead of zero messages and false healthy',()=>{
  const source=fs.readFileSync(new URL('../manager-center-v1932.js',import.meta.url),'utf8');
  const start=source.indexOf('  function render(d){');
  const end=source.indexOf('  function mergePanel(out){',start);
  assert.ok(start>0&&end>start);
  const ui=source.slice(start,end);
  const nodes={
    mgr1932Body:{innerHTML:''},
    mgr1932Meta:{textContent:''}
  };
  const context={
    st:{errors:{}},
    txt:v=>String(v==null?'':v),
    esc:v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
    card:(name,value,sub)=>'<card>'+name+':'+value+':'+sub+'</card>',
    document:{getElementById:id=>nodes[id]||null},
  };
  const render=vm.runInNewContext(ui+'\nrender',context);
  render({success:true,system:{duplicateHealthy:null},employeePerformance:[],stockAlerts:[],
    messageQueue:null,debtControl:{restrictions:[]}});
  assert.match(nodes.mgr1932Body.innerHTML,/رسائل معلقة:—:/);
  assert.match(nodes.mgr1932Body.innerHTML,/حالة طابور الرسائل غير متاحة/);
  assert.match(nodes.mgr1932Body.innerHTML,/UNKNOWN/);
  assert.match(nodes.mgr1932Meta.textContent,/قراءة مجمعة من Core D1/);
});
