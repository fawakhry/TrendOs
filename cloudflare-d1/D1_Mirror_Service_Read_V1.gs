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
  var apiUrl = String(props.getProperty('D1_API_URL') || '').replace(/\/+$/, '');
  if (!apiUrl || !/^https:\/\//.test(apiUrl)) throw new Error('SERVER67_D1_API_URL_NOT_SET');
  var match = /^\/v1\/mirror\/(stats|sheets|capabilities|sheet)(\?.*)?$/.exec(String(legacyPath || ''));
  if (!match) throw new Error('SERVER67_ROUTE_NOT_ALLOWED');
  var kind = match[1], query = match[2] || '';
  var isRows = kind === 'sheet';
  var principal = isRows ? 'trendos_mirror_parity' : 'trendos_mirror_metadata';
  var secretProperty = isRows
    ? 'D1_MIRROR_PARITY_HMAC_SECRET'
    : 'D1_MIRROR_METADATA_HMAC_SECRET';
  var secret = String(props.getProperty(secretProperty) || '');
  if (secret.length < 32) throw new Error('SERVER67_SERVICE_SECRET_MISSING');
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
