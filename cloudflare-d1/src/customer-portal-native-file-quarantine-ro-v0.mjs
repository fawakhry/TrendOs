/* TrendOS PRIVATE D1 customer-file quarantine audit — INTERNAL ONLY.
 * An R2 READY object and matching SHA256 are still UNTRUSTED until a future
 * independent approved scanner/service has genuinely inspected it.
 * No HTTP endpoint. No CLEAN flag, operator override, T12 writer, printer.
 */
export const NATIVE_CUSTOMER_QUARANTINE_AUDIT_SQL_V0=`
SELECT
 (SELECT COUNT(*) FROM customer_portal_native_draft_files_v1) AS totalFiles,
 (SELECT COUNT(*) FROM customer_portal_native_file_quarantine_v1) AS quarantineRows,
 (SELECT COUNT(*) FROM customer_portal_native_draft_files_v1 f
    LEFT JOIN customer_portal_native_file_quarantine_v1 q ON q.file_id=f.file_id
    WHERE q.file_id IS NULL OR q.customer_id<>f.customer_id
       OR q.draft_id<>f.draft_id OR q.item_id<>f.item_id
       OR q.sha256_hex<>f.sha256_hex OR q.byte_size<>f.byte_size
       OR q.content_type<>f.content_type
       OR q.disposition<>'QUARANTINED' OR q.scan_completed<>0
       OR q.print_release_authorized<>0) AS missingOrInvalid,
 (SELECT COUNT(*) FROM customer_portal_native_file_quarantine_v1 q
    LEFT JOIN customer_portal_native_draft_files_v1 f ON f.file_id=q.file_id
    WHERE f.file_id IS NULL) AS orphanRows
`;
export async function auditCustomerPrivateQuarantineV0({db}={}){
  const fail=(code)=>({success:false,code,allFilesQuarantined:false,
    malwareScanComplete:false,printReleaseAuthorized:false,
    productionOrderCreated:false});
  if(!db||typeof db.prepare!=='function')return fail('QUARANTINE_DB_UNAVAILABLE');
  try{
    const row=await db.prepare(NATIVE_CUSTOMER_QUARANTINE_AUDIT_SQL_V0).first();
    if(!row)return fail('QUARANTINE_AUDIT_MISSING');
    const values=['totalFiles','quarantineRows','missingOrInvalid','orphanRows']
      .map(k=>Number(row[k]));
    if(values.some(x=>!Number.isSafeInteger(x)||x<0)||
       values[0]!==values[1]||values[2]!==0||values[3]!==0)
      return fail('QUARANTINE_LEDGER_INCOMPLETE');
    return {success:true,allFilesQuarantined:true,
      quarantinedFileCount:values[0],malwareScanComplete:false,
      printReleaseAuthorized:false,productionOrderCreated:false,
      source:'customer-native-quarantine-internal-ro-v0'};
  }catch{return fail('QUARANTINE_AUDIT_UNAVAILABLE');}
}
export const NATIVE_CUSTOMER_QUARANTINE_POLICY_V0=Object.freeze({
  sourceOnly:true,liveMigrationApplied:false,httpRouteAvailable:false,
  scannerEngineConnected:false,malwareScanComplete:false,
  scanVerdictCleanAllowed:false,operatorOverrideAllowed:false,
  officialT12HandoffAllowed:false,printReleaseAuthorized:false
});
