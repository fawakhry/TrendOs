/* AP-098: private in-memory order source qualification, aggregate-only output.
 * This is a diagnostic safety gate, NOT an authentication or dispatch policy.
 * No network/DB reads or business writes; caller owns source attestation.
 */
import { buildOperationalRealityV1 } from './operational-reality-v1.mjs';
import { buildReadinessQualifiedRealityV1 } from './readiness-evidence-v1.mjs';
import { selectEvidencePilotTargetV1 } from './evidence-pilot-target-v1.mjs';
import { buildEvidenceAcquisitionPacketV1 } from './evidence-acquisition-packet-v1.mjs';

export const REAL_PILOT_SOURCE_AUDIT_VERSION='REAL_PILOT_SOURCE_AUDIT_V1';
const FRESH_MS=5*60*1000;
const REQUIRED=['design','material','machine'];

export function buildRealPilotSourceAuditV1({rows=[],events=[],source={},nowMs=Date.now()}={}){
  const items=Array.isArray(rows)?rows:[];
  const base=buildOperationalRealityV1(items,{});
  const counts={
    observedRows:items.length,
    ordinary:base.counts.ordinary,
    exceptions:base.counts.exceptions,
    closed:base.counts.closed,
    flyPrint:base.counts.flyPrint,
    inProgress:base.counts.inProgress
  };
  const now=Number(nowMs);
  const observed=Number(source&&source.observedAtMs);
  const clockValid=Number.isFinite(now)&&now>0;
  const srcKind=String(source&&source.kind||'');
  const d1=srcKind==='D1_QUALIFIED_SHADOW';
  const authenticated=source&&source.authorizedRead===true;
  const complete=source&&source.snapshotComplete===true;
  const validObservation=clockValid&&Number.isFinite(observed)&&observed>0&&
    observed<=now&&now-observed<=FRESH_MS;
  const qualified=d1&&authenticated&&complete&&validObservation;

  const none=buildEvidenceAcquisitionPacketV1({exists:false});
  if(!qualified){
    const reason=!d1?'NON_AUTHORITATIVE_SOURCE':
      !authenticated?'AUTHORIZED_READ_NOT_PROVEN':
      !complete?'SNAPSHOT_INCOMPLETE':
      !validObservation?'SOURCE_STALE_OR_CLOCK_UNVERIFIED':'SOURCE_UNVERIFIED';
    return {
      version:REAL_PILOT_SOURCE_AUDIT_VERSION,
      mode:'READ_ONLY',
      sourceQualified:false,sourceStatus:reason,counts,
      strictEligible:null,candidateExists:false,
      acquisitionPacket:none,
      rawOrderIdsExposed:false,rawLineIdsExposed:false,
      customerPiiExposed:false,employeeIdentityExposed:false,
      actualTaskAssignmentAllowed:false,productionWritesAllowed:false
    };
  }

  // A fresh, authorized, complete D1 source is mandatory even for diagnostics.
  // A source assertion alone cannot grant business permissions.
  const evidence=Array.isArray(events)?events:[];
  const projected=buildReadinessQualifiedRealityV1(items,evidence,{
    nowMs:now,requiredKinds:REQUIRED
  });
  const target=selectEvidencePilotTargetV1(projected.rows,{requiredKinds:REQUIRED});
  const selected=target.exists?projected.rows[target.sourceIndex]:null;
  const packet=buildEvidenceAcquisitionPacketV1(target,{
    lineId:selected?.lineId??selected?.line_id,
    events:evidence,nowMs:now
  });
  return {
    version:REAL_PILOT_SOURCE_AUDIT_VERSION,
    mode:'READ_ONLY',
    sourceQualified:true,
    sourceStatus:counts.ordinary===0?'NO_BASELINE_PILOT_LINE':'D1_EVIDENCE_REVIEW',
    counts,strictEligible:projected.reality.counts.ordinary,
    candidateExists:target.exists,
    acquisitionPacket:packet,
    rawOrderIdsExposed:false,rawLineIdsExposed:false,
    customerPiiExposed:false,employeeIdentityExposed:false,
    actualTaskAssignmentAllowed:false,productionWritesAllowed:false
  };
}
