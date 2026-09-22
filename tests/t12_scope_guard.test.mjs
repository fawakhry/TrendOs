import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const BASE='f07cc56501fba1c29c0ef72cccda78e494935373';
const out=execFileSync('git',['-c','core.quotepath=false','diff','--name-only','-z',BASE+'...HEAD'],{encoding:'utf8'});
const files=out.split('\0').map(x=>x.trim()).filter(Boolean);

const exact=new Set([
  '.github/workflows/trendos-t12-order-create-isolated-ci.yml',
  '.github/workflows/trendos-r4-production-recovery-controlled.yml',
  '.github/workflows/trendos-r5-periodic-controlled.yml',
  'docs/trendos/blackbox/منصة ترند/00_INDEX.md',
  'docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md',
  'docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md',
  'docs/trendos/blackbox/منصة ترند/TRENDOS_PRODUCTION_INCIDENT_PROPERTIES_QUOTA_TRIGGER_PAUSE_LOG_2026-09-19.md',
  'docs/trendos/blackbox/منصة ترند/TRENDOS_D1_PAUSED_SYNC_RECOVERY_PROTOCOL_2026-09-19.md',
  'cloudflare-d1/wrangler.toml',
  'cloudflare-d1/production-shadow/index.js',
  'cloudflare-d1/src/r4-guarded-recovery-production.mjs'
]);
const prefixes=[
  'cloudflare-d1/src/t12-',
  'cloudflare-d1/t12-preview/',
  'cloudflare-d1/schema-prep/t12-',
  'tests/t12_',
  'docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_'
];
const forbidden=[
  'config.js','index.html','app.js','Code.gs',
  'cloudflare-d1/src/index_v2.js'
];

for(const f of files){
  assert(!forbidden.includes(f),'T12 must not modify production/runtime file: '+f);
  assert(exact.has(f)||prefixes.some(p=>f.startsWith(p)),'T12 out-of-scope file changed: '+f);
}
assert(files.length>0);
console.log('T12 scope guard PASS; changed files='+files.length+'; only exact approved R4 production files allowed.');
