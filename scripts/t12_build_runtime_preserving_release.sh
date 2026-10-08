#!/usr/bin/env bash
# Build only. No deployment, remote SQL, traffic changes, or repository edits.
set -euo pipefail
REPO_ROOT=$(git rev-parse --show-toplevel)
SOURCE_HEAD=$(git rev-parse --verify "${1:-HEAD}^{commit}")
BASE_HEAD=467c5e5fcd0e538a5b57692e630943d6ab500710
ACCOUNTING_HEAD=ab01814dc9abddefb0d572d49b64c70a3e83b57f
EXPECTED_LIVE_SHA=f61e58185ec245b996dcf2aa139805d8bbac7d9d068aa7f8a7514835da3398d4
T12_WRANGLER_BIN=${T12_WRANGLER_BIN:?Set T12_WRANGLER_BIN to pinned wrangler 4.33.2}
test "$("$T12_WRANGLER_BIN" --version | tail -1)" = '4.33.2'
git cat-file -e "$BASE_HEAD^{commit}"
git cat-file -e "$ACCOUNTING_HEAD^{commit}"
BUILD_ROOT=$(mktemp -d /tmp/trendos-t12-release.XXXXXXXX)
mkdir -p "$BUILD_ROOT/live-source" "$BUILD_ROOT/frontend-patches"
git archive "$BASE_HEAD" | tar -x -C "$BUILD_ROOT/live-source"
for file in cloudflare-d1/src/employee-accounting-native-v1.mjs cloudflare-d1/src/employee-core-native-v1.mjs; do
  git show "$ACCOUNTING_HEAD:$file" > "$BUILD_ROOT/live-source/$file"
done
(
  cd "$BUILD_ROOT/live-source/cloudflare-d1"
  WRANGLER_SEND_METRICS=false "$T12_WRANGLER_BIN" deploy --dry-run --outdir "$BUILD_ROOT/live-bundle" > "$BUILD_ROOT/live-build.log" 2>&1
)
python3 - "$BUILD_ROOT/live-bundle/index.js" "$EXPECTED_LIVE_SHA" <<'PY'
import hashlib,sys
from pathlib import Path
buf=Path(sys.argv[1]).read_bytes().replace(b'\r\n',b'\n').rstrip()+b'\n'
actual=hashlib.sha256(buf).hexdigest()
if actual!=sys.argv[2]:raise SystemExit('RECONSTRUCTED_LIVE_SHA_MISMATCH; STOP')
print('RECONSTRUCTED_LIVE_BYTE_PARITY=PASS')
PY
cp -a "$BUILD_ROOT/live-source" "$BUILD_ROOT/target-source"
for file in cloudflare-d1/src/t12-general-create.mjs cloudflare-d1/src/t12-general-create-handler.mjs cloudflare-d1/src/t12-customer-lane-policy.mjs cloudflare-d1/src/t12-order-create-shadow-intent.mjs cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql; do
  git show "$SOURCE_HEAD:$file" > "$BUILD_ROOT/target-source/$file"
done
# These four assets must later overlay the exact live frontend snapshot. This
# directory is a patch set, not a complete deployable frontend replacement.
for file in app.js trendos-edge-orders-read-v1.js config.js index.html; do
  git show "$SOURCE_HEAD:$file" > "$BUILD_ROOT/frontend-patches/$file"
done
(
  cd "$BUILD_ROOT/target-source/cloudflare-d1"
  WRANGLER_SEND_METRICS=false "$T12_WRANGLER_BIN" deploy --dry-run --outdir "$BUILD_ROOT/target-bundle" > "$BUILD_ROOT/target-build.log" 2>&1
)
python3 - "$BUILD_ROOT" "$SOURCE_HEAD" "$BASE_HEAD" "$ACCOUNTING_HEAD" <<'PY'
import hashlib,json,sys
from pathlib import Path
root=Path(sys.argv[1]);live=root/'live-source';target=root/'target-source'
allowed={'cloudflare-d1/src/t12-general-create.mjs','cloudflare-d1/src/t12-general-create-handler.mjs',
 'cloudflare-d1/src/t12-customer-lane-policy.mjs','cloudflare-d1/src/t12-order-create-shadow-intent.mjs',
 'cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql'}
changed=[]
for path in target.rglob('*'):
 if not path.is_file() or '.wrangler' in path.parts:continue
 rel=str(path.relative_to(target));old=live/rel
 if not old.exists() or old.read_bytes()!=path.read_bytes():changed.append(rel)
if set(changed)!=allowed:raise SystemExit('UNEXPECTED_RELEASE_FILE_DELTA: '+str(changed))
def digest(path):
 b=path.read_bytes().replace(b'\r\n',b'\n').rstrip()+b'\n'
 return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
for module in ['employee-accounting-native-v1.mjs','employee-core-native-v1.mjs','accounting-foundation-v1.mjs']:
 p='cloudflare-d1/src/'+module
 assert (live/p).read_bytes()==(target/p).read_bytes(),p
manifest={'sourceHead':sys.argv[2],'sharedBase':sys.argv[3],'accountingSource':sys.argv[4],
 'runtimeBaselineVersion':'d7c65348-a921-4f2e-8359-f3e30ce3a1eb',
 'liveBundle':digest(root/'live-bundle/index.js'),'targetBundle':digest(root/'target-bundle/index.js'),
 'backendDelta':sorted(changed),'frontendPatches':{p.name:digest(p) for p in (root/'frontend-patches').iterdir()},
 'accountingCoreFoundationSourcesUnchanged':True,'deploy':False,'productionD1Write':False,
 'requiresFreshLiveLease':True,'requiresOwnerDeploymentApproval':True}
(root/'release-manifest.json').write_text(json.dumps(manifest,indent=2))
print('RUNTIME_ACCOUNTING_CORE_FOUNDATION_PRESERVED=PASS')
print('TARGET_WORKER_SHA256='+manifest['targetBundle']['sha256'])
print('BUILD_ARTIFACT_DIRECTORY='+str(root))
print('DEPLOY=NO; MIGRATION_APPLIED=NO; FRONTEND_PATCHES_NOT_PUBLISHED=YES')
PY
