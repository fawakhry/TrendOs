#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const WORKER_NAME = 'trendos-ui';
const MAIN_MODULE = 'frontend-static-worker.mjs';
const COMPATIBILITY_DATE = '2026-09-27';

function fail(message) {
  console.error('ERROR:', message);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { packageDir: process.cwd(), dryRun: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--package') {
      i += 1;
      if (!argv[i]) fail('--package requires a directory');
      out.packageDir = path.resolve(argv[i]);
    } else {
      fail('Unknown argument: ' + arg);
    }
  }
  return out;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.pdf': 'application/pdf'
  };
  return map[ext] || 'application/octet-stream';
}

function walkFiles(root, current = root, out = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) walkFiles(root, full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function createManifest(assetsDir) {
  const manifest = {};
  const byHash = new Map();
  const files = walkFiles(assetsDir);
  if (!files.length) fail('No frontend assets found: ' + assetsDir);

  for (const full of files) {
    const rel = path.relative(assetsDir, full).replace(/\\/g, '/');
    const content = fs.readFileSync(full);
    const extension = path.extname(rel).substring(1);
    const hash = crypto
      .createHash('sha256')
      .update(content.toString('base64') + extension)
      .digest('hex')
      .slice(0, 32);
    const publicPath = '/' + rel;
    manifest[publicPath] = { hash, size: content.length };
    byHash.set(hash, {
      full,
      rel,
      content,
      mime: mimeFor(rel)
    });
  }
  return { manifest, byHash };
}

function assertEntry499(packageDir) {
  const required = [
    ['frontend-dist/app.js', 'Data/read failures must never destroy the employee browser session.'],
    ['frontend-dist/trendos-edge-orders-read-v1.js', 'd1-qualified-snapshot+t12-native-overlay'],
    ['frontend-dist/press-control-v1.js', 'employee-session-unavailable'],
    [MAIN_MODULE, 'env.ASSETS.fetch(request)']
  ];
  for (const [rel, marker] of required) {
    const full = path.join(packageDir, rel);
    if (!fs.existsSync(full)) fail('Missing required Entry499 file: ' + rel);
    const text = fs.readFileSync(full, 'utf8');
    if (!text.includes(marker)) fail('Entry499 qualification marker missing in ' + rel);
  }
  const app = fs.readFileSync(path.join(packageDir, 'frontend-dist/app.js'), 'utf8');
  if (app.includes('indexOf("انتهت الجلسة") !== -1) logout();')) {
    fail('Unsafe auto-logout heuristic is still present in app.js');
  }
}

async function cfJson(url, options, label) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    fail(label + ' returned non-JSON HTTP ' + response.status);
  }
  if (!response.ok || body?.success === false) {
    const errors = Array.isArray(body?.errors) ? body.errors.map(x => x?.message || JSON.stringify(x)).join('; ') : '';
    fail(label + ' failed HTTP ' + response.status + (errors ? ': ' + errors : ''));
  }
  return body;
}

async function startUploadSession(accountId, apiToken, manifest) {
  const url = `${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${WORKER_NAME}/assets-upload-session`;
  const body = await cfJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ manifest })
  }, 'Asset manifest registration');
  const jwt = body?.result?.jwt;
  const buckets = body?.result?.buckets;
  if (!jwt || !Array.isArray(buckets)) fail('Upload session response is missing jwt/buckets');
  return { jwt, buckets };
}

async function uploadBucket(accountId, uploadJwt, hashes, byHash, index, total) {
  const form = new FormData();
  for (const hash of hashes) {
    const asset = byHash.get(hash);
    if (!asset) fail('Cloudflare requested an unknown asset hash: ' + hash);
    const base64 = asset.content.toString('base64');
    form.append(hash, new Blob([base64], { type: asset.mime }), hash);
  }
  const url = `${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/assets/upload?base64=true`;
  const body = await cfJson(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${uploadJwt}` },
    body: form
  }, `Asset upload bucket ${index}/${total}`);
  return body?.result?.jwt || null;
}

async function createVersion(accountId, apiToken, completionJwt, mainPath) {
  const metadata = {
    main_module: MAIN_MODULE,
    compatibility_date: COMPATIBILITY_DATE,
    bindings: [{ type: 'assets', name: 'ASSETS' }],
    assets: {
      jwt: completionJwt,
      config: { not_found_handling: 'single-page-application' }
    },
    annotations: {
      'workers/message': 'TrendOS Entry499 frontend manual version; create only, no deployment'
    }
  };

  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata));
  const mainContent = fs.readFileSync(mainPath);
  form.append(
    MAIN_MODULE,
    new Blob([mainContent], { type: 'application/javascript+module' }),
    MAIN_MODULE
  );

  const url = `${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${WORKER_NAME}/versions`;
  const body = await cfJson(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form
  }, 'Create Worker version');

  const versionId = body?.result?.id;
  if (!versionId) fail('Version creation succeeded but no version ID was returned');
  return versionId;
}

async function main() {
  const { packageDir, dryRun } = parseArgs(process.argv);
  const assetsDir = path.join(packageDir, 'frontend-dist');
  const mainPath = path.join(packageDir, MAIN_MODULE);

  if (!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) {
    fail('Missing frontend-dist directory in package: ' + packageDir);
  }
  if (!fs.existsSync(mainPath)) fail('Missing ' + MAIN_MODULE);

  assertEntry499(packageDir);
  const { manifest, byHash } = createManifest(assetsDir);

  console.log('ENTRY499_PACKAGE=QUALIFIED');
  console.log('TARGET_WORKER=' + WORKER_NAME);
  console.log('ASSET_COUNT=' + Object.keys(manifest).length);
  console.log('DEPLOYMENT_ACTION=NONE');

  if (dryRun) {
    console.log('DRY_RUN=PASS');
    return;
  }

  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (!accountId) fail('CLOUDFLARE_ACCOUNT_ID is not set');
  if (!apiToken) fail('CLOUDFLARE_API_TOKEN is not set');

  console.log('Starting Cloudflare asset upload session...');
  const session = await startUploadSession(accountId, apiToken, manifest);
  console.log('UPLOAD_BUCKETS=' + session.buckets.length);

  let completionJwt = session.jwt;
  if (session.buckets.length) {
    completionJwt = null;
    for (let i = 0; i < session.buckets.length; i += 1) {
      const maybeCompletion = await uploadBucket(
        accountId,
        session.jwt,
        session.buckets[i],
        byHash,
        i + 1,
        session.buckets.length
      );
      if (maybeCompletion) completionJwt = maybeCompletion;
    }
    if (!completionJwt) fail('All asset buckets uploaded but no completion JWT was returned');
  }

  console.log('Assets uploaded. Creating a NEW VERSION only...');
  const versionId = await createVersion(accountId, apiToken, completionJwt, mainPath);

  console.log('');
  console.log('ENTRY499_VERSION_CREATED=YES');
  console.log('VERSION_ID=' + versionId);
  console.log('TRAFFIC_CHANGED=NO');
  console.log('DEPLOYMENT_CREATED=NO');
  console.log('PROMOTE_REQUIRED_MANUALLY=YES');
  console.log('');
  console.log('Open Cloudflare > trendos-ui > Deployments and promote this version manually to 100% only after you confirm the Version ID.');
}

main().catch((error) => {
  console.error('ERROR:', error?.stack || error?.message || String(error));
  process.exit(1);
});
