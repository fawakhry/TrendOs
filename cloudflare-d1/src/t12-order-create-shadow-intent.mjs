/*
 * T12 isolated shadow-intent planner.
 * PURE: no D1, fetch, Apps Script, Sheets, PropertiesService or Worker route.
 * It deliberately DOES NOT allocate a production business Order ID or Line ID.
 */
import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';

export const T12_SHADOW_INTENT_VERSION = 'TRENDOS_T12_ORDER_CREATE_SHADOW_INTENT_20260919';

function text(v){ return String(v == null ? '' : v).trim(); }
function assignedFor(department){
  if (department === 'طباعة') return 'وائل';
  if (department === 'ليزر') return 'جابر';
  return '';
}
function fail(reason, extra={}){
  return Object.freeze({
    success:false, valid:false, mutationFree:true, productionRouteIntegrated:false,
    productionCutoverAuthorized:false, businessOrderIdAllocated:false,
    version:T12_SHADOW_INTENT_VERSION, reason, ...extra
  });
}
export function buildT12OrderCreateShadowIntent(input={}, actor=''){
  const canonical = buildCanonicalOrderCreateIntentV2({...input, actor: text(actor || input.actor)});
  if (!canonical.valid) return fail('canonical-intent-invalid',{errors:canonical.errors || []});

  const p = canonical.canonicalCreateParams;
  const requestKey = p.clientRequestId;
  const provisionalRef = 't12-order-intent:' + requestKey;
  const departments = p.department === 'متعدد الأقسام'
    ? [
        {department:'طباعة',assignedTo:'وائل',suffix:'طباعة'},
        {department:'ليزر',assignedTo:'جابر',suffix:'ليزر'}
      ]
    : [{department:p.department,assignedTo:assignedFor(p.department),suffix:p.department}];

  const lines = departments.map((d,index)=>Object.freeze({
    ordinal:index + 1,
    provisionalLineRef: provisionalRef + ':line:' + String(index + 1).padStart(2,'0'),
    department:d.department,
    assignedTo:d.assignedTo,
    itemName:departments.length > 1 ? p.itemName + ' - ' + d.suffix : p.itemName,
    qty:p.qty,
    priority:p.priority,
    status:'طلب جديد',
    heatPress:p.heatPress,
    flyPrint:p.flyPrint
  }));

  const activityPlan = Object.freeze({
    eventType:'order-create-intent',
    requestKey,
    provisionalRef,
    customerName:p.customerName,
    department:p.department,
    actor:text(actor || input.actor)
  });
  const queuePlans = lines.map(line=>Object.freeze({
    eventType:'trend-master-status-intent',
    requestKey,
    provisionalRef,
    provisionalLineRef:line.provisionalLineRef,
    department:line.department,
    assignedTo:line.assignedTo,
    status:'طلب جديد'
  }));

  return Object.freeze({
    success:true,
    valid:true,
    mutationFree:true,
    productionRouteIntegrated:false,
    productionCutoverAuthorized:false,
    businessOrderIdAllocated:false,
    lineIdsAllocated:false,
    version:T12_SHADOW_INTENT_VERSION,
    intentVersion:canonical.version,
    requestKey,
    provisionalRef,
    identity:{
      mode:canonical.normalized.identityMode,
      customerName:p.customerName,
      customerPhone:p.customerPhone,
      externalCustomerId:p.externalCustomerId
    },
    order:{
      department:p.department,
      priority:p.priority,
      status:'طلب جديد',
      source:p.source,
      notes:p.notes,
      heatPress:p.heatPress,
      flyPrint:p.flyPrint
    },
    lines:Object.freeze(lines),
    activityPlan,
    queuePlans:Object.freeze(queuePlans),
    unresolvedAuthority:Object.freeze([
      'live-version-155-source-exactness',
      'business-order-id-allocation',
      'open-order-reuse-and-age-policy',
      'debt-policy-runtime-read',
      'registered-customer-runtime-lookup',
      'atomic-d1-persistence-and-read-your-write',
      'rollback-reconciliation'
    ])
  });
}
