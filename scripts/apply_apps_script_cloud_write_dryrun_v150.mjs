import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const targetPath = path.join(root, 'Code.gs');
const helperPath = path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs');

const routeAction = 'cloudWriteReconcileDryRunV1';
const routeLine = `    else if (action === "${routeAction}") result = trendosCloudWriteReconcileDryRunV1_(e);`;
const routeAnchor = '    else if (action === "health") result = healthCheck_();';
const helperFunction = 'function trendosCloudWriteReconcileDryRunV1_(e) {';
const marker = '/*********************** PERF-CF-02AO / APPS SCRIPT V150 DRY-RUN ONLY ***********************/';

function count(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

let code = fs.readFileSync(targetPath, 'utf8');
const helper = fs.readFileSync(helperPath, 'utf8').trimEnd();

const routeCount = count(code, routeLine);
if (routeCount > 1) throw new Error(`Refusing duplicate ${routeAction} route: ${routeCount}`);
if (routeCount === 0) {
  const anchorCount = count(code, routeAnchor);
  if (anchorCount !== 1) throw new Error(`Expected exactly one health route anchor, found ${anchorCount}`);
  code = code.replace(routeAnchor, `${routeAnchor}\n${routeLine}`);
}

const helperCount = count(code, helperFunction);
if (helperCount > 1) throw new Error(`Refusing duplicate dry-run helper: ${helperCount}`);
if (helperCount === 0) {
  if (code.includes(marker)) throw new Error('V150 marker exists but dry-run helper is missing; refusing ambiguous repair');
  code = `${code.trimEnd()}\n\n${marker}\n${helper}\n`;
} else if (!code.includes(marker)) {
  throw new Error('Dry-run helper already exists without PERF-CF-02AO marker; refusing ambiguous state');
}

if (count(code, routeLine) !== 1) throw new Error('Dry-run route integration did not converge to exactly one route');
if (count(code, helperFunction) !== 1) throw new Error('Dry-run helper integration did not converge to exactly one helper');
if (!code.trimEnd().endsWith(helper.trimEnd())) throw new Error('Dry-run helper must remain append-only at the end of Code.gs');

fs.writeFileSync(targetPath, code, 'utf8');
console.log('APPS_SCRIPT_V150_DRYRUN_PATCH_READY route=1 helper=1 deploy=NO');
