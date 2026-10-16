import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

// Execute ACTUAL Code.gs updateLine_ source; stub only Apps Script Sheet,
// verified-session API and activity side-effects. Never call Google services.
const source=fs.readFileSync('Code.gs','utf8');
const marker='function updateLine_(e) {';
const a=source.indexOf(marker);
const b=source.indexOf('/*********************** تغيير جماعي لحالة القسم',a);
assert.ok(a>=0&&b>a,'missing real Legacy updateLine_ source');
const patchHelper='function legacySingleCanEditLineV1931_(user,department,heatPress)';
const helpIdx=source.indexOf(patchHelper);
const helper=helpIdx>=0?source.slice(helpIdx,a):'';
const code=helper+source.slice(a,b)+'\n;globalThis.legacyUpdate=updateLine_;';

const origRole=source.indexOf('function roleFromArabic_(');
const roleEnd=source.indexOf('\nfunction ',origRole+9);
const originalRole=source.slice(origRole,roleEnd);
const origScreen=source.indexOf('function dashboardMatchesScreen_(');
const screenEnd=source.indexOf('\nfunction ',origScreen+9);
const originalScreen=source.slice(origScreen,screenEnd);

function setup(role='print',department='طباعة',debts={}){
 const cols=14;
 const mk=(order,id,cust,dept)=>{
   const a=Array(cols).fill('');
   a[0]=order;a[2]=cust;a[4]=dept;a[5]=id;a[10]='تحت التنفيذ';a[11]='لا';
   return a;
 };
 const rows=[
  mk('FAKE_ORDER_PRINT','FAKE_LINE_PRINT','FAKE_CUST_PRINT','طباعة'),
  mk('FAKE_ORDER_LASER','FAKE_LINE_LASER','FAKE_CUST_LASER','ليزر'),
  mk('FAKE_ORDER_PRESS','FAKE_LINE_PRESS','FAKE_CUST_PRESS','مكبس')
 ];
 let writes=0,events=0;
 const colMap=Object.fromEntries([
  ['رقم الأوردر',1],['Order ID',1],['رقم البند',6],['Line ID',6],
  ['الحالة',11],['Status',11],['جاهز؟',12],['جاهز',12],['Ready',12],
  ['آخر تحديث',13],['Updated At',13],['ملاحظات',14],['Notes',14],
  ['اسم الشات / المكتب',3],['اسم العميل',3],['Customer Name',3],
  ['القسم',5],['Department',5]
 ]);
 const sheet={
   getLastRow(){return rows.length+1;},
   getLastColumn(){return cols;},
   getRange(r,c,nr=1,nc=1){
     const v={
       getValue(){return rows[r-2]?.[c-1];},
       getValues(){
         return Array.from({length:nr},(_,i)=>
           Array.from({length:nc},(_,j)=>rows[r-2+i]?.[c-1+j]??''));
       },
       setValues(values){
         if(values.length!==nr||values.some(x=>x.length!==nc))throw Error('invalid fake batch');
         values.forEach((valuesRow,i)=>valuesRow.forEach((cell,j)=>{rows[r-2+i][c-1+j]=cell;}));
         writes++;return v;
       }
     };
     return v;
   }
 };
 let actor={username:'FAKE_VERIFIED_EMPLOYEE',role,department};
 const norm=v=>String(v==null?'':v).trim();
 const ctx=vm.createContext({
   Date,
   normalize_:norm,
   ss_:()=>({getSheetByName:n=>n==='FAKE_LINES'?sheet:null}),
   SHEET_NAME_LINES:'FAKE_LINES',
   authorize_:(username,token)=>username==='FAKE_VERIFIED_EMPLOYEE'&&token==='FAKE_TOKEN'
     ?{ok:true,user:actor}:{ok:false,message:'fake token rejected'},
   ensureWhatsAppHeaders_:()=>{},
   headersMap_:()=>colMap,
   firstCol_:(h,names,fallback)=>names.map(n=>h[n]).find(Boolean)||fallback,
   valueAt_:(row,col)=>col>0?row[col-1]:'',
   isReadyStatus_:s=>s==='جاهز للاستلام',
   safeSet_:(sh,r,c,val)=>{rows[r-2][c-1]=val;writes++},
   isHeatPressFlag_:s=>norm(s)==='نعم',
   isCustomerDebtBlocked_:name=>({amount:debts[name]||0}),
   debtDeliveryRestrictionMapV1931_:()=>({'FAKE_CUST_PRINT':{reason:'fake ban'}}),
   searchKey_:name=>name,
   parseDebtAmount_:v=>Number(v)||0,
   trendosDeliveryGateV1931_:(id,name,invoice,debt,restriction)=>
     ({ok:!(debt>0&&restriction),message:'fake active debt ban'}),
   syncOrderFromLines_:()=>{events++},
   appendActivityLog_:()=>{events++},
   queueOrderStatusMessageV1931_:()=>{events++},
   trendosBumpDataVersionV1931_:()=>{events++},
   console
 });
 vm.runInContext(originalRole+'\n'+originalScreen+'\n'+code,ctx,{timeout:15000});
 const run=(param)=>ctx.legacyUpdate({parameter:{username:'FAKE_VERIFIED_EMPLOYEE',token:'FAKE_TOKEN',...param}});
 return {rows,run,setActor:a=>{actor=a},count:()=>({writes,events})};
}

await test('BOOK19 Legacy 01: rowNumber and lineId disagreement rejects write to someone else order',()=>{
 const f=setup('print','طباعة');
 const before=structuredClone(f.rows);
 const result=f.run({rowNumber:2,lineId:'FAKE_LINE_LASER',orderId:'FAKE_ORDER_LASER',status:'تم التسليم'});
 assert.equal(result.success,false,JSON.stringify(result));
 assert.equal(result.code,'legacy-line-selector-mismatch');
 assert.deepEqual(f.rows,before,'invalid selectors cannot mutate another real sheet row');
 assert.equal(f.count().writes,0);
});
await test('BOOK19 Legacy 02: forged orderId with correct row+lineId cannot mutate',()=>{
 const f=setup('print','طباعة');
 const before=structuredClone(f.rows);
 const r=f.run({rowNumber:2,lineId:'FAKE_LINE_PRINT',orderId:'FAKE_ORDER_LASER',status:'تم التسليم'});
 assert.equal(r.success,false,JSON.stringify(r));
 assert.equal(r.code,'legacy-line-selector-mismatch');
 assert.deepEqual(f.rows,before);
});
await test('BOOK28 Legacy 03: verified print user denied laser line even if body role/screen admin',()=>{
 const f=setup('print','طباعة');
 const before=structuredClone(f.rows);
 const r=f.run({rowNumber:3,lineId:'FAKE_LINE_LASER',orderId:'FAKE_ORDER_LASER',
   role:'admin',screen:'laser',department:'ليزر',status:'تم التسليم'});
 assert.equal(r.success,false,JSON.stringify(r));
 assert.equal(r.code,'legacy-line-department-denied');
 assert.deepEqual(f.rows,before);
});
await test('BOOK28 Legacy 04: verified laser employee may edit own department',()=>{
 const f=setup('laser','ليزر');
 const r=f.run({rowNumber:3,lineId:'FAKE_LINE_LASER',orderId:'FAKE_ORDER_LASER',status:'جاهز للاستلام'});
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(f.rows[1][10],'جاهز للاستلام');
});
await test('BOOK28 Legacy 05: verified customer service has existing full operational scope',()=>{
 const f=setup('service','خدمة العملاء');
 const r=f.run({rowNumber:3,lineId:'FAKE_LINE_LASER',orderId:'FAKE_ORDER_LASER',status:'تحت التنفيذ'});
 assert.equal(r.success,true,JSON.stringify(r));
});
await test('BOOK28 Legacy 06: unknown verified role must NOT inherit fallback service permissions',()=>{
 const f=setup('unknown-role','unknown-department');
 const before=structuredClone(f.rows);
 const r=f.run({rowNumber:3,lineId:'FAKE_LINE_LASER',orderId:'FAKE_ORDER_LASER',status:'تم التسليم'});
 assert.equal(r.success,false,JSON.stringify(r));
 assert.equal(r.code,'legacy-line-department-denied');
 assert.deepEqual(f.rows,before);
});
await test('BOOK19 Legacy 07: active restricted debtor blocked even with authorized print role',()=>{
 const f=setup('print','طباعة',{'FAKE_CUST_PRINT':20});
 const before=structuredClone(f.rows);
 const r=f.run({rowNumber:2,lineId:'FAKE_LINE_PRINT',orderId:'FAKE_ORDER_PRINT',status:'تم التسليم'});
 assert.equal(r.success,false,JSON.stringify(r));
 assert.equal(r.deliveryBlocked,true);
 assert.deepEqual(f.rows,before);
});
await test('BOOK19 Legacy 08: unblocked delivery + matching row/id remains allowed',()=>{
 const f=setup('print','طباعة');
 const r=f.run({rowNumber:2,lineId:'FAKE_LINE_PRINT',orderId:'FAKE_ORDER_PRINT',status:'تم التسليم'});
 assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(f.rows[0][10],'تم التسليم');
});
await test('BOOK19 Legacy 09: bogus token fails before any sheet mutation',()=>{
 const f=setup('print','طباعة');
 const before=structuredClone(f.rows);
 const r=f.run({username:'FAKE_VERIFIED_EMPLOYEE',token:'WRONG',rowNumber:2,
   lineId:'FAKE_LINE_PRINT',orderId:'FAKE_ORDER_PRINT',status:'تم التسليم'});
 assert.equal(r.success,false);
 assert.deepEqual(f.rows,before);
});
console.log('BOOK19_LEGACY_SINGLE_SOURCE_ONLY=YES');
console.log('BOOK19_FINANCE_RELEASE=NO_GO');