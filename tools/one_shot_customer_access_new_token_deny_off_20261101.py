#!/usr/bin/env python3
"""One owner-authorized Cloudflare Access DENY EVERYONE attempt for an existing
nonpublic synthetic TrendOS worker. Designed to run only once from GitHub Actions.
Does not create/modify Workers, D1, R2, routes, public access, customers or finance.
Never prints API secrets, account IDs, Worker IDs, D1 UUID or HTTP response bodies.
"""
import hashlib
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

WORKER="trendos-customer-portal-isolated-stage-v0"
D1_NAME="trendos-zg-customer-stage-synthetic-20261101-v0"
APP="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
FLAGS=[
 "TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED",
 "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED",
 "TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED",
 "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED",
 "TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED",
 "TRENDOS_CUSTOMER_PORTAL_NATIVE_PASSWORD_CHANGE_V0_ENABLED",
 "TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED",
 "TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED",
 "TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED",
 "TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED",
 "TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED"
]
def stop(code):
    raise SystemExit("ISOLATED_ACCESS_STOP_"+code)
def require(test,code):
    if not test:stop(code)

account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
reader=os.environ.get("CLOUDFLARE_API_TOKEN","")
writer=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN","")
require(bool(re.fullmatch(r"[a-fA-F0-9]{32}",account)),"ACCOUNT_INVALID")
require(len(reader)>20 and len(writer)>20 and reader!=writer,"MISSING_SEPARATE_SCOPED_TOKENS")
require(os.environ.get("GITHUB_EVENT_NAME")=="pull_request","NOT_EXPLICIT_PR")
require(os.environ.get("GITHUB_HEAD_REF")=="ops/customer-stage-access-deny-only-new-token-once-20261101","WRONG_SOURCE_BRANCH")
source=pathlib.Path(".stage-original/cloudflare-d1/wrangler.customer-stage.toml").read_text()
require(re.search(r'^name\s*=\s*"'+WORKER+r'"\s*$',source,re.M),"SOURCE_WRONG_WORKER")
require(re.search(r'^workers_dev\s*=\s*false\s*$',source,re.M) and
        re.search(r'^preview_urls\s*=\s*false\s*$',source,re.M),"SOURCE_NOT_PRIVATE")
require(not re.search(r"^\s*(route|routes|custom_domains)\s*=",source,re.M),"SOURCE_ROUTE")
require(all(re.search(r'^'+re.escape(f)+r'\s*=\s*"false"\s*$',source,re.M)
            for f in FLAGS),"SOURCE_CUSTOMER_NOT_OFF")
print("PR_SOURCE_AND_PINNED_OFF_CONFIG=VERIFIED",flush=True)

BASE="https://api.cloudflare.com/client/v4/accounts/"+account
def api(path,token,body=None):
    require(path.startswith("/") and not path.startswith("//"),"PATH")
    req=urllib.request.Request(BASE+path,method="POST" if body is not None else "GET",
        headers={"Authorization":"Bearer "+token,"Accept":"application/json",
                 "Content-Type":"application/json"},
        data=None if body is None else json.dumps(body,separators=(",",":")).encode())
    try:
        with urllib.request.urlopen(req,timeout=35) as response:
            status=response.status
            data=json.load(response)
    except urllib.error.HTTPError as exc:
        print("CF_ACCESS_HTTP_STATUS="+str(exc.code),flush=True)
        stop("API_REFUSED_NO_FALLBACK")
    except (TimeoutError,urllib.error.URLError,ValueError):
        stop("API_RESPONSE_UNCERTAIN_NO_RETRY")
    if not isinstance(data,dict) or data.get("success") is not True:
        codes=",".join(str(e.get("code","?")) for e in data.get("errors",[])
                       if isinstance(e,dict))
        print("CF_ACCESS_API_ERROR_CODES="+codes[:150],flush=True)
        stop("API_REJECTED_NO_FALLBACK")
    return data["result"],status

w,_=api("/workers/workers/"+WORKER,reader)
require(isinstance(w,dict) and w.get("name")==WORKER and
        bool(re.fullmatch(r"[a-fA-F0-9-]{32,36}",str(w.get("id","")))),
        "WORKER_ID_MISMATCH")
wid=w["id"]
sub,_=api("/workers/scripts/"+WORKER+"/subdomain",reader)
require(isinstance(sub,dict) and
        sub.get("enabled") is False and sub.get("previews_enabled") is False,
        "WORKER_PUBLIC_OR_PREVIEW")
settings,_=api("/workers/scripts/"+WORKER+"/settings",reader)
bind=settings.get("bindings") if isinstance(settings,dict) else None
require(isinstance(bind,list),"WORKER_BINDINGS_UNREADABLE")
db=[b for b in bind if isinstance(b,dict) and (b.get("type")=="d1" or b.get("name")=="DB")]
require(len(db)==1 and db[0].get("type")=="d1" and db[0].get("name")=="DB",
        "WORKER_D1_BINDING_INEXACT")
require(not any(isinstance(b,dict) and
                b.get("type") in ("r2_bucket","kv_namespace","service","hyperdrive","queue")
                for b in bind),"OTHER_BINDING_UNSAFE")
# Only the existing independently provisioned synthetic D1 is acceptable.
datasets,_=api("/d1/database?page=1&per_page=100",reader)
require(isinstance(datasets,list) and len([d for d in datasets
    if isinstance(d,dict) and d.get("name")==D1_NAME and d.get("uuid")==db[0].get("id")])==1,
    "ISOLATED_D1_NOT_EXACT")
print("EXISTING_PRIVATE_STAGE_WORKER_AND_SYNTHETIC_D1=VERIFIED",flush=True)

# Inventory using the known read-only account token, full pagination.
apps=[]
for page in range(1,21):
    data,_=api("/access/apps?"+urllib.parse.urlencode({"page":page,"per_page":100}),reader)
    require(isinstance(data,list),"APPS_RESPONSE_INVALID")
    apps.extend(data)
    if len(data)<100:break
else:stop("APPS_INVENTORY_UNBOUNDED")
target=[a for a in apps if isinstance(a,dict) and (
        a.get("name")==APP or any(
         isinstance(d,dict) and d.get("type")=="worker" and d.get("worker_id")==wid
         for d in (a.get("destinations") or [])))]
require(len(target)==1 and target[0].get("name")==APP,"CREATED_APP_NOT_IN_INVENTORY_STOP")
if target:
    require(len(target)==1 and target[0].get("name")==APP,"ACCESS_APP_CONFLICT")
    print("ACCESS_APP_ALREADY_PRESENT_NO_SECOND_POST",flush=True)
    appid=target[0].get("id")
else:
    # Owner authorized ONLY initial private DENY EVERYONE, not Service Auth,
    # never allow/all_workers, workers.dev, preview, routes or customer traffic.
    body={"type":"self_hosted","name":APP,
          "destinations":[{"type":"worker","worker_id":wid}],
          "policies":[{"name":"DENY ALL TrendOS Isolated Stage",
                       "decision":"deny","include":[{"everyone":{}}]}],
          "session_duration":"1h","app_launcher_visible":False}
    require(len(body["destinations"])==1 and body["destinations"][0]["type"]=="worker",
            "POST_WRONG_SCOPE")
    print("ACCESS_DENY_ALL_SINGLE_CREATE_ATTEMPT=YES",flush=True)
    created,code=api("/access/apps",writer,body)
    require(code in (200,201) and isinstance(created,dict),"CREATE_ACK_UNVERIFIED")
    appid=created.get("id")
    print("ACCESS_CREATE_HTTP_STATUS="+str(code),flush=True)

require(isinstance(appid,str) and
        bool(re.fullmatch(r"[a-fA-F0-9-]{32,36}",appid)),"ACCESS_ID_NOT_VERIFIED")
actual,_=api("/access/apps/"+appid,writer)
require(isinstance(actual,dict) and actual.get("name")==APP,"ACCESS_READBACK_NAME")
dest=actual.get("destinations")
require(isinstance(dest,list) and len(dest)==1 and dest[0].get("type")=="worker" and
        dest[0].get("worker_id")==wid and not dest[0].get("overrides"),
        "ACCESS_DESTINATIONS_MISMATCH")
pol=actual.get("policies")
require(isinstance(pol,list) and len(pol)==1 and isinstance(pol[0],dict) and
        pol[0].get("decision")=="deny" and
        any(isinstance(x,dict) and x.get("everyone")=={} for x in
            (pol[0].get("include") or [])) and
        not pol[0].get("exclude") and not pol[0].get("require"),
        "DENY_ALL_POLICY_READBACK_UNVERIFIED")
after,_=api("/workers/scripts/"+WORKER+"/subdomain",reader)
require(after.get("enabled") is False and after.get("previews_enabled") is False,
        "WORKER_SUBDOMAIN_STATUS_CHANGED")
print("ACCESS_WORKER_SCOPED_DENY_EVERYONE_READBACK=PASS",flush=True)
print("ACCESS_APP_ID_SHA256_PREFIX="+hashlib.sha256(appid.encode()).hexdigest()[:12],flush=True)
print("WORKERS_DEV_AND_PREVIEW_DISABLED=YES",flush=True)
print("CUSTOMER_PUBLIC_INGRESS=OFF",flush=True)
print("CUSTOMER_GO_LIVE=NO_GO",flush=True)
