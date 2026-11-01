#!/usr/bin/env python3
"""Reuse Zero Google #311 ORIGINAL Wrangler/D1/R2 stage fixtures, not a copied backend.

- Checks out PR311 exact pinned commit in a separate CI directory.
- Builds only a disposable LOCAL Wrangler config, D1 and R2 in tempfile.
- Calls main branch's original coordinator + loopback HTTP adapter with fake
  Native login bearers created by actual isolated local Workerd.
- Never deploys, accesses Cloudflare remotely, or reads real customer data.
"""
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parents[1]
SOURCE_SHA="0ff6ce9f1dfcc5d9dba319c13bd6a6c553f40009"
STAGE=Path(os.environ.get("CUSTOMER_UPLOAD_ZERO_GOOGLE_CHECKOUT","")).resolve()
BRIDGE=HERE/"tests/customer_native_upload_real_wrangle_bridge_off.cjs"
OPT_IN=os.environ.get("CUSTOMER_UPLOAD_REAL_LOCAL_E2E")=="1"
FLAGS=(
  "TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED",
  "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED",
  "TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED",
  "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED",
  "TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED",
  "TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED",
  "TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED",
  "TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED",
  "TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED",
)
def check(test,message):
    if not test:raise AssertionError(message)
def stage_module():
    check(OPT_IN,"Explicit disposable local E2E opt-in missing")
    check(STAGE.is_dir() and STAGE!=HERE,"Independent PR311 checkout missing")
    checked=subprocess.run(["git","rev-parse","HEAD"],cwd=STAGE,
                           capture_output=True,text=True,check=True).stdout.strip()
    check(checked==SOURCE_SHA,"Zero Google fixture HEAD drift — refuse test")
    script=STAGE/"tests/customer_stage_wrangle_local_real_d1_do_e2e.py"
    check(script.is_file(),"Original PR311 local harness missing")
    spec=importlib.util.spec_from_file_location("zero_google_original_fixture",script)
    m=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    check(m.ROOT==STAGE and m.CF==STAGE/"cloudflare-d1","Imported wrong Stage")
    check(m.WRANGLER.is_file(),"Wrangler binary not present")
    check(m.SOURCE_CFG.read_text().count('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"')==1,
          "Original Stage no longer default OFF")
    check("[[d1_databases]]" not in m.SOURCE_CFG.read_text() and
          "[[r2_buckets]]" not in m.SOURCE_CFG.read_text(),
          "Unapproved checked-in Cloud D1/R2 binding")
    check(not (m.CF/"wrangler.toml").read_text().count(m.NAME),
          "Synthetic test database conflicts with production config")
    return m

def local_conf(m):
    cfg=m.SOURCE_CFG.read_text()
    for name in FLAGS:
        off=name+' = "false"'
        check(cfg.count(off)==1,"Original Stage OFF contract changed: "+name)
        cfg=cfg.replace(off,name+' = "true"')
    marker='TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED = "true"'
    check(cfg.count(marker)==1,"Expected logout staging flag missing")
    cfg=cfg.replace(marker,marker+'\n'+
        'TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET = "'+m.HMAC+'"\n'+
        'TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET = "'+m.THROTTLE+'"')
    cfg+='\n[[d1_databases]]\n'
    cfg+='binding = "DB"\n'
    cfg+='database_name = "'+m.NAME+'"\n'
    cfg+='database_id = "'+m.DUMMY_UUID+'"\n'
    cfg+='migrations_dir = "migrations"\n'
    cfg+='\n[[r2_buckets]]\n'
    cfg+='binding = "CUSTOMER_DRAFT_FILES_BUCKET"\n'
    cfg+='bucket_name = "trendos-local-customer-draft-not-real"\n'
    check("workers_dev = false" in cfg and "preview_urls = false" in cfg,
          "Stage exposure flags changed")
    return cfg

def serve_native_customer_browser_stage(port):
    """Serve ONLY the 4 known UI assets from THIS tested source; no arbitrary path."""
    assets={
        "/customer-portal-native-stage-v0.html":("customer-portal-native-stage-v0.html","text/html; charset=utf-8"),
        "/customer-portal-native-browser-stage-v0.js":("customer-portal-native-browser-stage-v0.js","text/javascript; charset=utf-8"),
        "/customer-native-upload-coordinator-off-v0.js":("customer-native-upload-coordinator-off-v0.js","text/javascript; charset=utf-8"),
        "/customer-native-ui-stage-plan-off-v0.js":("customer-native-ui-stage-plan-off-v0.js","text/javascript; charset=utf-8"),
    }
    class Fixture(BaseHTTPRequestHandler):
        def log_message(self,*_args):pass
        def do_GET(self):
            url=urlsplit(self.path)
            if url.path=="/favicon.ico":
                self.send_response(204);self.end_headers();return
            if url.path not in assets:
                self.send_error(404);return
            filename,mime=assets[url.path]
            blob=(HERE/filename).read_bytes()
            # No browser behavior on any ordinary or public URL. Only this
            # disposable local test opt-in inserts the Stage configuration.
            if filename.endswith(".html") and url.query!="unconfigured=1":
                shim=(
                    '<script>window.TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY=true;'
                    'window.TRENDOS_CUSTOMER_NATIVE_PORTAL_TEST_CONFIG='
                    '{"enabled":true,"apiBase":"http://127.0.0.1:%d"};'
                    '</script></head>'%port
                ).encode()
                check(blob.count(b"</head>")==1,"Expected single Stage HTML head")
                blob=blob.replace(b"</head>",shim)
            self.send_response(200)
            self.send_header("Content-Type",mime)
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            self.send_header("Content-Length",str(len(blob)))
            self.end_headers();self.wfile.write(blob)
    server=ThreadingHTTPServer(("127.0.0.1",8000),Fixture)
    thread=Thread(target=server.serve_forever,daemon=True)
    thread.start()
    return server,thread

def inspect_db(persist):
    databases=[]
    for file in persist.rglob("*.sqlite"):
        try:
            db=sqlite3.connect(f"file:{file}?mode=ro",uri=True)
            tables={r[0] for r in db.execute(
                "SELECT name FROM sqlite_master WHERE type='table'")}
            if "customer_portal_native_draft_files_v1" in tables:
                databases.append((file,db))
            else:db.close()
        except sqlite3.Error:
            pass
    check(len(databases)==1,"Expected exactly one disposable local D1 database")
    _,db=databases[0]
    try:
        def count(table):
            return db.execute("SELECT COUNT(*) FROM "+table).fetchone()[0]
        check(count("t12_prod_orders")==2,"Official production-shadow order table was modified")
        check(count("customer_portal_native_drafts_v1")==3,"Native draft count unexpectedly changed")
        check(count("customer_portal_native_draft_items_v1")==3,
              "Item idempotency failed in actual local D1")
        check(count("customer_portal_native_draft_files_v1")==4,
              "File idempotency failed in actual local D1")
        check(count("customer_portal_native_file_quarantine_v1")==4,
              "Quarantine ledger missing")
        assert db.execute("""SELECT COUNT(*) FROM customer_portal_native_draft_files_v1
                             WHERE state='READY'""").fetchone()[0]==4
        assert db.execute("""SELECT COUNT(*) FROM customer_portal_native_file_quarantine_v1
                             WHERE disposition='QUARANTINED' AND scan_completed=0
                             AND print_release_authorized=0""").fetchone()[0]==4
        # Physical owner from native account, not names/phones.
        assert db.execute("""SELECT COUNT(DISTINCT d.customer_id)
             FROM customer_portal_native_draft_files_v1 f
             JOIN customer_portal_native_drafts_v1 d ON d.draft_id=f.draft_id
             WHERE f.customer_id=d.customer_id""").fetchone()[0]==2
    finally:db.close()

def main():
    m=stage_module()
    with tempfile.TemporaryDirectory(prefix="trendos-upload-real-workerd-off-") as dir:
        workspace=Path(dir)
        persist=workspace/"persist"
        persist.mkdir()
        cfg=m.CF/".wrangler-customer-upload-bridge-local-ci.toml"
        check(not cfg.exists(),"Refusing to overwrite existing Wrangler config")
        proc=None
        browser_server=None
        browser_thread=None
        try:
            cfg.write_text(local_conf(m))
            for migration in m.MIGRATIONS:
                check((m.CF/"migrations"/migration).is_file(),
                      "Zero Google original migration not found")
                m.run(["d1","execute",m.NAME,"--local","--config",cfg.name,
                       "--persist-to",persist,"--file",m.CF/"migrations"/migration])
            fixture=workspace/"fixture-seed.sql"
            fixture.write_text(m.seed_sql())
            m.run(["d1","execute",m.NAME,"--local","--config",cfg.name,
                   "--persist-to",persist,"--file",fixture])
            port=m.ephemeral_port()
            proc=m.start_dev(cfg,persist,port)
            paths=[]
            for code,password in ((m.CODE,m.PASSWORD),(m.CODE2,m.PASSWORD2)):
                status,login=m.request(port,"/v1/customer/native/login",method="POST",
                       payload={"portalCode":code,"password":password})
                check(status==200 and login.get("customerSessionIssued") is True,
                      "Original Native PBKDF2/D1 login denied disposable fixture")
                bearer=login["token"]
                from secrets import token_hex
                status,draft=m.request(port,"/v1/customer/native/drafts",method="POST",
                           token=bearer,payload={"requestKey":token_hex(16)})
                check(status==201 and draft.get("officialOrderCreated") is False and
                      draft.get("draftId","").startswith("CDR-"),
                      "Original Native create draft denied fixture")
                paths.append((bearer,draft["draftId"]))
            bridge_env={
                **os.environ,"CLOUDFLARE_API_TOKEN":"","CLOUDFLARE_ACCOUNT_ID":"",
                "GOOGLE_APPLICATION_CREDENTIALS":"","OPENAI_API_KEY":"",
                "CUSTOMER_UPLOAD_REAL_LOCAL_E2E":"1",
                "CUSTOMER_UPLOAD_LOCAL_BASE":"http://127.0.0.1:"+str(port),
                "CUSTOMER_UPLOAD_BEARER_C1":paths[0][0],
                "CUSTOMER_UPLOAD_DRAFT_C1":paths[0][1],
                "CUSTOMER_UPLOAD_BEARER_C2":paths[1][0],
                "CUSTOMER_UPLOAD_DRAFT_C2":paths[1][1],
            }
            result=subprocess.run(["node",str(BRIDGE)],cwd=HERE,
                 env=bridge_env,capture_output=True,text=True,timeout=100)
            # A failing test must never dump customer bearer/password values.
            output=result.stdout+result.stderr
            for token in [*map(lambda p:p[0],paths),m.PASSWORD,m.PASSWORD2,m.HMAC]:
                check(token not in output,"Unsafe test output included fixture secret")
            check(result.returncode==0,
                  "Coordinator/Workerd integration failed (sanitized): "+output[-2200:])
            assert '"stage":"REAL_LOCAL_WORKER_D1_R2"' in output
            assert '"customerGoLive":"NO_GO"' in output
            print("PASS: Original independent Native D1 login, main coordinator/adapter, real local Workerd+D1+R2 idempotent retries")
            browser_server,browser_thread=serve_native_customer_browser_stage(port)
            browser_env={
                **bridge_env,
                "CUSTOMER_NATIVE_BROWSER_UI_LOCAL_E2E":"1",
                "CUSTOMER_UI_CODE_C1":m.CODE,
                "CUSTOMER_UI_PASS_C1":m.PASSWORD,
                "CUSTOMER_UI_CODE_C2":m.CODE2,
                "CUSTOMER_UI_PASS_C2":m.PASSWORD2,
            }
            real_ui=subprocess.run(
                ["node",str(HERE/"tests/customer_native_browser_full_ui_real_local.cjs")],
                cwd=HERE,env=browser_env,capture_output=True,text=True,timeout=115)
            public_log=real_ui.stdout+real_ui.stderr
            for secret in [*map(lambda p:p[0],paths),m.PASSWORD,m.PASSWORD2,m.HMAC]:
                check(secret not in public_log,"Browser E2E logs leaked a test-only credential")
            check(real_ui.returncode==0,
                  "Real Chromium customer stage UI failed (sanitized): "+public_log[-1800:])
            check("NO_REMOTE_HTTP=YES" in public_log,
                  "Real browser did not prove local-only network rule")
            print("PASS: REAL Chromium full native customer portal Stage, private file upload, D1 owner history and no live order")
        finally:
            if browser_server:
                browser_server.shutdown()
                browser_server.server_close()
                if browser_thread:browser_thread.join(timeout=5)
            m.stop_dev(proc)
            try:cfg.unlink(missing_ok=True)
            except Exception:pass
        inspect_db(persist)
        print("PASS: Disposable D1 exactly 2 account owners, 3 drafts, 3 items, 4 quarantined private files; original 2 official orders untouched")
        print("NO_REMOTE_DEPLOY=YES; CUSTOMER_LIVE_ACTIVATION=OFF; CUSTOMER_RELEASE=NO_GO")

if __name__=="__main__":main()
