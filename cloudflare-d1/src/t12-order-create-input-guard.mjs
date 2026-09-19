/*
 * T12 exact-shape admission control. Fail closed before calling the pure V2
 * canonical contract; V2 does not itself reject every ignored input field.
 * Intentionally restricts the FIRST isolated single-line order create lane.
 * No IO, no Worker route, no production wiring.
 */
export const T12_INPUT_GUARD_VERSION='TRENDOS_T12_ORDER_CREATE_INPUT_GUARD_20260919';
const ACCEPTED=Object.freeze([
  'clientRequestId','requestId','idempotencyKey','idempotency_key',
  'customerMode','identityMode','customerIdentityMode',
  'externalCustomerId','customerExternalId','lightCustomerId',
  'customerName','name','اسم العميل','اسم الشات / المكتب',
  'customerPhone','phone','رقم العميل','رقم الهاتف',
  'department','القسم',
  'heatPress','press','isPress','مكبس حراري',
  'flyPrint','quickPrint','fastPrint','طباعة على الطاير',
  'itemName','item','اسم البند','نوع الشغل',
  'qty','quantity','الكمية',
  'status','orderStatus','الحالة',
  'priority','الأولوية',
  'source','مصدر الطلب','notes','ملاحظات'
]);
const ACCEPTED_SET=new Set(ACCEPTED);
const DANGEROUS=Object.freeze([
  'orderId','order_id','رقم الأوردر',
  'assignedTo','createdBy','actor','cloudActor',
  'username','token','employeeToken','edgeToken','password',
  'items','lineItems','orderLines','lines','products',
  'payment','payments','invoice','stockMovements','discount',
  'total','remaining','shippingFee','deposit','amountPaid','customPrice',
  'الإجمالي','المتبقي','المدفوع','الخصم','بنود الأوردر',
  'forceCreate','id','lineId','createdAt','updatedAt',
  'customerType','expectedDelivery','deliveryDate','price'
]);
function own(x,k){return Object.prototype.hasOwnProperty.call(x,k);}
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);}
export function checkT12OrderCreateInputShape(input) {
  if(!plain(input))return Object.freeze({valid:false,version:T12_INPUT_GUARD_VERSION,reason:'invalid-input-object',unexpectedFields:[],sensitiveFields:[]});
  const keys=Object.keys(input);
  const unexpectedFields=keys.filter(k=>!ACCEPTED_SET.has(k));
  const sensitiveFields=keys.filter(k=>DANGEROUS.includes(k)||/token|password|secret|credential|auth/i.test(k));
  if(unexpectedFields.length||sensitiveFields.length)return Object.freeze({
    valid:false,version:T12_INPUT_GUARD_VERSION,
    reason:'unsupported-create-fields-must-be-mapped',
    unexpectedFields:Object.freeze(unexpectedFields),sensitiveFields:Object.freeze(sensitiveFields)
  });
  if(keys.length>60)return Object.freeze({valid:false,version:T12_INPUT_GUARD_VERSION,reason:'too-many-fields',unexpectedFields:[],sensitiveFields:[]});
  return Object.freeze({valid:true,version:T12_INPUT_GUARD_VERSION,reason:'accepted-restricted-single-line-intent',unexpectedFields:[],sensitiveFields:[]});
}
export const T12_ACCEPTED_INPUT_FIELDS=ACCEPTED;
export const T12_UNSUPPORTED_BUSINESS_FIELDS=DANGEROUS;
