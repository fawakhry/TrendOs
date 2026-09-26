import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {buildReadOnlyGuardProbe} from
  '../cloudflare-d1/t12-preview/t12-existing-test-mirror-142-readonly-guard-probe-20260926.mjs';

const NOTE='TrendOS orders live sync V2 quota-aware';
const specs=[
  {name:'الأوردرات',sheetId:'T12_142_SYNTHETIC_9001',width:77,base:652},
  {name:'بنود الأوردرات',sheetId:'T12_142_SYNTHETIC_9002',width:92,base:708}
];
const tag=(w,v)=>JSON.stringify(Array(w).fill(v));
const headers=w=>JSON.stringify(Array.from({length:w},(_,i)=>'c'+i));
const formulas=w=>JSON.stringify(Array(w).fill(''));

class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  first(){return this.db.raw.prepare(this.sql).get(...this.args);}
}
class LocalDb{
  constructor(){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec(fs.readFileSync(new URL(
      '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql',import.meta.url),'utf8'));
    for(const s of specs){
      this.raw.prepare(`INSERT INTO sheet_catalog
        (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
        VALUES (?,?,?,?,?,?,'ready',?)`).run(
          s.name,s.sheetId,headers(s.width),s.base,s.width,s.base,NOTE);
      const put=this.raw.prepare(`INSERT INTO sheet_rows
        (sheet_name,row_number,values_json,display_json,formulas_json)
        VALUES (?,?,?,?,?)`);
      for(let n=1;n<=s.base;n++){
        const v=n===1?tag(s.width,'h'):n<=12?tag(s.width,'o'):tag(s.width,'s');
        put.run(s.name,n,v,v,formulas(s.width));
      }
    }
  }
  prepare(sql){return new Statement(this,sql);}
}

const db=new LocalDb();
const metrics=[];
for(const s of specs){
  const built=buildReadOnlyGuardProbe(db,s);
  const r=built.stmt.first();
  assert.equal(Number(r.expected_rows),s.base-11);
  assert.equal(Number(r.mismatches),0);
  assert.equal(Number(r.catalog_matches),1);
  assert.equal(Number(r.actual_rows),s.base);
  assert(built.metrics.sqlBytes<100000);
  assert(built.metrics.bindCount<=100);
  assert(built.metrics.maxChunkBytes<=100000);
  metrics.push(built.metrics);
}
assert.deepEqual(metrics.map(x=>x.chunks),[9,12]);
assert.deepEqual(metrics.map(x=>x.bindCount),[19,22]);
assert.deepEqual(metrics.map(x=>x.payloadBytes),[860783,1113729]);

db.raw.prepare(`UPDATE sheet_rows SET values_json=?
  WHERE sheet_name=? AND row_number=500`).run(
    JSON.stringify(['READONLY_PROBE_DRIFT']),specs[1].name);
const drift=buildReadOnlyGuardProbe(db,specs[1]).stmt.first();
assert.equal(Number(drift.mismatches),1);

console.log(JSON.stringify({
  status:'PASS',cases:3,
  metrics:metrics.map(x=>({
    chunks:x.chunks,payloadBytes:x.payloadBytes,maxChunkBytes:x.maxChunkBytes,
    sqlBytes:x.sqlBytes,bindCount:x.bindCount
  })),
  mutationAttempted:false,productionAuthorization:false
}));
