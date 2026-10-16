/** SERVER-68 page-size adapter is SOURCE-ONLY, no Apps Script or D1 calls. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';

const code=readFileSync('cloudflare-d1/D1_Orders_Read_Cutover.gs','utf8');
const fakeRows=Array.from({length:125},(_,i)=>({rowNumber:i+1,values:['SYNTHETIC-'+(i+1)]}));

function mocked({secure=false,installSigner=true}={}){
  const calls=[];
  const props={D1_MIRROR_SERVICE_READ_V1_ENABLED:secure?'true':'false',D1_API_URL:'https://synthetic-only.invalid'};
  function data(path){
    const url=new URL('https://synthetic-only.invalid'+path);
    const limit=Number(url.searchParams.get('limit'));
    const offset=Number(url.searchParams.get('offset'));
    calls.push({path,limit,offset});
    return {success:true,sheet:{
      sheetName:'الأوردرات',headers:['SYNTHETIC'],sourceLastRow:125,
      sourceLastCol:1,rowCount:125,status:'ready',
      syncedAt:'2026-10-16 00:00:00',note:'SYNTHETIC',
      rows:fakeRows.slice(offset,offset+limit)
    }};
  }
  const env={
    PropertiesService:{getScriptProperties:()=>({getProperty:(key)=>props[key]||''})},
    UrlFetchApp:{fetch:(url)=>({
      getResponseCode:()=>200,
      getContentText:()=>JSON.stringify(data(new URL(url).pathname+new URL(url).search))
    })}
  };
  if(installSigner){
    env.d1MirrorServiceReadV1_=(path)=>data(path);
  }
  const ctx=createContext(env);
  runInContext(code,ctx);
  return {ctx,calls,props};
}
test('default OFF preserves legacy 500-page contract with no signer needed',()=>{
  const x=mocked({secure:false,installSigner:false});
  const result=x.ctx.d1OrdersReadFetchSheet_('الأوردرات');
  assert.equal(result.rows.length,125);
  assert.equal(x.calls.length,1);
  assert.equal(x.calls[0].limit,500);
  assert.equal(x.calls[0].offset,0);
});
test('opted-in signed parity automatically requests two <=100-page batches',()=>{
  const x=mocked({secure:true});
  const result=x.ctx.d1OrdersReadFetchSheet_('الأوردرات');
  assert.equal(result.rows.length,125);
  assert.equal(result.rows[0].rowNumber,1);
  assert.equal(result.rows[124].rowNumber,125);
  assert.deepEqual(x.calls.map(y=>[y.limit,y.offset]),[[100,0],[100,100]]);
  assert.ok(x.calls.every(y=>y.path.startsWith('/v1/mirror/sheet?')));
});
test('opted-in secure reader refuses missing signer with zero HTTP activity',()=>{
  const x=mocked({secure:true,installSigner:false});
  assert.throws(()=>x.ctx.d1OrdersReadFetchSheet_('الأوردرات'),/SERVER67_SIGNER_NOT_INSTALLED/);
  assert.equal(x.calls.length,0);
});
test('secure reader keeps original behavior when explicitly toggled back OFF',()=>{
  const x=mocked({secure:true});
  x.ctx.d1OrdersReadFetchSheet_('الأوردرات');
  x.calls.length=0;
  x.props.D1_MIRROR_SERVICE_READ_V1_ENABLED='false';
  x.ctx.d1OrdersReadFetchSheet_('الأوردرات');
  assert.deepEqual(x.calls.map(y=>[y.limit,y.offset]),[[500,0]]);
});
test('fake endpoints are reserved RFC2606 .invalid',()=>{
  assert.equal(new URL('https://synthetic-only.invalid').hostname.endsWith('.invalid'),true);
});
