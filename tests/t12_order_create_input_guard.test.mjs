import assert from 'node:assert/strict';
import { checkT12OrderCreateInputShape } from '../cloudflare-d1/src/t12-order-create-input-guard.mjs';
import { evaluateT12OrderCreatePreflight } from '../cloudflare-d1/src/t12-order-create-preflight.mjs';
import { buildT12OrderCreateShadowIntent } from '../cloudflare-d1/src/t12-order-create-shadow-intent.mjs';

const base=()=>({
  clientRequestId:'T12-FIELD-001',customerName:'عميل اختبار',customerPhone:'01012345678',
  department:'طباعة',itemName:'تابلوه',qty:1,status:'طلب جديد'
});
const good=checkT12OrderCreateInputShape(base());
assert.equal(good.valid,true);
const fields=[
  'assignedTo','customerType','total','remaining','amountPaid','deposit',
  'discount','payments','lineItems','orderLines','lines','items',
  'username','token','edgeToken','createdBy','actor',
  'orderId','lineId','forceCreate','expectedDelivery',
  'price','shippingFee','unknownBusinessField','الإجمالي','المتبقي'
];
for(const field of fields){
  const v=field==='items'||field==='lineItems'||field==='lines'||field==='payments'?[{name:'lost'}]:'LOST';
  const input={...base(),[field]:v};
  const shape=checkT12OrderCreateInputShape(input);
  assert.equal(shape.valid,false,'guard must refuse silently dropped field '+field);
  assert(shape.unexpectedFields.includes(field));
  const preflight=evaluateT12OrderCreatePreflight(input,{});
  assert.equal(preflight.ready,false);
  assert.equal(preflight.reason,'unsupported-create-fields-must-be-mapped');
  const shadow=buildT12OrderCreateShadowIntent(input,'wael');
  assert.equal(shadow.success,false);
  assert.equal(shadow.reason,'unsupported-create-fields-must-be-mapped');
}
assert.equal(checkT12OrderCreateInputShape([]).valid,false);
assert.equal(checkT12OrderCreateInputShape(null).valid,false);
assert.equal(checkT12OrderCreateInputShape('string').valid,false);
const external={clientRequestId:'T12-EXT',customerMode:'خارجي / عابر',externalCustomerId:'987',department:'ليزر',itemName:'حفر',qty:1};
assert.equal(checkT12OrderCreateInputShape(external).valid,true);
assert.equal(buildT12OrderCreateShadowIntent(external,'gaber').valid,true);
console.log('T12 create-input admission guard PASS; silent-drop fields rejected='+fields.length);
