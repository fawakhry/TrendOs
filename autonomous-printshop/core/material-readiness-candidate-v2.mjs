export const MATERIAL_READINESS_CANDIDATE_VERSION='MATERIAL_READINESS_CANDIDATE_V2';

function text(v){return String(v==null?'':v).trim();}

export function materialReadinessEvidenceCandidatesV2(rows=[],options={}){
  const nowMs=Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now();
  const bucketMs=Math.floor(nowMs/(10*60*1000))*(10*60*1000);
  const allowReady=options.allowReady===true &&
    options.accountingGeneral===true &&
    options.postCutoverQualified===true &&
    options.stockAuthorityConfirmed===true;

  const out=[];
  for(const row of Array.isArray(rows)?rows:[]){
    const lineId=text(row.lineId||row.line_id);
    const materialName=text(row.materialName||row.material_name);
    const materialId=text(row.materialId||row.material_id);
    const consumption=Number(row.materialConsumption??row.material_consumption);
    const stock=Number(row.stockQty??row.stock_qty);
    if(!lineId||!materialName||!materialId) continue;
    if(!Number.isFinite(consumption)||consumption<=0) continue;
    if(!Number.isFinite(stock)||stock<0) continue;

    if(stock<consumption){
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
      continue;
    }

    if(allowReady){
      out.push({
        lineId,
        kind:'MATERIAL',
        state:'READY',
        sourceKind:'MATERIAL_LEDGER',
        sourceRef:'accounting-material:'+materialId,
        sourceVersion:'catalog-v'+String(row.materialVersion||row.material_version||'1'),
        confidence:1,
        observedAtMs:bucketMs,
        expiresAtMs:bucketMs+30*60*1000,
        evidence:{
          reason:'AUTHORITATIVE_STOCK_SUFFICIENT',
          materialName,
          required:consumption,
          available:stock,
          department:text(row.department),
          postCutoverQualified:true
        }
      });
    }
  }
  return out;
}
