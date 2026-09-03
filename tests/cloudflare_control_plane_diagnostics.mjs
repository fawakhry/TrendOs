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
const settings = await cf(settingsPath);

if (!settings.response.ok || !settings.payload || settings.payload.success !== true) {
  console.log('CONTROL_PLANE_DIAGNOSTIC=' + JSON.stringify({
    workerName,
    accessible: false,
    httpStatus: settings.response.status,
    message: Array.isArray(settings.payload?.errors)
      ? settings.payload.errors.map((x) => String(x?.message || '')).filter(Boolean).join('; ')
      : 'Worker settings endpoint unavailable'
  }));
  process.exit(0);
}

const rawBindings = Array.isArray(settings.payload?.result?.bindings) ? settings.payload.result.bindings : [];
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

// Deployment metadata is read-only and does not contain secret values. Recording
// its timeline helps distinguish an Apps Script-side freeze from a Worker redeploy.
const deployments = await cf(`/workers/scripts/${encodeURIComponent(workerName)}/deployments`);
if (!deployments.response.ok || !deployments.payload || deployments.payload.success !== true) {
  console.log('PRODUCTION_WORKER_DEPLOYMENTS=' + JSON.stringify({
    accessible: false,
    httpStatus: deployments.response.status,
    message: Array.isArray(deployments.payload?.errors)
      ? deployments.payload.errors.map((x) => String(x?.message || '')).filter(Boolean).join('; ')
      : 'Worker deployments endpoint unavailable'
  }));
} else {
  const list = Array.isArray(deployments.payload?.result) ? deployments.payload.result : [];
  const sanitized = list.slice(0, 20).map((deployment) => ({
    id: String(deployment?.id || ''),
    createdOn: String(deployment?.created_on || deployment?.createdOn || ''),
    source: String(deployment?.source || ''),
    strategy: String(deployment?.strategy || ''),
    versions: Array.isArray(deployment?.versions)
      ? deployment.versions.map((v) => ({ versionId: String(v?.version_id || v?.versionId || ''), percentage: Number(v?.percentage || 0) }))
      : []
  }));
  console.log('PRODUCTION_WORKER_DEPLOYMENTS=' + JSON.stringify({
    accessible: true,
    count: list.length,
    deployments: sanitized
  }));
}
