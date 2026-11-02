/** T12 native-only close/archive; explicit OFF by default. No legacy/Google. */
export const CLOSE_ARCHIVE_ACTION='closeAndArchiveT12OrderV1';
const ID=/^[a-zA-Z0-9_-]{1,64}$/, KEY=/^[a-zA-Z0-9:._-]{12,128}$/;
const text=v=>String(v??'').trim();
const deny=(code,extra={})=>({success:false,code,...extra});
const permitted=user=>{
  const role=text(user?.role).toLowerCase(),screens=Array.isArray(user?.screens)?user.screens.map(text):[];
  return role==='admin'||(role==='service'&&(!screens.length||screens.includes('service')));
};
export async function closeAndArchiveT12OrderV1(env,user,body={}){
  if(env?.TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED!=='true')return deny('native-close-archive-off');
  if(!permitted(user))return deny('native-close-archive-forbidden');
  const orderId=text(body.orderId),requestId=text(body.requestId),actor=text(user.username);
  if(!ID.test(orderId))return deny('native-order-id-invalid');
  if(!KEY.test(requestId))return deny('request-id-invalid');
  if(!actor)return deny('actor-required');
  if(!env?.DB?.batch||!env?.DB?.prepare)return deny('native-db-unavailable');
  const db=env.DB;
  const existing=await db.prepare(`SELECT order_id AS orderId,request_key AS requestKey FROM employee_core_archive_orders_v1 WHERE order_id=? LIMIT 1`).bind(orderId).first();
  if(existing){
    if(text(existing.requestKey)!==requestId)return deny('order-already-archived');
    return {success:true,cloudNative:true,idempotent:true,closed:true,archived:true,orderId,requestId};
  }
  // ONLY original T12-native authority. Legacy/core-import rows are never queried.
  const order=await db.prepare(`SELECT order_id AS orderId,customer_name AS customerName,
    customer_phone AS customerPhone,department,priority,source,notes
    FROM t12_prod_orders WHERE order_id=? LIMIT 1`).bind(orderId).first();
  if(!order)return deny('native-order-not-found');
  const lines=(await db.prepare(`SELECT l.line_id AS lineId,l.order_id AS orderId,l.department,
      l.item_name AS itemName,l.qty,l.priority,l.ordinal,
      COALESCE(r.status,l.status) AS status,COALESCE(r.notes,o.notes) AS notes,
      a.line_id AS archivedLineId
    FROM t12_prod_lines l JOIN t12_prod_orders o ON o.order_id=l.order_id
    LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
    LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
    WHERE l.order_id=? ORDER BY l.ordinal`).bind(orderId).all()).results||[];
  if(!lines.length)return deny('native-order-has-no-lines');
  if(lines.some(l=>l.archivedLineId))return deny('native-order-partially-archived-review');
  if(lines.some(l=>text(l.status)!=='تم التسليم'))return deny('native-order-not-all-delivered',{
    lineCount:lines.length,deliveredLines:lines.filter(l=>text(l.status)==='تم التسليم').length
  });
  // This operation is NOT an invoice, receipt, balance clearance, or notification.
  const snapshot=JSON.stringify({schema:'T12_NATIVE_ORDER_CLOSE_ARCHIVE_V1',orderId,
    customerName:order.customerName,customerPhone:order.customerPhone,
    department:order.department,priority:order.priority,source:order.source,
    notes:order.notes,lineIds:lines.map(l=>text(l.lineId)),closedReason:'all-native-lines-delivered'});
  // Guard at SQL execution, not just preflight; D1.batch is transactional.
  const statements=[db.prepare(`
    INSERT OR IGNORE INTO employee_core_archive_orders_v1
      (order_id,customer_name,customer_phone,department,priority,status,source,notes,
       snapshot_json,archived_by,request_key)
    SELECT o.order_id,o.customer_name,o.customer_phone,o.department,o.priority,
           'تم التسليم',o.source,o.notes,?,?,?
      FROM t12_prod_orders o WHERE o.order_id=?
       AND EXISTS(SELECT 1 FROM t12_prod_lines l WHERE l.order_id=o.order_id)
       AND NOT EXISTS(
         SELECT 1 FROM t12_prod_lines l
         LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
         LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
         WHERE l.order_id=o.order_id
         AND (COALESCE(r.status,l.status)<>'تم التسليم' OR a.line_id IS NOT NULL)
       )
       AND NOT EXISTS(SELECT 1 FROM employee_core_archive_orders_v1 a WHERE a.order_id=o.order_id)
    `).bind(snapshot,actor,requestId,orderId)];
  for(const l of lines)statements.push(db.prepare(`
    INSERT OR IGNORE INTO employee_core_archive_lines_v1
      (line_id,order_id,department,item_name,qty,priority,status,notes,
       snapshot_json,archived_by,request_key)
    SELECT l.line_id,l.order_id,l.department,l.item_name,l.qty,l.priority,
           'تم التسليم',COALESCE(r.notes,o.notes),?,?,?
      FROM t12_prod_lines l JOIN t12_prod_orders o ON o.order_id=l.order_id
      LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
      JOIN employee_core_archive_orders_v1 a ON a.order_id=l.order_id
      WHERE l.order_id=? AND l.line_id=? AND a.request_key=?
      AND COALESCE(r.status,l.status)='تم التسليم'
    `).bind(JSON.stringify({...l,archivedLineId:undefined}),actor,requestId,orderId,text(l.lineId),requestId));
  statements.push(db.prepare(`
    INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json)
    SELECT ?, 'order', ?, ?, ? FROM employee_core_archive_orders_v1 a
    WHERE a.order_id=? AND a.request_key=?
    `).bind(CLOSE_ARCHIVE_ACTION,orderId,actor,JSON.stringify({lineCount:lines.length,requestId}),orderId,requestId));
  statements.push(db.prepare(`
    UPDATE employee_core_control_v1 SET data_version=data_version+1,
      updated_at=CURRENT_TIMESTAMP WHERE singleton=1
      AND EXISTS(SELECT 1 FROM employee_core_archive_orders_v1 WHERE order_id=? AND request_key=?)
    `).bind(orderId,requestId));
  try{await db.batch(statements);}catch{return deny('native-close-archive-outcome-unknown-check-d1');}
  const post=await db.prepare(`
    SELECT a.request_key AS requestKey,
      (SELECT COUNT(*) FROM employee_core_archive_lines_v1 l WHERE l.order_id=a.order_id) AS archivedLines,
      (SELECT COUNT(*) FROM t12_prod_lines l WHERE l.order_id=a.order_id) AS totalLines
    FROM employee_core_archive_orders_v1 a WHERE a.order_id=?`).bind(orderId).first();
  if(!post||text(post.requestKey)!==requestId)return deny('native-close-archive-cas-lost-check-d1');
  if(Number(post.archivedLines)!==Number(post.totalLines)||Number(post.totalLines)!==lines.length)
    return deny('native-close-archive-inconsistent-check-d1');
  return {success:true,cloudNative:true,closed:true,archived:true,
    orderId,requestId,archivedOrders:1,archivedLines:lines.length};
}
