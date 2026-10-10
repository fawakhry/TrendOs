/* AP-110 protected in-memory same-line evidence provenance PRECHECK.
 * Never publish line keys, content hashes, storage refs, serials or identities.
 * Pure diagnostic: an event payload or sourceKind label is NOT independent proof.
 */
export const PRIVATE_LINE_EVIDENCE_REVIEW_VERSION='AP110_PRIVATE_LINE_EVIDENCE_REVIEW_V1';
const KINDS=Object.freeze(['DESIGN','MATERIAL','MACHINE']);
const SOURCES=Object.freeze({
  DESIGN:'DESIGN_PREFLIGHT',
  MATERIAL:'MATERIAL_LEDGER',
  MACHINE:'MACHINE_AGENT'
});
const text=v=>typeof v==='string'?v.trim():'';
const time=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0?v:null;

function reviewProof(kind,event){
  const raw=event.evidence&&typeof event.evidence==='object'?event.evidence:{};
  if(kind==='DESIGN'){
    if(!/^[0-9a-fA-F]{64}$/.test(text(event.sourceVersion)))
      return 'DESIGN_SHA256_OR_VERSION_MISSING';
    if(raw.assetBindingState!=='READY'||raw.preflightResult!=='PASS'&&
      raw.reason!=='DESIGN_ASSET_LINKED_APPROVED_AND_PREFLIGHT_PASS')
      return 'DESIGN_BINDING_OR_PREFLIGHT_UNVERIFIED';
    if(!['CUSTOMER_APPROVED','OWNER_APPROVED','POLICY_APPROVED'].includes(raw.approvalState))
      return 'DESIGN_APPROVAL_UNVERIFIED';
    return 'DESIGN_EXTERNAL_PROVENANCE_REVIEW_REQUIRED';
  }
  if(kind==='MATERIAL'){
    const required=raw.required,stock=raw.available;
    if(raw.postCutoverQualified!==true||
      typeof required!=='number'||!Number.isFinite(required)||required<=0||
      typeof stock!=='number'||!Number.isFinite(stock)||stock<required)
      return 'MATERIAL_STOCK_CONSUMPTION_UNVERIFIED';
    return 'MATERIAL_LEDGER_EXTERNAL_VERIFICATION_REQUIRED';
  }
  if(!text(raw.machineId)||!['OPERATOR_CHECK','SELF_TEST'].includes(raw.observationSource)||
     !text(raw.mappingSource))
    return 'MACHINE_ID_OR_DIRECT_CHECK_UNVERIFIED';
  // MACHINE_AGENT evidence does not itself establish nameplate/serial/registry
  // or prove this is the actual mapped physical machine.
  return 'MACHINE_REGISTRY_SERIAL_EXTERNAL_VERIFICATION_REQUIRED';
}

export function reviewPrivateSameLineProvenanceV1({
  privateLineKey,events=[],nowMs,sourceAccessVerified=false
}={}){
  const line=text(privateLineKey);
  const clock=time(nowMs);
  const inputValid=!!line&&line.length<=256&&!!clock&&
    Array.isArray(events)&&events.length<=5000;
  const byKind={};
  for(const kind of KINDS){
    let status='PRIVATE_LINE_OR_SNAPSHOT_UNVERIFIED';
    if(inputValid){
      const matching=events.filter(e=>e&&typeof e==='object'&&
        text(e.lineId??e.line_id)===line&&
        text(e.kind??e.evidenceKind??e.evidence_kind).toUpperCase()===kind);
      if(matching.length===0) status='NO_SAME_LINE_EVIDENCE';
      else if(matching.some(e=>!time(e.observedAtMs??e.observed_at_ms))){
        status='SOURCE_TIME_UNVERIFIED';
      } else {
        // Latest wins BEFORE expiry/state checks. Expired latest never
        // resurrects older READY for the same line and kind.
        matching.sort((a,b)=>time(b.observedAtMs??b.observed_at_ms)-
          time(a.observedAtMs??a.observed_at_ms));
        const latest=matching[0];
        const observed=time(latest.observedAtMs??latest.observed_at_ms);
        const expires=time(latest.expiresAtMs??latest.expires_at_ms);
        const state=text(latest.state??latest.evidenceState??latest.evidence_state).toUpperCase();
        const sourceKind=text(latest.sourceKind??latest.source_kind).toUpperCase();
        const sourceRef=text(latest.sourceRef??latest.source_ref);
        if(observed>clock)status='FUTURE_OBSERVATION';
        else if(!expires||expires<=observed)status='EXPIRY_UNVERIFIED';
        else if(expires<=clock)status='LATEST_EVIDENCE_EXPIRED';
        else if(state==='BLOCKED')status='EVIDENCE_BLOCKED';
        else if(state!=='READY')status='EVIDENCE_NOT_READY';
        else if(sourceKind!==SOURCES[kind])status='SOURCE_KIND_UNQUALIFIED';
        else if(!sourceRef||!text(latest.sourceVersion??latest.source_version))
          status='SOURCE_PROVENANCE_REFERENCE_MISSING';
        else status=reviewProof(kind,latest);
      }
    }
    byKind[kind]=status;
  }
  const output={
    version:PRIVATE_LINE_EVIDENCE_REVIEW_VERSION,
    classification:inputValid?'PRIVATE_CLAIM_PRECHECK_ONLY':'BLOCKED_SAFE',
    sourceAuthentication:sourceAccessVerified===true
      ?'CALLER_ATTESTED_NOT_INDEPENDENTLY_VERIFIED':'NOT_ESTABLISHED',
    statusByKind:byKind,
    sameLineKeyProcessedInternally:inputValid,
    designMaterialMachineSourceVerified:false,
    independentSourceProofRequired:true,
    pilotLineApproved:false,
    readinessWriteAllowed:false,
    assignmentAllowed:false,
    taskClaimAllowed:false,
    operatorTaskActivationAllowed:false,
    productionWriteAllowed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    customerPiiExposed:false,
    sourceRefsExposed:false,
    machineSerialExposed:false
  };
  return output;
}
