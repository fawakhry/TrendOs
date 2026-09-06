import assert from 'node:assert/strict';
import {
  buildCustomerLookup02CR,
  buildDebtRestrictionLookup02CR,
  enrichOperationalRows02CR,
  headerIndex02CR,
  parseDebtAmount02CR
} from '../cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs';

function mirrorRows(headers, rows) {
  return [
    { rowNumber: 1, display: headers, values: headers },
    ...rows.map((row, i) => ({ rowNumber: i + 2, display: row, values: row }))
  ];
}

// Debt parser mirrors Apps Script safety: phone-like / huge numbers are not debt.
assert.equal(parseDebtAmount02CR('125.50'), 125.5);
assert.equal(parseDebtAmount02CR('١٢٥,٥٠'), 125.5);
assert.equal(parseDebtAmount02CR('01012345678'), 0);
assert.equal(parseDebtAmount02CR('900000'), 0);

// Exact duplicate headers are last-wins, while alias priority is preserved.
assert.equal(headerIndex02CR(['رقم العميل الأساسي','رقم العميل','رقم العميل الأساسي'], ['رقم العميل الأساسي','رقم العميل']), 2);

const customerHeaders = [
  'اسم الشات / المكتب',
  'رقم العميل الأساسي',
  'رقم إضافي',
  'مديونية',
  'ملاحظات المديونية',
  'مديونية',
  'رقم العميل'
];
const customerRow = ['عميل اختبار','01011111111','01022222222','999','ملاحظة مديونية','350','01099999999'];
const customers = buildCustomerLookup02CR(customerHeaders, mirrorRows(customerHeaders, [customerRow]));
const customer = Object.values(customers)[0];
assert.equal(customer.phone, '01011111111', 'alias priority must prefer رقم العميل الأساسي over رقم العميل');
assert.equal(customer.debtAmount, 350, 'last exact duplicate مديونية must win');
assert.equal(customer.debtNotes, 'ملاحظة مديونية');

const restrictionHeaders = ['ID','اسم العميل','منع فعال؟','سبب المنع','صالح حتى'];
const activeRestriction = ['R1','عميل اختبار','نعم','مراجعة المديونية','2026/09/07'];
const inactiveRestriction = ['R2','عميل بدون منع','لا','قديم','2026/09/10'];
const expiredRestriction = ['R3','عميل منتهي','نعم','قديم','2026/09/05'];
const restrictions = buildDebtRestrictionLookup02CR(
  restrictionHeaders,
  mirrorRows(restrictionHeaders, [activeRestriction, inactiveRestriction, expiredRestriction]),
  new Date(2026, 8, 6, 12, 0, 0)
);
assert.equal(Object.keys(restrictions).length, 1, 'only active non-expired restriction should remain');
assert.equal(Object.values(restrictions)[0].reason, 'مراجعة المديونية');

const lineRows = [{
  orderId: '5001',
  lineId: '5001-01',
  customer: 'عميل اختبار',
  customerPhone: '',
  debtAmount: 9999,
  debtHold: 'نعم',
  deliveryDebtRestricted: false,
  debtRestrictionReason: '',
  debtNotes: ''
}];
const enriched = enrichOperationalRows02CR(lineRows, customers, restrictions);
assert.equal(enriched.length, 1);
assert.equal(enriched[0].customerPhone, '01011111111', 'customer phone must fall back from customer mirror');
assert.equal(enriched[0].debtAmount, 350, 'customer mirror debt must override line debt like Apps Script');
assert.equal(enriched[0].debtHold, 'نعم');
assert.equal(enriched[0].deliveryDebtRestricted, true);
assert.equal(enriched[0].debtRestrictionReason, 'مراجعة المديونية');
assert.equal(enriched[0].debtNotes, 'ملاحظة مديونية');

// Existing line phone and line debt note remain preferred where Apps Script does so.
const withLineValues = enrichOperationalRows02CR([{
  customer: 'عميل اختبار',
  customerPhone: '01033333333',
  debtNotes: 'ملاحظة من البند'
}], customers, restrictions)[0];
assert.equal(withLineValues.customerPhone, '01033333333');
assert.equal(withLineValues.debtNotes, 'ملاحظة من البند');

// No customer lookup means safe debt=0; do not trust line debt as authority.
const unknown = enrichOperationalRows02CR([{
  customer: 'غير موجود',
  customerPhone: '',
  debtAmount: 700
}], customers, restrictions)[0];
assert.equal(unknown.debtAmount, 0);
assert.equal(unknown.debtHold, 'لا');
assert.equal(unknown.deliveryDebtRestricted, false);

console.log('PERF_CF_02CR_OPERATIONAL_ENRICHMENT_CONTRACT_PASS');
