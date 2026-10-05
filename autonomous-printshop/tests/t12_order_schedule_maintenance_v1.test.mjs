import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const base=fs.readFileSync('cloudflare-d1/migrations/0005_t12_production_create_canary.sql','utf8');
const schedule=fs.readFileSync('autonomous-printshop/migrations/0021_t12_order_schedule_v1.sql','utf8');
const maintenance=fs.readFileSync('autonomous-printshop/migrations/0022_t12_order_schedule_maintenance_v1.sql','utf8');

assert.match(maintenance,/CREATE TRIGGER IF NOT EXISTS trg_t12_order_schedule_after_order_insert/);
assert.match(maintenance,/CREATE TRIGGER IF NOT EXISTS trg_t12_order_schedule_after_line_insert/);
assert.match(maintenance,/LEGACY_D0_FLY_D2_STANDARD_V1/);
assert.doesNotMatch(maintenance,/\bDROP\b/i);
assert.doesNotMatch(maintenance,/\bALTER\b/i);
assert.doesNotMatch(maintenance,/\bDELETE\b/i);
assert.doesNotMatch(maintenance,/UPDATE\s+t12_prod_orders/i);
assert.doesNotMatch(maintenance,/UPDATE\s+t12_prod_lines/i);

const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON;');
db.exec(base);
db.exec(schedule);
db.exec(maintenance);

function addOrder({orderId,key,flyPrint,createdAt}){
  db.prepare(`
    INSERT INTO t12_prod_request_ledger
      (request_key,actor,policy_epoch,canonical_json,order_id,status,response_json)
    VALUES (?,?,?,?,?,'COMMITTED','{}')
  `).run(key,'tester','v1','{}',orderId);

  db.prepare(`
    INSERT INTO t12_prod_orders (
      order_id,request_key,customer_mode,customer_name,customer_phone,
      external_customer_id,department,priority,status,source,notes,actor,
      created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    orderId,key,'خارجي / عابر','TEST','','','طباعة','عادي','طلب جديد',
    'TEST','','tester',createdAt,createdAt
  );

  db.prepare(`
    INSERT INTO t12_prod_lines (
      line_id,order_id,request_key,ordinal,department,assigned_to,item_name,
      qty,priority,status,heat_press,fly_print,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    orderId+'-01',orderId,key,1,'طباعة','','TEST ITEM',1,'عادي','طلب جديد',
    0,flyPrint?1:0,createdAt,createdAt
  );
}

addOrder({
  orderId:'9001',
  key:'req-standard',
  flyPrint:false,
  createdAt:'2026-10-05 20:00:00'
});
let row=db.prepare('SELECT * FROM t12_prod_order_schedule WHERE order_id=?').get('9001');
assert.equal(row.expected_delivery_date,'2026-10-07');
assert.equal(row.policy_code,'LEGACY_D0_FLY_D2_STANDARD_V1');
assert.equal(row.source_kind,'AUTONOMOUS_PRINTSHOP_SCHEDULE_TRIGGER_V1');

addOrder({
  orderId:'9002',
  key:'req-fly',
  flyPrint:true,
  createdAt:'2026-10-05 20:00:00'
});
row=db.prepare('SELECT * FROM t12_prod_order_schedule WHERE order_id=?').get('9002');
assert.equal(row.expected_delivery_date,'2026-10-05');
assert.equal(row.policy_code,'LEGACY_D0_FLY_D2_STANDARD_V1');

db.prepare(`
  INSERT INTO t12_prod_lines (
    line_id,order_id,request_key,ordinal,department,assigned_to,item_name,
    qty,priority,status,heat_press,fly_print,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`).run(
  '9001-02','9001','req-standard',2,'طباعة','','FLY SECOND LINE',
  1,'عادي','طلب جديد',0,1,'2026-10-05 20:00:00','2026-10-05 20:00:00'
);
row=db.prepare('SELECT * FROM t12_prod_order_schedule WHERE order_id=?').get('9001');
assert.equal(row.expected_delivery_date,'2026-10-05');

assert.equal(
  db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_t12_order_schedule_after_%'").get().n,
  2
);

console.log('AUTONOMOUS_PRINTSHOP_T12_ORDER_SCHEDULE_MAINTENANCE_V1=PASS');
console.log('STANDARD_DUE=CAIRO_CREATE_DATE_PLUS_2_DAYS');
console.log('FLY_DUE=CAIRO_CREATE_DATE_SAME_DAY');
console.log('ORDER_LINE_BUSINESS_STATE_MUTATION=NO');
