import { buildOperationalRealityV1 } from './operational-reality-v1.mjs';

export const EVIDENCE_PILOT_TARGET_VERSION='EVIDENCE_PILOT_TARGET_V1';

function text(v){return String(v==null?'':v).trim();}
function machineClassHint(row={}){
  const dept=text(row.department).toLowerCase();
  if(row.heatPress===true||Number(row.heatPress||0)===1) return 'HEAT_PRESS';
  if(dept.includes('ليزر')) return 'LASER';
  if(dept.includes('طباعة')) return 'PRINT';
  if(dept.includes('فنيل')||dept.includes('استيكر')) return 'VINYL_CUTTER';
  return 'UNKNOWN';
}

export function selectEvidencePilotTargetV1(rows=[],options={}){
  const requiredKinds=Array.isArray(options.requiredKinds)&&options.requiredKinds.length
    ? options.requiredKinds.map(x=>text(x).toLowerCase())
    : ['design','material','machine'];

  const sourceRows=Array.isArray(rows)?rows:[];
  const acquisitionRows=sourceRows.map(row=>({
    ...row,
    designReady:null,
    materialReady:null,
    machineReady:null
  }));
  const reality=buildOperationalRealityV1(acquisitionRows,{});
  for(const line of reality.ordinary){
    const source=sourceRows[line.sourceIndex]||{};
    const missingKinds=[];
    if(requiredKinds.includes('design')&&source.designReady!==true) missingKinds.push('DESIGN');
    if(requiredKinds.includes('material')&&source.materialReady!==true) missingKinds.push('MATERIAL');
    if(requiredKinds.includes('machine')&&source.machineReady!==true) missingKinds.push('MACHINE');
    if(!missingKinds.length) continue;

    return {
      version:EVIDENCE_PILOT_TARGET_VERSION,
      exists:true,
      sourceIndex:Number(line.sourceIndex),
      department:text(line.department),
      priority:text(line.priority),
      dueIso:text(line.dueIso),
      urgent:line.urgent===true,
      missingKinds,
      machineClassHint:machineClassHint(source),
      purpose:'EVIDENCE_ACQUISITION_ONLY',
      assignmentAllowed:false,
      taskClaimAllowed:false
    };
  }

  return {
    version:EVIDENCE_PILOT_TARGET_VERSION,
    exists:false,
    sourceIndex:-1,
    department:'',
    priority:'',
    dueIso:'',
    urgent:false,
    missingKinds:[],
    machineClassHint:'UNKNOWN',
    purpose:'EVIDENCE_ACQUISITION_ONLY',
    assignmentAllowed:false,
    taskClaimAllowed:false
  };
}
