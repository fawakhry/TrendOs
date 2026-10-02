import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {
  applyLegacyRuntimeOverlay
} from '../cloudflare-d1/src/t12-legacy-line-runtime.mjs';
import { handleT12OperationalRuntimeRequest } from '../cloudflare-d1/src/t12-operational-runtime-handler.mjs';

const migration=fs.readFileSync(new URL('../cloudflare-d1/migrations/0011_t12_legacy_line_runtime.sql',import.meta.url),'utf8');
assert.match(migration,/CREATE TABLE IF NOT EXISTS t12_legacy_line_runtime/);
assert.match(migration,/CREATE TABLE IF NOT EXISTS t12_legacy_line_runtime_events/);
assert.doesNotMatch(migration,/\b(?:DROP|ALTER)\b/i);

const serial4310=String(Math.round((Date.UTC(4310,0,1)-Date.UTC(1899,11,30))/(24*60*60*1000)));
const overlaid=applyLegacyRuntimeOverlay(
  [{orderId:'4310',lineId:serial4310,status:'طلب جديد',notes:'old'}],
  [{orderId:'4310',lineId:'4310-01',status:'تم التسليم',notes:'done',version:2,updatedAt:'2026-10-02 12:00:00'}]
);
assert.equal(overlaid[0].lineId,'4310-01');
assert.equal(overlaid[0].status,'تم التسليم');
assert.equal(overlaid[0].notes,'done');
assert.equal(overlaid[0].legacyRuntime,true);
assert.equal(overlaid[0].writeAuthority,'cloudflare-t12-legacy-runtime');

const lineHeaders=[
  'رقم الأوردر','كود الأوردر','اسم الشات / المكتب','اسم المسؤول','القسم','رقم البند',
  'اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟','آخر تحديث','ملاحظات'
];
const rawLine=['4310','4310','شهد جمجره','','طباعة','4310-01-01T08:00:00.000Z','أوردر جديد - طباعة','1','وائل','عادي','طلب جديد','','9/23/2026',''];
const displayLine=['4310','4310','شهد جمجره','','طباعة','4310-01','أوردر جديد - طباعة','1','وائل','عادي','طلب جديد','','9/23/2026',''];

function mirror(headers,rows){
  return {
    catalog:{headersJson:JSON.stringify(headers),sourceLastRow:rows.length+1,sourceLastCol:headers.length,rowCount:rows.length+1,status:'ready',syncedAt:'2026-09-26 18:33:08'},
    rows:[
      {rowNumber:1,valuesJson:JSON.stringify(headers),displayJson:JSON.stringify(headers)},
      ...rows.map((x,i)=>({rowNumber:i+2,valuesJson:JSON.stringify(x.values),displayJson:JSON.stringify(x.display)}))
    ]
  };
}
const customerHeaders=['اسم الشات / المكتب','رقم العميل الأساسي','مديونية','ملاحظات المديونية'];
const restrictionHeaders=['ID','اسم العميل','رقم العميل','منع فعال؟','سبب المنع','صالح حتى'];

class FakeStmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  async first(){
    if(/FROM\s+t12_prod_lines\s+l/i.test(this.sql))return null;
    if(/FROM\s+sheet_catalog/i.test(this.sql)){
      const m=this.db.mirrors[this.args[0]];return m?{...m.catalog}:null;
    }
    if(/FROM\s+t12_legacy_line_runtime/i.test(this.sql)&&/WHERE\s+line_id=\?/i.test(this.sql)){
      const found=this.db.runtime.find(x=>x.lineId===this.args[0]&&x.orderId===this.args[1]);
      return found?{status:found.status,notes:found.notes,version:found.version,updatedAt:found.updatedAt}:null;
    }
    return null;
  }
  async all(){
    if(/FROM\s+sheet_rows/i.test(this.sql)){
      const m=this.db.mirrors[this.args[0]];return {results:m?m.rows.map(x=>({...x})):[]};
    }
    if(/FROM\s+t12_legacy_line_runtime/i.test(this.sql)&&!this.sql.includes('sqlite_master')){
      return {results:this.db.runtime.map(x=>({...x}))};
    }
    if(/sqlite_master/i.test(this.sql)){
      return {results:[{name:'t12_legacy_line_runtime'},{name:'t12_legacy_line_runtime_events'}]};
    }
    return {results:[]};
  }
}
class FakeDB{
  constructor({debt=false}={}){
    this.runtime=[];
    this.events=[];
    this.mirrors={
      'بنود الأوردرات':mirror(lineHeaders,[{values:rawLine,display:displayLine}]),
      'العملاء':mirror(customerHeaders,[{values:['شهد جمجره','01000000000',debt?'500':'0',''],display:['شهد جمجره','01000000000',debt?'500':'0','']}]),
      'عملاء منع التسليم بالمديونية':mirror(restrictionHeaders,debt?[{values:['R1','شهد جمجره','','نعم','مراجعة مديونية','2099/12/31'],display:['R1','شهد جمجره','','نعم','مراجعة مديونية','2099/12/31']}]:[])
    };
  }
  prepare(sql){return new FakeStmt(this,sql);}
  async batch(stmts){
    const up=stmts[0],ev=stmts[1];
    const [lineId,orderId,status,notes,sourceRowNumber,sourceMirrorSyncedAt,actor,updateSource]=up.args;
    const existing=this.runtime.find(x=>x.lineId===lineId);
    if(existing){
      Object.assign(existing,{orderId,status,notes,sourceRowNumber,sourceMirrorSyncedAt,updatedBy:actor,updateSource,version:existing.version+1,updatedAt:'2026-10-02 12:00:00'});
    }else{
      this.runtime.push({lineId,orderId,status,notes,sourceRowNumber,sourceMirrorSyncedAt,updatedBy:actor,updateSource,version:1,updatedAt:'2026-10-02 12:00:00'});
    }
    this.events.push({args:ev.args});
  }
}

const SECRET='entry597-secret';
const token=await issueOrdersEdgeToken({sub:'employee',role:'print',department:'طباعة',screens:['print']},SECRET,Math.floor(Date.now()/1000),600);

{
  const db=new FakeDB();
  const env={DB:db,EDGE_SESSION_SECRET:SECRET,CORS_ORIGINS:'https://example.test'};
  const req=new Request('https://example.test/v1/t12/orders/line-runtime/legacy-update',{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({orderId:'4310',lineId:'4310-01',status:'تحت التنفيذ',notes:'cloud legacy'})
  });
  const res=await handleT12OperationalRuntimeRequest(req,env);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.success,true);
  assert.equal(body.legacyRuntime,true);
  assert.equal(db.runtime.length,1);
  assert.equal(db.runtime[0].lineId,'4310-01');
  assert.equal(db.runtime[0].status,'تحت التنفيذ');
  assert.equal(db.events.length,1);
}

{
  const db=new FakeDB({debt:true});
  const env={DB:db,EDGE_SESSION_SECRET:SECRET,CORS_ORIGINS:'https://example.test'};
  const req=new Request('https://example.test/v1/t12/orders/line-runtime/legacy-update',{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({orderId:'4310',lineId:'4310-01',status:'تم التسليم',notes:''})
  });
  const res=await handleT12OperationalRuntimeRequest(req,env);
  assert.equal(res.status,409);
  const body=await res.json();
  assert.equal(body.deliveryBlocked,true);
  assert.equal(body.code,'delivery-debt-restricted');
  assert.equal(db.runtime.length,0);
}

{
  const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
  const calls=[],original=[];
  const storage=new Map();
  const sessionStorage={
    getItem:k=>storage.get(String(k))||'',
    setItem:(k,v)=>storage.set(String(k),String(v)),
    removeItem:k=>storage.delete(String(k))
  };
  const window={
    MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,
    MATBAGY_T12_LEGACY_LINE_RUNTIME_V1_ENABLED:true,
    MATBAGY_EDGE_ORDERS_API_URL:'https://edge.test',
    state:{user:{username:'employee',token:'employee-token'}},
    trendosSecureApiV1922:async function(action,params){original.push({action,params});return {success:true,source:'apps-script'};}
  };
  const context={
    window,sessionStorage,Map,Date,Math,JSON,String,Object,URLSearchParams,setInterval,clearInterval,
    console:{warn(){},log(){},error(){}},
    fetch:async function(url,options={}){
      calls.push({url:String(url),method:options.method||'GET',body:options.body});
      if(String(url).endsWith('/v1/edge/orders/session')){
        return {status:200,ok:true,async text(){return JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600});}};
      }
      if(String(url).endsWith('/v1/t12/orders/line-runtime/legacy-update')){
        return {status:200,ok:true,async text(){return JSON.stringify({success:true,legacyRuntime:true,status:'تم التسليم',version:1});}};
      }
      throw new Error('unexpected fetch '+url);
    }
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'trendos-edge-orders-read-v1.js'});
  const out=await window.trendosSecureApiV1922('updateLine',{rowNumber:757,orderId:'4310',lineId:'4310-01',status:'تم التسليم',notes:''});
  assert.equal(out.success,true);
  assert.equal(out.legacyRuntime,true);
  assert.equal(original.length,0,'legacy stable identity must not call Apps Script when Cloud runtime is armed');
  assert.equal(calls.some(x=>x.url.endsWith('/v1/t12/orders/line-runtime/legacy-update')&&x.method==='POST'),true);
  assert.equal(window.TrendOSEdgeOrdersReadV1.stats().legacyRuntimeWrites,1);
  assert.equal(window.TrendOSEdgeOrdersReadV1.stats().postWriteBarrierActive,true);
}

console.log('ENTRY597_T12_LEGACY_LINE_RUNTIME=PASS');
