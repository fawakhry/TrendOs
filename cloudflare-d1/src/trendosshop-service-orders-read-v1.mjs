/**
 * SERVER-33: disabled-by-default, dedicated service-principal orders read.
 * REVIEW ONLY: no production credential, schema migration or deploy.
 * Never reuse employee Edge session tokens. All D1 reads happen AFTER auth.
 */
import { mapMirrorRows } from './edge-orders-read-v1.mjs';

const PATH = '/v1/printshop/service/orders/page';
const ID = 'trendosshop_order_reader';
const SHEET = 'بنود الأوردرات';
const VALID_NOTES = new Set(['TrendOS orders live sync V1','TrendOS orders live sync V2 quota-aware']);
const DEPTS = Object.freeze({ print:'طباعة', laser:'ليزر' });
const MAX_PAGE = 20;
const MAX_RESPONSE_BYTES = 131072;

const text = value => typeof value === 'string' ? value.trim() : '';
function response(status, code, data) {
  return new Response(JSON.stringify(data || {success:false,code}),{
    status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
  });
}
export function isTrendosShopServiceOrdersPath(path) {
  return (String(path||'').replace(/\/+$/,'')||'/') === PATH;
}
function parseScope(url) {
  const allowed = new Set(['screen','page','pageSize']);
  for(const key of url.searchParams.keys()) {
    if(!allowed.has(key)||url.searchParams.getAll(key).length!==1)return null;
  }
  const screen = url.searchParams.get('screen');
  if(!Object.hasOwn(DEPTS,screen))return null;
  const page = url.searchParams.get('page') || '1';
  const pageSize = url.searchParams.get('pageSize') || '20';
  if(page !== '1'||!/^(?:[1-9]|1\d|20)$/.test(pageSize))return null;
  return {screen,pageSize:Number(pageSize),department:DEPTS[screen]};
}
async function tokenAllowed(request,env) {
  const expected = text(env.TRENDOSSHOP_READER_TOKEN_SHA256_HEX);
  if(!/^[a-f0-9]{64}$/.test(expected))return false;
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
  if(!match)return false;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(match[1])));
  const wanted = Uint8Array.from(expected.match(/../g),h=>parseInt(h,16));
  let delta = 0;
  for(let i=0;i<32;i++)delta |= digest[i]^wanted[i];
  return delta === 0;
}
function project(row,screen,department) {
  if(!row||typeof row!=='object'||text(row.department)!==department)return null;
  const orderId = text(row.orderId), lineId = text(row.lineId);
  const status = text(row.status);
  const qty = Number(row.qty);
  if(!orderId||orderId.length>96||!lineId||lineId.length>96||
     !status||status.length>80||!Number.isFinite(qty)||qty<=0||qty>1000000)return null;
  return {orderId,lineId,screen,serviceCode:screen,status,quantity:qty};
}
async function readQualifiedLines(env,scope) {
  const db = env.DB;
  if(!db||typeof db.prepare!=='function')throw new Error('DB_MISSING');
  const catalog = await db.prepare(`
    SELECT headers_json AS headersJson,source_last_row AS sourceLastRow,
      row_count AS rowCount,status,note
    FROM sheet_catalog WHERE sheet_name = ? LIMIT 1
  `).bind(SHEET).first();
  if(!catalog||text(catalog.status)!=='ready'||!VALID_NOTES.has(text(catalog.note))||
     !Number.isSafeInteger(Number(catalog.rowCount))||
     Number(catalog.rowCount)!==Number(catalog.sourceLastRow))throw new Error('MIRROR_UNREADY');

  const [mirrorRows, control, nativeRows] = await Promise.all([
    db.prepare(`SELECT row_number AS rowNumber,values_json AS valuesJson,
       display_json AS displayJson FROM sheet_rows
       WHERE sheet_name = ? ORDER BY row_number`).bind(SHEET).all(),
    db.prepare(`SELECT marker FROM t12_prod_create_control
       WHERE singleton = 1 LIMIT 1`).first(),
    db.prepare(`SELECT l.line_id AS lineId, l.order_id AS orderId,
       l.department, COALESCE(r.status,l.status) AS status, l.qty
       FROM t12_prod_lines l
       LEFT JOIN t12_prod_line_runtime r ON r.line_id = l.line_id
       WHERE l.department = ?
       ORDER BY l.created_at DESC,l.ordinal ASC`).bind(scope.department).all(),
  ]);
  if(!control||text(control.marker)!=='T12_PROD_CREATE_CANARY_V1'||!Array.isArray(mirrorRows?.results)||
     !Array.isArray(nativeRows?.results))throw new Error('SOURCE_UNREADY');
  const mirror = mirrorRows.results.map(raw=>({
    rowNumber:Number(raw.rowNumber),
    values:JSON.parse(raw.valuesJson),
    display:JSON.parse(raw.displayJson),
  }));
  // Native identity wins if a line appears in both mirror and native sources.
  const candidates=[
    ...nativeRows.results,
    ...mapMirrorRows(JSON.parse(catalog.headersJson),mirror,scope.screen)
  ];
  const seen=new Set(),out=[];
  for(const item of candidates) {
    // Every candidate is independently rechecked: never trust screen selection,
    // frontend filters, legacy loose department matching, or D1 row shape.
    if(text(item.department)!==scope.department)continue;
    const projected=project(item,scope.screen,scope.department);
    if(!projected)throw new Error('LINE_SHAPE_UNQUALIFIED');
    if(seen.has(projected.lineId))continue;
    seen.add(projected.lineId);
    out.push(projected);
  }
  return out;
}
export async function handleTrendosShopServiceOrdersRequest(request,env={}) {
  if(!isTrendosShopServiceOrdersPath(new URL(request.url).pathname))return null;
  if(request.method!=='GET')return response(405,'method-not-allowed');
  if(env.TRENDOSSHOP_SERVICE_READ_ENABLED!=='true')return response(404,'service-reader-disabled');
  if(request.headers.has('Origin'))return response(403,'browser-origin-not-allowed');
  const scope=parseScope(new URL(request.url));
  if(!scope)return response(403,'screen-or-page-not-allowed');
  // Both explicit principal registration and a non-empty credential digest are
  // required; no browser account, admin token, Edge token or fallback accepted.
  if(env.TRENDOSSHOP_READER_PRINCIPAL!==ID||
     !/^[a-f0-9]{64}$/.test(text(env.TRENDOSSHOP_READER_TOKEN_SHA256_HEX)))
    return response(503,'reader-not-provisioned');
  if(!(await tokenAllowed(request,env)))return response(401,'reader-not-authorized');
  try {
    const all = await readQualifiedLines(env,scope);
    const rows = all.slice(0,scope.pageSize);
    const body={success:true,mode:'read-only',screen:scope.screen,rows,
      pagination:{page:1,pageSize:scope.pageSize,hasMore:all.length>scope.pageSize},
      source:'qualified-mirror-plus-t12-snapshot'};
    if(new TextEncoder().encode(JSON.stringify(body)).length>MAX_RESPONSE_BYTES)
      throw new Error('RESPONSE_SIZE_EXCEEDED');
    return response(200,'ok',body);
  }catch(_error){
    // Never return D1 SQL, order or customer content in errors.
    return response(503,'reader-snapshot-unavailable');
  }
}
