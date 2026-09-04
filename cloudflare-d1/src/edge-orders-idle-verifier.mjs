const HEARTBEAT_ACTION = 'getD1OrdersLowUsageHeartbeatV1';
const DEFAULT_TIMEOUT_MS = 5000;

function text(value) {
  return String(value == null ? '' : value).trim();
}

export function ordersIdleHeartbeatVerifierEnabled(env) {
  return ['1', 'true', 'on', 'yes'].includes(text(env && env.EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED).toLowerCase());
}

export function ordersIdleHeartbeatUrl(env) {
  const base = text(env && env.APPS_SCRIPT_API_URL);
  if (!/^https:\/\//i.test(base)) return '';
  const url = new URL(base);
  url.searchParams.set('action', HEARTBEAT_ACTION);
  return url.toString();
}

export async function fetchOrdersIdleHeartbeat(env, options = {}) {
  if (!ordersIdleHeartbeatVerifierEnabled(env)) {
    throw new Error('Orders idle heartbeat verifier is disabled.');
  }

  const url = ordersIdleHeartbeatUrl(env);
  if (!url) throw new Error('Apps Script heartbeat URL is not configured.');

  const fetchImpl = typeof options.fetchImpl === 'function' ? options.fetchImpl : fetch;
  const timeoutMsRaw = Number(options.timeoutMs);
  const timeoutMs = Number.isFinite(timeoutMsRaw)
    ? Math.max(1000, Math.min(10000, Math.trunc(timeoutMsRaw)))
    : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response || !response.ok) {
      throw new Error(`Apps Script heartbeat HTTP ${response ? response.status : 'unavailable'}`);
    }
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Apps Script heartbeat payload is invalid.');
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export const ORDERS_IDLE_HEARTBEAT_ACTION = HEARTBEAT_ACTION;
