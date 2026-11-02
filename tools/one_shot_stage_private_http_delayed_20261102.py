#!/usr/bin/env python3
"""Single-use restricted Stage HTTP admission probe; ALWAYS restore workers.dev OFF.
No production operations, client login, D1 writes, deploys or customer data.
Success requires exact Cloudflare Access Worker-ID scoped policies first.
"""
import hmac,json,os,re,sys,time,urllib.error,urllib.request,urllib.parse
SCRIPT="trendos-customer-portal-isolated-stage-v0"
APP="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
TOK="TrendOS Customer Isolated Stage Service Auth"
ACCOUNT=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
WORKER_TOKEN=os.environ.get("CLOUDFLARE_API_TOKEN","")
ACCESS_API=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN","")
READ_API=os.environ.get("CLOUDFLARE_SERVICE_TOKENS_READ_API_TOKEN","")
CLIENT_ID=os.environ.get("CF_STAGE_ACCESS_CLIENT_ID","")
CLIENT_SECRET=os.environ.get("CF_STAGE_ACCESS_CLIENT_SECRET","")
def safecheck(ok,code):
    if not ok:raise RuntimeError("STAGE_HTTP_SAFE_STOP_"+code)
def log(msg):print(msg,flush=True)
safecheck(os.environ.get("GITHUB_EVENT_NAME")=="pull_request" and
          os.environ.get("GITHUB_HEAD_REF")=="ops/customer-stage-private-http-delayed-once-20261102",
          "WRONG_CONTEXT")
safecheck(bool(re.fullmatch("[A-Fa-f0-9]{32}",ACCOUNT)) and
          all(len(x)>20 for x in (WORKER_TOKEN,ACCESS_API,READ_API,CLIENT_ID,CLIENT_SECRET)),
          "SECRET_MISSING")
base="https://api.cloudflare.com/client/v4/accounts/"+ACCOUNT
def api(method,path,token,payload=None):
    safecheck(path.startswith("/") and ".." not in path and
        (method=="GET" or (method=="POST" and
        path=="/workers/scripts/"+SCRIPT+"/subdomain" and
        payload in ({"enabled":True,"previews_enabled":False},
                    {"enabled":False,"previews_enabled":False}))),
        "API_ENDPOINT_FORBIDDEN")
    req=urllib.request.Request(base+path,method=method,headers={
        "Authorization":"Bearer "+token,"Accept":"application/json",
        "Content-Type":"application/json"},
        data=json.dumps(payload).encode() if payload is not None else None)
    try:
        with urllib.request.urlopen(req,timeout=20) as response:
            status=response.status;body=json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("STAGE_HTTP_SAFE_STOP_CLOUDFLARE_API_HTTP_"+str(exc.code))
    safecheck(status in (200,201) and isinstance(body,dict) and
              body.get("success") is True,"API_NO_SUCCESS")
    return body.get("result")
def get(path,token):return api("GET",path,token)
if "--cleanup-only" in sys.argv:
    try:
        api("POST","/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN,
            {"enabled":False,"previews_enabled":False})
        final=get("/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN)
        safecheck(isinstance(final,dict) and final.get("enabled") is False and
            final.get("previews_enabled") is False,
            "CLEANUP_INDEPENDENT_READBACK_FAILED")
        log("INDEPENDENT_STAGE_CLEANUP=CONFIRMED_OFF")
        sys.exit(0)
    except Exception:
        log("INDEPENDENT_STAGE_CLEANUP=FAILED_REQUIRES_OPERATOR")
        sys.exit(2)
worker=get("/workers/workers/"+SCRIPT,WORKER_TOKEN)
safecheck(isinstance(worker,dict) and worker.get("name")==SCRIPT and
    isinstance(worker.get("id"),str) and
    bool(re.fullmatch("[0-9A-Fa-f-]{32,36}",worker["id"])),
    "WRONG_WORKER")
wid=worker["id"]
sub=get("/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN)
safecheck(sub=={"enabled":False,"previews_enabled":False},
    "WORKER_ALREADY_PUBLIC_OR_RESPONSE_CHANGED")
settings=get("/workers/scripts/"+SCRIPT+"/settings",WORKER_TOKEN)
bindings=settings.get("bindings") if isinstance(settings,dict) else None
safecheck(isinstance(bindings,list),"WORKER_BINDINGS_NOT_READABLE")
d1=[b for b in bindings if isinstance(b,dict) and
    (b.get("type")=="d1" or b.get("name")=="DB")]
safecheck(len(d1)==1 and d1[0].get("type")=="d1" and d1[0].get("name")=="DB",
    "DB_BINDING_NOT_EXACT")
safecheck(not any(b.get("type") in ("r2_bucket","kv_namespace","service","hyperdrive")
    for b in bindings if isinstance(b,dict)),"UNEXPECTED_STORAGE_BINDING")
safecheck(not any(isinstance(b,dict) and
    b.get("name")=="TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED" and
    b.get("text")=="true" for b in bindings),
    "CUSTOMER_STAGE_IS_NOT_OFF")
dbs=get("/d1/database?page=1&per_page=100",WORKER_TOKEN)
safecheck(isinstance(dbs,list) and len([db for db in dbs
    if isinstance(db,dict) and db.get("name")==
       "trendos-zg-customer-stage-synthetic-20261101-v0" and
       db.get("uuid")==d1[0].get("id")])==1,
       "D1_NOT_SYNTHETIC")
log("EXACT_ISOLATED_WORKER_AND_D1_OFF=PASS")
app_list=get("/access/apps?per_page=100",ACCESS_API)
safecheck(isinstance(app_list,list),"ACCESS_LIST_MISSING")
matches=[x for x in app_list if isinstance(x,dict) and
    (x.get("name")==APP or any(isinstance(y,dict) and
    y.get("type")=="worker" and y.get("worker_id")==wid
    for y in x.get("destinations",[])))]
safecheck(len(matches)==1 and matches[0].get("name")==APP,
    "ACCESS_NOT_EXACT_APP")
app=get("/access/apps/"+matches[0]["id"],ACCESS_API)
safecheck(app.get("destinations")==[{"type":"worker","worker_id":wid}],
    "ACCESS_WRONG_DESTINATION")
pol=get("/access/apps/"+matches[0]["id"]+"/policies?per_page=100",ACCESS_API)
safecheck(isinstance(pol,list) and len(pol)==2,"ACCESS_POLICY_COUNT_NOT_TWO")
denied=[x for x in pol if isinstance(x,dict) and x.get("decision")=="deny"]
allowed=[x for x in pol if isinstance(x,dict) and x.get("decision")=="non_identity"]
safecheck(len(denied)==1 and denied[0].get("include")==[{"everyone":{}}]
    and not denied[0].get("exclude") and not denied[0].get("require"),
    "DENY_ALL_MISSING")
tokens=get("/access/service_tokens?per_page=100",READ_API)
safecheck(isinstance(tokens,list),"SERVICE_TOKEN_READ_REQUIRED")
mt=[t for t in tokens if isinstance(t,dict) and t.get("name")==TOK and
    isinstance(t.get("client_id"),str) and
    hmac.compare_digest(t.get("client_id"),CLIENT_ID)]
safecheck(len(mt)==1 and mt[0].get("enabled") is True,"SERVICE_TOKEN_ID_MISMATCH")
safecheck(len(allowed)==1 and allowed[0].get("include")==[
    {"service_token":{"token_id":mt[0]["id"]}}]
    and not allowed[0].get("exclude") and not allowed[0].get("require"),
    "SERVICE_AUTH_NOT_EXACT_ONE")
log("WORKER_SCOPED_DENY_ALL_PLUS_SINGLE_SERVICE_AUTH=PASS")
domain=get("/workers/subdomain",WORKER_TOKEN)
safecheck(isinstance(domain,dict) and
    bool(re.fullmatch("[a-z0-9-]{3,100}",str(domain.get("subdomain","")))),
    "ACCOUNT_SUBDOMAIN_NOT_VERIFIED")
url="https://"+SCRIPT+"."+domain["subdomain"]+".workers.dev/"
def http(headers):
    req=urllib.request.Request(url,headers=headers,method="GET")
    try:
        with urllib.request.urlopen(req,timeout=12) as response:
            return response.status,response.read(1600)
    except urllib.error.HTTPError as e:
        return e.code,e.read(1600)
    except (TimeoutError,urllib.error.URLError):
        return 0,b""
changed=False
verified_closed=False
try:
    # No login, no account creation, no D1 writes. Only GET / returns
    # CUSTOMER_STAGE_ROUTE_NOT_FOUND JSON when Access truly lets request through.
    result=api("POST","/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN,
        {"enabled":True,"previews_enabled":False})
    changed=True
    safecheck(isinstance(result,dict) and result.get("enabled") is True
        and result.get("previews_enabled") is False,"ENABLE_UNVERIFIED")
    log("TEMPORARY_PROTECTED_STAGE_URL=ENABLED_FOR_PROBE_ONLY")
    log("ROUTE_PROPAGATION_WAIT_SECONDS=10")
    time.sleep(10)

    # Require deny behavior *before* sending the credentialed request.
    for i in range(3):
        no_status,no_body=http({})
        if no_status in (401,403,302):break
        time.sleep(2)
    log("NO_AUTH_HTTP_STATUS="+str(no_status))
    safecheck(no_status in (401,403,302),"UNAUTHENTICATED_ACCESS_NOT_DENIED")
    wrong_status,wrong_body=http({
        "CF-Access-Client-Id":CLIENT_ID,
        "CF-Access-Client-Secret":CLIENT_SECRET+"-invalid"
    })
    log("WRONG_SECRET_HTTP_STATUS="+str(wrong_status))
    safecheck(wrong_status in (401,403,302),"WRONG_CLIENT_SECRET_NOT_DENIED")
    yes_status,yes_body=http({
        "CF-Access-Client-Id":CLIENT_ID,
        "CF-Access-Client-Secret":CLIENT_SECRET
    })
    # Up to two extra spaced read-only GETs accommodate edge propagation;
    # no login, writes, retries of Cloudflare POST or customer data.
    for i in range(2):
        if yes_status==404 and b'"code":"CUSTOMER_STAGE_ROUTE_NOT_FOUND"' in yes_body:
            break
        time.sleep(5)
        yes_status,yes_body=http({
            "CF-Access-Client-Id":CLIENT_ID,
            "CF-Access-Client-Secret":CLIENT_SECRET
        })
    log("SCOPED_SERVICE_AUTH_HTTP_STATUS="+str(yes_status))
    safecheck(yes_status==404 and
        b'"code":"CUSTOMER_STAGE_ROUTE_NOT_FOUND"' in yes_body and
        b'"source":"customer-stage-isolated-v0"' in yes_body,
        "AUTHORIZED_REQUEST_DID_NOT_REACH_EXACT_OFF_WORKER")
    log("PRIVATE_STAGE_AUTHENTICATED_HTTP=PASS")
finally:
    # A failed/uncertain enable is potentially live: ALWAYS force OFF
    # even when the POST response was lost.
    try:
        api("POST","/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN,
            {"enabled":False,"previews_enabled":False})
        check=get("/workers/scripts/"+SCRIPT+"/subdomain",WORKER_TOKEN)
        verified_closed=(isinstance(check,dict) and
            check.get("enabled") is False and check.get("previews_enabled") is False)
        log("STAGE_PUBLIC_SUBDOMAIN_RESTORED_OFF="+("PASS" if verified_closed else "FAIL"))
    except Exception:
        log("STAGE_PUBLIC_SUBDOMAIN_RESTORED_OFF=FAILED_REQUIRES_OPERATOR")
    if not verified_closed:
        raise RuntimeError("CRITICAL_STAGE_CLEANUP_NOT_VERIFIED")
log("CUSTOMER_PRODUCTION=NO_GO")
log("CUSTOMER_D1_WRITES=NONE")
