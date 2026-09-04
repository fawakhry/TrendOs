import assert from 'node:assert/strict';
import { issueOrdersEdgeToken, verifyOrdersEdgeToken, mapMirrorRows, filterRows } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';

const secret = 'test-secret-orders-edge';
const token = await issueOrdersEdgeToken({ sub: 'admin', role: 'admin', department: 'إدارة', screens: ['service','print','laser','press',''] }, secret, 1000, 600);
const verified = await verifyOrdersEdgeToken(token, secret, 1100);
assert.equal(verified.ok, true);
assert.equal(verified.payload.sub, 'admin');
assert.equal(verified.payload.role, 'admin');
assert.deepEqual(verified.payload.screens.slice(0,4), ['service','print','laser','press']);
assert.equal((await verifyOrdersEdgeToken(token, 'wrong-secret', 1100)).ok, false);
assert.equal((await verifyOrdersEdgeToken(token, secret, 1700)).ok, false);

const headers = [
  'رقم الأوردر','كود الأوردر','اسم الشات / المكتب','اسم المسؤول','القسم','رقم البند',
  'اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟','آخر تحديث','ملاحظات',
  'x15','x16','رقم العميل','مكبس حراري','تم إبلاغ العميل؟','وقت الإبلاغ','تم الإبلاغ بواسطة',
  'x22','آخر رسالة واتساب','x24','آخر وقت واتساب','آخر واتساب بواسطة','x27','تم إرسال رسالة التسجيل؟',
  'x29','x30','x31','تاريخ الاستلام','تاريخ التسليم المتوقع','الوقت المتوقع','x35','x36','مصدر الطلب',
  'x38','x39','x40','مديونية العميل','x42','x43','ملاحظات المديونية','طباعة على الطاير',
  'x46','x47','x48','x49','x50','x51','x52','x53','x54','x55','x56','x57','x58','x59','x60','x61','x62','x63','x64','x65','x66','x67','x68','x69','x70','x71','x72','x73','x74','x75','x76','x77','x78','نوع إدخال العميل','علامة العميل الخارجي'
];
function row(rowNumber, values) { return { rowNumber, display: values, values }; }
const base = new Array(headers.length).fill('');
const printRow = base.slice();
printRow[0] = '3901'; printRow[1] = '3901'; printRow[2] = 'عميل أ'; printRow[4] = 'طباعة'; printRow[5] = '3901-01';
printRow[6] = 'مج'; printRow[7] = '2'; printRow[8] = 'وائل'; printRow[9] = 'عاجل'; printRow[10] = 'تحت التنفيذ';
printRow[12] = '9/4/2026'; printRow[13] = 'ملاحظة'; printRow[16] = '01012345678'; printRow[17] = 'لا'; printRow[31] = '9/4/2026'; printRow[32] = '9/6/2026';
const laserRow = base.slice();
laserRow[0] = '3902'; laserRow[4] = 'ليزر'; laserRow[5] = '3902-01'; laserRow[6] = 'حفر'; laserRow[9] = 'عادي'; laserRow[10] = 'طلب جديد';
const delivered = base.slice();
delivered[0] = '3903'; delivered[4] = 'طباعة'; delivered[5] = '3903-01'; delivered[9] = 'عادي'; delivered[10] = 'تم التسليم';

const mirrorRows = [row(1, headers), row(2, printRow), row(3, laserRow), row(4, delivered)];
const print = mapMirrorRows(headers, mirrorRows, 'print');
assert.equal(print.length, 2);
assert.equal(print[0].orderId, '3901');
assert.equal(print[0].lineId, '3901-01');
assert.equal(print[0].customerPhone, '01012345678');
assert.equal(print[0].priority, 'عاجل');
assert.equal(mapMirrorRows(headers, mirrorRows, 'laser').length, 1);
assert.equal(filterRows(print, { statusFilter: '__ACTIVE__' }).length, 1);
assert.equal(filterRows(print, { query: '3901' }).length, 1);
assert.equal(filterRows(print, { statusFilter: 'تم التسليم' }).length, 1);
assert.equal(filterRows(print, { statusFilter: '__DEBT__' }).length, 0);

console.log('Cloudflare Edge Orders Read V1: TOKEN + ROLE CLAIMS + MIRROR MAPPING + FILTERS PASS');
