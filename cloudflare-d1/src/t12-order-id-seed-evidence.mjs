/*
 * T12 production-order-number migration preparation: PURE snapshot reconciliation.
 * NO Google/D1 access, sequence insert, HTTP route, deployment, or production authorization.
 * Inputs must be obtained separately from trusted read-only, frozen-snapshot evidence;
 * user-supplied numbers cannot prove that an actual production writer is fenced.
 */
export const T12_ORDER_ID_SEED_EVIDENCE_VERSION='T12_ORDER_ID_SEED_EVIDENCE_20260922';
export const T12_ORDER_ID_REQUIRED_SOURCES=Object.freeze([
  'currentOrders','currentLines','archivedOrders','archivedLines','productionD1Mirror'
]);

const MAX=Number.MAX_SAFE_INTEGER;
const DECIMAL=/^(0|[1-9][0-9]*)$/;
const LEGACY=/^[A-Za-z][A-Za-z0-9_-]{1,79}$/;
function fail(reason,extra={}){
  return Object.freeze({success:false,productionAuthorized:false,authoritative:false,
    version:T12_ORDER_ID_SEED_EVIDENCE_VERSION,reason,...extra});
}
function own(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
function isRecord(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);}
function decimal(raw){
  if(typeof raw!=='string'||!DECIMAL.test(raw))return null;
  const n=Number(raw);
  return Number.isSafeInteger(n)?n:null;
}
/**
 * source: {snapshotId,complete:true,orderIds:[displayed IDs]} from ONE read-only source.
 * No inferred rows: an omitted source, inconsistent source epoch, noncanonical number,
 * or unsupported ID spelling must stop, rather than silently lower the seed.
 * This function NEVER returns an instruction to seed a live sequence.
 */
export function reconcileT12OrderIdSeedEvidence(evidence){
  if(!isRecord(evidence))return fail('evidence-object-required');
  const snapshotId=evidence.snapshotId;
  if(typeof snapshotId!=='string'||snapshotId.length<12||snapshotId.length>180||
    snapshotId!==snapshotId.trim())return fail('source-snapshot-id-required');
  const prop=evidence.scriptPropertiesNext;
  const propertyNext=decimal(prop);
  if(propertyNext===null||propertyNext<1001||propertyNext>=MAX)
    return fail('invalid-or-unavailable-google-next-number');
  if(!isRecord(evidence.sources)||
    Object.keys(evidence.sources).some(k=>!T12_ORDER_ID_REQUIRED_SOURCES.includes(k)))
    return fail('source-inventory-invalid');
  let maximum=1000,observed=0,legacy=0;
  const perSource=[];
  for(const key of T12_ORDER_ID_REQUIRED_SOURCES){
    if(!own(evidence.sources,key))return fail('mandatory-source-missing',{source:key});
    const source=evidence.sources[key];
    if(!isRecord(source)||source.complete!==true||source.snapshotId!==snapshotId||
      !Array.isArray(source.orderIds))return fail('source-coverage-or-snapshot-mismatch',{source:key});
    // Self-attestation of source count is helpful to detect accidental partial
    // extracts; a genuine complete export must still be established separately.
    if(!Number.isSafeInteger(source.rowCount)||source.rowCount<0||
      source.rowCount!==source.orderIds.length)
      return fail('source-row-count-mismatch',{source:key});
    let sourceMax=0,sourceLegacy=0;
    for(const raw of source.orderIds){
      if(typeof raw!=='string'||!raw||raw!==raw.trim())
        return fail('invalid-order-id-in-snapshot',{source:key});
      const n=decimal(raw);
      if(n!==null){
        if(n<1001||n>=MAX)return fail('numeric-order-id-out-of-range',{source:key});
        maximum=Math.max(maximum,n);
        sourceMax=Math.max(sourceMax,n);
        observed++;
      }else if(LEGACY.test(raw)){
        // Historical alphanumeric IDs are recognized, not interpreted as numbers.
        legacy++;sourceLegacy++;
      }else{
        return fail('unsupported-or-noncanonical-order-id',{source:key});
      }
    }
    perSource.push(Object.freeze({source:key,rows:source.rowCount,
      highestNumericId:sourceMax,legacyIds:sourceLegacy}));
  }
  // An empty mirror or zero numbers everywhere may be valid only after a separate
  // verified baseline. Do not fabricate a production seed from default 1000.
  if(!observed)return fail('no-confirmed-numeric-order-id');
  if(maximum>=MAX-1)return fail('numeric-sequence-exhausted');
  const nextCandidate=Math.max(propertyNext,maximum+1);
  if(!Number.isSafeInteger(nextCandidate)||nextCandidate>=MAX)
    return fail('numeric-sequence-exhausted');
  return Object.freeze({success:true,productionAuthorized:false,
    authoritative:false,version:T12_ORDER_ID_SEED_EVIDENCE_VERSION,
    snapshotId,maxObservedNumericId:maximum,googlePropertyNext:propertyNext,
    nextCandidate,observedNumericCells:observed,legacyCells:legacy,
    perSource:Object.freeze(perSource),
    // This is a PRELIMINARY candidate only. Source coverage, post-freeze
    // re-read, legacy-key retention and sole-writer cutover remain separate gates.
    remainingGates:Object.freeze([
      'trusted-source-completeness-and-production-d1-binding',
      'exclusive-google-and-r5-writer-fence-with-final-frozen-snapshot',
      'historic-request-key-retention-and-replay-reconciliation',
      'independent-owner-authorized-production-transfer'
    ])});
}
