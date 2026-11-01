#!/usr/bin/env python3
"""Pure, fail-closed Cloudflare Access privacy qualification for TrendOS Stage.

SOURCE ONLY: this module does not call any API, create apps, enable endpoints,
provision tokens, mutate D1, or deploy Workers. A source check is NOT live
Access protection. Invoked by tests and future independently authorized probe.
"""
import json
import pathlib
import re

WORKER="trendos-customer-portal-isolated-stage-v0"
DATABASE="trendos-zg-customer-stage-synthetic-20261101-v0"
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
DISALLOWED_BINDINGS=frozenset(("r2_bucket","kv_namespace","service","hyperdrive","queue"))
def assess_private_customer_stage(*,worker,subdomain,settings,databases,access_apps,wrangler_source):
    """This assesses source and Cloudflare API response structures; it never
    claims that authenticated HTTP E2E, network policy, or the original
    customer UI has been remotely tested.
    """
    failures=[]
    def need(ok,code):
        if not ok:failures.append(code)
    wid=worker.get("id") if isinstance(worker,dict) else None
    need(isinstance(worker,dict) and worker.get("name")==WORKER and
         isinstance(wid,str) and bool(re.fullmatch(r"[0-9a-fA-F-]{32,36}",wid)),
         "ISOLATED_WORKER_ID_UNVERIFIED")
    need(isinstance(subdomain,dict) and subdomain.get("enabled") is False and
         subdomain.get("previews_enabled") is False,"STAGE_WORKERS_DEV_OR_PREVIEW_NOT_OFF")
    binds=settings.get("bindings") if isinstance(settings,dict) else None
    need(isinstance(binds,list),"REMOTE_WORKER_BINDINGS_NOT_READ")
    binds=binds if isinstance(binds,list) else []
    d1=[x for x in binds if isinstance(x,dict) and (x.get("name")=="DB" or x.get("type")=="d1")]
    need(len(d1)==1 and d1[0].get("name")=="DB" and d1[0].get("type")=="d1","ISOLATED_D1_BINDING_MISSING_OR_MULTIPLE")
    need(not any(isinstance(x,dict) and x.get("type") in DISALLOWED_BINDINGS for x in binds),
         "UNAUTHORIZED_REMOTE_STORAGE_OR_SERVICE_BINDING")
    dbid=d1[0].get("id") if d1 else None
    need(isinstance(databases,list) and len([x for x in databases if isinstance(x,dict) and
          x.get("name")==DATABASE and x.get("uuid")==dbid])==1,
         "EXACT_ISOLATED_SYNTHETIC_D1_IDENTITY_UNPROVEN")
    source=wrangler_source if isinstance(wrangler_source,str) else ""
    need(re.search(r'^name\s*=\s*"'+WORKER+r'"\s*$',source,re.M) is not None and
         re.search(r'^workers_dev\s*=\s*false\s*$',source,re.M) is not None and
         re.search(r'^preview_urls\s*=\s*false\s*$',source,re.M) is not None and
         not re.search(r'^\s*(routes?|custom_domains)\s*=',source,re.M),
         "STAGE_SOURCE_PUBLIC_ROUTE_OR_WRONG_WORKER")
    need(all(re.search(r'^'+re.escape(k)+r'\s*=\s*"false"\s*$',source,re.M)
             for k in REQUIRED_OFF),"STAGE_SOURCE_CUSTOMER_FEATURES_ENABLED")
    need(isinstance(access_apps,list),"CLOUDFLARE_ACCESS_APPS_INVENTORY_NOT_READ")
    matches=[]
    if isinstance(access_apps,list) and isinstance(wid,str):
        matches=[app for app in access_apps if isinstance(app,dict)
                 and any(d.get("type")=="worker" and d.get("worker_id")==wid
                         for d in app.get("destinations",[]) if isinstance(d,dict))]
    need(len(matches)==1,"EXACT_WORKER_ACCESS_APP_MISSING_OR_AMBIGUOUS")
    valid_policy=False
    if len(matches)==1:
        app=matches[0]
        dest=app.get("destinations") or []
        p=app.get("policies") or []
        # Require worker-wide protection, no public override or bypass.
        full=len(dest)==1 and dest[0].get("type")=="worker" and not dest[0].get("overrides")
        # Accept only a single narrow service_auth policy with exact token_id.
        # No policy for everyone, any_valid_service_token, or identity bypass.
        if full and len(p)==1 and isinstance(p[0],dict):
            policy=p[0]
            included=policy.get("include") or []
            valid_policy=(policy.get("decision")=="non_identity" and
                  len(included)==1 and isinstance(included[0],dict) and
                  isinstance(included[0].get("service_token"),dict) and
                  bool(re.fullmatch(r"[0-9a-fA-F-]{32,36}",
                                   str(included[0]["service_token"].get("token_id","")))) and
                  not policy.get("exclude") and not policy.get("require"))
        need(full,"ACCESS_PUBLIC_PATH_OVERRIDE_OR_EXTRA_DESTINATION")
        need(valid_policy,"EXACT_TOKEN_SERVICE_AUTH_POLICY_NOT_PROVEN")
    return {
      "policy":"ZG_CUSTOMER_PRIVATE_ACCESS_FAIL_CLOSED_V1",
      "sourceStageOff":all(x not in failures for x in ("STAGE_SOURCE_PUBLIC_ROUTE_OR_WRONG_WORKER",
                              "STAGE_SOURCE_CUSTOMER_FEATURES_ENABLED")),
      "remotePrivateIngressReady":len(failures)==0,
      "failures":failures,
      "cloudflareAccessWritePermissionVerified":False,
      "customerOriginalBrowserRemoteE2ePassed":False,
      "customerGoogleActionsRetiredLiveLastProven":0,
      "publicRouteActivationAuthorized":False,
      "productionGo":False,
    }

if __name__=="__main__":
    source=(pathlib.Path(__file__).resolve().parents[1]/
            "cloudflare-d1/wrangler.customer-stage.toml").read_text(encoding="utf8")
    # Intentionally no fake remote proof, returning NOT READY until a trusted
    # Cloudflare readback of exact app/policies succeeds separately.
    report=assess_private_customer_stage(worker=None,subdomain=None,
        settings=None,databases=None,access_apps=None,wrangler_source=source)
    print(json.dumps(report,indent=2))
    if report["remotePrivateIngressReady"]:raise SystemExit(1)
