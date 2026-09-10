import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const containmentSource=fs.readFileSync(new URL('../trendos-rp07-legacy-containment-v1.gs',import.meta.url),'utf8');
const routerSource=fs.readFileSync(new URL('../v1932-router.gs',import.meta.url),'utf8');

function loadContainment(){
  let lockDepth=0;
  const calls=[];
  const context={
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Error,
    Utilities:{formatDate(){return '2026-09-10';}},
    LockService:{
      getScriptLock(){
        return{
          waitLock(ms){assert.equal(ms,30000);assert.equal(lockDepth,0,'nested ScriptLock is not allowed');lockDepth=1;calls.push(['lock','wait']);},
          releaseLock(){assert.equal(lockDepth,1);lockDepth=0;calls.push(['lock','release']);}
        };
      }
    },
    attendanceV1_(e){calls.push(['attendance',e.parameter.op||'state',lockDepth]);return{success:true,op:e.parameter.op||'state',lockDepth};},
    attendanceClockinV1_(e){calls.push(['clockin',e.parameter.op||'',lockDepth]);return{success:true,lockDepth};},
    cleaningV1_(e){const payload=JSON.parse(e.parameter.payload||'{}');calls.push(['cleaning',payload.date,lockDepth]);return{success:true,date:payload.date,lockDepth};}
  };
  vm.createContext(context);
  vm.runInContext(containmentSource,context,{filename:'trendos-rp07-legacy-containment-v1.gs'});
  return{context,calls,getLockDepth:()=>lockDepth};
}

{
  const {context,calls,getLockDepth}=loadContainment();
  const out=context.trendosRp07LegacyAttendanceV1_({parameter:{op:'start'}});
  assert.equal(out.success,true);
  assert.equal(out.lockDepth,1,'attendance mutation must execute while ScriptLock is held');
  assert.deepEqual(calls.map(x=>x[0]),['lock','attendance','lock']);
  assert.equal(getLockDepth(),0,'ScriptLock must always be released');
}

{
  const {context,calls}=loadContainment();
  const out=context.trendosRp07LegacyAttendanceV1_({parameter:{op:'state'}});
  assert.equal(out.success,true);
  assert.equal(out.lockDepth,0,'attendance read state must not acquire the containment lock');
  assert.deepEqual(calls,[['attendance','state',0]]);
}

{
  const {context,calls,getLockDepth}=loadContainment();
  const out=context.trendosRp07LegacyAttendanceClockinV1_({parameter:{op:'clockin'}});
  assert.equal(out.success,true);
  assert.equal(out.lockDepth,1,'clock-in find/start/write sequence must execute under ScriptLock');
  assert.deepEqual(calls.map(x=>x[0]),['lock','clockin','lock']);
  assert.equal(getLockDepth(),0);
}

{
  const {context,calls}=loadContainment();
  const out=context.trendosRp07LegacyCleaningV1_({parameter:{op:'complete',payload:JSON.stringify({date:'2026/9/10',issue:''})}});
  assert.equal(out.success,true);
  assert.equal(out.date,'2026-09-10','cleaning business date must be canonical before duplicate scan/append');
  assert.equal(out.lockDepth,1,'cleaning check/append must execute while ScriptLock is held');
  assert.deepEqual(calls.map(x=>x[0]),['lock','cleaning','lock']);
}

{
  const {context,calls}=loadContainment();
  const out=context.trendosRp07LegacyCleaningV1_({parameter:{op:'complete',payload:JSON.stringify({date:'not-a-date'})}});
  assert.equal(out.success,false);
  assert.equal(out.integrityError,true);
  assert.equal(calls.length,0,'invalid cleaning date must fail closed before any legacy writer call');
}

function runRouter(extra){
  const context=Object.assign({
    console,
    Object,
    String,
    ContentService:{createTextOutput(x){return x;}},
    output_(x){return x;}
  },extra||{});
  vm.createContext(context);
  vm.runInContext(routerSource,context,{filename:'v1932-router.gs'});
  return context;
}

{
  const calls=[];
  const context=runRouter({
    trendosRp07LegacyAttendanceV1_(e){calls.push('containment');return{success:true,from:'containment',op:e.parameter.op};},
    attendanceV1_(){calls.push('legacy');return{success:true,from:'legacy'};}
  });
  const out=context.trendosV1932TryRoute_({parameter:{action:'attendanceV1',op:'start'}},null);
  assert.equal(out.from,'containment');
  assert.deepEqual(calls,['containment'],'router must prefer RP-07 containment when present');
}

{
  const calls=[];
  const context=runRouter({
    cleaningV1_(e){calls.push('legacy');return{success:true,from:'legacy',op:e.parameter.op};}
  });
  const out=context.trendosV1932TryRoute_({parameter:{action:'cleaningV1',op:'complete',payload:'{}'}},null);
  assert.equal(out.from,'legacy');
  assert.deepEqual(calls,['legacy'],'router fallback must remain intact when containment file is absent');
}

for(const forbidden of ['deleteRow(','deleteRows(','clearContent(','clear(']){
  assert.equal(containmentSource.includes(forbidden),false,`containment must not contain historical-data destructive primitive: ${forbidden}`);
}

assert.match(routerSource,/trendosRp07LegacyAttendanceV1_/);
assert.match(routerSource,/trendosRp07LegacyAttendanceClockinV1_/);
assert.match(routerSource,/trendosRp07LegacyCleaningV1_/);

console.log('RP-07 legacy Attendance/Cleaning containment contract: PASS');
