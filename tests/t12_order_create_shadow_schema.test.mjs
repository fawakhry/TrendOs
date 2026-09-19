import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const sql = fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql', import.meta.url), 'utf8');

for (const forbidden of [
  /\bDROP\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+(?:orders|customers|sheet_rows|sheet_catalog|cloud_write_)/i,
  /\bINSERT\s+INTO\s+(?:orders|customers|sheet_rows|sheet_catalog|cloud_write_)/i,
  /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(?:orders|customers|cloud_write_)/i
]) assert.equal(forbidden.test(sql), false, 'T12 schema prep must not touch existing production tables: ' + forbidden);

assert.match(sql,/CREATE TABLE IF NOT EXISTS t12_order_create_intents/i);
assert.match(sql,/CREATE TABLE IF NOT EXISTS t12_order_create_line_intents/i);
assert.match(sql,/CREATE TABLE IF NOT EXISTS t12_order_create_shadow_events/i);
assert.equal(/business_order_id/i.test(sql), false, 'shadow schema must not allocate/store production business Order ID');

const db = new DatabaseSync(':memory:');
db.exec(sql);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 't12_%' ORDER BY name").all().map(x=>x.name);
assert.deepEqual(tables,[
  't12_order_create_intents',
  't12_order_create_line_intents',
  't12_order_create_shadow_events'
]);

db.prepare(`
  INSERT INTO t12_order_create_intents
  (client_request_id, provisional_ref, actor, identity_mode, customer_name, department, priority, canonical_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('REQ-1','t12-order-intent:REQ-1','wael','registered','عميل','طباعة','عادي','{}');

assert.throws(()=>db.prepare(`
  INSERT INTO t12_order_create_intents
  (client_request_id, provisional_ref, actor, identity_mode, customer_name, department, priority, canonical_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('REQ-1','t12-order-intent:REQ-1-dup','wael','registered','عميل','طباعة','عادي','{}'));

db.prepare(`
  INSERT INTO t12_order_create_line_intents
  (client_request_id, ordinal, provisional_line_ref, department, assigned_to, item_name, qty, priority)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('REQ-1',1,'t12-order-intent:REQ-1:line:01','طباعة','وائل','تابلوه',2,'عادي');

assert.throws(()=>db.prepare(`
  INSERT INTO t12_order_create_line_intents
  (client_request_id, ordinal, provisional_line_ref, department, assigned_to, item_name, qty, priority)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('REQ-1',1,'t12-order-intent:REQ-1:line:02','ليزر','جابر','حفر',1,'عادي'));

db.prepare(`
  INSERT INTO t12_order_create_shadow_events
  (client_request_id, event_key, event_type, payload_json)
  VALUES (?, ?, ?, ?)
`).run('REQ-1','activity','order-create-intent','{}');

assert.throws(()=>db.prepare(`
  INSERT INTO t12_order_create_shadow_events
  (client_request_id, event_key, event_type, payload_json)
  VALUES (?, ?, ?, ?)
`).run('REQ-1','activity','order-create-intent','{}'));

console.log('T12 shadow schema prep PASS; isolated sqlite constraints and idempotency keys verified.');
