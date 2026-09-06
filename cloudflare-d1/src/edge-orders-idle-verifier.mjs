const HEARTBEAT_ACTION = 'getD1OrdersLowUsageHeartbeatV1';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_CACHE_TTL_MS = 30000;

let heartbeatCache = { key: '', payload: null, expiresAt: 0 };
let heartbeatInflight = { key: '', promise: null };

function text(value) {
  return String(value == null ? '' : value).trim();
}

function cacheTtlMs(env, options) {
  const candidate = Number(options && options.cacheTtlMs != null
    ? options.cacheTtlMs
    : env && env.EDGE_ORDERS_IDLE_HEARTBEAT_CACHE_TTL_MS);
  return Number.isFinite(candidate)
    ? Math.max(5000, Math.min(60000, Math.trunc(candidate)))
    : DEFAULT_CACHE_TTL_MS;
}

function shouldCache(options) {
  if (options && options.cache === false) return false;
  // Custom fetch implementations are test/probe surfaces and remain uncached
  // unless the caller explicitly opts into cache/coalescing behavior.
  if (options && typeof options.fetchImpl === 'function') return options.cache === true;
  return true;
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

async function fetchHeartbeatPayload(url, fetchImpl, timeoutMs) {
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
  const useCache = shouldCache(options);
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const key = url;

  if (useCache && heartbeatCache.key === key && heartbeatCache.payload && heartbeatCache.expiresAt > nowMs) {
    return heartbeatCache.payload;
  }
  if (useCache && heartbeatInflight.key === key && heartbeatInflight.promise) {
    return heartbeatInflight.promise;
  }

  const task = fetchHeartbeatPayload(url, fetchImpl, timeoutMs).then((payload) => {
    if (useCache) {
      heartbeatCache = {
        key,
        payload,
        expiresAt: Date.now() + cacheTtlMs(env, options)
      };
    }
    return payload;
  });

  if (useCache) heartbeatInflight = { key, promise: task };
  try {
    return await task;
  } finally {
    if (useCache && heartbeatInflight.promise === task) heartbeatInflight = { key: '', promise: null };
  }
}

export function resetOrdersIdleHeartbeatCacheForTests() {
  heartbeatCache = { key: '', payload: null, expiresAt: 0 };
  heartbeatInflight = { key: '', promise: null };
}

export const ORDERS_IDLE_HEARTBEAT_ACTION = HEARTBEAT_ACTION;
export const ORDERS_IDLE_HEARTBEAT_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;
