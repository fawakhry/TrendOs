import assert from 'node:assert/strict';
import { mapMirrorRows } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';

// PERF-CF-02CR regression fixture.
// Apps Script headersMap_ overwrites duplicate names, so the LAST occurrence wins.
// D1 must preserve the same semantics or operational fields become blank/stale.
const headers = [
  'رقم الأوردر','كود الأوردر','اسم الشات / المكتب','اسم المسؤول','القسم','رقم البند',
  'اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟','آخر تحديث','ملاحظات',
  'x15','x16','رقم العميل','مكبس حراري',
  'تم إبلاغ العميل؟','وقت الإبلاغ','تم الإبلاغ بواسطة','تم الإبلاغ بواسطة',
  'آخر رسالة واتساب','آخر رسالة واتساب','آخر وقت واتساب','آخر واتساب بواسطة',
  'نوع رسالة واتساب','تم إرسال رسالة التسجيل؟','وقت رسالة التسجيل','تم إرسال رسالة التسجيل؟','رسالة التسجيل بواسطة',
  'تاريخ الاستلام','تاريخ التسليم المتوقع','الوقت المتوقع','الوقت المتوقع','الوقت المتوقع',
  'المصدر','القالب','عدد الصور','عدد الشيتات',
  'مديونية العميل','مديونية العميل','إيقاف بسبب مديونية؟','ملاحظات المديونية','طباعة على الطاير','كود الشات',
  'مصدر الطلب','أنشئ بواسطة','مصدر الطلب','ملاحظات العميل','مصدر الطلب','تأكيد فاصل واتساب',
  'نوع إدخال العميل','علامة العميل الخارجي'
];

const values = new Array(headers.length).fill('');
values[0] = '5001';
values[1] = '5001';
values[2] = 'عميل اختبار';
values[4] = 'طباعة';
values[5] = '5001-01';
values[6] = 'مج';
values[7] = '1';
values[9] = 'عادي';
values[10] = 'طلب جديد';
values[16] = '01000000000';
values[17] = 'لا';

// Duplicate columns: first occurrence intentionally blank/stale, last occurrence authoritative.
values[20] = '';
values[21] = 'رحمه';
values[22] = '';
values[23] = 'رسالة واتساب الصحيحة';
values[27] = '';
values[29] = 'نعم';
values[31] = '2026/09/05';
values[32] = '2026/09/07';
values[33] = '';
values[34] = '';
values[35] = '2026/09/07';
values[46] = '';
values[48] = 'قديم';
values[50] = 'واتساب';
values[52] = 'خارجي';
values[53] = 'EXT-5001';

const rows = [
  { rowNumber: 1, values: headers, display: headers },
  { rowNumber: 2, values, display: values }
];

const mapped = mapMirrorRows(headers, rows, 'print');
assert.equal(mapped.length, 1);
const item = mapped[0];
assert.equal(item.notifiedBy, 'رحمه', 'last duplicate تم الإبلاغ بواسطة must win');
assert.equal(item.lastWhatsAppMessage, 'رسالة واتساب الصحيحة', 'last duplicate آخر رسالة واتساب must win');
assert.equal(item.registrationSent, 'نعم', 'last duplicate تم إرسال رسالة التسجيل؟ must win');
assert.equal(item.expectedDeliveryText, '2026/09/07', 'last duplicate الوقت المتوقع must win');
assert.equal(item.customerSource, 'واتساب', 'last duplicate مصدر الطلب must win');
assert.equal(item.source, 'واتساب');
assert.equal(item.customerMode, 'خارجي');
assert.equal(item.externalCustomerId, 'EXT-5001');

console.log('PERF_CF_02CR_DUPLICATE_HEADER_LAST_WINS_CONTRACT_PASS');
