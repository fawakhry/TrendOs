import { buildDashboardFromRows, buildOrdersSummary, verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import { inspectOrdersIdleHeartbeat, ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS } from './edge-orders-idle-heartbeat.mjs';
import { fetchOrdersIdleHeartbeat, ordersIdleHeartbeatVerifierEnabled } from './edge-orders-idle-verifier.mjs';

const PATH = '/v1/edge/orders/service/page';
const ORDERS_SHEET = 'الأوردرات';
const LINES_SHEET = 'بنود الأوردرات';
const ORDERS_LIVE_NOTES = new Set(['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware']);
const OWNER_APPROVED_EXCLUSION_HASHES = new Set([
  '1245e0f4e67e6ddd8f372de7f68600380ab1438f27f47ba45752b0ffa423e392',
  '31ea43f205c124649678207a42b1f8cc1081aeefe5eae1b771d378d39ec2399a',
  '65711b0c91f290b46814d789a283a0d87ba0b5539ce6cc6acd1d0e3d7b3d57de',
  '8c86a34f5ae4709588fb7dff504925527414e1732af291d52575a87d85d097be',
  'af09e068b9ba95b8424e9d0ca74af1ed38ea41fbdbd044085edfb86937e4085c',
  'ba3c81028254460bb6f4cc63636f3da88f42b0bcfcf140c05fbfb063de90093f',
  'c6d8a6e65e96b479efd7485483ffa312ac95ab55f1e689ba6f2f44eab212d254',
  'cf3ff1a00fa1836509df654dd27e81bd2e64b6ee293b26a7b96817388e44a711',
  'd516e83af2a27b96ea0ac8447d094fca22d7f20a5385637bbbe25315432cc44f'
]);
const BASE_HIDDEN_STATUSES = new Set(['تم التسليم', 'مكرر', 'ملغى', 'ملغي']);
const ACTIVE_HIDDEN_STATUSES = new Set(['جاهز للاستلام', 'تم التسليم', 'مكرر', 'تم التنفيذ', 'جاهز للطباعة', 'ملغى', 'ملغي']);
const DEFAULT_MAX_AGE_SECONDS = 300;

function text(v) { return String(v == null ? '' : v).trim(); }
function clampInt(v, fallback, min, max) { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback; }
function configuredOrigins(env) { const list = String((env && env.CORS_ORIGINS) || '').split(',').map(x => x.trim()).filter(Boolean); return list.length ? list : ['https://fawakhry.github.io']; }
function corsHeaders(request, env) { const origin = text(request.headers.get('Origin')); const allowed = configuredOrigins(env); return {'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0], 'access-control-allow-methods':'GET,OPTIONS', 'access-control-allow-headers':'content-type,authorization', 'access-control-max-age':'86400', vary:'Origin'}; }
function json(data, status, headers) { return new Response(JSON.stringify(data), {status:status || 200, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...(headers || {})}}); }
function bearer(request) { const m = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i); return m ? text(m[1]) : ''; }
function normalizeArabic(value) { return text(value).toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim(); }
function searchKey(value) { return normalizeArabic(value).replace(/[^0-9a-z\u0600-\u06ff ]/g,' ').replace(/\s+/g,' ').trim(); }
function priorityRank(p) { const v=text(p)||'عادي'; if(v==='عاجل'||v==='VIP') return 0; if(v==='عادي') return 1; if(v==='مؤجل') return 2; return 9; }
function parseSqliteUtc(value) { const raw=text(value); if(!raw) return 0; const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)?raw.replace(' ','T')+'Z':raw; const ms=Date.parse(normalized); return Number.isFinite(ms)?ms:0; }
function maxAgeSeconds(env) { const n=Number(env && env.EDGE_ORDERS_02CR_MAX_AGE_SECONDS); return Number.isFinite(n)?Math.max(300,Math.min(900,Math.trunc(n))):DEFAULT_MAX_AGE_SECONDS; }
function heartbeatMaxAgeSeconds(env) { const n=Number(env && env.EDGE_ORDERS_IDLE_HEARTBEAT_MAX_AGE_SECONDS); return Number.isFinite(n)?Math.max(300,Math.min(1800,Math.trunc(n))):ORDERS_IDLE_HEARTBEAT_DEFAULT_MAX_AGE_SECONDS; }

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function readCatalog(env, sheetName) {
  return env.DB.prepare(`
    SELECT source_last_row AS sourceLastRow, source_last_col AS sourceLastCol,
           row_count AS rowCount, status, synced_at AS syncedAt, note
      FROM sheet_catalog WHERE sheet_name = ? LIMIT 1
  `).bind(sheetName).first();
}

async function readOrdersMirror(env) {
  const catalog = await env.DB.prepare(`
    SELECT headers_json AS headersJson, source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol, row_count AS rowCount,
           status, synced_at AS syncedAt, note
      FROM sheet_catalog WHERE sheet_name = ? LIMIT 1
  `).bind(ORDERS_SHEET).first();
  if (!catalog) throw new Error('Service Orders mirror is missing.');
  const query = await env.DB.prepare(`
    SELECT row_number AS rowNumber, values_json AS valuesJson, display_json AS displayJson
      FROM sheet_rows WHERE sheet_name = ? ORDER BY row_number
  `).bind(ORDERS_SHEET).all();
  return {
    catalog,
    headers: JSON.parse(catalog.headersJson || '[]'),
    rows: (query.results || []).map(r => ({rowNumber:Number(r.rowNumber || 0), values:JSON.parse(r.valuesJson || '[]'), display:JSON.parse(r.displayJson || '[]')}))
  };
}

async function verifyServiceFreshness(env, ordersCatalog, nowMs=Date.now()) {
  const syncedMs=parseSqliteUtc(ordersCatalog && ordersCatalog.syncedAt);
  const ageSeconds=syncedMs?Math.max(0,Math.round((nowMs-syncedMs)/1000)):Number.MAX_SAFE_INTEGER;
  if(ageSeconds<=maxAgeSeconds(env)) return {ok:true,mode:'write-age-fresh',ageSeconds};
  if(!ordersIdleHeartbeatVerifierEnabled(env)) return {ok:false,mode:'idle-verifier-disabled',ageSeconds};
  const linesCatalog=await readCatalog(env,LINES_SHEET);
  if(!linesCatalog) return {ok:false,mode:'lines-shape-missing',ageSeconds};
  let heartbeat;
  try {
    const status=await fetchOrdersIdleHeartbeat(env);
    heartbeat=inspectOrdersIdleHeartbeat(status,{
      nowMs,
      maxAgeSeconds:heartbeatMaxAgeSeconds(env),
      expectedOrdersSourceLastRow:Number(ordersCatalog.sourceLastRow||0),
      expectedOrdersSourceLastCol:Number(ordersCatalog.sourceLastCol||0),
      expectedLinesSourceLastRow:Number(linesCatalog.sourceLastRow||0),
      expectedLinesSourceLastCol:Number(linesCatalog.sourceLastCol||0)
    });
  } catch (err) {
    return {ok:false,mode:'idle-heartbeat-error',ageSeconds};
  }
  return heartbeat && heartbeat.ok===true
    ? {ok:true,mode:'verified-idle-source-unchanged',ageSeconds,checkedAt:heartbeat.checkedAt}
    : {ok:false,mode:'idle-heartbeat-invalid',ageSeconds,failedChecks:heartbeat && heartbeat.failedChecks || []};
}

function headerIndex(headers) {
  const map = new Map();
  (headers || []).forEach((h,i) => { const k=text(h); if(k && !map.has(k)) map.set(k,i); });
  const get = (names, fallback=-1) => { for (const n of names) if (map.has(n)) return map.get(n); return fallback; };
  return {
    orderId:get(['رقم الأوردر'],0), orderCode:get(['كود الأوردر'],1), createdAt:get(['تاريخ الإنشاء'],2),
    customer:get(['اسم الشات / المكتب'],3), assignedName:get(['اسم المسؤول'],4), customerPhone:get(['رقم العميل'],5),
    externalPhone:get(['رقم عميل خارجي'],6), customerType:get(['نوع العميل'],7), department:get(['القسم الرئيسي'],8),
    itemName:get(['وصف مختصر'],9), priority:get(['الأولوية'],10), status:get(['الحالة العامة'],11), updatedAt:get(['آخر تحديث'],12),
    qty:get(['عدد البنود'],13), ready:get(['بنود جاهزة'],14), notReady:get(['بنود غير جاهزة'],15), partial:get(['تسليم جزئي؟'],16),
    executor:get(['الكيان المنفذ الرئيسي'],17), notes:get(['ملاحظات'],18), debtAmount:get(['مديونية العميل'],-1), expected:get(['الوقت المتوقع'],-1)
  };
}

function at(d, i) { return i >= 0 && i < d.length ? d[i] : ''; }
function mapOrderRow(row, cols) {
  const d = Array.isArray(row.display) && row.display.length ? row.display : (row.values || []);
  const orderId = text(at(d, cols.orderId)) || text(at(d, cols.orderCode));
  const phone = text(at(d, cols.customerPhone));
  const qty = text(at(d, cols.qty)) || '1';
  return {
    rowNumber:Number(row.rowNumber || 0), orderId, orderCode:text(at(d, cols.orderCode)) || orderId,
    lineId:phone, customerPhone:phone, customer:text(at(d, cols.customer)), department:text(at(d, cols.department)),
    itemName:text(at(d, cols.itemName)), qty, assignedTo:text(at(d, cols.department)),
    priority:text(at(d, cols.priority)) || 'عادي', status:text(at(d, cols.status)) || 'طلب جديد', ready:text(at(d, cols.ready)),
    notes:text(at(d, cols.notes)), receivedAt:text(at(d, cols.createdAt)), updatedAt:text(at(d, cols.updatedAt)),
    expectedDeliveryAt:text(at(d, cols.expected)), expectedDeliveryText:text(at(d, cols.expected)),
    debtAmount:text(at(d, cols.debtAmount)), debtHold:'', debtNotes:'', heatPress:'', flyPrint:'', quickPrint:''
  };
}

async function ownerExcluded(row) {
  if (text(row.status) !== 'طلب جديد') return false;
  const id = text(row.orderId || row.orderCode);
  if (!id) return false;
  return OWNER_APPROVED_EXCLUSION_HASHES.has(await sha256Hex(id));
}

function matches(row, params) {
  const status = text(params.statusFilter || params.status || '');
  const priority = text(params.priorityFilter || params.priority || '');
  const q = searchKey(params.query || params.q || '');
  if (q) {
    const blob=searchKey([row.orderId,row.orderCode,row.customer,row.customerPhone,row.department,row.itemName,row.notes].join(' '));
    if (!blob.includes(q)) return false;
  }
  if (status === '__ACTIVE__' && ACTIVE_HIDDEN_STATUSES.has(text(row.status))) return false;
  if (status && !status.startsWith('__') && text(row.status) !== status) return false;
  if (priority === '__ACTIVE__' && !['عاجل','عادي','VIP',''].includes(text(row.priority))) return false;
  if (priority && priority !== '__ACTIVE__' && text(row.priority) !== priority) return false;
  return true;
}

function statusCounts(rows) { const out={}; for(const r of rows || []) { const s=text(r.status)||'طلب جديد'; out[s]=Number(out[s]||0)+1; } return out; }
function sortRows(rows) { return (rows || []).map((r,i)=>({r,i})).sort((a,b)=>priorityRank(a.r.priority)-priorityRank(b.r.priority)||a.i-b.i).map(x=>x.r); }
function mirrorMeta(m) { const c=m.catalog || {}; return {sheetName:ORDERS_SHEET, sourceLastRow:Number(c.sourceLastRow||0), sourceLastCol:Number(c.sourceLastCol||0), rowCount:Number(c.rowCount||0), status:text(c.status), syncedAt:text(c.syncedAt), note:text(c.note)}; }
function mirrorQualified(m) { const c=m.catalog || {}; return text(c.status)==='ready' && Number(c.rowCount||0)===Number(c.sourceLastRow||0) && ORDERS_LIVE_NOTES.has(text(c.note)); }

export function isEdgeOrdersServicePath(path) { return (String(path || '').replace(/\/+$/,'') || '/') === PATH; }

export async function handleEdgeOrdersServiceRequest(request, env) {
  const url=new URL(request.url); const path=url.pathname.replace(/\/+$/,'') || '/';
  if (request.method==='OPTIONS' && path===PATH) return new Response(null,{status:204,headers:corsHeaders(request,env)});
  if (request.method!=='GET' || path!==PATH) return null;
  const verified=await verifyOrdersEdgeToken(bearer(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) return json({success:false,code:verified.reason,message:'Unauthorized orders edge session'},401,corsHeaders(request,env));
  const screen=text(url.searchParams.get('screen')||'service');
  if (screen!=='service') return json({success:false,code:'service-route-only',fallback:'apps-script'},409,corsHeaders(request,env));
  const allowed=Array.isArray(verified.payload.screens)?verified.payload.screens:[];
  if (allowed.length && !allowed.includes('service')) return json({success:false,message:'غير مصرح لك بعرض أوردرات خدمة العملاء.'},403,corsHeaders(request,env));
  const params=Object.fromEntries(url.searchParams.entries());
  if (text(params.statusFilter)==='__DEBT__') return json({success:false,code:'apps-script-required',fallback:'apps-script'},409,corsHeaders(request,env));
  try {
    const mirror=await readOrdersMirror(env);
    if (!mirrorQualified(mirror)) return json({success:false,code:'service-orders-mirror-not-qualified',fallback:'apps-script',mirrors:[mirrorMeta(mirror)]},503,corsHeaders(request,env));
    const freshness=await verifyServiceFreshness(env,mirror.catalog,Date.now());
    if(!freshness.ok) return json({success:false,code:'service-orders-mirror-stale',fallback:'apps-script',freshness,mirrors:[mirrorMeta(mirror)]},503,corsHeaders(request,env));
    const cols=headerIndex(mirror.headers);
    const mapped=mirror.rows.filter(r=>Number(r.rowNumber||0)>1).map(r=>mapOrderRow(r,cols));
    const base=[];
    for (const row of mapped) {
      if (!text(row.orderId)) continue;
      if (BASE_HIDDEN_STATUSES.has(text(row.status))) continue;
      if (await ownerExcluded(row)) continue;
      base.push(row);
    }
    const ordered=sortRows(base);
    const filtered=ordered.filter(r=>matches(r,params));
    const activeRows=ordered.filter(r=>matches(r,{statusFilter:'__ACTIVE__'}));
    const pageSize=clampInt(params.pageSize,20,5,100); const requested=clampInt(params.page,1,1,1000000);
    const totalRows=filtered.length; const totalPages=Math.max(1,Math.ceil(totalRows/pageSize)); const page=Math.min(requested,totalPages); const start=(page-1)*pageSize;
    return json({
      success:true, rows:filtered.slice(start,start+pageSize), dashboard:buildDashboardFromRows(ordered,'service'),
      activeSummaryCounts:buildOrdersSummary(activeRows), pagination:{page,pageSize,totalRows,totalPages,hasOlder:page<totalPages},
      statusCounts:statusCounts(ordered), serverPaged:true, dataVersion:text(mirror.catalog.syncedAt)||'d1',
      version:'D1_SERVICE_READ_V1_OWNER_EXCLUSIONS', dataSource:'d1-edge-orders-service-v1', edgeSession:verified.payload.sub,
      exclusionMode:'owner-approved-sha256', exclusionCount:OWNER_APPROVED_EXCLUSION_HASHES.size, freshness, mirrors:[mirrorMeta(mirror)]
    },200,corsHeaders(request,env));
  } catch (err) {
    return json({success:false,code:'service-d1-candidate-error',fallback:'apps-script',message:String(err&&err.message?err.message:err)},502,corsHeaders(request,env));
  }
}
