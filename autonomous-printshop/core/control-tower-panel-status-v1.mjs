export const CONTROL_TOWER_PANEL_STATUS_VERSION='CONTROL_TOWER_PANEL_STATUS_V1_20261008';
const MAX_AGE_MS=300000;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// Snapshot age describes the read, never the completeness of business history.
export function buildControlTowerPanelStatusV1(control={},evidence={},at=Date.now()){
  const produced=Date.parse(control.generatedAt);
  const ageMs=at-produced;
  const qualified=Number.isFinite(at)&&Number.isFinite(produced)&&ageMs>=0&&ageMs<=MAX_AGE_MS&&
    control.success===true&&control.mode==='CONTROL_TOWER_SHADOW'&&
    control.source?.authority==='trendos-main-d1'&&control.writesAccepted===false&&
    control.d1Mutation===false&&control.employeeAssignment===false&&
    ['piiExposed','employeeIdentityExposed','rawOrderIdsExposed','rawLineIdsExposed'].every(k=>control[k]===false);
  function panel(present,source='CONTROL_TOWER_SHADOW',extra={}){
    const available=qualified&&present;
    return {state:available?'FRESH':'UNAVAILABLE',displayAvailable:available,
      source,asOf:qualified?new Date(produced).toISOString():null,
      ageMs:qualified?ageMs:null,maxAgeMs:MAX_AGE_MS,
      scope:'READ_SNAPSHOT_ONLY',executionAllowed:false,...extra};
  }
  const finance=control.finance?.warnings;
  const panels={
    operations:panel(object(control.operations?.counts)),
    deadlines:panel(object(control.operations?.deadlineRisk)),
    employees:panel(object(control.employees?.operatorCounts)),
    employeeBlockers:panel(control.employees?.blockers?.success===true&&object(control.employees.blockers.summary)),
    readiness:panel(object(control.readiness)&&object(control.readiness.coverage)),
    communications:panel(control.communications?.pending?.success===true&&object(control.communications.pending.summary)),
    finance:panel(finance?.success===true&&finance.summary?.control?.readModeSafe===true,'CONTROL_TOWER_SHADOW',{
      historicalCompletenessQualified:qualified&&finance?.success===true&&finance.summary?.control?.readModeSafe===true&&finance.summary?.source?.absenceQualified===true
    }),
    learning:panel(object(control.shadowLearning))
  };
  const received=qualified&&evidence.success===true&&evidence.mode==='READINESS_EVIDENCE_STATUS';
  const evidenceTime=Date.parse(evidence.generatedAt);
  const evidenceAge=at-evidenceTime;
  const timestampPresent=evidence.generatedAt!==undefined&&evidence.generatedAt!==null;
  const evidenceFresh=received&&Number.isFinite(evidenceTime)&&evidenceAge>=0&&evidenceAge<=MAX_AGE_MS;
  panels.evidence={
    state:evidenceFresh?'FRESH':received&&!timestampPresent?'RECEIVED_AGE_UNKNOWN':'UNAVAILABLE',
    displayAvailable:evidenceFresh||received&&!timestampPresent,
    source:'READINESS_COLLECTOR',asOf:evidenceFresh?new Date(evidenceTime).toISOString():null,
    ageMs:evidenceFresh?evidenceAge:null,observedAt:Number.isFinite(at)?new Date(at).toISOString():null,
    maxAgeMs:MAX_AGE_MS,scope:'READ_SNAPSHOT_ONLY',executionAllowed:false
  };
  return {version:CONTROL_TOWER_PANEL_STATUS_VERSION,panels,businessWrite:false,d1Mutation:false};
}
