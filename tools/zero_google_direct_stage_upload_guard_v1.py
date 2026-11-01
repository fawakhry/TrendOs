#!/usr/bin/env python3
"""Read-only guard for uploading one isolated OFF customer Worker VERSION.

No credentials, Cloudflare/GitHub API calls, D1/R2 data, remote upload,
deployment, or worker activation. This is a SOURCE check, not cloud proof.
"""
import pathlib
import re

ROOT=pathlib.Path(__file__).resolve().parents[1]
STAGE_CONFIG="cloudflare-d1/wrangler.customer-stage.toml"
UPLOAD_WORKFLOW=".github/workflows/trendos-zero-google-cloudflare-direct-stage-upload-only.yml"
STAGE_JS="cloudflare-d1/customer-stage/index.mjs"
PROD_CONFIG="cloudflare-d1/wrangler.toml"
PROD_SHADOW="cloudflare-d1/production-shadow/index.js"
STAGE_WORKER_NAME="trendos-customer-portal-isolated-stage-v0"
REQUIRED_FALSE=(
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

def inspect(override=None):
    """Validate actual source or local synthetic modified copies."""
    source={k:(ROOT/k).read_text(encoding="utf8") for k in
            (STAGE_CONFIG,UPLOAD_WORKFLOW,STAGE_JS,PROD_CONFIG,PROD_SHADOW)}
    if override:source.update(override)
    cfg=source[STAGE_CONFIG]
    workflow=source[UPLOAD_WORKFLOW]
    stage=source[STAGE_JS]
    prod=source[PROD_CONFIG]
    shadow=source[PROD_SHADOW]
    checks={}
    def check(key,ok):checks[key]=bool(ok)
    check("unique_nonproduction_stage_identity",
          bool(re.search(r'^name\s*=\s*"'+STAGE_WORKER_NAME+r'"\s*$',cfg,re.M)) and
          STAGE_WORKER_NAME not in ("trendos","trendos-d1-api",
                                    "trendos-server68-isolated-stage"))
    check("stage_route_and_preview_disabled",
          bool(re.search(r'^workers_dev\s*=\s*false\s*$',cfg,re.M)) and
          bool(re.search(r'^preview_urls\s*=\s*false\s*$',cfg,re.M)) and
          not re.search(r'^\s*(route|routes|custom_domains)\s*=',cfg,re.M))
    check("all_stage_read_and_write_feature_flags_explicitly_false",
          all(bool(re.search(r'^'+re.escape(flag)+r'\s*=\s*"false"\s*$',cfg,re.M))
              for flag in REQUIRED_FALSE))
    check("no_actual_d1_r2_kv_prod_bindings_or_external_auth",
          not re.search(r'\[\[(d1_databases|r2_buckets|kv_namespaces|services|hyperdrive)\]\]',
                        cfg,re.I) and
          not re.search(r'^\s*(database_id|bucket_name|zone_id|account_id|api_token)\s*=',
                        cfg,re.M|re.I))
    check("stage_imported_only_from_isolated_worker",
          'main = "customer-stage/index.mjs"' in cfg and
          "TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED!=='true'" in stage and
          "'customer-stage'" not in shadow and
          'main = "production-shadow/index.js"' in prod)
    check("manual_only_no_auto_push_or_pr_cloud_upload",
          bool(re.search(r'^on:\s*\n\s+workflow_dispatch:',workflow,re.M)) and
          not re.search(r'^\s+(push|pull_request|schedule|repository_dispatch):',
                        workflow,re.M))
    check("explicit_full_sha_account_and_branch_confirmation",
          "UPLOAD_ISOLATED_ZERO_GOOGLE_VERSION_ONLY" in workflow and
          'test "$INPUT_EXPECTED_SHA" = "$(git rev-parse HEAD)"' in workflow and
          'test "$INPUT_EXPECTED_ACCOUNT_ID" = "$CLOUDFLARE_ACCOUNT_ID"' in workflow and
          "chore/zero-google-direct-cloudflare-stage-upload-v1-20261101" in workflow)
    check("upload_only_no_traffic_deploy_or_fallback",
          bool(re.search(r'wrangler"?\s+versions\s+upload\s*\\',workflow,re.I)) and
          "wrangler.customer-stage.toml" in workflow and
          "WRANGLER_VERSIONS_DEPLOY_NOT_EXECUTED=YES" in workflow and
          "NEVER fallback to deploy" in workflow and
          "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}" in workflow and
          "CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" in workflow and
          not re.search(r'\bwrangler"?\s+(?:deploy\s+--config|versions\s+deploy|d1\s+execute)',
                        workflow))
    failed=[k for k,ok in checks.items() if not ok]
    return {
        "version":"ZERO_GOOGLE_DIRECT_CLOUDFLARE_STAGE_VERSION_UPLOAD_OFF_V1",
        "sourceGuardsPass":not failed,
        "sourceFailures":failed,
        "checks":checks,
        "stageWorkerName":STAGE_WORKER_NAME,
        "workerCanBeBuiltLocally":True,
        "cloudflareApiTokenPresent":None,
        "actualCloudflareVersionUploaded":False,
        "workerDeployedToTraffic":False,
        "productionDataChanged":False,
        "remoteUbuntuConnected":False,
        "versionUploadNeedsCloudflareAccountCredentials":True,
        "liveCustomerGoogleActionsRetiredLastProven":0,
        "productionGo":False,
        "note":"Only the separately confirmed manual GitHub workflow can upload a version. No deploy or public URL."
    }

if __name__=="__main__":
    report=inspect()
    import json
    print(json.dumps(report,indent=2,sort_keys=True))
    if not report["sourceGuardsPass"]:
        raise SystemExit(1)
