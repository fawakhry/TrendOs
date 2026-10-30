/**
 * ACC273 - pure, source-only ChatGPT -> ORIGINAL EasyStore action preflight.
 *
 * This is NOT a webhook, transport, financial API, persistence layer,
 * authorization check, or money writer. NO ChatGPT conversation messages are
 * subscribed/forwarded automatically. A connected authenticated caller is a
 * separate release gate; only the original native accounting handler may post.
 *
 * Never store real supplier amounts/names or raw chat text in public GitHub.
 * Financial data belongs only in the existing secured EasyStore finance D1.
 */
const CASH = new Set(['نقدي','cash']);
const ALLOWED = new Set([
  'cash_sale','customer_cash_receipt','supplier_payment',
  'supplier_opening','customer_opening','installment_payment',
  'installment_obligation','expense','invoice_draft','balance_query',
  'non_accounting'
]);
const trim = x => typeof x === 'string' ? x.trim() : '';
const own = (x,k) => Object.prototype.hasOwnProperty.call(x,k);
const freeze = o => Object.freeze(o);
const status = (state,reason,extra={})=>freeze({
  state,reason,postingAllowed:false,posted:false,receiptId:null,...extra
});

function positiveCents(v) {
  // Accept only explicitly structured values. Never silently parse free text.
  if(typeof v!=='number' && typeof v!=='string') return null;
  const s=String(v).trim();
  if(!/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(s))return null;
  const [whole,frac='']=s.split('.');
  const cents=Number(whole)*100+Number(frac.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents>0?cents:null;
}
function validDate(v) {
  if(typeof v!=='string'||!/^20\d\d-\d\d-\d\d$/.test(v))return false;
  const d=new Date(v+'T12:00:00Z');
  return !Number.isNaN(d.valueOf())&&d.toISOString().startsWith(v);
}
function missingRequired(fields, keys) {
  return keys.filter(k=> fields[k]==null || fields[k]==='' || Number.isNaN(fields[k]));
}
function safeMessageId(v){
  // An immutable, connector-issued message identity, not user text or timestamp.
  const s=trim(v);
  return /^[A-Za-z0-9_.:-]{12,110}$/.test(s)?s:'';
}
function cashOnly(v){return CASH.has(trim(v).toLowerCase())}
function exactCustomerId(v){return /^ESC-[A-F0-9]{20}$/.test(trim(v))}
function safeRef(v,max=90){const s=trim(v);return s.length>=1&&s.length<=max&&!/[<>\x00-\x1f]/.test(s)?s:''}
const RESERVED = ['status','time','actor','author','auth','token','username','role','session',
  'isAdmin','grant','override','force','controlMode','financeMode'];

export function prepareEasyStoreChatCommandACC273(envelope) {
  if(!envelope||typeof envelope!=='object'||Array.isArray(envelope))
    return status('REJECTED','invalid-envelope');
  if(RESERVED.some(k=>own(envelope,k)))
    return status('REJECTED','untrusted-authorization-fields');
  const kind=trim(envelope.intent);
  if(!ALLOWED.has(kind))return status('NOT_AN_ACCOUNTING_COMMAND','unknown-intent');
  if(kind==='non_accounting')return status('NOT_AN_ACCOUNTING_COMMAND','not-financial');
  if(envelope.source!=='chatgpt')
    return status('REJECTED','source-must-be-connector-attested');
  const mid=safeMessageId(envelope.messageId);
  if(!mid)return status('NEEDS_VERIFIED_MESSAGE_ID','immutable-message-id-required');
  const stableRequestId='CHAT-'+mid;
  const base={intent:kind,source:'chatgpt',requestId:stableRequestId};

  // Never accept user text as an opening or payee ID. Independent exact
  // opening reconciliation is needed for existing creditors/instalments.
  if(['supplier_opening','customer_opening','installment_obligation'].includes(kind))
    return status('NEEDS_OPENING_RECONCILIATION','opening-is-not-a-live-payment',
      { ...base, postingCandidate:null });
  if(['supplier_payment','installment_payment','expense'].includes(kind))
    return status('SCOPE_BLOCKED','outside-approved-cash-sales-and-customer-receipts',
      { ...base,postingCandidate:null });
  if(kind==='balance_query')
    return status('NEEDS_AUTHENTICATED_READ','requires-exact-party-and-read-session',
      {...base,postingCandidate:null});
  if(kind==='invoice_draft')
    return status('DRAFT_ONLY','invoice-draft-is-not-a-posted-sale',
      {...base,postingCandidate:null});

  const amountCents=positiveCents(envelope.amount);
  if(!amountCents)return status('NEEDS_DETAILS','positive-exact-egp-amount-required',
    {...base,missing:['amount'],postingCandidate:null});
  if(envelope.currency!=='EGP')
    return status('NEEDS_DETAILS','explicit-egp-currency-required',
      {...base,missing:['currency'],postingCandidate:null});
  if(!exactCustomerId(envelope.customerId))
    return status('NEEDS_DETAILS','exact-finance-customer-id-required',
      {...base,missing:['customerId'],postingCandidate:null});
  if(!cashOnly(envelope.paymentMethod))
    return status('SCOPE_BLOCKED','non-cash-or-unconfirmed-payment',
      {...base,postingCandidate:null});
  if(envelope.paymentDate!==undefined && !validDate(envelope.paymentDate))
    return status('NEEDS_DETAILS','invalid-payment-date',{...base,missing:['paymentDate']});
  const amount=amountCents/100;
  const common={requestId:stableRequestId,customerId:envelope.customerId,
    paymentMethod:'نقدي',amount,workDate:envelope.paymentDate};

  if(kind==='customer_cash_receipt'){
    const ref=safeRef(envelope.reference);
    if(!ref)return status('NEEDS_DETAILS','linked-customer-receipt-reference-required',
      {...base,missing:['reference'],postingCandidate:null});
    return status('READY_FOR_AUTHENTICATED_REVALIDATION',
      'preflight-only-original-ledger-and-balance-check-still-required',
      {...base,postingCandidate:freeze({action:'savePartyLedgerTransaction',
        payload:freeze({requestId:stableRequestId,partyType:'customer',
          customerId:envelope.customerId,operation:'payment_received',
          amount,paymentMethod:'نقدي',refNo:ref,
          ...(envelope.paymentDate?{workDate:envelope.paymentDate}:{})})})});
  }
  // New cash sale: avoid accidentally posting a draft, partial payment,
  // unknown customer, missing full item/quantity, or legacy order.
  const invoiceNo=safeRef(envelope.invoiceNo);
  const item=safeRef(envelope.item,180);
  const qty=Number(envelope.quantity);
  const unitCents=positiveCents(envelope.unitPrice);
  const missing=[];
  if(!invoiceNo)missing.push('invoiceNo');
  if(!item)missing.push('item');
  if(!Number.isSafeInteger(qty)||qty<1||qty>10000)missing.push('quantity');
  if(!unitCents)missing.push('unitPrice');
  if(missing.length) return status('NEEDS_DETAILS','sale-requires-exact-invoice-and-items',
    {...base,missing,postingCandidate:null});
  const expected=unitCents*qty;
  if(!Number.isSafeInteger(expected)||expected!==amountCents)
    return status('NEEDS_DETAILS','invoice-quantity-unit-total-mismatch',
      {...base,missing:['amount'],postingCandidate:null});
  if(trim(envelope.orderId)||envelope.paid===false||envelope.credit===true)
    return status('SCOPE_BLOCKED','order-linked-or-credit-sale-deferred',
      {...base,postingCandidate:null});
  return status('READY_FOR_AUTHENTICATED_REVALIDATION',
    'preflight-only-original-invoice-idempotency-and-cashbox-check-required',
    {...base,postingCandidate:freeze({action:'saveEasyStoreSaleV2',payload:freeze({
      requestId:stableRequestId,customerId:envelope.customerId,
      invoiceNo, no:invoiceNo,item,qty,unitPrice:unitCents/100,
      total:amount,paid:amount,paymentMethod:'نقدي',paymentType:'نقدي',
      orderId:'',...(envelope.paymentDate?{workDate:envelope.paymentDate}:{})
    })})});
}

// This module intentionally exports NO post/write, HTTP, database or polling
// primitive. An authenticated private bridge plus original deployed finance
// handler and a verified post-commit receipt is REQUIRED for any live sync.
