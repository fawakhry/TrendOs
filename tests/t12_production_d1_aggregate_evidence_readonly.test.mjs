import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

// Run ONLY against in-memory fixture; never a real D1 binding or Worker.
const source=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-production-d1-aggregate-evidence-readonly-20260922.sql',import.meta.url),'utf8');
const beginnings=[...source.matchAll(/^-- QUERY ([1-4]):[^\n]*$/gm)];
assert.equal(beginnings.length,4,'expect four separate, named owner-run SQL queries');
const queries=beginnings.map((m,i)=>source.slice(m.index+m[0].length,beginnings[i+1]?.index??source.length)
  .split('\n').filter(line=>!line.trim().startsWith('--')).join('\n').trim());
for(let i=0;i<queries.length;i++){
  const q=queries[i];
  assert.match(q,/^(SELECT|WITH)\b/i,'query '+(i+1)+' must be read-only SELECT');
  assert.equal((q.match(/;/g)||[]).length,1,'run precisely one statement at a time');
  assert.equal(q.endsWith(';'),true);
  assert.doesNotMatch(q,/\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|ATTACH|DETACH|VACUUM|REINDEX|TRIGGER|RETURNING|PRAGMA)\b/i,'no executable SQL mutation/privileged statement');
  assert.doesNotMatch(q,/\b(?:customer_phone|customer_name|raw_json|headers_json|values_json|formulas_json)\b/i,'do not retrieve customer/raw data');
}
assert.match(source,/PREPARED, NOT EXECUTED/);
assert.match(source,/not the separate trendos-t12-synthetic-test D1/);
assert.match(source,/non-atomic and NEVER a final post-writer-fence seed/);
const d=new DatabaseSync(':memory:');
d.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0001_init.sql',import.meta.url),'utf8'));
d.exec(fs.readFileSync(new URL('../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8'));
const tabNames=['الأوردرات','بنود الأوردرات','أرشيف الأوردرات','أرشيف بنود الأوردرات'];
for(let i=0;i<tabNames.length;i++){
 const tab=tabNames[i];
 d.prepare('INSERT INTO sheet_catalog(sheet_name,source_last_row,source_last_col,row_count,status,synced_at) VALUES (?,?,?,?,?,?)')
 .run(tab,i===0?6:i===1?3:2,5,i===0?6:i===1?3:2,'ready','2026-09-22 19:00:00');
 const ids=i===0?['4307','LEGACY-1','00001','9007199254740992','not-json']:
   i===1?['4307','4306']:i===2?['3761']:['3761'];
 for(let ix=0;ix<=ids.length;ix++){
  const datum=ix===0?'["رقم الأوردر"]':ids[ix-1]==='not-json'?'invalid_json':JSON.stringify([ids[ix-1]]);
  d.prepare('INSERT INTO sheet_rows(sheet_name,row_number,display_json,synced_at) VALUES (?,?,?,?)').run(tab,ix+1,datum,'2026-09-22 19:00:00');
 }
}
for(const id of ['4307','4306','LEGACY-1','00001','9007199254740992']){
 d.prepare('INSERT INTO orders(order_id) VALUES (?)').run(id);
}
const q1=d.prepare(queries[0]).all().map(x=>x.recognized_table);
assert.deepEqual(q1,['orders','sheet_catalog','sheet_rows']);
const q2=d.prepare(queries[1]).all();
assert.equal(q2.length,4);
for(const r of q2){
 assert.equal(r.mirror_status,'ready');
 assert.equal(r.reported_mirror_rows_including_header,r.observed_mirror_rows_including_header);
 assert.equal(r.reported_last_sync_at,'2026-09-22 19:00:00');
}
const q3=d.prepare(queries[2]).get();
assert.equal(q3.normalized_orders_count,5);
assert.equal(q3.numeric_id_rows,2);
assert.equal(q3.highest_normalized_numeric_order_id,4307);
assert.equal(q3.noncanonical_or_legacy_order_id_rows,3);
const q4=d.prepare(queries[3]).all();
assert.equal(q4.length,4);
const byTab=Object.fromEntries(q4.map(r=>[r.tab_name,r]));
assert.equal(byTab['الأوردرات'].mirrored_nonheader_rows,5);
assert.equal(byTab['الأوردرات'].mirrored_numeric_order_id_rows,1);
assert.equal(byTab['الأوردرات'].highest_mirrored_numeric_order_id,4307);
assert.equal(byTab['الأوردرات'].invalid_json_rows,1);
assert.equal(byTab['الأوردرات'].missing_legacy_or_noncanonical_id_rows,4);
assert.equal(byTab['بنود الأوردرات'].highest_mirrored_numeric_order_id,4307);
assert.equal(byTab['أرشيف الأوردرات'].highest_mirrored_numeric_order_id,3761);
assert.equal(byTab['أرشيف بنود الأوردرات'].highest_mirrored_numeric_order_id,3761);
for(const r of q4)assert.equal(r.latest_row_sync_at,'2026-09-22 19:00:00');
for(const r of [...q2,...[q3],...q4]){
 const keys=Object.keys(r).join('|');
 assert.doesNotMatch(keys,/customer|phone|raw_json|values_json|display_json/i);
}
d.close();
console.log('T12 D1 aggregate evidence PASS: four independent SELECT-only statements; table/catalog, numeric maxima, invalid JSON and noncanonical ID outputs only; in-memory fixture.');
