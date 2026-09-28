import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import {
  filterT12OverlayRows,
  readT12CloudNativeOverlay
} from './t12-read-overlay.mjs';

const PATH = '/v1/t12/orders/read-overlay';

function text(value) { return String(value == null ? '' : value).trim(); }

function configuredOrigins(env) {
  const list = String((env && env.CORS_ORIGINS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.length ? list : ['https://fawakhry.github.io'];
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      ...corsHeaders(request, env)
    }
  });
}

function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

export function isT12ReadOverlayPath(path) {
  return (String(path || '').replace(/\/+$/, '') || '/') === PATH;
}

export async function handleT12ReadOverlayRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!isT12ReadOverlayPath(path)) return null;
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:corsHeaders(request, env) });
  if (request.method !== 'GET') return json({ success:false, code:'method-not-allowed' }, 405, request, env);

  const verified = await verifyOrdersEdgeToken(bearer(request), text(env && env.EDGE_SESSION_SECRET));
  if (!verified.ok) {
    return json({ success:false, code:verified.reason, message:'Unauthorized T12 read overlay session' }, 401, request, env);
  }

  const screen = text(url.searchParams.get('screen') || 'service');
  const allowed = Array.isArray(verified.payload && verified.payload.screens)
    ? verified.payload.screens.map(text)
    : [];
  if (allowed.length && !allowed.includes(screen)) {
    return json({ success:false, code:'screen-forbidden', message:'غير مصرح لك بعرض أوردرات هذا القسم.' }, 403, request, env);
  }

  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const overlay = await readT12CloudNativeOverlay(env, screen);
    const rows = filterT12OverlayRows(overlay.rows, params);
    return json({
      success:true,
      rows,
      control:overlay.control,
      version:'T12_READ_OVERLAY_V1',
      dataSource:'t12-prod-native',
      readOnly:true,
      edgeSession:verified.payload.sub
    }, 200, request, env);
  } catch (err) {
    return json({
      success:false,
      code:'t12-read-overlay-error',
      message:String(err && err.message ? err.message : err)
    }, 502, request, env);
  }
}
