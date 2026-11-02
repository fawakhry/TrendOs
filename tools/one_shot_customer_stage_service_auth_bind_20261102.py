#!/usr/bin/env python3
"""ONE-SHOT: add one exact Service Auth policy to already DENY-EVERYONE isolated
customer Stage. NO app/token creation, no ingress changes, no production.

All credential values reside only in GitHub Actions Secrets. Do not print
response bodies, token identities, customer data, headers or API secrets.
Cloudflare returns an error/uncertain commit: NEVER automatically retry POST.
"""
import datetime
import hashlib
import hmac
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

WORKER="trendos-customer-portal-isolated-stage-v0"
D1="trendos-zg-customer-stage-synthetic-20261101-v0"
APP="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
TOKEN_NAME="TrendOS Customer Isolated Stage Service Auth"
POLICY="TrendOS Customer Stage Exact Service Auth V0"
BRANCH="ops/customer-stage-service-auth-bind-once-20261102"
UUID=re.compile(r"[a-fA-F0-9-]{32,36}")
def must(ok,code):
    if not ok:raise SystemExit("ACCESS_SERVICE_AUTH_SAFE_STOP_"+code)
def status(line):
    print(line,flush=True)

account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
reader=os.environ.get("CLOUDFLARE_API_TOKEN","")
admin=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN","")
client_id=os.environ.get("CF_STAGE_ACCESS_CLIENT_ID","")
client_secret=os.environ.get("CF_STAGE_ACCESS_CLIENT_SECRET","")
must(os.environ.get("GITHUB_EVENT_NAME")=="pull_request" and
     os.environ.get("GITHUB_HEAD_REF")==BRANCH,"WRONG_ONE_SHOT_GUARD")
must(bool(re.fullmatch(r"[a-fA-F0-9]{32}",account)),"ACCOUNT")
must(len(reader)>20 and len(admin)>20 and reader!=admin,"MISSING_SEPARATE_API_CREDS")
must(20<len(client_id)<256 and 20<len(client_secret)<256 and
     client_secret!=client_id and
     all(ord(x)>=33 and ord(x)<127 for x in client_id+client_secret),
     "MISSING_CLIENT_ID_OR_SECRET")
base="https://api.cloudflare.com/client/v4/accounts/"+account

def api(method,path,token,payload=None):
    must(method in ("GET","POST") and path.startswith("/") and
         not path.startswith("//") and ".." not in path,"ILLEGAL_REQUEST")
    if method=="POST":
        must(path.startswith("/access/apps/") and path.endswith("/policies") and
             payload is not None and isinstance(payload,dict) and
             payload.get("decision")=="non_identity" and
             payload.get("name")==POLICY and
             payload.get("include")==[{"service_token":{"token_id":verified_token_id}}],
             "FORBIDDEN_WRITE_ROUTE_OR_POLICY")
    req=urllib.request.Request(base+path,
       headers={"Authorization":"Bearer "+token,"Accept":"application/json",
                "Content-Type":"application/json"},
       method=method,data=None if payload is None else
       json.dumps(payload,separators=(",",":")).encode())
    try:
        with urllib.request.urlopen(req,timeout=25) as resp:
            code=resp.status
            body=json.load(resp)
    except urllib.error.HTTPError as e:
        status("CF_ACCESS_API_HTTP_STATUS="+str(e.code))
        raise SystemExit("ACCESS_SERVICE_AUTH_SAFE_STOP_API_HTTP_DENIED_NO_RETRY")
    except (urllib.error.URLError,TimeoutError,ValueError):
        raise SystemExit("ACCESS_SERVICE_AUTH_SAFE_STOP_RESPONSE_UNCERTAIN_NO_RETRY")
    must(isinstance(body,dict) and body.get("success") is True,
         "API_SUCCESS_FALSE_NO_RETRY")
    return body.get("result"),code

# Independently re-read the exact existing isolated Worker/D1. No live writes.
worker,_=api("GET","/workers/workers/"+WORKER,reader)
must(isinstance(worker,dict) and worker.get("name")==WORKER and
     isinstance(worker.get("id"),str) and bool(UUID.fullmatch(worker["id"])),
     "WORKER_ID_UNVERIFIED")
wid=worker["id"]
sub,_=api("GET","/workers/scripts/"+WORKER+"/subdomain",reader)
must(isinstance(sub,dict) and sub.get("enabled") is False and
     sub.get("previews_enabled") is False,"WORKER_MAY_BE_PUBLIC")
settings,_=api("GET","/workers/scripts/"+WORKER+"/settings",reader)
binds=settings.get("bindings") if isinstance(settings,dict) else None
must(isinstance(binds,list),"NO_BINDINGS")
d1=[b for b in binds if isinstance(b,dict) and
    (b.get("type")=="d1" or b.get("name")=="DB")]
must(len(d1)==1 and d1[0].get("name")=="DB" and d1[0].get("type")=="d1",
     "WRONG_D1_BINDING")
must(not any(isinstance(b,dict) and b.get("type") in
    ("r2_bucket","kv_namespace","service","queue","hyperdrive")
    for b in binds),"UNEXPECTED_STORAGE_BINDINGS")
dbs,_=api("GET","/d1/database?page=1&per_page=100",reader)
must(isinstance(dbs,list) and len([d for d in dbs if isinstance(d,dict) and
     d.get("name")==D1 and d.get("uuid")==d1[0].get("id")])==1,
     "D1_IS_NOT_EXACT_SYNTHETIC")
status("EXACT_PRIVATE_OFF_WORKER_AND_OWN_SYNTHETIC_D1=PASS")

# Old generic Cloudflare API token has incomplete Access visibility.
apps=[]
for page in range(1,21):
    rows,_=api("GET","/access/apps?"+urllib.parse.urlencode(
        {"page":page,"per_page":100}),admin)
    must(isinstance(rows,list),"ACCESS_INVENTORY_UNREADABLE")
    apps+=rows
    if len(rows)<100:break
else:must(False,"APP_INVENTORY_UNBOUNDED")
matches=[a for a in apps if isinstance(a,dict) and
         (a.get("name")==APP or any(isinstance(x,dict) and x.get("type")=="worker"
          and x.get("worker_id")==wid for x in (a.get("destinations") or [])))]
must(len(matches)==1 and matches[0].get("name")==APP and
     isinstance(matches[0].get("id"),str) and bool(UUID.fullmatch(matches[0]["id"])),
     "APP_MISSING_OR_CONFLICT")
appid=matches[0]["id"]
app,_=api("GET","/access/apps/"+appid,admin)
dest=app.get("destinations") if isinstance(app,dict) else None
must(isinstance(dest,list) and len(dest)==1 and
     dest[0].get("type")=="worker" and dest[0].get("worker_id")==wid and
     not dest[0].get("overrides"),"ACCESS_DESTINATION_UNSAFE")
pol=app.get("policies")
must(isinstance(pol,list) and len(pol)==1 and
     isinstance(pol[0],dict) and pol[0].get("decision")=="deny" and
     pol[0].get("include")==[{"everyone":{}}] and
     not pol[0].get("exclude") and not pol[0].get("require"),
     "DENY_ALL_PRECONDITION_CHANGED")
status("EXACT_ACCESS_APP_WITH_ONE_DENY_ALL=PASS")

# A separate Service Token created by account owner must already exist.
# Do not attempt token creation, renewal, secret recovery or reuse Ubuntu token.
tokens=[]
for page in range(1,21):
    items,_=api("GET","/access/service_tokens?"+urllib.parse.urlencode(
        {"page":page,"per_page":100}),reader)
    must(isinstance(items,list),"SERVICE_TOKENS_UNREADABLE")
    tokens+=items
    if len(items)<100:break
else:must(False,"SERVICE_TOKENS_INVENTORY_UNBOUNDED")
matches=[t for t in tokens if isinstance(t,dict) and
         (t.get("name")==TOKEN_NAME or
          isinstance(t.get("client_id"),str) and
          hmac.compare_digest(t["client_id"],client_id))]
must(len(matches)==1 and matches[0].get("name")==TOKEN_NAME,
     "DEDICATED_TOKEN_MISSING_OR_DUPLICATE_OR_WRONG_ID")
tok=matches[0]
must(tok.get("enabled") is True and isinstance(tok.get("id"),str) and
     bool(UUID.fullmatch(tok["id"])) and
     isinstance(tok.get("client_id"),str) and
     hmac.compare_digest(tok["client_id"],client_id),
     "CLIENT_ID_SECRET_DOES_NOT_MATCH_DEDICATED_TOKEN")
expires=tok.get("expires_at")
try:
    expiry=datetime.datetime.fromisoformat(expires.replace("Z","+00:00"))
    now=datetime.datetime.now(datetime.timezone.utc)
    must(datetime.timedelta(hours=12)<expiry-now<=datetime.timedelta(days=31),
         "SERVICE_TOKEN_EXPIRY_INVALID")
except (TypeError,ValueError,AttributeError):
    must(False,"SERVICE_TOKEN_EXPIRY_UNKNOWN")
must(not tok.get("leak_reported_at"),"SERVICE_TOKEN_LEAKED")
verified_token_id=tok["id"]
status("EXACT_ENABLED_STAGE_SERVICE_TOKEN_AND_SECRET_ID_MATCH=PASS")
# Matching Client ID is verifiable; Client Secret *content* is not verifiable
# without an actual Access-protected request. Never claim it was authenticated.
status("CLIENT_SECRET_VALUE_NOT_VERIFIED_BY_REMOTE_HTTP=YES")

# Verify app-scoped policies independently before the ONLY mutation.
pl,_=api("GET","/access/apps/"+appid+"/policies?per_page=100",admin)
must(isinstance(pl,list) and len(pl)==1 and pl[0].get("decision")=="deny" and
     pl[0].get("include")==[{"everyone":{}}],"APP_POLICY_LIST_PRECONDITION")
payload={"name":POLICY,"decision":"non_identity",
         "include":[{"service_token":{"token_id":verified_token_id}}],
         "session_duration":"1h"}
status("ONE_EXACT_APP_POLICY_POST_ATTEMPT=YES")
created,code=api("POST","/access/apps/"+appid+"/policies",admin,payload)
must(code in (200,201) and isinstance(created,dict) and
     created.get("decision")=="non_identity","CREATE_ACK_UNVERIFIED")
status("SERVICE_AUTH_POLICY_CREATE_HTTP="+str(code))
# An uncertain response/readback is a STOP. NEVER retry POST automatically.
postpol,_=api("GET","/access/apps/"+appid+"/policies?per_page=100",admin)
must(isinstance(postpol,list) and len(postpol)==2,"POLICY_LIST_NOT_EXACT_TWO")
actual,_=api("GET","/access/apps/"+appid,admin)
must(isinstance(actual,dict) and actual.get("name")==APP and
     actual.get("destinations")==dest,"APP_DESTINATION_DRIFT")
checkpol=actual.get("policies")
must(isinstance(checkpol,list) and len(checkpol)==2,
     "APP_POLICY_LINK_NOT_CONFIRMED")
for policies in (postpol,checkpol):
    denied=[p for p in policies if isinstance(p,dict) and p.get("decision")=="deny"]
    service=[p for p in policies if isinstance(p,dict) and p.get("decision")=="non_identity"]
    must(len(denied)==1 and denied[0].get("include")==[{"everyone":{}}]
         and not denied[0].get("exclude") and not denied[0].get("require"),
         "DENY_EVERYONE_LOST")
    must(len(service)==1 and
         service[0].get("include")==[{"service_token":{"token_id":verified_token_id}}]
         and not service[0].get("exclude") and not service[0].get("require"),
         "SERVICE_AUTH_NOT_SINGLE_CLIENT")
after,_=api("GET","/workers/scripts/"+WORKER+"/subdomain",reader)
must(after.get("enabled") is False and after.get("previews_enabled") is False,
     "WORKER_BECAME_PUBLIC")
status("REMOTE_SERVICE_AUTH_AND_DENY_EVERYONE_EXACT_READBACK=PASS")
status("REMOTE_APP_SHA256_PREFIX="+hashlib.sha256(appid.encode()).hexdigest()[:12])
status("PUBLIC_INGRESS=OFF")
status("WORKER_D1_R2_DEPLOYMENTS=NONE")
status("REMOTE_CUSTOMER_BROWSER_E2E=NOT_RUN")
status("CUSTOMER_GO_LIVE=NO_GO")
