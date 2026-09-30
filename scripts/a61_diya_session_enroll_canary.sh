#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?missing}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing}"
: "${QUALIFY_USERNAME:?missing}"
: "${QUALIFY_PASSWORD:?missing}"

PROD_URL="${PROD_URL:-https://trendos-d1-api.trendmall-contact.workers.dev}"
WRANGLER_VERSION="${WRANGLER_VERSION:-4.33.2}"
ROOT="$(pwd)"
CFG="$ROOT/cloudflare-d1/wrangler.toml"
CONTROL_OPEN=0
ENROLLED=0
SUCCESS=0

cleanup_files() {
  rm -f /tmp/a61-legacy-token /tmp/a61-apps-url /tmp/a61-must-change /tmp/a61-native-token /tmp/a61-user-key
  rm -f "$ROOT/cloudflare-d1/wrangler.a61-enroll-canary.toml" "$ROOT/cloudflare-d1/wrangler.a61-native-only-canary.toml"
}

legacy_logout_best_effort() {
  if [[ -f /tmp/a61-legacy-token && -f /tmp/a61-apps-url ]]; then
    node <<'NODE' || true
const fs=require('fs');
const u=fs.readFileSync('/tmp/a61-apps-url','utf8').trim();
const token=fs.readFileSync('/tmp/a61-legacy-token','utf8').trim();
const username=String(process.env.QUALIFY_USERNAME||'').trim();
fetch(u,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'logout',username,token,_ts:Date.now()}),redirect:'follow'}).catch(()=>{});
NODE
  fi
}

rollback() {
  local ec=$?
  if [[ "$SUCCESS" == "1" ]]; then cleanup_files; return 0; fi
  set +e
  cd "$ROOT/cloudflare-d1"
  npx --yes wrangler@"$WRANGLER_VERSION" d1 execute trendos-main --remote --config wrangler.toml --command "UPDATE employee_auth_control_v1 SET mode='OFF',policy_epoch=policy_epoch+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_EMPLOYEE_AUTH_V1';" >/tmp/a61-rollback-control.txt 2>&1
  npx --yes wrangler@"$WRANGLER_VERSION" deploy --config wrangler.toml >/tmp/a61-rollback-deploy.txt 2>&1
  if [[ "$ENROLLED" == "1" && -f /tmp/a61-user-key ]]; then
    node <<'NODE'
const fs=require('fs');
const k=fs.readFileSync('/tmp/a61-user-key','utf8').trim();
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
fs.writeFileSync('/tmp/a61-delete-user.sql',
  "DELETE FROM employee_auth_sessions_v1 WHERE username_key="+q(k)+";\n"+
  "DELETE FROM employee_auth_users_v1 WHERE username_key="+q(k)+";\n");
NODE
    npx --yes wrangler@"$WRANGLER_VERSION" d1 execute trendos-main --remote --config wrangler.toml --file /tmp/a61-delete-user.sql >/tmp/a61-delete-user.txt 2>&1
    rm -f /tmp/a61-delete-user.sql
  fi
  cd "$ROOT"
  legacy_logout_best_effort
  cleanup_files
  echo "A61_EMERGENCY_OFF_RESTORE_ATTEMPTED=YES"
  exit "$ec"
}
trap rollback EXIT

grep -Fx 'TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"' "$CFG" >/dev/null
grep -Fx 'TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "false"' "$CFG" >/dev/null
grep -Fx 'TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"' "$CFG" >/dev/null
grep -Fx 'TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"' "$CFG" >/dev/null

curl --fail --silent --show-error "$PROD_URL/v1/employee/auth/health" >/tmp/a61-pre-auth.json
curl --fail --silent --show-error "$PROD_URL/v1/employee/legacy-action/health" >/tmp/a61-pre-bridge.json
curl --fail --silent --show-error "$PROD_URL/v1/t12/customers/write/health" >/tmp/a61-pre-customer.json
curl --fail --silent --show-error "$PROD_URL/v1/t12/orders/create/health" >/tmp/a61-pre-order.json
node <<'NODE'
const fs=require('fs');
const a=JSON.parse(fs.readFileSync('/tmp/a61-pre-auth.json'));
const b=JSON.parse(fs.readFileSync('/tmp/a61-pre-bridge.json'));
const c=JSON.parse(fs.readFileSync('/tmp/a61-pre-customer.json'));
const o=JSON.parse(fs.readFileSync('/tmp/a61-pre-order.json'));
if(!a.success||a.mode!=='OFF'||a.envEnabled!==false||a.nativeOnly!==false||Number(a.nativeReadyCount||0)!==0)process.exit(1);
if(!b.success||b.enabled!==false||b.secretConfigured!==false)process.exit(2);
if(!c.success||c.mode!=='GENERAL'||Number(c.customerCount||0)<247)process.exit(3);
if(!o.success||o.mode!=='GENERAL')process.exit(4);
console.log('A61_DIYA_ENROLL_PREFLIGHT=PASS');
NODE

node <<'NODE'
const fs=require('fs');
const toml=fs.readFileSync('cloudflare-d1/wrangler.toml','utf8');
const m=toml.match(/^APPS_SCRIPT_API_URL = "([^"]+)"$/m);
if(!m)process.exit(10);
const upstream=m[1];
const username=String(process.env.QUALIFY_USERNAME||'').trim();
const password=String(process.env.QUALIFY_PASSWORD||'');
(async()=>{
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),120000);
  let r;
  try {
    r=await fetch(upstream,{method:'POST',headers:{accept:'application/json','content-type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'login',username,password,_ts:Date.now()}),redirect:'follow',signal:ctrl.signal});
  } finally { clearTimeout(timer); }
  const raw=await r.text(); let body={}; try{body=JSON.parse(raw||'{}')}catch{}
  const token=String(body&&body.user&&body.user.token||'').trim();
  if(r.status!==200||body.success!==true||!token)process.exit(11);
  console.log('::add-mask::'+token);
  fs.writeFileSync('/tmp/a61-legacy-token',token,{mode:0o600});
  fs.writeFileSync('/tmp/a61-apps-url',upstream,{mode:0o600});
  fs.writeFileSync('/tmp/a61-must-change',body.user&&body.user.mustChange===true?'true':'false',{mode:0o600});
  fs.writeFileSync('/tmp/a61-user-key',String(body.user&&body.user.username||username).trim().toLowerCase(),{mode:0o600});
  console.log('A61_LEGACY_LOGIN_FOR_ENROLL=PASS');
})().catch(()=>process.exit(12));
NODE

NONCE="$(openssl rand -hex 32)"
echo "::add-mask::$NONCE"
export ENROLL_NONCE="$NONCE"

cd "$ROOT/cloudflare-d1"
node <<'NODE'
const fs=require('fs');
let c=fs.readFileSync('wrangler.toml','utf8');
const user=String(process.env.QUALIFY_USERNAME||'').trim();
c=c.replace('workers_dev = true','workers_dev = true\nkeep_vars = true');
c=c.replace('TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"','TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "true"');
c=c.replace('TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "false"','TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "true"');
c=c.replace('EMPLOYEE_AUTH_ENROLL_CANARY_USER = ""','EMPLOYEE_AUTH_ENROLL_CANARY_USER = '+JSON.stringify(user));
if(!c.includes('TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED = "false"'))process.exit(20);
if(!c.includes('TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"'))process.exit(21);
if(!c.includes('TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"'))process.exit(22);
fs.writeFileSync('wrangler.a61-enroll-canary.toml',c);
NODE

npx --yes wrangler@"$WRANGLER_VERSION" d1 execute trendos-main --remote --config wrangler.toml --command "UPDATE employee_auth_control_v1 SET mode='TRANSITIONAL',policy_epoch=policy_epoch+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_EMPLOYEE_AUTH_V1' AND mode='OFF';" >/tmp/a61-open.txt
CONTROL_OPEN=1
npx --yes wrangler@"$WRANGLER_VERSION" deploy --config wrangler.a61-enroll-canary.toml >/tmp/a61-enroll-deploy.txt
sleep 4
cd "$ROOT"

node <<'NODE'
const fs=require('fs');
const base=String(process.env.PROD_URL||'https://trendos-d1-api.trendmall-contact.workers.dev').replace(/\/$/,'');
const username=String(process.env.QUALIFY_USERNAME||'').trim();
const password=String(process.env.QUALIFY_PASSWORD||'');
const legacyToken=fs.readFileSync('/tmp/a61-legacy-token','utf8').trim();
const mustChange=fs.readFileSync('/tmp/a61-must-change','utf8').trim()==='true';
const enrollNonce=String(process.env.ENROLL_NONCE||'');
(async()=>{
  const r=await fetch(base+'/v1/employee/auth/enroll-legacy-session',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({username,legacyToken,password,mustChange,enrollNonce}),cache:'no-store'});
  const raw=await r.text(); let body={}; try{body=JSON.parse(raw||'{}')}catch{}
  if(r.status!==200||body.success!==true||String(body.authSource||'')!=='d1-native-legacy-session-enroll-v1'){
    console.error('A61_DIYA_ENROLL=FAIL status='+r.status+' code='+String(body.code||''));
    process.exit(30);
  }
  console.log('A61_DIYA_ENROLL=PASS');
})().catch(()=>process.exit(31));
NODE
ENROLLED=1

curl --fail --silent --show-error "$PROD_URL/v1/employee/auth/health" >/tmp/a61-enrolled-health.json
node -e "const a=JSON.parse(require('fs').readFileSync('/tmp/a61-enrolled-health.json')); if(Number(a.userCount||0)!==1||Number(a.nativeReadyCount||0)!==1)process.exit(1); console.log('A61_NATIVE_READY_COUNT=1')"

legacy_logout_best_effort
rm -f /tmp/a61-legacy-token

cd "$ROOT/cloudflare-d1"
node <<'NODE'
const fs=require('fs');
let c=fs.readFileSync('wrangler.toml','utf8');
c=c.replace('workers_dev = true','workers_dev = true\nkeep_vars = true');
c=c.replace('TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"','TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "true"');
c=c.replace('TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "false"','TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1 = "true"');
if(!c.includes('TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED = "false"'))process.exit(40);
if(!c.includes('TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "false"'))process.exit(41);
if(!c.includes('TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"'))process.exit(42);
fs.writeFileSync('wrangler.a61-native-only-canary.toml',c);
NODE
npx --yes wrangler@"$WRANGLER_VERSION" deploy --config wrangler.a61-native-only-canary.toml >/tmp/a61-native-deploy.txt
sleep 4
cd "$ROOT"

node <<'NODE'
const fs=require('fs');
const base=String(process.env.PROD_URL||'https://trendos-d1-api.trendmall-contact.workers.dev').replace(/\/$/,'');
const username=String(process.env.QUALIFY_USERNAME||'').trim();
const password=String(process.env.QUALIFY_PASSWORD||'');
(async()=>{
  let r=await fetch(base+'/v1/employee/auth/login',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({username,password}),cache:'no-store'});
  let raw=await r.text(); let body={}; try{body=JSON.parse(raw||'{}')}catch{}
  const token=String(body&&body.user&&body.user.token||'').trim();
  if(r.status!==200||body.success!==true||!token||String(body.authSource||'')!=='d1-native-employee-v1')process.exit(50);
  console.log('::add-mask::'+token);
  fs.writeFileSync('/tmp/a61-native-token',token,{mode:0o600});
  console.log('A61_DIYA_NATIVE_LOGIN=PASS');
  console.log('A61_DIYA_LOGIN_AUTH_SOURCE=d1-native-employee-v1');
  r=await fetch(base+'/v1/employee/auth/session',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({username,token}),cache:'no-store'});
  raw=await r.text(); body={}; try{body=JSON.parse(raw||'{}')}catch{}
  if(r.status!==200||body.success!==true||String(body.authSource||'')!=='d1-native-employee-v1')process.exit(51);
  console.log('A61_DIYA_NATIVE_SESSION=PASS');
})().catch(()=>process.exit(52));
NODE

node <<'NODE'
const fs=require('fs');
const base=String(process.env.PROD_URL||'https://trendos-d1-api.trendmall-contact.workers.dev').replace(/\/$/,'');
const username=String(process.env.QUALIFY_USERNAME||'').trim();
const token=fs.readFileSync('/tmp/a61-native-token','utf8').trim();
fetch(base+'/v1/employee/auth/logout',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({username,token}),cache:'no-store'})
  .then(async r=>{const b=JSON.parse(await r.text()||'{}');if(r.status!==200||b.success!==true)process.exit(60);console.log('A61_DIYA_NATIVE_SESSION_REVOKED=PASS')})
  .catch(()=>process.exit(61));
NODE

cd "$ROOT/cloudflare-d1"
npx --yes wrangler@"$WRANGLER_VERSION" d1 execute trendos-main --remote --config wrangler.toml --command "UPDATE employee_auth_control_v1 SET mode='OFF',policy_epoch=policy_epoch+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_EMPLOYEE_AUTH_V1';" >/tmp/a61-close.txt
CONTROL_OPEN=0
npx --yes wrangler@"$WRANGLER_VERSION" deploy --config wrangler.toml >/tmp/a61-off-deploy.txt
sleep 4
cd "$ROOT"

curl --fail --silent --show-error "$PROD_URL/v1/employee/auth/health" >/tmp/a61-final-auth.json
curl --fail --silent --show-error "$PROD_URL/v1/employee/legacy-action/health" >/tmp/a61-final-bridge.json
curl --fail --silent --show-error "$PROD_URL/v1/t12/customers/write/health" >/tmp/a61-final-customer.json
curl --fail --silent --show-error "$PROD_URL/v1/t12/orders/create/health" >/tmp/a61-final-order.json
node <<'NODE'
const fs=require('fs');
const a=JSON.parse(fs.readFileSync('/tmp/a61-final-auth.json'));
const b=JSON.parse(fs.readFileSync('/tmp/a61-final-bridge.json'));
const c=JSON.parse(fs.readFileSync('/tmp/a61-final-customer.json'));
const o=JSON.parse(fs.readFileSync('/tmp/a61-final-order.json'));
if(!a.success||a.mode!=='OFF'||a.envEnabled!==false||a.nativeOnly!==false||Number(a.userCount||0)!==1||Number(a.nativeReadyCount||0)!==1)process.exit(70);
if(!b.success||b.enabled!==false||b.secretConfigured!==false)process.exit(71);
if(!c.success||c.mode!=='GENERAL'||Number(c.customerCount||0)<247)process.exit(72);
if(!o.success||o.mode!=='GENERAL')process.exit(73);
console.log('A61_DIYA_SESSION_ENROLL_CANARY=SUCCESS');
console.log('FINAL_AUTH_MODE=OFF');
console.log('FINAL_NATIVE_USER_COUNT=1');
console.log('FINAL_NATIVE_READY_COUNT=1');
console.log('FINAL_BRIDGE_ENABLED=NO');
console.log('CUSTOMER_MODE=GENERAL');
console.log('ORDER_CREATE_MODE=GENERAL');
NODE

SUCCESS=1
cleanup_files
trap - EXIT
