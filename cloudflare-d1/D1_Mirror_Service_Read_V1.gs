/* SERVER-67 — opt-in Apps Script client for purpose-scoped backend mirror reads.
 * SOURCE-ONLY. Do NOT install/enable against production without approved secret
 * provisioning, per-route rollback and atomic nonce replay protection.
 * No secret values or live customer data are logged here.
 */
function d1MirrorServiceReadEnabledV1_() {
  return String(PropertiesService.getScriptProperties()
    .getProperty('D1_MIRROR_SERVICE_READ_V1_ENABLED') || '') === 'true';
}
function d1MirrorServiceReadV1_(legacyPath) {
  if (!d1MirrorServiceReadEnabledV1_()) throw new Error('SERVER67_SECURE_MIRROR_CLIENT_OFF');
  var props = PropertiesService.getScriptProperties();
  // SERVER-71: secure opt-in sends an HMAC signature only to an independently
  // pinned HTTPS host. Never treat arbitrary Script Property URLs as approved.
  // Existing legacy reads and scripts remain unchanged while opt-in is OFF.
  var apiUrl = String(props.getProperty('D1_API_URL') || '').trim().replace(/\/+$/, '');
  var expectedHost = String(props.getProperty('D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME') || '').trim().toLowerCase();
  if (!expectedHost || !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(expectedHost) ||
      expectedHost.indexOf('..') !== -1 || !/\.[a-z]{2,63}$/.test(expectedHost)) {
    throw new Error('SERVER71_SIGNED_TARGET_NOT_PINNED');
  }
  var urlMatch = /^https:\/\/([a-z0-9][a-z0-9.-]*[a-z0-9])$/i.exec(apiUrl);
  if (!urlMatch || urlMatch[1].toLowerCase() !== expectedHost ||
      urlMatch[1].indexOf('..') !== -1) {
    throw new Error('SERVER71_SIGNED_TARGET_NOT_APPROVED');
  }
  var match = /^\/v1\/mirror\/(stats|sheets|capabilities|sheet)(\?.*)?$/.exec(String(legacyPath || ''));
  if (!match) throw new Error('SERVER67_ROUTE_NOT_ALLOWED');
  var kind = match[1], query = match[2] || '';
  var isRows = kind === 'sheet';
  var principal = isRows ? 'trendos_mirror_parity' : 'trendos_mirror_metadata';
  var secretProperty = isRows
    ? 'D1_MIRROR_PARITY_HMAC_SECRET'
    : 'D1_MIRROR_METADATA_HMAC_SECRET';
  var secret = String(props.getProperty(secretProperty) || '');
  if (secret.length < 32 || secret.length > 256) throw new Error('SERVER67_SERVICE_SECRET_MISSING');
  var path = '/v1/service/mirror/' + kind;
  var seconds = String(Math.floor(Date.now() / 1000));
  var nonce = Utilities.getUuid().replace(/-/g, '');
  var canonical = ['GET', path, query, seconds, nonce, principal].join('\n');
  var bytes = Utilities.computeHmacSha256Signature(canonical, secret);
  var signature = bytes.map(function (n) {
    return ('0' + ((n & 255).toString(16))).slice(-2);
  }).join('');
  var response = UrlFetchApp.fetch(apiUrl + path + query, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: false,
    headers: {
      'x-trendos-read-principal': principal,
      'x-trendos-read-timestamp': seconds,
      'x-trendos-read-nonce': nonce,
      'x-trendos-read-signature': signature
    }
  });
  var status = response.getResponseCode();
  var body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); }
  catch (err) { throw new Error('SERVER67_NON_JSON_RESPONSE_' + status); }
  if (status !== 200 || body.success !== true) {
    throw new Error('SERVER67_MIRROR_SERVICE_HTTP_' + status);
  }
  return body;
}
