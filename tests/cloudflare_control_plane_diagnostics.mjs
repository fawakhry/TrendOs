const token = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const workerName = String(process.env.PRODUCTION_WORKER_NAME || 'trendos-d1-api').trim();

if (!token || !accountId) {
  console.error('CONTROL_PLANE_DIAGNOSTIC=SKIP missing Cloudflare credentials in CI environment');
  process.exit(0);
}

async function cf(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch {}
  return { response, payload };
}

const settingsPath = `/workers/scripts/${encodeURIComponent(workerName)}/settings`;
const { response, payload } = await cf(settingsPath);

if (!response.ok || !payload || payload.success !== true) {
  console.log('CONTROL_PLANE_DIAGNOSTIC=' + JSON.stringify({
    workerName,
    accessible: false,
    httpStatus: response.status,
    message: Array.isArray(payload?.errors)
      ? payload.errors.map((x) => String(x?.message || '')).filter(Boolean).join('; ')
      : 'Worker settings endpoint unavailable'
  }));
  process.exit(0);
}

const rawBindings = Array.isArray(payload?.result?.bindings) ? payload.result.bindings : [];
const bindings = rawBindings.map((binding) => ({
  name: String(binding?.name || ''),
  type: String(binding?.type || '')
})).filter((binding) => binding.name);

const names = new Set(bindings.map((binding) => binding.name));
const result = {
  workerName,
  accessible: true,
  bindingCount: bindings.length,
  bindings,
  hasDbBinding: names.has('DB'),
  hasMigrationSecretBinding: names.has('MIGRATION_SECRET'),
  hasCorsOriginsBinding: names.has('CORS_ORIGINS')
};

// Deliberately output names/types only. Never output binding text/secret values.
console.log('CONTROL_PLANE_DIAGNOSTIC=' + JSON.stringify(result));
