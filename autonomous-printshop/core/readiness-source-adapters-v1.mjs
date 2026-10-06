import { recordReadinessEvidenceV1 } from './readiness-evidence-writer-v1.mjs';
import { machineReadinessEvidenceCandidatesV1 } from './machine-readiness-v1.mjs';
import { readAccountingMaterialEvidenceSnapshotV1 } from './accounting-material-evidence-connector-v1.mjs';

function text(v){return String(v==null?'':v).trim();}
function norm(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا')
    .replace(/[ى]/g,'ي')
    .replace(/[ةه]/g,'ه')
    .replace(/\s+/g,' ')
    .trim();
}
function parseUtc(v){
  const s=text(v);
  if(!s)return 0;
  const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)?s.replace(' ','T')+'Z':s;
  const ms=Date.parse(normalized);
  return Number.isFinite(ms)?ms:0;
}
function legacyReadyState(v){
  const k=norm(v);
  if(['نعم','جاهز','جاهزه','yes','true','1','ready'].includes(k)) return 'READY';
  if(['لا','غير جاهز','غير جاهزه','no','false','0','blocked'].includes(k)) return 'BLOCKED';
  return '';
}

export function legacyDesignEvidenceCandidatesV1(rows=[]){
  const out=[];
  for(const row of Array.isArray(rows)?rows:[]){
    const state=legacyReadyState(row.ready);
    const lineId=text(row.lineId||row.line_id);
    const updatedAt=text(row.updatedAt||row.updated_at);
    const observedAtMs=parseUtc(updatedAt);
    if(!lineId||!state||!observedAtMs) continue;
    out.push({
      lineId,
      kind:'DESIGN',
      state,
      sourceKind:'TRENDOS_LEGACY',
      sourceRef:'employee_core_lines_v1:'+lineId,
      sourceVersion:'legacy-ready@'+updatedAt,
      confidence:1,
      observedAtMs,
      evidence:{field:'ready',value:text(row.ready)}
    });
  }
  return out;
}

export function materialBlockerEvidenceCandidatesV1(rows=[],options={}){
  const nowMs=Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now();
  const bucketMs=Math.floor(nowMs/(10*60*1000))*(10*60*1000);
  const out=[];
  for(const row of Array.isArray(rows)?rows:[]){
    const lineId=text(row.lineId||row.line_id);
    const materialName=text(row.materialName||row.material_name);
    const materialId=text(row.materialId||row.material_id);
    const consumption=Number(row.materialConsumption??row.material_consumption);
    const stock=Number(row.stockQty??row.stock_qty);
    if(!lineId||!materialName||!materialId) continue;
    if(!Number.isFinite(consumption)||consumption<=0) continue;
    if(!Number.isFinite(stock)||stock>=consumption) continue;

    out.push({
      lineId,
      kind:'MATERIAL',
      state:'BLOCKED',
      sourceKind:'MATERIAL_LEDGER',
      sourceRef:'accounting-material:'+materialId,
      sourceVersion:'catalog-v'+String(row.materialVersion||row.material_version||'1'),
      confidence:1,
      observedAtMs:bucketMs,
      expiresAtMs:bucketMs+2*60*60*1000,
      evidence:{
        reason:'INSUFFICIENT_STOCK',
        materialName,
        required:consumption,
        available:stock,
        department:text(row.department)
      }
    });
  }
  return out;
}

export async function collectExistingReadinessEvidenceV1(db,options={}){
  if(!db||typeof db.prepare!=='function') throw new Error('READINESS_DB_REQUIRED');
  const control=await db.prepare(`
    SELECT mode
      FROM autonomous_readiness_control
     WHERE singleton_id=1
     LIMIT 1
  `).first();
  if(text(control&&control.mode)!=='SHADOW'){
    return {success:true,skipped:true,reason:'READINESS_CONTROL_NOT_SHADOW'};
  }

  const [legacyResult,materialSnapshot,machineControl,machinesResult,mappingsResult,observationsResult]=await Promise.all([
    db.prepare(`
      SELECT l.line_id AS lineId,
             l.ready,
             l.updated_at AS updatedAt
        FROM employee_core_lines_v1 l
        LEFT JOIN t12_legacy_line_runtime lr
          ON lr.line_id=l.line_id AND lr.order_id=l.order_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE l.active=1
         AND a.line_id IS NULL
         AND TRIM(l.ready)<>''
         AND COALESCE(lr.status,l.status,'') NOT IN (
           'تم التسليم','جاهز للاستلام','ملغي','ملغى','مكرر','مدمج','مغلق','ملغي/مغلق'
         )
    `).all(),
    readAccountingMaterialEvidenceSnapshotV1(db),
    db.prepare(`
      SELECT mode
        FROM autonomous_machine_control
       WHERE singleton_id=1
       LIMIT 1
    `).first(),
    db.prepare(`
      SELECT machine_id AS machineId,
             display_name AS displayName,
             department,
             machine_class AS machineClass,
             capabilities_json AS capabilitiesJson,
             active,
             version
        FROM autonomous_machines
       WHERE active=1
    `).all(),
    db.prepare(`
      SELECT mapping_event_id AS mappingEventId,
             line_id AS lineId,
             machine_id AS machineId,
             mapping_state AS mappingState,
             source_kind AS sourceKind,
             source_ref AS sourceRef,
             observed_at_ms AS observedAtMs
        FROM autonomous_line_machine_mapping_events
    `).all(),
    db.prepare(`
      SELECT observation_id AS observationId,
             machine_id AS machineId,
             machine_state AS machineState,
             source_kind AS sourceKind,
             source_ref AS sourceRef,
             confidence,
             evidence_json AS evidenceJson,
             observed_at_ms AS observedAtMs,
             expires_at_ms AS expiresAtMs
        FROM autonomous_machine_observations
       WHERE expires_at_ms>?
    `).bind(Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now()).all()
  ]);

  const candidates=[
    ...legacyDesignEvidenceCandidatesV1(legacyResult.results||[]),
    ...(materialSnapshot&&materialSnapshot.qualified
      ? materialBlockerEvidenceCandidatesV1(materialSnapshot.rows||[],options)
      : []),
    ...(text(machineControl&&machineControl.mode)==='SHADOW'
      ? machineReadinessEvidenceCandidatesV1({
          machines:machinesResult.results||[],
          mappings:mappingsResult.results||[],
          observations:observationsResult.results||[],
          nowMs:Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now()
        })
      : [])
  ];

  let inserted=0;
  let duplicates=0;
  const byKind={DESIGN:0,MATERIAL:0,MACHINE:0};
  for(const candidate of candidates){
    const result=await recordReadinessEvidenceV1(db,candidate,options);
    byKind[candidate.kind]=(byKind[candidate.kind]||0)+1;
    if(result.inserted) inserted+=1;
    else duplicates+=1;
  }

  return {
    success:true,
    skipped:false,
    candidates:candidates.length,
    inserted,
    duplicates,
    byKind,
    accountingMode:text(materialSnapshot&&materialSnapshot.accountingMode)||'ABSENT',
    accountingEpoch:Number(materialSnapshot&&materialSnapshot.accountingEpoch||0),
    materialAuthorityReadOnly:!!(materialSnapshot&&materialSnapshot.qualified),
    materialConnector:text(materialSnapshot&&materialSnapshot.connectorVersion)||'',
    materialConnectorReason:text(materialSnapshot&&materialSnapshot.reason)||'',
    machineMode:text(machineControl&&machineControl.mode)||'ABSENT'
  };
}
