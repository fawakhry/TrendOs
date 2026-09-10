import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../press-control-v1.js',import.meta.url),'utf8');
let promptValue='',confirmValue=true;
const window={TREND_API_URL:'https://example.invalid/exec'};
const context={
  console,window,JSON,Object,Array,String,Number,Math,Date,RegExp,Set,
  document:{readyState:'loading',addEventListener(){}},
  prompt(){return promptValue;},
  confirm(){return confirmValue;},
  alert(){},
  fetch:async()=>{throw new Error('network must not be used by payload unit test');},
  setInterval(){return 1;}
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'press-control-v1.js'});
assert.ok(window.TrendPressControlV1,'press frontend API must be exported');
const build=window.TrendPressControlV1.exactStopPayload;
assert.equal(typeof build,'function');

const session={
  sessionId:'PRESS-1',
  startItems:[
    {orderId:'4001',lineId:'4001-01',customer:'عميل أ'},
    {orderId:'4001',lineId:'4001-02',customer:'عميل أ'},
    {orderId:'4002',lineId:'4002-01',customer:'عميل ب'}
  ]
};

promptValue='1,3';confirmValue=true;
let p=build(session);
assert.equal(p.sessionId,'PRESS-1');
assert.deepEqual(JSON.parse(p.completedLineIds),['4001-01','4002-01']);
assert.equal(p.ordersPressed,'2','order count must be derived from exact selected Line IDs');

promptValue='١،٢';
p=build(session);
assert.deepEqual(JSON.parse(p.completedLineIds),['4001-01','4001-02'],'Arabic digits/comma must map to exact snapshot indexes');
assert.equal(p.ordersPressed,'1','two selected lines from one order must count as one completed order');

promptValue='2,2,2';
p=build(session);
assert.deepEqual(JSON.parse(p.completedLineIds),['4001-02'],'duplicate selections must be deduplicated');

promptValue='4';
p=build(session);
assert.match(p.error,/خارج Snapshot/,'out-of-range selection must fail closed');

promptValue='x';
p=build(session);
assert.match(p.error,/غير صالح/,'non-numeric selection must fail closed');

promptValue='';confirmValue=true;
p=build(session);
assert.deepEqual(JSON.parse(p.completedLineIds),[]);
assert.equal(p.ordersPressed,'0');

confirmValue=false;
p=build(session);
assert.equal(p.cancelled,true,'zero completion requires explicit confirmation');

confirmValue=true;
p=build({sessionId:'PRESS-EMPTY',startItems:[]});
assert.deepEqual(JSON.parse(p.completedLineIds),[]);
assert.equal(p.ordersPressed,'0');

p=build({startItems:[]});
assert.match(p.error,/Session ID/,'missing session id must fail closed');

assert.match(source,/action:'pressControlV1'/,'legacy public action name must remain stable');
assert.match(source,/api\('stop',\{ordersPressed:n\}\)/,'legacy count-only fallback must remain for family-off rollout compatibility');
assert.match(source,/completedLineIds:JSON\.stringify\(lineIds\)/,'integrity mode must submit exact line ids');
assert.ok(!source.includes('localStorage'),'completion authority must not depend on stale browser storage');
console.log('RP-07 Press frontend exact-line compatibility: PASS');
