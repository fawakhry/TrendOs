/* ACC242: compare original T12 operational candidate against ORIGINAL
 * EasyStore accounting department-line identity/approval metadata.
 *
 * OFFLINE / SOURCE-ONLY. No runtime Worker import, service binding or HTTP
 * route. No FINANCE_AUTHORITY. Never treat a caller-supplied source candidate,
 * names, an accounting approved_by field or a local DB read as independent
 * official order/customer ownership or a signed order_line_approved event.
 * Two fake, separate SQLite databases in CI; NO cross-D1 deployment.
 */
export const ACC242_POLICY=Object.freeze({
  version:'ACC242_ORIGINAL_T12_EASYSTORE_LINEAGE_PREVIEW_NO_GO',
  sourceOnly:true,readOnly:true,workerWired:false,connectorPublished:false,
  independentSourceAuthentication:false,ownerAttested:false,
  signedLineApprovalsVerified:false,independentEmployeeGrantsVerified:false,
  financeWrites:false,financeRelease:'NO_GO'
});
const id=v=>typeof v==='string'&&v.length>=1&&v.length<=160&&
  v===v.trim()&&v.normalize('NFC')===v&&
  !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(v);
const approved='معتمد من القسم';
const departments=new Set(['طباعة','ليزر']);
const deny=code=>Object.freeze({
  status:409,success:false,code,
  operationalSourceShapeVerified:false,
  originalAccountingLineageShapeMatched:false,
  nativeDepartmentApprovalRowsObserved:false,
  signedLineApprovalsVerified:false,
  ownerAttested:false,independentSourceAuthentication:false,
  customerIdentityFinanciallyVerified:false,
  canRequestInvoice:false,canPostCash:false,financeAuthorized:false,
  sourceOnly:true,readOnly:true,financeRelease:'NO_GO'
});
const FINANCE_SQL_PREFIX=`SELECT accounting_line_id AS accountingLineId,
 order_id AS orderId,line_id AS sourceLineId,department,
 approval_status AS approvalStatus,approved_by AS approvedBy,
 approved_at_ms AS approvedAtMs,approval_batch_id AS approvalBatchId,
 stock_deducted AS stockDeducted,final_invoice_no AS finalInvoiceNo,version
 FROM employee_accounting_dept_lines_v1 WHERE order_id=? OR line_id IN (`;
export const ACC242_MAX_ACCOUNTING_ROWS=100;

export async function previewOriginalT12AccountingLineageACC242({
 sourceResponse,financeDb,orderId,expectedOfficialCustomerId
}={}){
 if(!id(orderId)||!id(expectedOfficialCustomerId)||
    !financeDb||typeof financeDb.prepare!=='function')
   return deny('EXACT_IDS_AND_SEPARATE_FINANCE_READER_REQUIRED');
 const c=sourceResponse?.body;
 if(sourceResponse?.status!==200||c?.success!==true||
    c.source!=='original-t12-at-create-source-only'||
    c.readOnly!==true||c.sourceOnly!==true||
    c.operationalSourceShapeVerified!==true||
    c.officialCustomerOwnershipAttested!==false||
    c.departmentApprovalsVerified!==false||
    c.financeAuthorized!==false||c.canRequestInvoice!==false||
    c.connectorEventPublished!==false||c.posted!==false||
    c.orderId!==orderId||c.officialCustomerId!==expectedOfficialCustomerId||
    !Array.isArray(c.lines)||c.lines.length<1||c.lines.length>2||
    c.lineCount!==c.lines.length)
   return deny('ORIGINAL_T12_SOURCE_PREVIEW_NOT_QUALIFIED');
 const sourceLines=new Map();
 for(let i=0;i<c.lines.length;i++){
   const row=c.lines[i];
   if(!row||!id(row.lineId)||row.lineId!==orderId+'-'+String(i+1).padStart(2,'0')||
      row.ordinal!==i+1||!departments.has(row.department)||
      sourceLines.has(row.lineId))
     return deny('ORIGINAL_SOURCE_LINE_SET_UNQUALIFIED');
   sourceLines.set(row.lineId,row.department);
 }
 if(sourceLines.size===2&&new Set(sourceLines.values()).size!==2)
   return deny('ORIGINAL_SOURCE_DEPARTMENT_DUPLICATED');
 // SELECT only; query exact T12 source IDs as well as the order id, so any
 // accounting row reusing a source line under another order is surfaced.
 // Never SELECT money, customer_name, notes, session data or raw_json.
 const placeholders=c.lines.map(()=>'?').join(',');
 const sql=FINANCE_SQL_PREFIX+placeholders+
  ') ORDER BY accounting_line_id LIMIT '+(ACC242_MAX_ACCOUNTING_ROWS+1);
 try{
   const stmt=financeDb.prepare(sql).bind(orderId,...c.lines.map(x=>x.lineId));
   const r=await stmt.all();
   const records=Array.isArray(r)?r:r?.results;
   if(!Array.isArray(records))return deny('ORIGINAL_FINANCE_METADATA_READ_UNAVAILABLE');
   if(!records.length)return deny('FINANCE_DEPARTMENT_LINES_ABSENT');
   if(records.length>ACC242_MAX_ACCOUNTING_ROWS)
     return deny('FINANCE_DEPARTMENT_ROW_LIMIT_EXCEEDED');
   const seenAccounts=new Set(),counts=new Map([...sourceLines.keys()].map(x=>[x,0]));
   for(const a of records){
     if(!a||!id(a.accountingLineId)||seenAccounts.has(a.accountingLineId)||
        a.orderId!==orderId||!id(a.sourceLineId)||
        !sourceLines.has(a.sourceLineId)||
        a.department!==sourceLines.get(a.sourceLineId))
       return deny('FINANCE_ROW_CROSS_ORDER_OR_LINEAGE_MISMATCH');
     seenAccounts.add(a.accountingLineId);
     if(a.approvalStatus!==approved||
        !id(a.approvedBy)||!id(a.approvalBatchId)||
        !Number.isSafeInteger(a.approvedAtMs)||a.approvedAtMs<=0||
        a.stockDeducted!==1||a.finalInvoiceNo!==''||
        !Number.isSafeInteger(a.version)||a.version<1)
       return deny('FINANCE_LINE_NOT_NATIVE_APPROVED_OPEN');
     counts.set(a.sourceLineId,counts.get(a.sourceLineId)+1);
   }
   if([...counts.values()].some(x=>x===0))
     return deny('FINANCE_APPROVAL_MISSING_FOR_SOURCE_LINE');
   // These are shape/ledger comparisons only. A future isolated connector
   // must separately verify source ownership, signed operational approvals,
   // authenticated finance staff grants, dedupe and no prior invoice/posting.
   return Object.freeze({
     status:200,success:true,sourceOnly:true,readOnly:true,
     orderId,officialCustomerId:expectedOfficialCustomerId,
     operationalSourceShapeVerified:true,
     originalAccountingLineageShapeMatched:true,
     nativeDepartmentApprovalRowsObserved:true,
     originalSourceLineCount:sourceLines.size,
     originalAccountingRowCount:records.length,
     signedLineApprovalsVerified:false,ownerAttested:false,
     independentSourceAuthentication:false,
     customerIdentityFinanciallyVerified:false,
     canRequestInvoice:false,canPostCash:false,financeAuthorized:false,
     connectorEventPublished:false,financeRelease:'NO_GO',
     nextRequiredGate:'INDEPENDENT_OWNER_ATTESTATION_AND_SIGNED_ORDER_LINE_APPROVED'
   });
 }catch{return deny('ORIGINAL_FINANCE_METADATA_READ_UNAVAILABLE');}
}
