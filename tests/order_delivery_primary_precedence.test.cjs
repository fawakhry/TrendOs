'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');

function displayWith(today){
 const fn=src.match(/function displayExpectedDelivery\(row\) \{[\s\S]*?\n  \}/);
 assert.ok(fn,'display function missing');
 const sandbox={
   formatDisplayDate(value){return value ? String(value):'';},
   text(value){return String(value == null?'':value);},
   Date: class extends Date { constructor(...args){super(...(args.length?args:[today+'T12:00:00+02:00']));}}
 };
 return vm.runInNewContext('('+fn[0]+')',sandbox);
}

test('canonical expectedDeliveryAt wins over contradictory legacy expectedDeliveryText on multiple days',()=>{
  for(const today of ['2026-11-04','2026-11-05','2026-11-15']){
    const display=displayWith(today);
    assert.equal(display({expectedDeliveryAt:'2026/11/07',expectedDeliveryText:'2026/11/01'}),'2026/11/07');
    assert.equal(display({expectedDeliveryAt:'2026/11/07',expectedDeliveryText:'2026/11/07 - نفس اليوم'}),'2026/11/07 - نفس اليوم');
    assert.equal(display({expectedDeliveryText:'2026/11/01'}),'2026/11/01');
    assert.equal(display({receivedAt:'2026/11/03'}),'غير محدد');
    assert.equal(display({}),'غير محدد');
  }
});

test('all customer/receipt rendering paths use the authoritative helper',()=>{
 assert.match(src,/deliveryText:\s*displayExpectedDelivery\(row\)/);
 assert.match(src,/escapeHtml\(displayExpectedDelivery\(r\)\)/);
 assert.match(src,/const expectedText = displayExpectedDelivery\(res\);/);
 assert.doesNotMatch(src,/expectedDeliveryTextFromNow/);
});
