import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareEasyStoreChatCommandACC273 as prepare} from
  '../cloudflare-d1/src/easystore-chat-command-intake-acc273.mjs';

const base=Object.freeze({
  source:'chatgpt',messageId:'example-conversation:message-000001',
  customerId:'ESC-0123456789ABCDEFABCD',currency:'EGP',
  amount:'250.00',paymentMethod:'نقدي'
});
test('ACC273 a normal chat message never posts a finance command',()=>{
  const r=prepare({source:'chatgpt',messageId:base.messageId,intent:'non_accounting'});
  assert.equal(r.state,'NOT_AN_ACCOUNTING_COMMAND');
  assert.equal(r.postingAllowed,false);
  assert.equal(r.posted,false);
  assert.equal(r.receiptId,null);
  assert.equal(prepare({source:'chatgpt',intent:'wrong',messageId:base.messageId}).postingCandidate,undefined);
});
test('ACC273 opening supplier amounts and installments only reconcile, never post cash',()=>{
  for(const intent of ['supplier_opening','customer_opening','installment_obligation']){
    const r=prepare({...base,intent,amount:'99999.00'});
    assert.equal(r.state,'NEEDS_OPENING_RECONCILIATION');
    assert.equal(r.postingCandidate,null);
    assert.equal(r.posted,false);
  }
});
test('ACC273 supplier payments, installments, expenses are blocked by initial cash-only scope',()=>{
  for(const intent of ['supplier_payment','installment_payment','expense']){
    const r=prepare({...base,intent});
    assert.equal(r.state,'SCOPE_BLOCKED');
    assert.equal(r.postingCandidate,null);
  }
});
test('ACC273 a chat invoice draft is NOT a customer invoice in the ledger',()=>{
  const r=prepare({...base,intent:'invoice_draft'});
  assert.equal(r.state,'DRAFT_ONLY');
  assert.equal(r.posted,false);
});
test('ACC273 does not trust injected user roles or failed chat provenance',()=>{
  assert.equal(prepare({...base,intent:'customer_cash_receipt',role:'admin'}).state,'REJECTED');
  assert.equal(prepare({...base,intent:'customer_cash_receipt',token:'fake'}).state,'REJECTED');
  assert.equal(prepare({...base,intent:'customer_cash_receipt',source:'other'}).state,'REJECTED');
  assert.equal(prepare({...base,intent:'customer_cash_receipt',messageId:'123'}).state,'NEEDS_VERIFIED_MESSAGE_ID');
  assert.equal(prepare(null).state,'REJECTED');
});
test('ACC273 complete customer cash receipt preflight uses canonical ORIGINAL accounting action and stable id',()=>{
  const payload={...base,intent:'customer_cash_receipt',reference:'FAKE-INVOICE-0001'};
  const a=prepare(payload),b=prepare(payload);
  assert.equal(a.state,'READY_FOR_AUTHENTICATED_REVALIDATION');
  assert.equal(a.postingCandidate.action,'savePartyLedgerTransaction');
  assert.equal(a.postingCandidate.payload.operation,'payment_received');
  assert.equal(a.postingCandidate.payload.customerId,base.customerId);
  assert.equal(a.postingCandidate.payload.amount,250);
  assert.equal(a.posted,false);
  assert.equal(a.postingAllowed,false);
  assert.deepEqual(a.postingCandidate,b.postingCandidate);
  assert.notEqual(prepare({...payload,messageId:'example-conversation:message-000002'}).requestId,a.requestId);
  assert.equal(prepare({...payload,reference:''}).state,'NEEDS_DETAILS');
});
test('ACC273 an actual fully-paid manual cash invoice is prepared without creating original T12 order',()=>{
  const r=prepare({...base,intent:'cash_sale',invoiceNo:'FAKE-INV-003',
    item:'Synthetic print',quantity:2,unitPrice:'125'});
  assert.equal(r.state,'READY_FOR_AUTHENTICATED_REVALIDATION');
  assert.equal(r.postingCandidate.action,'saveEasyStoreSaleV2');
  assert.equal(r.postingCandidate.payload.orderId,'');
  assert.equal(r.postingCandidate.payload.paid,250);
  assert.equal(r.postingCandidate.payload.invoiceNo,'FAKE-INV-003');
  assert.equal(r.postingCandidate.payload.customerId,base.customerId);
  assert.equal(r.postingAllowed,false);
  assert.equal(r.receiptId,null);
});
test('ACC273 no silent rounding, guessed customer, partial sale, duplicate legacy or non-cash',()=>{
  const sale={...base,intent:'cash_sale',invoiceNo:'FAKE-INV-003',
    item:'Synthetic print',quantity:2,unitPrice:'125'};
  assert.equal(prepare({...sale,amount:249.99}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,amount:'5.777'}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,amount:-2}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,amount:'0010'}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,customerId:'اسم عميل'}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,paymentMethod:'إنستا باي'}).state,'SCOPE_BLOCKED');
  assert.equal(prepare({...sale,orderId:'T12-123'}).state,'SCOPE_BLOCKED');
  assert.equal(prepare({...sale,paid:false}).state,'SCOPE_BLOCKED');
  assert.equal(prepare({...sale,quantity:0}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,invoiceNo:''}).state,'NEEDS_DETAILS');
  assert.equal(prepare({...sale,paymentDate:'2026-02-30'}).state,'NEEDS_DETAILS');
});
test('ACC273 read-only balance questions cannot post or bypass staff authentication',()=>{
  const r=prepare({...base,intent:'balance_query'});
  assert.equal(r.state,'NEEDS_AUTHENTICATED_READ');
  assert.equal(r.postingCandidate,null);
});
