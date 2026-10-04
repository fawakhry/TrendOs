/* Autonomous Printshop - TrendOS Operational Reality Read Adapter V1
 * Repository-only / read-only composition layer.
 *
 * Consumes the already-qualified TrendOS Edge Orders page envelope through an
 * injected readPage function. It performs no network call by itself and no writes.
 * A snapshot is rejected if pagination is incomplete or the source dataVersion
 * changes while pages are being collected.
 */

import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from './operational-reality-v1.mjs';

function text(v){ return String(v == null ? '' : v).trim(); }

export const TRENDOS_REALITY_SOURCE = Object.freeze({
  VERSION:'D1_ORDERS_READ_V1',
  DATA_SOURCE:'d1-edge-orders'
});

function sourceError(code,message,details={}){
  const err=new Error(message);
  err.code=code;
  err.details=details;
  return err;
}

export function validateTrendOsRealityPageV1(payload){
  if(!payload || payload.success!==true) throw sourceError(
    'REALITY_SOURCE_READ_FAILED',
    text(payload && (payload.message || payload.code)) || 'TrendOS reality source read failed'
  );
  if(!Array.isArray(payload.rows)) throw sourceError(
    'REALITY_SOURCE_ROWS_INVALID',
    'TrendOS reality source did not return rows'
  );
  if(text(payload.version)!==TRENDOS_REALITY_SOURCE.VERSION) throw sourceError(
    'REALITY_SOURCE_VERSION_UNQUALIFIED',
    'TrendOS reality source version is not qualified',
    {version:text(payload.version)}
  );
  if(text(payload.dataSource)!==TRENDOS_REALITY_SOURCE.DATA_SOURCE) throw sourceError(
    'REALITY_SOURCE_AUTHORITY_UNQUALIFIED',
    'TrendOS reality source authority is not D1 Edge Orders',
    {dataSource:text(payload.dataSource)}
  );
  const pagination=payload.pagination||{};
  const page=Math.max(1,Number(pagination.page)||1);
  const totalPages=Math.max(1,Number(pagination.totalPages)||1);
  return {
    page,
    totalPages,
    pageSize:Math.max(1,Number(pagination.pageSize)||payload.rows.length||1),
    totalRows:Math.max(0,Number(pagination.totalRows)||0),
    dataVersion:text(payload.dataVersion),
    edgeSession:text(payload.edgeSession),
    mirror:payload.mirror||{},
    rows:payload.rows
  };
}

export async function collectTrendOsRealityRowsV1(readPage, options={}){
  if(typeof readPage!=='function') throw new Error('TRENDOS_REALITY_READ_PAGE_REQUIRED');

  const screen=text(options.screen||'');
  const pageSize=Math.max(5,Math.min(100,Number(options.pageSize)||100));
  const maxPages=Math.max(1,Math.min(100,Number(options.maxPages)||25));
  const activeOnly=options.activeOnly!==false;

  const rows=[];
  let expectedVersion='';
  let expectedSession='';
  let totalPages=1;
  let sourceMeta=null;

  for(let page=1;page<=totalPages;page++){
    if(page>maxPages) throw sourceError(
      'REALITY_SOURCE_INCOMPLETE',
      'TrendOS operational snapshot exceeded the allowed page budget',
      {maxPages,totalPages,rowsCollected:rows.length}
    );

    const payload=await readPage({
      screen,
      page,
      pageSize,
      statusFilter:activeOnly?'__ACTIVE__':''
    });
    const checked=validateTrendOsRealityPageV1(payload);

    if(page===1){
      totalPages=checked.totalPages;
      if(totalPages>maxPages) throw sourceError(
        'REALITY_SOURCE_INCOMPLETE',
        'TrendOS operational snapshot cannot be complete inside the page budget',
        {maxPages,totalPages,totalRows:checked.totalRows}
      );
      expectedVersion=checked.dataVersion;
      expectedSession=checked.edgeSession;
      sourceMeta={
        version:TRENDOS_REALITY_SOURCE.VERSION,
        dataSource:TRENDOS_REALITY_SOURCE.DATA_SOURCE,
        dataVersion:expectedVersion,
        edgeSession:expectedSession,
        mirror:checked.mirror,
        totalPages,
        totalRows:checked.totalRows,
        activeOnly
      };
    }else{
      if(checked.dataVersion!==expectedVersion) throw sourceError(
        'REALITY_SOURCE_VERSION_CHANGED',
        'TrendOS operational data changed while the snapshot was being assembled',
        {expectedVersion,actualVersion:checked.dataVersion,page}
      );
      if(expectedSession && checked.edgeSession && checked.edgeSession!==expectedSession) throw sourceError(
        'REALITY_SOURCE_SESSION_CHANGED',
        'TrendOS Edge session changed while the snapshot was being assembled',
        {page}
      );
      if(checked.totalPages!==totalPages) throw sourceError(
        'REALITY_SOURCE_PAGINATION_CHANGED',
        'TrendOS pagination changed while the snapshot was being assembled',
        {expectedTotalPages:totalPages,actualTotalPages:checked.totalPages,page}
      );
    }

    rows.push(...checked.rows);
  }

  return {rows,source:sourceMeta};
}

export async function buildTrendOsOperationalRealityV1(readPage, options={}){
  const collected=await collectTrendOsRealityRowsV1(readPage,options);
  const reality=buildOperationalRealityV1(collected.rows,{
    department:options.department,
    requiredReadiness:options.requiredReadiness||[]
  });
  return {
    success:true,
    source:collected.source,
    reality
  };
}

export async function recommendNextTrendOsTaskV1(readPage, options={}){
  const collected=await collectTrendOsRealityRowsV1(readPage,options);
  const result=recommendNextTaskV1(collected.rows,{
    department:options.department,
    requiredReadiness:options.requiredReadiness||[],
    operatorAvailable:options.operatorAvailable,
    activeTask:options.activeTask
  });
  return {
    success:true,
    source:collected.source,
    ...result
  };
}
