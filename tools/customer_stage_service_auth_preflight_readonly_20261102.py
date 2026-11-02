#!/usr/bin/env python3
"""READ ONLY audit of the existing private Cloudflare customer Stage.

No writes, Worker deployments, changes to Access policies, secrets, ingress,
Service Token creation, D1 queries or production resources.
This diagnostic neither receives nor exposes a Client Secret.
"""
import hashlib
import json
import os
import re
import urllib.request
import urllib.error
import urllib.parse

WORKER="trendos-customer-portal-isolated-stage-v0"
DB="trendos-zg-customer-stage-synthetic-20261101-v0"
APP="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
PROPOSED_SERVICE_TOKEN_NAME="TrendOS Customer Isolated Stage Service Auth"
def check(condition,reason):
    if not condition: raise SystemExit("STAGE_PRECHECK_STOP_"+reason)
account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
reader=os.environ.get("CLOUDFLARE_API_TOKEN","")
access=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN","")
check(os.environ.get("GITHUB_EVENT_NAME")=="pull_request","NOT_PR")
check(os.environ.get("GITHUB_HEAD_REF")==
      "ops/customer-stage-service-auth-preflight-readonly-20261102","WRONG_REF")
check(bool(re.fullmatch("[a-fA-F0-9]{32}",account)),"ACCOUNT")
check(len(reader)>=20 and len(access)>=20 and reader!=access,"MISSING_SEPARATE_API_TOKENS")
base="https://api.cloudflare.com/client/v4/accounts/"+account
def get(path,token):
    """Only Cloudflare account-scoped literal GET requests. Never print bodies."""
    check(path.startswith("/") and "://" not in path and ".." not in path,"INVALID_PATH")
    req=urllib.request.Request(base+path,method="GET",
        headers={"Authorization":"Bearer "+token,"Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=25) as rsp:
            body=json.load(rsp)
    except urllib.error.HTTPError as exc:
        return None,exc.code
    except (ValueError,urllib.error.URLError,TimeoutError):
        return None,0
    return (body.get("result") if isinstance(body,dict)
            and body.get("success") is True else None),200

worker,code=get("/workers/workers/"+WORKER,reader)
check(code==200 and isinstance(worker,dict) and worker.get("name")==WORKER
      and bool(re.fullmatch(r"[0-9a-fA-F-]{32,36}",str(worker.get("id","")))),
      "EXACT_WORKER_NOT_VERIFIED")
wid=worker["id"]
sub,code=get("/workers/scripts/"+WORKER+"/subdomain",reader)
check(code==200 and isinstance(sub,dict) and sub.get("enabled") is False
      and sub.get("previews_enabled") is False,"PUBLIC_STAGE_OR_PREVIEW")
settings,code=get("/workers/scripts/"+WORKER+"/settings",reader)
check(code==200 and isinstance(settings,dict)
      and isinstance(settings.get("bindings"),list),"SETTINGS_UNREADABLE")
bindings=settings["bindings"]
d1=[b for b in bindings if isinstance(b,dict) and
    (b.get("name")=="DB" or b.get("type")=="d1")]
check(len(d1)==1 and d1[0].get("name")=="DB" and d1[0].get("type")=="d1",
      "WRONG_D1_BINDING")
check(not any(isinstance(b,dict) and b.get("type") in
    ("r2_bucket","kv_namespace","service","queue","hyperdrive")
    for b in bindings),"UNEXPECTED_STAGE_PRODUCTION_BINDING")
databases,code=get("/d1/database?page=1&per_page=100",reader)
check(code==200 and isinstance(databases,list) and
      len([d for d in databases if isinstance(d,dict)
           and d.get("uuid")==d1[0].get("id") and d.get("name")==DB])==1,
      "EXACT_SYNTHETIC_D1_UNPROVEN")
print("EXISTING_STAGE_WORKER_D1_PRIVATE_OFF=PASS",flush=True)

apps=[]
for page in range(1,21):
    data,code=get("/access/apps?"+urllib.parse.urlencode(
        {"page":page,"per_page":100}),access)
    check(code==200 and isinstance(data,list),"SCOPED_ACCESS_APPS_UNREADABLE")
    apps+=data
    if len(data)<100: break
else: check(False,"UNBOUNDED_APP_LIST")
match=[a for a in apps if isinstance(a,dict) and
       (a.get("name")==APP or any(isinstance(d,dict) and
         d.get("type")=="worker" and d.get("worker_id")==wid
         for d in (a.get("destinations") or [])))]
check(len(match)==1 and match[0].get("name")==APP
      and bool(re.fullmatch(r"[a-fA-F0-9-]{32,36}",str(match[0].get("id","")))),
      "ACCESS_APP_NOT_UNIQUE")
app,code=get("/access/apps/"+match[0]["id"],access)
check(code==200 and isinstance(app,dict) and app.get("name")==APP,
      "ACCESS_APP_READBACK_FAILED")
dest=app.get("destinations")
check(isinstance(dest,list) and len(dest)==1
      and isinstance(dest[0],dict) and dest[0].get("type")=="worker"
      and dest[0].get("worker_id")==wid and not dest[0].get("overrides"),
      "ACCESS_APP_UNSAFE_DESTINATION")
pol=app.get("policies")
check(isinstance(pol,list) and len(pol)==1 and isinstance(pol[0],dict)
      and pol[0].get("decision")=="deny" and
      pol[0].get("include")==[{"everyone":{}}] and
      not pol[0].get("exclude") and not pol[0].get("require"),
      "DENY_EVERYONE_POLICY_CHANGED")
print("ACCESS_DENY_EVERYONE_REMOTE_READBACK=PASS",flush=True)
print("ACCESS_APP_HASH_SHA256_PREFIX="+
      hashlib.sha256(match[0]["id"].encode()).hexdigest()[:12],flush=True)

# A service token is a different machine credential than the admin API token.
# Try read-only inventory only. An insufficient scope is a documented blocker,
# not permission to create/rotate/reuse Ubuntu's existing service token.
tokens,code=get("/access/service_tokens?page=1&per_page=100",access)
if code!=200 or not isinstance(tokens,list):
    tokens,code=get("/access/service_tokens?page=1&per_page=100",reader)
if code==200 and isinstance(tokens,list):
    stage=[t for t in tokens if isinstance(t,dict) and
           t.get("name")==PROPOSED_SERVICE_TOKEN_NAME]
    print("SERVICE_TOKEN_READONLY_INVENTORY=PASS",flush=True)
    print("DEDICATED_STAGE_SERVICE_TOKEN_COUNT="+str(len(stage)),flush=True)
    print("SERVICE_TOKEN_CREDENTIAL_IN_GITHUB=UNKNOWN",flush=True)
else:
    print("SERVICE_TOKEN_READONLY_INVENTORY=NOT_AUTHORIZED_STATUS_"+str(code),flush=True)
    print("SERVICE_TOKEN_CREDENTIAL_IN_GITHUB=UNKNOWN",flush=True)
print("SERVICE_AUTH_POLICY_CONFIGURED=NO",flush=True)
print("PUBLIC_STAGE_INGRESS=OFF",flush=True)
print("REMOTE_AUTHENTICATED_CUSTOMER_TEST=NOT_RUN",flush=True)
print("CUSTOMER_GO_LIVE=NO_GO",flush=True)
