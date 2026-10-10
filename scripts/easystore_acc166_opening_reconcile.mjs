import fs from 'node:fs';

// Offline-only exact per-entity opening reconciliation. No database connector,
// remote fetch, financial mutation or automatic source-of-truth inference.
export const CATEGORIES=Object.freeze([
  'customer_receivable','supplier_payable','inventory_quantity',
  'inventory_value','cashbox','custody'
]);
const canonAmount=(value)=>{
  if(typeof value!=='number'||!Number.isFinite(value))throw Error('non-finite or nonnumeric amount');
  return Math.round(value*10000);
};
function normalizeRows(rows,side){
  if(!Array.isArray(rows))throw Error(side+' rows must be an array');
  const out=new Map();
  for(const row of rows){
    if(!row||!CATEGORIES.includes(row.category)||typeof row.id!=='string'||!row.id.trim()||
       typeof row.sourceRef!=='string'||!row.sourceRef.trim())throw Error(side+' row missing category, id, or evidence reference');
    const k=row.category+'\u0000'+row.id.trim();
    if(out.has(k))throw Error(side+' duplicate entity key');
    out.set(k,canonAmount(row.amount));
  }
  return out;
}
export function reconcileOpening(input){
  const m=input?.manifest??{};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(m.cutoverDate??''))||
     !String(m.authorityRef??'').trim()||!String(m.targetSnapshotRef??'').trim()){
    return {decision:'NO_GO',reason:'AUTHORITATIVE_SOURCE_OR_CUTOVER_OR_TARGET_SNAPSHOT_MISSING',
      approved:false,entitiesCompared:0,unmatched:0};
  }
  if(m.ownerApproved!==true)return {decision:'NO_GO',reason:'OWNER_SOURCE_APPROVAL_MISSING',
    approved:false,entitiesCompared:0,unmatched:0};
  const source=normalizeRows(input.source,'source');
  const target=normalizeRows(input.target,'target');
  const keys=new Set([...source.keys(),...target.keys()]);
  if(keys.size===0)return {decision:'NO_GO',reason:'NO_SOURCE_OR_TARGET_ENTITIES',approved:true,entitiesCompared:0,unmatched:0};
  const diffs=[...keys].filter(k=>!source.has(k)||!target.has(k)||source.get(k)!==target.get(k));
  const populatedCategories=new Set([...keys].map(k=>k.split('\u0000')[0]));
  const missingCategories=CATEGORIES.filter(c=>!populatedCategories.has(c));
  const ok=diffs.length===0&&missingCategories.length===0;
  return {decision:ok?'RECONCILED_OFFLINE_ONLY':'NO_GO',
    reason:ok?'MATCHED_WITH_SUPPLIED_EVIDENCE':'UNMATCHED_OR_MISSING_CATEGORIES',
    approved:true,entitiesCompared:keys.size,unmatched:diffs.length,
    missingCategoryCount:missingCategories.length,
    // No entity identifiers, amounts, balances or personal data in audit output.
    financialLaunchAuthorized:false};
}
if(process.argv[1]&&process.argv[1].endsWith('easystore_acc166_opening_reconcile.mjs')&&process.argv[2]){
  const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const result=reconcileOpening(input);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.decision!=='RECONCILED_OFFLINE_ONLY')process.exitCode=2;
}
