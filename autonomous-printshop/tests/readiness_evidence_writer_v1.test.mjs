import assert from 'node:assert/strict';
import {
  validateReadinessEvidenceV1,
  recordReadinessEvidenceV1
} from '../core/readiness-evidence-writer-v1.mjs';

const now=1800000000000;

let v=validateReadinessEvidenceV1({
  lineId:'10-1',
  kind:'DESIGN',
  state:'READY',
  sourceKind:'DESIGN_PREFLIGHT',
  sourceRef:'design-case-10',
  sourceVersion:'sha256:abc',
  confidence:0.99,
  observedAtMs:now,
  evidence:{preflight:'PASS'}
},{nowMs:now});
assert.equal(v.kind,'DESIGN');
assert.equal(v.expiresAtMs,null);

v=validateReadinessEvidenceV1({
  lineId:'10-1',
  kind:'MATERIAL',
  state:'READY',
  sourceKind:'MATERIAL_LEDGER',
  sourceRef:'movement:55',
  sourceVersion:'ledger-v1',
  confidence:1,
  observedAtMs:now,
  expiresAtMs:now+20*60*1000
},{nowMs:now});
assert.equal(v.kind,'MATERIAL');

assert.throws(()=>validateReadinessEvidenceV1({
  lineId:'10-1',kind:'MATERIAL',state:'READY',
  sourceKind:'MATERIAL_LEDGER',sourceRef:'x',confidence:1,observedAtMs:now
},{nowMs:now}),/READINESS_EXPIRY_REQUIRED/);

assert.throws(()=>validateReadinessEvidenceV1({
  lineId:'10-1',kind:'MACHINE',state:'READY',
  sourceKind:'MACHINE_AGENT',sourceRef:'press',confidence:1,
  observedAtMs:now,expiresAtMs:now+16*60*1000
},{nowMs:now}),/READINESS_EXPIRY_TOO_LONG/);

assert.throws(()=>validateReadinessEvidenceV1({
  lineId:'10-1',kind:'DESIGN',state:'READY',
  sourceKind:'DESIGN_PREFLIGHT',sourceRef:'case',confidence:1,observedAtMs:now
},{nowMs:now}),/READINESS_DESIGN_READY_VERSION_REQUIRED/);

const writes=[];
function fakeDb(identity={imported:0,native:1}){
  return {
    prepare(sql){
      return {
        bind(...args){
          return {
            async first(){
              if(sql.includes('FROM employee_core_lines_v1')) return identity;
              return null;
            },
            async run(){
              writes.push({sql,args});
              return {meta:{changes:1}};
            }
          };
        }
      };
    }
  };
}

const out=await recordReadinessEvidenceV1(fakeDb(),{
  lineId:'20-1',
  kind:'MACHINE',
  state:'BLOCKED',
  sourceKind:'MACHINE_AGENT',
  sourceRef:'laser-1:fault-9',
  sourceVersion:'machine-agent-v1',
  confidence:1,
  observedAtMs:now,
  expiresAtMs:now+2*60*60*1000,
  evidence:{reason:'FAULT'}
},{nowMs:now});
assert.equal(out.success,true);
assert.equal(out.inserted,true);
assert.equal(out.identity.native,1);
assert.match(writes[0].sql,/INSERT OR IGNORE INTO autonomous_readiness_evidence/);
assert.equal(writes[0].args[1],'20-1');
assert.equal(writes[0].args[2],'MACHINE');
assert.equal(writes[0].args[3],'BLOCKED');

await assert.rejects(
  ()=>recordReadinessEvidenceV1(fakeDb({imported:0,native:0}),{
    lineId:'missing',kind:'DESIGN',state:'READY',
    sourceKind:'DESIGN_PREFLIGHT',sourceRef:'case',sourceVersion:'v1',
    confidence:1,observedAtMs:now
  },{nowMs:now}),
  /READINESS_LINE_NOT_FOUND/
);

await assert.rejects(
  ()=>recordReadinessEvidenceV1(fakeDb({imported:1,native:1}),{
    lineId:'dup',kind:'DESIGN',state:'READY',
    sourceKind:'DESIGN_PREFLIGHT',sourceRef:'case',sourceVersion:'v1',
    confidence:1,observedAtMs:now
  },{nowMs:now}),
  /READINESS_LINE_IDENTITY_AMBIGUOUS/
);

console.log('AUTONOMOUS_PRINTSHOP_READINESS_EVIDENCE_WRITER_V1=PASS');
console.log('DESIGN_READY=VERSION_BOUND');
console.log('MATERIAL_READY_TTL_MAX_MIN=30');
console.log('MACHINE_READY_TTL_MAX_MIN=15');
console.log('LINE_IDENTITY=EXACTLY_ONE_REQUIRED');
console.log('WRITE_TARGET=AUTONOMOUS_READINESS_EVIDENCE_ONLY');
