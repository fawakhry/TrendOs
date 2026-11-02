#!/usr/bin/env python3
"""Read ONLY Cloudflare control plane to safely reconstruct a temporary Wrangler
configuration for the ALREADY owner-approved nonpublic isolated customer Stage.

Does NOT create/update DB or Worker, invoke Wrangler, query D1 rows, or
activate routes. Runtime secrets are never written, and only the exact Stage
D1 UUID is written to a transient local file for a deliberate version upload.
"""
from __future__ import annotations
import json
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import urllib.error

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"cloudflare-d1/wrangler.customer-stage.toml"
WORKER="trendos-customer-portal-isolated-stage-v0"
DBNAME="trendos-zg-customer-stage-synthetic-20261101-v0"
REQUIRED_OFF=(
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
    "TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED",
)
def fail(msg):raise ValueError("ZG_STAGE_D1_BINDING_RESOLVER_DENIED_"+msg)

def source_ok(s):
    if not re.search(r'^name\s*=\s*"'+WORKER+r'"\s*$',s,re.M):fail("WRONG_WORKER")
    if not re.search(r'^main\s*=\s*"customer-stage/index.mjs"\s*$',s,re.M):fail("WRONG_ENTRY")
    for k in ("workers_dev","preview_urls"):
        if not re.search(r'^'+k+r'\s*=\s*false\s*$',s,re.M):fail("PUBLIC_ACCESS_FLAG")
    if re.search(r'^\s*(route|routes|custom_domains)\s*=',s,re.M):fail("PUBLIC_ROUTE")
    if re.search(r'\[\[(d1_databases|r2_buckets|kv_namespaces|services|hyperdrive)\]\]',s,re.I):fail("SOURCE_BINDINGS_NOT_ORIGINAL")
    for k in REQUIRED_OFF:
        if not re.search(r'^'+k+r'\s*=\s*"false"\s*$',s,re.M):fail("STAGE_FLAG_ON")
    return True

def resolved_config(source,settings,subdomain,databases):
    source_ok(source)
    if not isinstance(subdomain,dict) or subdomain.get("enabled") is not False or subdomain.get("previews_enabled") is not False:
        fail("REMOTE_WORKER_PUBLIC")
    if not isinstance(settings,dict):fail("REMOTE_SETTINGS_UNKNOWN")
    bindings=settings.get("bindings")
    if not isinstance(bindings,list):fail("REMOTE_BINDINGS_UNKNOWN")
    disallowed={"r2_bucket","kv_namespace","service","hyperdrive","queue","send_email"}
    if any(b.get("type") in disallowed for b in bindings if isinstance(b,dict)):fail("UNAUTHORIZED_REMOTE_BINDING")
    exact=[b for b in bindings if isinstance(b,dict) and (b.get("name")=="DB" or b.get("type")=="d1")]
    if len(exact)!=1 or exact[0].get("name")!="DB" or exact[0].get("type")!="d1":
        fail("REMOTE_DB_BINDING_NOT_EXACT")
    uuid=exact[0].get("id")
    if not isinstance(uuid,str) or not re.fullmatch(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',uuid):
        fail("REMOTE_DB_ID_INVALID")
    if not isinstance(databases,list):fail("DB_INVENTORY_UNKNOWN")
    matches=[d for d in databases if isinstance(d,dict) and d.get('name')==DBNAME]
    if len(matches)!=1 or matches[0].get('uuid')!=uuid:fail("DB_INVENTORY_IDENTITY_MISMATCH")
    return source.rstrip()+"\n\n[[d1_databases]]\nbinding = \"DB\"\ndatabase_name = \""+DBNAME+"\"\ndatabase_id = \""+uuid+"\"\n"

def api_get(account,token,suffix):
    url="https://api.cloudflare.com/client/v4/accounts/"+account+suffix
    request=urllib.request.Request(url,headers={"Authorization":"Bearer "+token})
    try:
        with urllib.request.urlopen(request,timeout=25) as response:
            value=json.load(response)
    except urllib.error.HTTPError as e:
        fail("REMOTE_API_HTTP_"+str(e.code))
    if not isinstance(value,dict) or value.get("success") is not True:
        fail("REMOTE_API_UNSUCCESSFUL")
    return value

def read_d1_inventory(account,token):
    out=[]
    for page in range(1,31):
        v=api_get(account,token,"/d1/database?"+urllib.parse.urlencode({"page":page,"per_page":100}))
        result=v.get("result")
        if not isinstance(result,list):fail("REMOTE_D1_LIST_NOT_ARRAY")
        out.extend(result)
        info=v.get("result_info") or {}
        pages=int(info.get("total_pages") or 1)
        if page>=pages:return out
    fail("D1_INVENTORY_PAGINATION_CAP")

def main():
    if len(sys.argv)!=2:fail("USAGE_OUTPUT_PATH_REQUIRED")
    account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
    token=os.environ.get("CLOUDFLARE_API_TOKEN","")
    if not re.fullmatch(r'[0-9a-fA-F]{32}',account) or len(token)<20:
        fail("REAL_CLOUDFLARE_ACCOUNT_TOKEN_MISSING")
    out=pathlib.Path(sys.argv[1]).resolve()
    if out.suffix!=".toml" or not str(out).startswith(str(ROOT/"cloudflare-d1")+"/"):
        fail("OUTPUT_MUST_BE_TEMP_IN_CLOUDFLARE_SOURCE_DIR")
    if out.exists():fail("OUTPUT_ALREADY_EXISTS")
    src=SOURCE.read_text(encoding="utf-8")
    source_ok(src)
    root="/workers/scripts/"+WORKER
    sub=api_get(account,token,root+"/subdomain").get("result")
    sett=api_get(account,token,root+"/settings").get("result")
    dbs=read_d1_inventory(account,token)
    config=resolved_config(src,sett,sub,dbs)
    out.write_text(config,encoding="utf-8")
    out.chmod(0o600)
    print("ISOLATED_STAGE_D1_BINDING_RESOLVED_EXACT_ACCOUNT=YES")
    print("REMOTE_WORKER_PUBLIC_AND_PREVIEW=OFF")
    print("PRODUCTION_D1_OR_R2_BINDINGS=NOT_SELECTED")
    print("GOOGLE_LIVE_CUSTOMER_ACTIONS_RETIRED_LAST_PROVEN=0/9")

if __name__=="__main__":
    try:main()
    except ValueError as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
