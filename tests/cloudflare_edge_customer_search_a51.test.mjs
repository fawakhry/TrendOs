import assert from 'node:assert/strict';
import {
  isEdgeCustomerSearchPath,
  searchCustomerDirectory,
  handleEdgeCustomerSearchRequest
} from '../cloudflare-d1/src/edge-customer-search-v1.mjs';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';

const SECRET='a51-test-secret';

function makeEnv({parity=true}={}) {
  const headers=[
    'اسم الشات / المكتب','اسم المسؤول','رقم العميل الأساسي','رقم إضافي','نوع العميل','مفعل؟',
    'مديونية','كود العميل','فرع','ملاحظات','','','','','','','',''
  ];
  const rows=[
    headers,
    ['محمود مناع','فوخا','01007131332','','خارجي','نعم','125.50','C-4324','','','','','','','','','',''],
    ['احمد محمد','وائل','01000000000','','خارجي','لا','0','C-X','','','','','','','','','','']
  ];
  const catalog={
    headersJson:JSON.stringify(headers),
    sourceLastRow:parity?rows.length:99,
    sourceLastCol:18,
    rowCount:rows.length,
    status:'ready',
    syncedAt:'2026-09-28 21:47:08',
    note:'PERF-CF-02CR enrichment live sync V1'
  };
  const mirrorRows=rows.map((row,i)=>({rowNumber:i+1,displayJson:JSON.stringify(row),valuesJson:JSON.stringify(row)}));
  return {
    CORS_ORIGINS:'https://fawakhry.github.io',
    EDGE_SESSION_SECRET:SECRET,
    DB:{
      prepare(sql){
        return {
          bind(){
            return {
              async first(){
                if(String(sql).includes('FROM sheet_catalog')) return catalog;
                throw new Error('unexpected first SQL');
              },
              async all(){
                if(String(sql).includes('FROM sheet_rows')) return {results:mirrorRows};
                throw new Error('unexpected all SQL');
              }
            };
          }
        };
      }
    }
  };
}

assert.equal(isEdgeCustomerSearchPath('/v1/edge/customers/search'),true);
assert.equal(isEdgeCustomerSearchPath('/v1/edge/orders/02cr/page'),false);

{
  const result=await searchCustomerDirectory(makeEnv(),'محمود',12,Date.parse('2026-09-28T21:48:08Z'));
  assert.equal(result.customers.length,1);
  assert.equal(result.customers[0].name,'محمود مناع');
  assert.equal(result.customers[0].phone,'01007131332');
  assert.equal(result.customers[0].debtAmount,125.5);
  assert.equal(result.customers[0].currentBalance,125.5);
  assert.equal(result.customers[0].remainingBalance,125.5);
  assert.equal(result.mirror.rowCount,3);
  assert.equal(result.mirror.sourceLastRow,3);
  assert.equal(result.mirror.ageSeconds,60);
  assert.equal(JSON.stringify(result.customers[0]).includes('_search'),false);
}

{
  const result=await searchCustomerDirectory(makeEnv(),'01007131332');
  assert.equal(result.customers.length,1);
  assert.equal(result.customers[0].name,'محمود مناع');
}

{
  const result=await searchCustomerDirectory(makeEnv(),'احمد');
  assert.equal(result.customers.length,0,'inactive customers must stay excluded like Apps Script');
}

{
  const env=makeEnv();
  const unauthorized=await handleEdgeCustomerSearchRequest(
    new Request('https://edge.test/v1/edge/customers/search?q=%D9%85%D8%AD%D9%85%D9%88%D8%AF',{headers:{Origin:'https://fawakhry.github.io'}}),
    env
  );
  assert.equal(unauthorized.status,401);

  const token=await issueOrdersEdgeToken({sub:'wael',role:'admin',department:'إدارة',screens:['service','laser']},SECRET);
  const response=await handleEdgeCustomerSearchRequest(
    new Request('https://edge.test/v1/edge/customers/search?q=%D9%85%D8%AD%D9%85%D9%88%D8%AF',{
      headers:{Origin:'https://fawakhry.github.io',Authorization:'Bearer '+token}
    }),
    env
  );
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.success,true);
  assert.equal(body.dataSource,'d1-customer-directory');
  assert.equal(body.customers.length,1);
  assert.equal(body.edgeSession,'wael');
  assert.equal(JSON.stringify(body).includes('كلمة مرور'),false);
  assert.equal(JSON.stringify(body).includes('توكن'),false);
}

{
  const env=makeEnv({parity:false});
  const token=await issueOrdersEdgeToken({sub:'wael',role:'admin',department:'إدارة',screens:['service']},SECRET);
  const response=await handleEdgeCustomerSearchRequest(
    new Request('https://edge.test/v1/edge/customers/search?q=x',{headers:{Authorization:'Bearer '+token}}),
    env
  );
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.success,false);
  assert.equal(body.fallback,'apps-script');
}

console.log('T12 A51 D1 customer search tests: PASS');
