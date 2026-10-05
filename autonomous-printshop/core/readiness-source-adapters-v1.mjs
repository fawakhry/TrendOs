import { recordReadinessEvidenceV1 } from './readiness-evidence-writer-v1.mjs';

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

  const [legacyResult,materialResult]=await Promise.all([
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
    db.prepare(`
      SELECT d.line_id AS lineId,
             d.department,
             d.material_name AS materialName,
             d.material_consumption AS materialConsumption,
             m.material_id AS materialId,
             m.stock_qty AS stockQty,
             m.version AS materialVersion
        FROM employee_accounting_dept_lines_v1 d
        JOIN (
          SELECT line_id,MAX(updated_at) AS maxUpdated
            FROM employee_accounting_dept_lines_v1
           WHERE line_id<>''
           GROUP BY line_id
        ) x ON x.line_id=d.line_id AND x.maxUpdated=d.updated_at
        JOIN employee_accounting_materials_v1 m
          ON m.active=1
         AND m.department=d.department
         AND m.material_name=d.material_name
        LEFT JOIN employee_core_lines_v1 il ON il.line_id=d.line_id
        LEFT JOIN t12_legacy_line_runtime lr
          ON lr.line_id=d.line_id AND lr.order_id=il.order_id
        LEFT JOIN t12_prod_lines nl ON nl.line_id=d.line_id
        LEFT JOIN t12_prod_line_runtime nr ON nr.line_id=d.line_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=d.line_id
       WHERE d.line_id<>''
         AND a.line_id IS NULL
         AND TRIM(d.material_name)<>''
         AND d.material_consumption>0
         AND COALESCE(nr.status,nl.status,lr.status,il.status,'') NOT IN (
           'تم التسليم','جاهز للاستلام','ملغي','ملغى','مكرر','مدمج','مغلق','ملغي/مغلق'
         )
    `).all()
  ]);

  const candidates=[
    ...legacyDesignEvidenceCandidatesV1(legacyResult.results||[]),
    ...materialBlockerEvidenceCandidatesV1(materialResult.results||[],options)
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
    byKind
  };
}
