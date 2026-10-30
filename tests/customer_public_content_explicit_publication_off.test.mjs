/* Zero Google customer public D1 views — explicit publication consent.
 * Source-only synthetic DB, no real customer, Google, production or Worker.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
globalThis.crypto ??= webcrypto;
import {handleCustomerNativePublicContentStageV0 as handle} from
  '../cloudflare-d1/customer-stage/public-content-ro-v0.mjs';

const ORIGIN='http://127.0.0.1:8000';
const URLROOT='https://isolated.example/v1/customer/native/public-content';
const SESSION='a'.repeat(64);
const SECRET='synthetic-only-customer-public-content-HMAC-test-key-2026';
const rec=(id,content)=>({record_id:id,record_json:JSON.stringify(content)});
function fixtures(){
  return {
    marketplace_vendors:[
      rec('PUBLISHED-V',{code:'PUBLISHED-V',vendorName:'Public Vendor',
        category:'DTF',publicToCustomers:true,
        whatsapp:'PRIVATE_PHONE',commission:95,notes:'PRIVATE_NOTES',
        customerId:'PRIVATE_CUSTOMER'}),
      rec('NO-CONSENT-V',{code:'NO-CONSENT-V',vendorName:'Private Vendor',
        whatsapp:'PRIVATE_VENDOR',publicToCustomers:false}),
    ],
    marketplace_products:[
      rec('PUBLISHED-P',{code:'PUBLISHED-P',vendorCode:'PUBLISHED-V',
        productName:'Public Print',price:'12.50',unit:'piece',
        publicToCustomers:true,cost:4,employeeNotes:'PRIVATE_COST',
        googleFile:'https://drive.google.com/private'}),
      rec('NO-CONSENT-P',{code:'NO-CONSENT-P',vendorCode:'PUBLISHED-V',
        productName:'Private Print',price:'15',publicToCustomers:false}),
      rec('ORPHAN-P',{code:'ORPHAN-P',vendorCode:'NO-CONSENT-V',
        productName:'Orphan Print',price:'20',publicToCustomers:true}),
    ],
    platform_ads:[
      rec('PUBLISHED-AD',{adId:'PUBLISHED-AD',title:'Public Notice',
        placement:'top',publicToCustomers:true,ownerNotes:'PRIVATE_AD_NOTE',
        fileUrl:'https://drive.google.com/private'}),
      rec('PRIVATE-AD',{adId:'PRIVATE-AD',title:'Private Notice',
        publicToCustomers:false,secret:'PRIVATE_AD_SECRET'}),
      rec('IMAGE-ONLY',{adId:'IMAGE-ONLY',fileUrl:'https://drive.google.com/secret',
        publicToCustomers:true}),
    ],
    white_label:[rec('default',{platformName:'Approved Public Brand',
      primaryColor:'#224466',publicToCustomers:true,
      ownerName:'PRIVATE_OWNER',whatsappNumber:'PRIVATE_PHONE',
      licenseToken:'PRIVATE_TOKEN',logoUrl:'https://drive.google.com/private'})],
    platform_sections:[rec('DTF',{code:'DTF',name:'DTF'})],
    franchise_branches:[rec('BANHA',{code:'BANHA',displayName:'Public Branch',
      customerVisibility:'ظاهر كفرع مطبعجي'})],
  };
}
function sandbox(overrides={}){
  const collections=structuredClone(overrides.collections||fixtures());
  const state={sessions:0,controls:0,contentReads:0};
  const sql={prepare(statement){
    if(statement.includes('FROM customer_portal_native_sessions_v1 s')){
      return {bind(..._params){return {async first(){
        state.sessions++;
        return overrides.sessionRevoked?null:{customerId:'SYNTHETIC-C1'};
      }};}};
    }
    if(statement.includes('FROM employee_content_control_v1')){
      return {async first(){
        state.controls++;
        return overrides.contentModeOff?{mode:'OFF',epoch:1}:{mode:'READONLY',epoch:1};
      }};
    }
    if(statement.includes('FROM employee_content_records_v1')){
      if(statement.includes("collection='white_label'")){
        return {async all(){
          state.contentReads++;
          return {results:collections.white_label.filter(x=>x.record_id==='default').slice(0,1)};
        }};
      }
      return {bind(collection){
        return {async all(){
          state.contentReads++;
          return {results:collections[collection]||[]};
        }};
      }};
    }
    throw new Error('unexpected SQL query in synthetic test');
  }};
  const env={DB:sql,CORS_ORIGINS:ORIGIN,
    TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
    TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED:'true'};
  const request=(view,{origin=ORIGIN,token=SESSION}={})=>new Request(
    URLROOT+'?view='+encodeURIComponent(view),
    {method:'GET',headers:{Origin:origin,Authorization:'Bearer '+token}}
  );
  async function get(view,settings={}){
    const response=await handle(request(view,settings),env);
    return {status:response.status,body:await response.json()};
  }
  return {env,state,collections,get};
}
const privateLeak=s=>/PRIVATE_|drive\.google\.com/.test(JSON.stringify(s));

test('explicitly approved D1 marketplace, text ads and brand show bounded public properties',async()=>{
  const s=sandbox();
  const market=await s.get('marketplace');
  assert.equal(market.status,200);
  assert.equal(market.body.vendors.length,1);
  assert.equal(market.body.vendors[0].vendorCode,'PUBLISHED-V');
  assert.deepEqual(market.body.products.map(p=>p.productCode),['PUBLISHED-P']);
  assert.equal(market.body.products[0].price,'12.50');
  assert.equal(privateLeak(market.body),false);
  const ads=await s.get('ads');
  assert.equal(ads.status,200);
  assert.deepEqual(ads.body.ads.map(a=>a.adId),['PUBLISHED-AD']);
  assert.equal(privateLeak(ads.body),false);
  const brand=await s.get('brand');
  assert.equal(brand.status,200);
  assert.deepEqual(brand.body.settings,{
    platformName:'Approved Public Brand',primaryColor:'#224466'
  });
  assert.equal(privateLeak(brand.body),false);
  assert.equal(s.state.sessions,3);
  assert.equal(s.state.controls,3);
});

test('ACTIVE is not consent; absent publication flag keeps all sensitive views private',async()=>{
  const c=fixtures();
  for(const list of ['marketplace_vendors','marketplace_products','platform_ads','white_label']){
    for(const r of c[list])delete JSON.parse(r.record_json).publicToCustomers;
    c[list]=c[list].map(r=>{
      const obj=JSON.parse(r.record_json);delete obj.publicToCustomers;
      return rec(r.record_id,obj);
    });
  }
  const s=sandbox({collections:c});
  assert.deepEqual((await s.get('marketplace')).body.vendors,[]);
  assert.deepEqual((await s.get('marketplace')).body.products,[]);
  assert.deepEqual((await s.get('ads')).body.ads,[]);
  assert.deepEqual((await s.get('brand')).body.settings,{});
});

test('string true, number one, null are NOT customer publication consent',async()=>{
  for(const invalid of ['true',1,null,'نعم']){
    const c=fixtures();
    for(const key of ['marketplace_vendors','marketplace_products','platform_ads','white_label']){
      c[key]=c[key].map(r=>{
        const x=JSON.parse(r.record_json);x.publicToCustomers=invalid;
        return rec(r.record_id,x);
      });
    }
    const s=sandbox({collections:c});
    assert.deepEqual((await s.get('marketplace')).body.vendors,[]);
    assert.deepEqual((await s.get('ads')).body.ads,[]);
    assert.deepEqual((await s.get('brand')).body.settings,{});
  }
});

test('vendor and product each need independent publication consent',async()=>{
  const c=fixtures();
  c.marketplace_vendors[0]=rec('PUBLISHED-V',{
    code:'PUBLISHED-V',vendorName:'Inactive Consent',publicToCustomers:false
  });
  let out=(await sandbox({collections:c}).get('marketplace')).body;
  assert.deepEqual(out.vendors,[]);
  assert.deepEqual(out.products,[]);
  const d=fixtures();
  d.marketplace_products[0]=rec('PUBLISHED-P',{
    code:'PUBLISHED-P',vendorCode:'PUBLISHED-V',productName:'Private Product',
    publicToCustomers:false
  });
  out=(await sandbox({collections:d}).get('marketplace')).body;
  assert.equal(out.vendors.length,1);
  assert.deepEqual(out.products,[]);
});

test('price must be decimal digits and optional literal dot with max two decimals',async()=>{
  for(const price of ['12x50','12\\x50','12.500','-3','1e3']){
    const c=fixtures();
    c.marketplace_products[0]=rec('PUBLISHED-P',{
      code:'PUBLISHED-P',vendorCode:'PUBLISHED-V',productName:'Invalid Price',
      publicToCustomers:true,price
    });
    const out=(await sandbox({collections:c}).get('marketplace')).body;
    assert.deepEqual(out.products,[],price);
  }
  const c=fixtures();
  c.marketplace_products[0]=rec('PUBLISHED-P',{
    code:'PUBLISHED-P',vendorCode:'PUBLISHED-V',productName:'Valid Zero',
    publicToCustomers:true,price:'0.00'
  });
  const out=(await sandbox({collections:c}).get('marketplace')).body;
  assert.equal(out.products[0].price,'0.00');
});

test('revoked native customer session and forbidden Origin never read private content',async()=>{
  const revoked=sandbox({sessionRevoked:true});
  const r=await revoked.get('marketplace');
  assert.equal(r.status,401);
  assert.equal(revoked.state.contentReads,0);
  const external=sandbox();
  const e=await external.get('ads',{origin:'https://untrusted.example'});
  assert.equal(e.status,403);
  assert.equal(external.state.sessions,0);
});

test('independent source flag OFF and content-control OFF deny all public views',async()=>{
  const s=sandbox();
  s.env.TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED='false';
  const response=await s.get('brand');
  assert.equal(response.status,503);
  assert.equal(s.state.sessions,0);
  const wrongMode=sandbox({contentModeOff:true});
  const result=await wrongMode.get('ads');
  assert.equal(result.status,503);
  assert.equal(wrongMode.state.contentReads,0);
});

test('overflowed active content list fails closed instead of partial catalog',async()=>{
  const c=fixtures();
  c.marketplace_vendors=Array.from({length:41},(_,i)=>
    rec('V-'+i,{vendorName:'Vendor '+i,code:'V-'+i,publicToCustomers:true}));
  const s=sandbox({collections:c});
  const r=await s.get('marketplace');
  assert.equal(r.status,503);
  assert.equal(r.body.code,'CUSTOMER_PUBLIC_READ_UNAVAILABLE');
  assert.equal(privateLeak(r.body),false);
});
