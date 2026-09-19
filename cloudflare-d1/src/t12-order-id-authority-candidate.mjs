/*
 * T12 isolated business Order-ID authority candidate.
 * This module can only allocate from the t12_* candidate table when ALL
 * explicit isolated-qualification gates are true. It is not routed anywhere.
 */
export const T12_ORDER_ID_AUTHORITY_VERSION='TRENDOS_T12_ORDER_ID_AUTHORITY_20260919';

function fail(reason,extra={}){
  return {success:false,allocated:false,productionAuthorized:false,version:T12_ORDER_ID_AUTHORITY_VERSION,reason,...extra};
}
function gatesOk(g={}){
  return g.mode==='isolated-exclusive-qualification' &&
    g.allowTestAllocation===true &&
    g.productionVersion155SourceExact===true &&
    g.googleCreateFrozen===true &&
    g.idempotencyLedgerQualified===true &&
    g.rollbackReady===true;
}
export async function seedT12OrderIdAuthorityCandidate(db,{maxObservedOrderId,sourceSnapshot}={},gates={}){
  if(!db||typeof db.prepare!=='function') return fail('d1-adapter-required');
  if(!gatesOk(gates)) return fail('exclusive-authority-gates-not-satisfied');
  const max=Number(maxObservedOrderId);
  if(!Number.isInteger(max)||max<1000) return fail('invalid-max-observed-order-id');
  const snapshot=String(sourceSnapshot||'').trim();
  if(!snapshot) return fail('source-snapshot-required');
  const existing=await db.prepare(
    "SELECT next_value AS nextValue, seeded_from_max_order_id AS seededFromMaxOrderId, source_snapshot AS sourceSnapshot FROM t12_order_id_sequence_candidate WHERE authority_key='order' LIMIT 1"
  ).first();
  if(existing){
    if(Number(existing.seededFromMaxOrderId)!==max || String(existing.sourceSnapshot)!==snapshot){
      return fail('sequence-already-seeded-with-different-source',{existing});
    }
    return {success:true,seeded:false,idempotent:true,allocated:false,productionAuthorized:false,version:T12_ORDER_ID_AUTHORITY_VERSION,nextValue:Number(existing.nextValue)};
  }
  await db.prepare(
    "INSERT INTO t12_order_id_sequence_candidate(authority_key,next_value,seeded_from_max_order_id,source_snapshot,mode) VALUES('order',?,?,?,'isolated-test')"
  ).bind(max+1,max,snapshot).run();
  return {success:true,seeded:true,idempotent:false,allocated:false,productionAuthorized:false,version:T12_ORDER_ID_AUTHORITY_VERSION,nextValue:max+1};
}
export async function allocateT12OrderIdCandidate(db,gates={}){
  if(!db||typeof db.prepare!=='function') return fail('d1-adapter-required');
  if(!gatesOk(gates)) return fail('exclusive-authority-gates-not-satisfied');
  try{
    const row=await db.prepare(
      "UPDATE t12_order_id_sequence_candidate SET next_value=next_value+1, updated_at=CURRENT_TIMESTAMP WHERE authority_key='order' RETURNING next_value-1 AS allocatedId, next_value AS nextValue"
    ).first();
    if(!row) return fail('sequence-not-seeded');
    return {
      success:true,allocated:true,productionAuthorized:false,
      version:T12_ORDER_ID_AUTHORITY_VERSION,
      orderId:String(row.allocatedId),nextValue:Number(row.nextValue),
      authorityMode:'isolated-exclusive-qualification'
    };
  }catch(err){
    return fail('allocation-failed',{message:String(err&&err.message||err)});
  }
}
