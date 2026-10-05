import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {
  handleAutonomousPrintshopShadowRequest,
  isAutonomousPrintshopShadowPath
} from '../../cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs';

const nowIso=()=>new Date().toISOString();
const headers=[
  'رقم الأوردر','كود الأوردر','اسم الشات / المكتب','x','القسم','رقم البند',
  'اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟',
  'آخر تحديث','ملاحظات','x2','x3','رقم العميل الخارجي','مكبس','طباعة على الطاير',
  'تاريخ الاستلام','تاريخ التسليم المتوقع','الوقت المتوقع'
];

function row(orderId,lineId,priority,due){
  const a=new Array(headers.length).fill('');
  a[0]=orderId;a[1]=orderId;a[2]='عميل';a[4]='طباعة';a[5]=lineId;a[6]='منتج';
  a[7]='1';a[8]='وائل';a[9]=priority;a[10]='طلب جديد';a[12]=nowIso();a[20]=due;
  return a;
}
const viewRows=[
  {rowNumber:1,values:headers,display:headers},
  {rowNumber:2,values:row('20','20-1','عادي','2026-10-07'),display:row('20','20-1','عادي','2026-10-07')},
  {rowNumber:3,values:row('10','10-1','عاجل','2026-10-06'),display:row('10','10-1','عاجل','2026-10-06')}
];

const env={
  AUTONOMOUS_PRINTSHOP_SHADOW_V1_ENABLED:'true',
  EDGE_SESSION_SECRET:'shadow-test-secret',
  EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED:'false',
  CORS_ORIGINS:'https://fawakhry.github.io',
  DB:{
    prepare(sql){
      const kind=sql.includes('FROM sheet_rows')?'rows':'catalog';
      return {
        bind(sheetName){
          return {
            async first(){
              if(kind!=='catalog')return null;
              if(['الأوردرات','بنود الأوردرات'].includes(sheetName)){
                return {
                  headersJson:'[]',sourceLastRow:2,sourceLastCol:2,rowCount:2,status:'ready',
                  syncedAt:nowIso(),note:'TrendOS orders live sync V1'
                };
              }
              if(sheetName==='واجهة الطباعة'){
                return {
                  headersJson:JSON.stringify(headers),sourceLastRow:3,sourceLastCol:headers.length,
                  rowCount:3,status:'ready',syncedAt:nowIso(),note:'view'
                };
              }
              return null;
            },
            async all(){
              if(kind!=='rows')return {results:[]};
              if(sheetName!=='واجهة الطباعة')return {results:[]};
              return {results:viewRows.map(x=>({
                rowNumber:x.rowNumber,
                valuesJson:JSON.stringify(x.values),
                displayJson:JSON.stringify(x.display)
              }))};
            }
          };
        }
      };
    }
  }
};

assert.equal(isAutonomousPrintshopShadowPath('/v1/autonomous-printshop/shadow/health'),true);
assert.equal(isAutonomousPrintshopShadowPath('/v1/autonomous-printshop/shadow/recommend'),true);
assert.equal(isAutonomousPrintshopShadowPath('/v1/orders'),false);

let response=await handleAutonomousPrintshopShadowRequest(
  new Request('https://example.test/v1/autonomous-printshop/shadow/health'),
  env,
  {}
);
let body=await response.json();
assert.equal(response.status,200);
assert.equal(body.enabled,true);
assert.equal(body.writesAccepted,false);
assert.equal(body.employeeAssignment,false);

response=await handleAutonomousPrintshopShadowRequest(
  new Request('https://example.test/v1/autonomous-printshop/shadow/recommend?screen=print'),
  env,
  {}
);
body=await response.json();
assert.equal(response.status,401);
assert.equal(body.code,'AUTONOMOUS_PRINTSHOP_SHADOW_UNAUTHORIZED');

const token=await issueOrdersEdgeToken({
  sub:'admin-test',role:'admin',department:'',screens:['service','print','laser','press','']
},env.EDGE_SESSION_SECRET,Math.floor(Date.now()/1000),600);

response=await handleAutonomousPrintshopShadowRequest(
  new Request('https://example.test/v1/autonomous-printshop/shadow/recommend?screen=print',{
    headers:{Authorization:'Bearer '+token}
  }),
  env,
  {}
);
body=await response.json();
assert.equal(response.status,200);
assert.equal(body.success,true);
assert.equal(body.mode,'SHADOW_READ_ONLY');
assert.equal(body.writesAccepted,false);
assert.equal(body.employeeAssignment,false);
assert.equal(body.recommendation.task.orderId,'10');
assert.equal(body.counts.ordinary,2);
assert.equal(body.limitations.activeTaskAuthorityConnected,false);

const employeeToken=await issueOrdersEdgeToken({
  sub:'employee-test',role:'print',department:'طباعة',screens:['print','']
},env.EDGE_SESSION_SECRET,Math.floor(Date.now()/1000),600);
response=await handleAutonomousPrintshopShadowRequest(
  new Request('https://example.test/v1/autonomous-printshop/shadow/recommend?screen=print',{
    headers:{Authorization:'Bearer '+employeeToken}
  }),
  env,
  {}
);
body=await response.json();
assert.equal(response.status,403);
assert.equal(body.code,'AUTONOMOUS_PRINTSHOP_SHADOW_ADMIN_ONLY');

console.log('AUTONOMOUS_PRINTSHOP_SHADOW_ROUTE_V1=PASS');
console.log('MODE=SHADOW_READ_ONLY');
console.log('AUTH=ADMIN_EDGE_SESSION_ONLY');
console.log('WRITES_ACCEPTED=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');
