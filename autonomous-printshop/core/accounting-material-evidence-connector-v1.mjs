export const ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_VERSION='ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_V1';

function text(v){return String(v==null?'':v).trim();}

export async function readAccountingMaterialEvidenceSnapshotV1(db){
  if(!db||typeof db.prepare!=='function') throw new Error('ACCOUNTING_MATERIAL_CONNECTOR_DB_REQUIRED');

  const control=await db.prepare(`
    SELECT mode,policy_epoch AS policyEpoch
      FROM employee_accounting_control_v1
     WHERE singleton=1
     LIMIT 1
  `).first();

  const mode=text(control&&control.mode);
  const policyEpoch=Number(control&&control.policyEpoch||0);
  if(mode!=='READONLY'){
    return {
      success:true,
      qualified:false,
      reason:'ACCOUNTING_AUTHORITY_NOT_READONLY',
      accountingMode:mode||'ABSENT',
      accountingEpoch:policyEpoch,
      rows:[]
    };
  }

  const q=await db.prepare(`
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
  `).all();

  return {
    success:true,
    qualified:true,
    reason:'ACCOUNTING_READONLY_AUTHORITY_CONFIRMED',
    accountingMode:mode,
    accountingEpoch:policyEpoch,
    authority:'employee_accounting_d1_read_model',
    connectorVersion:ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_VERSION,
    piiExposed:false,
    financialWrites:false,
    rows:q.results||[]
  };
}
