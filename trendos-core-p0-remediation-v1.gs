/**
 * TrendOS CORE-P0 remediation helpers.
 * GitHub-only until the controlled RP deployment checkpoints pass.
 *
 * Contracts:
 * - keep the global Line-ID normalizer fail-closed for Date objects;
 * - recover a Line ID only from the display value of a known Sheet Line-ID cell;
 * - preserve source rows and record exact baseline/supersession decisions in an
 *   append-only resolution registry;
 * - fail closed when registry evidence no longer matches the protected rows.
 */
const TRENDOS_CORE_P0_REMEDIATION_VERSION_V1='TRENDOS_CORE_P0_REMEDIATION_V1_20260901';
const TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1='إدارة - معالجات السلامة V1';
const TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1=[
  'Metric ID','Entity Key','Canonical ID','Superseded ID','Classification',
  'Reason','Evidence Hash','Approved At','Approved By','Active?'
];

function trendosRemediationTextV1_(v){return String(v==null?'':v).trim();}
function trendosRemediationBoolV1_(v){
  if(typeof v==='boolean')return v;
  const s=trendosRemediationTextV1_(v).toLowerCase();
  return['1','true','yes','on','نعم','مفعل','فعال'].indexOf(s)!==-1;
}
function trendosRemediationAsciiDigitsV1_(v){
  return trendosRemediationTextV1_(v)
    .replace(/[٠-٩]/g,function(ch){return String(ch.charCodeAt(0)-1632);})
    .replace(/[۰-۹]/g,function(ch){return String(ch.charCodeAt(0)-1776);});
}
function trendosLineIdFromSheetCellV1_(rawValue,displayValue){
  const direct=typeof trendosNormalizeLineId_==='function'?trendosNormalizeLineId_(rawValue):'';
  if(direct)return direct;
  const isDate=rawValue instanceof Date&&!isNaN(rawValue.getTime());
  const isNumber=typeof rawValue==='number'&&isFinite(rawValue);
  if(!isDate&&!isNumber)return'';
  const shown=trendosRemediationAsciiDigitsV1_(displayValue).replace(/\s+/g,'').toUpperCase();
  if(!shown||shown.length>80||!/^[A-Z0-9_-]+$/.test(shown))return'';
  const recovered=typeof trendosNormalizeLineId_==='function'?trendosNormalizeLineId_(shown):'';
  return recovered&&recovered===shown?recovered:'';
}

function trendosIntegrityResolutionHeadersV1_(sheet){
  if(!sheet||sheet.getLastColumn()<1)return{};
  const out={};
  sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].forEach(function(v,i){
    const k=trendosRemediationTextV1_(v);if(k)out[k]=i;
  });
  return out;
}
function trendosIntegrityResolutionRowsV1_(){
  let ss=null;
  try{ss=typeof trendosSpreadsheetV1_==='function'?trendosSpreadsheetV1_():(typeof ss_==='function'?ss_():null);}catch(e){return[];}
  const sh=ss&&ss.getSheetByName(TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);
  if(!sh||sh.getLastRow()<2)return[];
  const h=trendosIntegrityResolutionHeadersV1_(sh);
  const missing=TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1.filter(function(k){return h[k]===undefined;});
  if(missing.length)throw new Error('TrendOS resolution registry schema mismatch: '+missing.join(', '));
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(function(row,i){
    const out={__rowNumber:i+2};
    TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1.forEach(function(k){out[k]=row[h[k]];});
    return out;
  });
}
function trendosIntegrityEvidenceHashV1_(evidence){
  if(typeof trendosSha256HexV1_!=='function'||typeof trendosStableJsonV1_!=='function')throw new Error('TrendOS evidence hashing dependency is missing.');
  return trendosSha256HexV1_(trendosStableJsonV1_(evidence));
}
function trendosIntegrityResolutionV1_(metricId,entityKey,evidence,rowsOverride){
  metricId=trendosRemediationTextV1_(metricId).toUpperCase();
  entityKey=trendosRemediationTextV1_(entityKey);
  if(!metricId||!entityKey)return{resolved:false,invalidKey:true};
  const rows=Array.isArray(rowsOverride)?rowsOverride:trendosIntegrityResolutionRowsV1_();
  const matches=rows.filter(function(r){
    return trendosRemediationTextV1_(r['Metric ID']).toUpperCase()===metricId&&
      trendosRemediationTextV1_(r['Entity Key'])===entityKey&&
      trendosRemediationBoolV1_(r['Active?']);
  });
  const currentHash=trendosIntegrityEvidenceHashV1_(evidence);
  if(!matches.length)return{resolved:false,missing:true,metricId:metricId,entityKey:entityKey,evidenceHash:currentHash};
  const hashes=[...new Set(matches.map(function(r){return trendosRemediationTextV1_(r['Evidence Hash']);}).filter(Boolean))];
  if(hashes.length!==1||hashes[0]!==currentHash){
    return{resolved:false,stale:true,metricId:metricId,entityKey:entityKey,evidenceHash:currentHash,registeredHashes:hashes};
  }
  const canonicalIds=[...new Set(matches.map(function(r){return trendosRemediationTextV1_(r['Canonical ID']);}).filter(Boolean))];
  if(canonicalIds.length>1)return{resolved:false,conflict:true,metricId:metricId,entityKey:entityKey,canonicalIds:canonicalIds};
  const supersededIds=[...new Set(matches.map(function(r){return trendosRemediationTextV1_(r['Superseded ID']);}).filter(Boolean))];
  const classifications=[...new Set(matches.map(function(r){return trendosRemediationTextV1_(r.Classification);}).filter(Boolean))];
  return{
    resolved:true,metricId:metricId,entityKey:entityKey,evidenceHash:currentHash,
    canonicalId:canonicalIds[0]||'',supersededIds:supersededIds,
    classifications:classifications,entries:matches
  };
}
function trendosIntegrityInvoiceDraftEvidenceV1_(drafts){
  return(drafts||[]).map(function(d){
    return{
      draftId:trendosRemediationTextV1_(d.draftId),
      orderId:typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(d.orderId):trendosRemediationTextV1_(d.orderId),
      subtotal:Number(d.subtotal||0),
      status:trendosRemediationTextV1_(d.status),
      blocker:trendosRemediationTextV1_(d.blocker),
      invoiceNo:trendosRemediationTextV1_(d.invoiceNo),
      messageStatus:trendosRemediationTextV1_(d.messageStatus),
      metaId:trendosRemediationTextV1_(d.metaId),
      updatedAt:trendosRemediationTextV1_(d.updatedAt)
    };
  }).sort(function(a,b){return a.draftId.localeCompare(b.draftId);});
}
function trendosIntegrityGroupEvidenceV1_(metricId,entityKey,rows){
  const stable=(rows||[]).map(function(r){
    const out={};
    Object.keys(r||{}).filter(function(k){return k!=='__display';}).sort().forEach(function(k){out[k]=r[k];});
    return out;
  }).sort(function(a,b){
    const ax=trendosRemediationTextV1_(a.__rowNumber)+'|'+trendosRemediationTextV1_(a.ID||a['معرف الجلسة']||a['Draft ID']);
    const bx=trendosRemediationTextV1_(b.__rowNumber)+'|'+trendosRemediationTextV1_(b.ID||b['معرف الجلسة']||b['Draft ID']);
    return ax.localeCompare(bx);
  });
  return{metricId:trendosRemediationTextV1_(metricId).toUpperCase(),entityKey:trendosRemediationTextV1_(entityKey),rows:stable};
}
