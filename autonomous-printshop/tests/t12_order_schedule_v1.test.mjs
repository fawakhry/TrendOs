import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('autonomous-printshop/migrations/0021_t12_order_schedule_v1.sql','utf8');

assert.match(sql,/CREATE TABLE IF NOT EXISTS t12_prod_order_schedule/);
assert.match(sql,/expected_delivery_date TEXT NOT NULL/);
assert.match(sql,/LEGACY_D0_FLY_D2_STANDARD_V1/);
assert.match(sql,/ENTRY_NATIVE_BACKFILL_CAIRO_UTC3_SAFE_WINDOW/);
assert.match(sql,/l\.fly_print = 1/);
assert.match(sql,/date\(datetime\(o\.created_at, '\+3 hours'\)\)/);
assert.match(sql,/date\(datetime\(o\.created_at, '\+3 hours'\), '\+2 days'\)/);
assert.doesNotMatch(sql,/\bDROP\s+TABLE\b/i);
assert.doesNotMatch(sql,/\bALTER\s+TABLE\b/i);
assert.doesNotMatch(sql,/\bUPDATE\s+/i);
assert.doesNotMatch(sql,/\bDELETE\s+FROM\b/i);
assert.doesNotMatch(sql,/\bREPLACE\s+INTO\b/i);

console.log('AUTONOMOUS_PRINTSHOP_T12_ORDER_SCHEDULE_V1=PASS');
console.log('FLY_PRINT_DUE=SAME_LOCAL_DATE');
console.log('STANDARD_DUE=LOCAL_DATE_PLUS_2');
console.log('HISTORICAL_WINDOW_CAIRO_OFFSET=UTC_PLUS_3');
