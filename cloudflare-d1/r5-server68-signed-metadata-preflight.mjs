/**
 * SERVER-68 / R5 — review-only replacement for the legacy unauthenticated
 * GET /v1/mirror/sheets post-deployment assertion.
 *
 * It does not run, fetch, change R5 workflows, or deploy anything on import.
 * Intentionally requires a caller-supplied fetch implementation AND a pinned
 * expected hostname. Never use it with real Cloudflare until approved.
 */
import {createHmac, randomBytes} from 'node:crypto';

const METADATA_PRINCIPAL = 'trendos_mirror_metadata';
const SIGNED_PATH = '/v1/service/mirror/sheets';

function fail(reason) { throw new Error('SERVER68_R5_' + reason); }

/** Build an HMAC-signed GET request. No network or credential access. */
export function makeR5SignedMetadataRequest({
  baseUrl, expectedHostname, secret, timestamp, nonce
} = {}) {
  if (typeof baseUrl !== 'string' || typeof expectedHostname !== 'string' ||
      !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(expectedHostname) ||
      expectedHostname.includes('..') || !/\.[a-z]{2,63}$/i.test(expectedHostname)) {
    fail('TARGET_NOT_PINNED');
  }
  // SERVER-72: check the RAW URL before URL() normalizes explicit default ports,
  // backslashes, encoded hostname characters or dot segments. No signed
  // metadata credential should go to a non-canonical destination.
  const rawTarget = /^https:\/\/([a-z0-9][a-z0-9.-]*[a-z0-9])\/?$/i.exec(baseUrl);
  if (!rawTarget || rawTarget[1].toLowerCase() !== expectedHostname.toLowerCase()) {
    fail('TARGET_NOT_APPROVED');
  }
  let base;
  try { base = new URL(baseUrl); } catch { fail('TARGET_INVALID'); }
  if (base.protocol !== 'https:' ||
      base.hostname.toLowerCase() !== expectedHostname.toLowerCase() ||
      base.username || base.password || base.port || base.pathname !== '/' ||
      base.search || base.hash) fail('TARGET_NOT_APPROVED');

  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 256) {
    fail('METADATA_CREDENTIAL_MISSING');
  }
  const stamp = timestamp === undefined ? String(Math.floor(Date.now() / 1000)) : String(timestamp);
  if (!/^[1-9]\d{9,11}$/.test(stamp)) fail('TIMESTAMP_INVALID');
  const token = nonce === undefined ? randomBytes(24).toString('base64url') : String(nonce);
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(token)) fail('NONCE_INVALID');

  const url = new URL(SIGNED_PATH, base);
  const message = ['GET',url.pathname,url.search,stamp,token,METADATA_PRINCIPAL].join('\n');
  const signature = createHmac('sha256',secret).update(message,'utf8').digest('hex');
  return Object.freeze({
    url: url.toString(),
    init: Object.freeze({
      method: 'GET',
      redirect: 'error',
      headers: Object.freeze({
        'x-trendos-read-principal': METADATA_PRINCIPAL,
        'x-trendos-read-timestamp': stamp,
        'x-trendos-read-nonce': token,
        'x-trendos-read-signature': signature,
        accept: 'application/json',
      }),
    }),
  });
}

/**
 * Only a synthetic/injected fetch adapter can run this helper.
 * Return a minimal verdict, not customer/sheet metadata or credentials.
 * No automatic fallback to unsafe legacy GET on HTTP errors.
 */
export async function qualifyR5SignedMirrorMetadata(options = {}) {
  if (typeof options.fetchImpl !== 'function') fail('FETCH_ADAPTER_REQUIRED');
  const {url, init} = makeR5SignedMetadataRequest(options);
  let result;
  try { result = await options.fetchImpl(url, init); }
  catch { fail('NETWORK_OR_REDIRECT_FAILED'); }
  if (!result || result.status !== 200 || result.redirected === true) {
    fail('SIGNED_READ_UNAVAILABLE');
  }
  let body;
  try { body = await result.json(); }
  catch { fail('RESPONSE_INVALID'); }
  if (!body || body.success !== true || !Array.isArray(body.sheets) ||
      body.sheets.some(row => !row || typeof row.sheetName !== 'string')) {
    fail('RESPONSE_CONTRACT_INVALID');
  }
  return Object.freeze({passed:true, kind:'metadata-only', sheetCount:body.sheets.length});
}
