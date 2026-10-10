/* AP-123: INTERNAL PROTECTED-HOST ONLY; private SELECT before first-line
 * human evidence review. Not a public route or Production deployment.
 * The host MUST independently validate the signed-in principal/tenant and
 * selected private line key. Passing a callback is NOT independent proof.
 * No auto-selection, raw IDs in the returned review, assignments or writes.
 */
import {buildLiveLineSnapshotHumanReviewV1}
  from './live-line-snapshot-human-review-v1.mjs';

export const PRIVATE_FIRST_LINE_D1_REVIEW_VERSION='AP123_PRIVATE_FIRST_LINE_D1_REVIEW_V1';
export const PRIVATE_FIRST_LINE_D1_SELECT_SQL=`
WITH legacy AS (
  SELECT l.line_id AS lineId,l.order_id AS orderId,
         COALESCE(lr.status,l.status,'') AS lineStatus,
         COALESCE(l.department,'') AS department,
         COALESCE(l.expected_delivery_at,'') AS dueDate,
         COALESCE(l.fly_print,0) AS flyPrint,
         CASE WHEN l.active=1 THEN 1 ELSE 0 END AS lineActive,
         CASE WHEN o.active=1 THEN 1 ELSE 0 END AS orderActive,
         CASE WHEN a.line_id IS NULL THEN 0 ELSE 1 END AS archived,
         0 AS originRank
    FROM employee_core_lines_v1 l
    LEFT JOIN employee_core_orders_v1 o ON o.order_id=l.order_id
    LEFT JOIN t12_legacy_line_runtime lr
      ON lr.line_id=l.line_id AND lr.order_id=l.order_id
    LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
   WHERE l.line_id=?
),
native AS (
  SELECT l.line_id AS lineId,l.order_id AS orderId,
         COALESCE(r.status,l.status,'') AS lineStatus,
         COALESCE(l.department,'') AS department,
         COALESCE(s.expected_delivery_date,'') AS dueDate,
         COALESCE(l.fly_print,0) AS flyPrint,
         1 AS lineActive,
         CASE WHEN o.order_id IS NULL THEN 0 ELSE 1 END AS orderActive,
         CASE WHEN a.line_id IS NULL THEN 0 ELSE 1 END AS archived,
         1 AS originRank
    FROM t12_prod_lines l
    LEFT JOIN t12_prod_orders o ON o.order_id=l.order_id
    LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
    LEFT JOIN t12_prod_order_schedule s ON s.order_id=l.order_id
    LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
   WHERE l.line_id=?
),
combined AS (SELECT * FROM legacy UNION ALL SELECT * FROM native),
ranked AS (
  SELECT *,
         SUM(CASE WHEN originRank=1 THEN 1 ELSE 0 END) OVER
           (PARTITION BY lineId) AS nativeMatches,
         SUM(CASE WHEN originRank=0 THEN 1 ELSE 0 END) OVER
           (PARTITION BY lineId) AS legacyMatches,
         ROW_NUMBER() OVER (
           PARTITION BY lineId
           ORDER BY originRank DESC,dueDate DESC,lineStatus DESC,orderId DESC
         ) AS rn
    FROM combined
)
SELECT lineId,lineStatus AS status,department,dueDate,flyPrint,
       lineActive,orderActive,archived,originRank,
       CASE WHEN nativeMatches>1 OR
                 (nativeMatches=0 AND legacyMatches<>1)
            THEN 1 ELSE 0 END AS sourceAmbiguous
  FROM ranked
 WHERE rn=1
`;

function denial(reason){
  const base=buildLiveLineSnapshotHumanReviewV1({});
  return {
    ...base,version:PRIVATE_FIRST_LINE_D1_REVIEW_VERSION,
    status:'BLOCKED_SAFE',reviewReason:reason,
    purpose:'FIRST_LINE_HUMAN_EVIDENCE_REVIEW_ONLY',
    protectedHostVerifiedByThisModule:false,
    privateD1SourceRead:false,manualReviewPacketExists:false
  };
}
function isPositiveClock(value){
  return Number.isSafeInteger(value)&&value>0;
}
function lineKey(value){
  return typeof value==='string'?value.trim():'';
}

// No calls to this function from a public/cross-origin unauthenticated API.
// An authorized host must supply a real trusted authorization callback.
// It must not take authorization booleans from user query/body input.
export async function reviewProtectedFirstLineD1V1({
  db,authorizeRead,selectedPrivateLineKey,nowMs=Date.now()
}={}){
  const key=lineKey(selectedPrivateLineKey);
  if(!key||key.length>256)return denial('EXPLICIT_PRIVATE_LINE_REQUIRED');
  if(!isPositiveClock(nowMs))return denial('CLOCK_UNVERIFIED');
  if(typeof authorizeRead!=='function')
    return denial('PROTECTED_ACCESS_GUARD_REQUIRED');

  let permitted=false;
  try {
    const result=await authorizeRead({
      operation:'READ_PRIVATE_FIRST_LINE_FOR_HUMAN_REVIEW',
      selectedPrivateLineKey:key
    });
    permitted=result?.allowed===true &&
      result?.scope==='AUTONOMOUS_FIRST_LINE_HUMAN_REVIEW' &&
      result?.selectedPrivateLineKey===key;
  }catch{return denial('PROTECTED_ACCESS_GUARD_REJECTED');}
  if(!permitted)return denial('PROTECTED_ACCESS_GUARD_REJECTED');
  if(!db||typeof db.prepare!=='function')return denial('PRIVATE_D1_READ_UNAVAILABLE');

  let records;
  try {
    const result=await db.prepare(PRIVATE_FIRST_LINE_D1_SELECT_SQL)
      .bind(key,key).all();
    if(!Array.isArray(result?.results)||result.results.length>1)
      return denial('PRIVATE_D1_RESULT_UNVERIFIED');
    records=result.results;
  }catch{return denial('PRIVATE_D1_READ_UNAVAILABLE');}

  if(records.length!==1)return denial('PRIVATE_LINE_NOT_FOUND_OR_NOT_VERIFIED');
  const r=records[0];
  try {
    if(r?.sourceAmbiguous!==0 || r?.lineId!==key)
      return denial('PRIVATE_LINE_SOURCE_AMBIGUOUS');
    const row={
      lineId:key,
      status:r.status,department:r.department,dueDate:r.dueDate,
      flyPrint:r.flyPrint,
      lineActive:r.lineActive===1,orderActive:r.orderActive===1,
      archived:r.archived===1
    };
    // This module reads order state only; live design/material/machine
    // evidence is NOT supplied and must not be inferred from D1 status.
    const snapshot=buildLiveLineSnapshotHumanReviewV1({
      rows:[row],events:[],selectedPrivateLineKey:key,
      nowMs,source:{
        kind:'D1_QUALIFIED_SHADOW',
        authorizedRead:true,snapshotComplete:true,observedAtMs:nowMs
      }
    });
    return {
      ...snapshot,version:PRIVATE_FIRST_LINE_D1_REVIEW_VERSION,
      protectedHostVerifiedByThisModule:false,
      privateD1SourceRead:true,
      independentDesignMaterialMachineProofs:false,
      status:snapshot.status==='HUMAN_REVIEW_ONLY'
        ?'HUMAN_REVIEW_ONLY':'BLOCKED_SAFE',
      // All private rows/refs remain internal; never returned in packet.
      assignmentAllowed:false,taskClaimAllowed:false,
      readyWriteAllowed:false,operatorTaskActivationAllowed:false,
      productionWriteAllowed:false
    };
  }catch{
    return denial('PRIVATE_D1_RESULT_UNVERIFIED');
  }
}
