import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

// Run the checked-in Legacy bulk-status function, not a rewritten copy.
// Every Google Sheet, auth, lock, cache and notification dependency is fake.
const source=fs.readFileSync('Code.gs','utf8');
const begin=source.indexOf('function bulkUpdateDepartmentStatusV1926_(e) {');
const end=source.indexOf('/*********************** أرشفة تم التسليم V1926',begin);
assert.ok(begin>=0&&end>begin,'Legacy bulk function missing');
const helperStart=source.indexOf('function legacyBulkPreflightV1931_(');
const helper=helperStart>=0?source.slice(helperStart,begin):'';
const script=helper+source.slice(begin,end)+'\n;globalThis.fakeBulk=bulkUpdateDepartmentStatusV1926_;';

function setup({debt={},banned=[],mutate}={}){
  const cols=14;
  const mk=(order,line,customer,dept='طباعة',status='تحت التنفيذ')=>{
    const r=Array(cols).fill('');
    r[0]=order;r[2]=customer;r[4]=dept;r[5]=line;r[10]=status;r[11]='لا';
    return r;
  };
  const rows=[
    mk('FAKE_ORDER_A','FAKE_LINE_A','FAKE_CUSTOMER_A'),
    mk('FAKE_ORDER_B','FAKE_LINE_B','FAKE_CUSTOMER_B')
  ];
  const debtNow={FAKE_CUSTOMER_A:0,FAKE_CUSTOMER_B:0,...debt};
  const bans=new Set(banned);
  let mutated=false,writes=0,events=0,locks=0;
  const snapshot=()=>rows.map(r=>[...r]);
  const sheet={
    getLastRow(){return rows.length+1;},
    getLastColumn(){return cols;},
    getRange(row,col,nRows=1,nCols=1){
      return {getValues(){return Array.from({length:nRows},(_,i)=>Array.from({length:nCols},(_,j)=>rows[row-2+i]?.[col-1+j]??''))}};
    }
  };
  const h=Object.fromEntries([
    ['رقم الأوردر',1],['Order ID',1],['كود الأوردر',2],
    ['اسم الشات / المكتب',3],['اسم العميل',3],['Customer Name',3],
    ['القسم',5],['Department',5],['رقم البند',6],['Line ID',6],
    ['الحالة',11],['Status',11],['جاهز؟',12],['Ready',12],
    ['آخر تحديث',13],['Updated At',13],['مكبس',14],['Press',14]
  ]);
  const key=v=>String(v==null?'':v).trim();
  const controls={
    fakeDebt:debtNow,fakeBan:bans,rows,
    updateDebt:(name,amount)=>{debtNow[name]=amount},
    restrict:name=>bans.add(name),
    swapRows:()=>{[rows[0],rows[1]]=[rows[1],rows[0]]},
    changeStatus:(idx,s)=>{rows[idx][10]=s}
  };
  const ctx=vm.createContext({
    Date,JSON,Object,Math,
    normalize_:key,searchKey_:key,
    authorize_:(u,t)=>u==='FAKE_VERIFIED_EMPLOYEE'&&t==='FAKE_TOKEN'
      ?{ok:true,user:{username:u,role:'print',department:'طباعة'}}:{ok:false,message:'invalid fake login'},
    bulkStatusAllowedValuesV1926_:()=>['تحت التنفيذ','تم التسليم','جاهز للاستلام'],
    bulkStatusCanUseScreenV1926_:(u,s)=>s==='print'&&u.role==='print',
    CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},
    authDigestV1922_:s=>'FAKE_HASH_'+key(s),
    LockService:{getScriptLock:()=>({tryLock:()=>{locks++;return true;},releaseLock:()=>{}})},
    ss_:()=>({getSheetByName:n=>n==='FAKE_LINES'?sheet:null}),
    SHEET_NAME_LINES:'FAKE_LINES',
    headersMap_:()=>h,
    firstCol_:(headers,names,fallback)=>names.map(n=>headers[n]).find(Boolean)||fallback,
    valueAt_:(row,col)=>col>0?row[col-1]:'',
    isHeatPressFlag_:v=>key(v)==='نعم',
    dashboardMatchesScreen_:(screen,department,press)=>screen==='print'&&department==='طباعة',
    buildCustomerPhoneMap_:()=>Object.fromEntries(Object.entries(debtNow).map(([name,amount])=>[name,{debtAmount:amount}])),
    debtDeliveryRestrictionMapV1931_:()=>Object.fromEntries([...bans].map(name=>[name,{active:true,reason:'FAKE_ACTIVE_RESTRICTION'}])),
    parseDebtAmount_:v=>Number(v)||0,
    trendosDeliveryGateV1931_:(order,name,invoiceMap,amount,restriction)=>{
      if(!mutated&&mutate){mutated=true;mutate(controls);}
      return {ok:!(amount>0&&restriction),message:'fake active ban and debt'};
    },
    isReadyStatus_:s=>s==='جاهز للاستلام',
    bulkStatusSetRangeListV1926_:(sh,targets,col,value)=>{
      for(const rowNumber of targets){rows[rowNumber-2][col-1]=value;}
      writes++;
    },
    bulkStatusSyncOrderSummariesV1926_:()=>{events++;return 1},
    bulkStatusAppendActivityV1926_:()=>{events++},
    queueOrderStatusMessageV1931_:()=>{events++},
    trendosBumpDataVersionV1931_:()=>{events++},
    SpreadsheetApp:{flush:()=>{events++}}
  });
  vm.runInContext(script,ctx,{timeout:12000});
  const send=(overrides={})=>ctx.fakeBulk({parameter:{
    username:'FAKE_VERIFIED_EMPLOYEE',token:'FAKE_TOKEN',
    screen:'print',fromStatus:'تحت التنفيذ',toStatus:'تم التسليم',
    requestId:'FAKE_BULK_20261016_0001',...overrides
  }});
  return {send,controls,snapshot,stats:()=>({writes,events,mutated,locks})};
}
const failWithoutWrites=(f,result,before)=>{
  assert.equal(result.success,false,JSON.stringify(result));
  assert.deepEqual(f.snapshot(),before,'no partial line status changes from rejected bulk');
  assert.equal(f.stats().writes,0,'no status Sheet writes before eligibility/rebinding check');
};
await test('BOOK19 Legacy bulk 01: debt changes after projection and before write; recheck blocks delivery',()=>{
  const f=setup({banned:['FAKE_CUSTOMER_A'],mutate:({updateDebt})=>updateDebt('FAKE_CUSTOMER_A',40)});
  const result=f.send();
  assert.equal(f.stats().mutated,true,'debt update injected after initial customer map');
  const expected=f.snapshot().map(r=>[...r]);expected[0][10]='تحت التنفيذ';expected[1][10]='تحت التنفيذ';
  failWithoutWrites(f,result,expected);
});
await test('BOOK19 Legacy bulk 02: delivery restriction becomes active after projection; block all',()=>{
  const f=setup({debt:{FAKE_CUSTOMER_A:50},mutate:({restrict})=>restrict('FAKE_CUSTOMER_A')});
  const before=f.snapshot();const result=f.send();
  assert.equal(f.stats().mutated,true);
  failWithoutWrites(f,result,before);
});
await test('BOOK19 Legacy bulk 03: sheet row shifts after snapshot; prevent writing another line by row number',()=>{
  const f=setup({mutate:({swapRows})=>swapRows()});
  const result=f.send();
  assert.equal(f.stats().mutated,true);
  const afterSwap=f.snapshot().map(r=>[...r]);afterSwap.forEach(row=>row[10]='تحت التنفيذ');
  failWithoutWrites(f,result,afterSwap);
});
await test('BOOK19 Legacy bulk 04: customer line changed from expected fromStatus before write, refuse silent overwrite',()=>{
  const f=setup({mutate:({changeStatus})=>changeStatus(0,'جاهز للاستلام')});
  const result=f.send();
  assert.equal(f.stats().mutated,true);
  const afterMutation=f.snapshot().map(r=>[...r]);
  failWithoutWrites(f,result,afterMutation);
});
await test('BOOK19 Legacy bulk 05: permitted debt without ban still delivers on same checked-in Legacy source',()=>{
  const f=setup({debt:{FAKE_CUSTOMER_A:90}});
  const result=f.send();
  assert.equal(result.success,true,JSON.stringify(result));
  assert.equal(result.changed,2);
  assert.equal(f.snapshot().filter(r=>r[10]==='تم التسليم').length,2);
  assert.equal(f.stats().writes>0,true);
});
await test('BOOK19 Legacy bulk 06: existing active ban+debt skips restricted client; eligible client delivers',()=>{
  const f=setup({debt:{FAKE_CUSTOMER_A:20},banned:['FAKE_CUSTOMER_A']});
  const result=f.send();
  assert.equal(result.success,true,JSON.stringify(result));
  assert.equal(result.skippedDebt,1);
  assert.equal(result.changed,1);
  const rows=f.snapshot();
  assert.equal(rows[0][10],'تحت التنفيذ');
  assert.equal(rows[1][10],'تم التسليم');
});
await test('BOOK19 Legacy bulk 07: fake invalid employee token rejected before writes',()=>{
  const f=setup();const before=f.snapshot();
  const result=f.send({token:'INVALID'});
  assert.equal(result.success,false);
  assert.deepEqual(f.snapshot(),before);
  assert.equal(f.stats().writes,0);
});
console.log('BOOK19_LEGACY_BULK_FAKE_SHEET_ONLY=YES');
console.log('FINANCE_RELEASE=NO_GO');