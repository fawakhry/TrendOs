import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs', import.meta.url), 'utf8');

assert.match(src, /TRENDOS_PERF_CF_02CR_ENRICHMENT_SYNC_ENABLED/);
assert.match(src, /PERF-CF-02CR enrichment live sync V1/);
assert.match(src, /function d1OperationalEnrichmentLiveSyncTick02CR\(\)/);
assert.match(src, /function startD1OperationalEnrichmentLiveSync02CR\(\)/);
assert.match(src, /function stopD1OperationalEnrichmentLiveSync02CR\(\)/);
assert.match(src, /function getD1OperationalEnrichmentLiveSync02CRStatus\(\)/);
assert.match(src, /everyMinutes\(1\)/);
assert.match(src, /\/v1\/mirror\/heartbeat/);
assert.match(src, /\/v1\/mirror\/delta/);
assert.match(src, /atomicAction:'stage'/);
assert.match(src, /atomicAction:'promote'/);
assert.match(src, /D1_API_URL/);
assert.match(src, /D1_MIGRATION_SECRET/);
assert.match(src, /SpreadsheetApp\.openById\(D1_ENRICHMENT_02CR_SPREADSHEET_ID\)/);

const targetBlock = src.match(/const D1_ENRICHMENT_02CR_TARGETS = Object\.freeze\(\[([\s\S]*?)\]\);/);
assert.ok(targetBlock, 'exact support target allow-list is required');
const targets = [...targetBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.deepEqual(targets, ['العملاء','عملاء منع التسليم بالمديونية']);

// The support lane must never claim ownership of Orders/Lines or their V2 controls.
assert.doesNotMatch(src, /'الأوردرات'|'بنود الأوردرات'/);
assert.doesNotMatch(src, /D1_ORDERS_LIVE_SYNC_V2_ENABLED|D1_ORDERS_LIVE_SYNC_ENABLED_V1|d1OrdersLiveSyncTickV2|d1OrdersLiveSyncTick'/);
assert.doesNotMatch(src, /TrendOS orders live sync V2 quota-aware/);

// No unrelated production authority/control surfaces.
assert.doesNotMatch(src, /EDGE_SESSION_SECRET|MATBAGY_EDGE_ORDERS_READ_V1_ENABLED|genericDrainEnabled|TRENDOS_PROD_RECONCILE_02CL_ENABLED|wrangler\s+deploy|d1\s+execute/);
assert.doesNotMatch(src, /setValue\(|setValues\(|appendRow\(|insertRow|deleteRow/);
assert.doesNotMatch(src, /Logger\.log|console\.log/);

// Default OFF: tick cannot mutate until private support property is explicitly enabled.
const tickBody = src.slice(src.indexOf('function d1OperationalEnrichmentLiveSyncTick02CR()'), src.indexOf('function d1Enrichment02CRRemoveTriggers_()'));
const enabledRead = tickBody.indexOf("const enabled = String(props.getProperty(D1_ENRICHMENT_02CR_ENABLED_KEY)");
const offReturn = tickBody.indexOf("if (!enabled) return");
const fullSyncCall = tickBody.indexOf('d1Enrichment02CRFullSync_');
const deltaCall = tickBody.indexOf('d1Enrichment02CRDelta_');
assert.ok(enabledRead >= 0 && offReturn > enabledRead && fullSyncCall > offReturn && deltaCall > offReturn);

// First start must fail closed before trigger creation if initial sync fails.
const startBody = src.slice(src.indexOf('function startD1OperationalEnrichmentLiveSync02CR()'), src.indexOf('function stopD1OperationalEnrichmentLiveSync02CR()'));
assert.ok(startBody.indexOf('const firstRun = d1OperationalEnrichmentLiveSyncTick02CR()') >= 0);
assert.ok(startBody.indexOf('if (!firstRun.success)') >= 0);
assert.ok(startBody.indexOf('.everyMinutes(1).create()') > startBody.indexOf('if (!firstRun.success)'));

console.log('PERF_CF_02CR_ENRICHMENT_LIVE_SYNC_CANDIDATE_SAFETY_PASS');
