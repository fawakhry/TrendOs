#!/usr/bin/env python3
"""E2E against ACTUAL local Wrangler Worker + D1 + SQLite Durable Object.

Explicit TEST ONLY. Generated config has fake IDs, fake passwords, fake HMAC
secrets and a fresh --persist-to directory; never remote/deploy/production.
No Google, real customer data, Cloudflare account, OTP or external endpoints.
"""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

ROOT=Path(__file__).resolve().parents[1]
CF=ROOT/"cloudflare-d1"
WRANGLER=Path(os.environ["CUSTOMER_STAGE_LOCAL_WRANGLER"]).resolve()
SOURCE_CFG=CF/"wrangler.customer-stage.toml"
STAGE_ORIGIN="http://127.0.0.1:8000"
CODE="LOCAL-FIXTURE-PC-C1"
PASSWORD="LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL!"
CODE2="LOCAL-FIXTURE-PC-C2"
PASSWORD2="LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL_2!"
HMAC="LOCAL_SYNTHETIC_NOT_SECRET_SESSION_HMAC_2026_STRICTLY_TEST_ONLY"
THROTTLE="LOCAL_SYNTHETIC_NOT_SECRET_THROTTLE_HMAC_2026_TEST_ONLY"
DUMMY_UUID="00000000-0000-4000-8000-000000000001"
MIGRATIONS=[
    "0005_t12_production_create_canary.sql",
    "0006_t12_operational_runtime.sql",
    "0008_t12_customer_master.sql",
    "0032_customer_portal_identity_foundation_v1.sql",
    "0033_customer_portal_native_order_ownership_v1.sql",
]
NAME="trendos-customer-disposable-local-only"

def check(condition,message):
    if not condition:
        raise AssertionError(message)

def run(args,timeout=120):
    result=subprocess.run([str(WRANGLER),*map(str,args)],cwd=CF,text=True,
                          capture_output=True,timeout=timeout,
                          env={**os.environ,"CLOUDFLARE_API_TOKEN":"",
                               "CLOUDFLARE_ACCOUNT_ID":""})
    if result.returncode:
        # Wrangler errors are about disposable configs only; never pass real creds.
        raise RuntimeError("Wrangler local command failed "+
                           " ".join(map(str,args[:3]))+
                           ": "+(result.stderr[-1800:] or result.stdout[-1800:]))
    return result.stdout

def ephemeral_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1",0))
        return s.getsockname()[1]

def request(port,path,method="GET",payload=None,token=None,origin=STAGE_ORIGIN):
    headers={"Origin":origin,"CF-Connecting-IP":"192.0.2.17"}
    if payload is not None:
        headers["Content-Type"]="application/json"
    if token is not None:
        headers["Authorization"]="Bearer "+token
    data=json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None
    req=urllib.request.Request("http://127.0.0.1:%d%s"%(port,path),
                              data=data,method=method,headers=headers)
    if method=="POST" and data is None:
        req.add_header("Content-Type","application/json")
        data=b"{}"
        req.data=data
    try:
        response=urllib.request.urlopen(req,timeout=15)
    except urllib.error.HTTPError as e:
        response=e
    with response:
        content=response.read(100_000)
        return response.status,json.loads(content.decode())

def start_dev(conf,persist,port):
    proc=subprocess.Popen([str(WRANGLER),"dev","--local",
            "--config",conf.name,"--ip","127.0.0.1","--port",str(port),
            "--persist-to",str(persist),"--log-level","error"],
            cwd=CF,text=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,
            env={**os.environ,"CLOUDFLARE_API_TOKEN":"",
                 "CLOUDFLARE_ACCOUNT_ID":""})
    end=time.monotonic()+75
    while time.monotonic()<end:
        if proc.poll() is not None:
            err=proc.stderr.read()[-2500:]
            raise RuntimeError("Local Wrangler exited before readiness: "+err)
        try:
            # There is no /health route in our isolated Stage, HTTP 404 proves
            # its Worker fetch handler is responding.
            code,body=request(port,"/health")
            if code==404 and body.get("code")=="CUSTOMER_STAGE_ROUTE_NOT_FOUND":
                return proc
        except (OSError,ValueError,TimeoutError):
            pass
        time.sleep(0.45)
    proc.terminate()
    raise RuntimeError("Local Wrangler did not report healthy isolated route")

def stop_dev(proc):
    if proc is None:return
    if proc.poll() is None:
        proc.terminate()
        try:proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill();proc.wait(timeout=5)
    try:proc.stderr.close()
    except Exception:pass

def serve_browser_fixture(port=8000):
    """Same-origin LOCAL fixture for Chromium; never serve production files."""
    fixture=(ROOT/"tests/fixtures/customer-stage-browser-local.html").read_bytes()
    native=(ROOT/"customer-native-browser-transport-v0.js").read_bytes()
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path in ("/","/index.html"):
                body,content_type=fixture,"text/html; charset=utf-8"
            elif self.path=="/customer-native-browser-transport-v0.js":
                body,content_type=native,"text/javascript; charset=utf-8"
            else:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type",content_type)
            self.send_header("Content-Length",str(len(body)))
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            self.end_headers()
            self.wfile.write(body)
        def log_message(self,*args):
            pass
    server=ThreadingHTTPServer(("127.0.0.1",port),Handler)
    thread=Thread(target=server.serve_forever,daemon=True)
    thread.start()
    return server,thread

def seed_sql():
    statements=[
        "UPDATE customer_portal_native_control_v1 SET mode='GENERAL' WHERE singleton=1;"
    ]
    for ident,code,password in [("LOCAL-C1",CODE,PASSWORD),("LOCAL-C2",CODE2,PASSWORD2)]:
        salt=("09" if ident=="LOCAL-C1" else "0a")*16
        verifier=hashlib.pbkdf2_hmac("sha256",password.encode(),
                                    bytes.fromhex(salt),100000).hex()
        statements+= [
          "INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source,legacy_chat_code) VALUES ('%s','LOCAL FAKE CUSTOMER','%s','cloud-native','%s');"%(ident,ident,code),
          "INSERT INTO customer_portal_native_accounts_v1 "+
          "(customer_id,portal_code,state,password_scheme,password_salt_hex,"+
          "password_hash_hex,password_iterations,must_change,verified_enrollment_ref) "+
          "VALUES ('%s','%s','ACTIVE','pbkdf2-sha256-v1','%s','%s',100000,0,'LOCAL_FIXTURE_INDEPENDENT_REVIEW_ONLY');"%(ident,code,salt,verifier)
        ]
        oid="LOCAL-ORDER-"+ident
        key="LOCAL-REQ-"+ident
        line="LOCAL-LINE-"+ident
        statements+=[
          "INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status) "+
          "VALUES ('%s','LOCAL_TEST_ACTOR','LOCAL_TEST_EPOCH','{}','%s','COMMITTED');"%(key,oid),
          "INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,source,actor) "+
          "VALUES ('%s','%s','%s','LOCAL FAKE CUSTOMER','LOCAL_FAKE_PHONE','%s','الطباعة','عادي','طلب جديد','local-test','LOCAL_TEST_ACTOR');"%(oid,key,ident,ident),
          "INSERT INTO t12_prod_lines(line_id,order_id,request_key,ordinal,department,item_name,qty,priority,status,heat_press,fly_print) "+
          "VALUES ('%s','%s','%s',1,'الطباعة','FAKE PRINT REQUEST',2,'عادي','طلب جديد',0,0);"%(line,oid,key),
          "INSERT INTO customer_portal_native_order_ownership_v1(order_id,customer_id,source,status,proof_ref,proof_method,verified_by,verified_at) "+
          "VALUES ('%s','%s','t12-cloud-native','VERIFIED','LOCAL_TEST_REVIEW_%s','OWNER_REVIEWED_EXACT_ID','LOCAL_TEST_ONLY','2026-10-24');"%(oid,ident,ident)
        ]
    return "\n".join(statements)+"\n"

def main():
    check(os.environ.get("CUSTOMER_STAGE_LOCAL_E2E")=="1",
          "Must opt in explicitly to disposable LOCAL test")
    check(WRANGLER.is_file(),"Wrangler executable missing")
    config=SOURCE_CFG.read_text()
    check('main = "customer-stage/index.mjs"' in config,"Unexpected Stage entry")
    check('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"' in config,
          "Checked-in Stage flag must remain false")
    check("database_id" not in config and "[[d1_databases]]" not in config,
          "Checked-in Stage must not contain any D1 binding")
    production=(CF/"wrangler.toml").read_text()
    check(NAME not in production and DUMMY_UUID not in production,
          "Synthetic local fixture unexpectedly referenced in prod")
    for f in MIGRATIONS:
        check((CF/"migrations"/f).is_file(),"Missing original source migration "+f)
    with tempfile.TemporaryDirectory(prefix="trendos-local-customer-e2e-") as td:
        working=Path(td)
        persist=working/"persist"
        persist.mkdir()
        local=CF/".wrangler-customer-local-e2e-ci.toml"
        # Refuse a pre-existing file to avoid replacing someone else's config.
        check(not local.exists(),"Refuse to overwrite a Wrangler config")
        proc=None
        try:
            # ONLY this generated temp config enables Stage, never commit it.
            for name in (
              "TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED",
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED",
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED",
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED"
            ):
                original=name+' = "false"'
                check(config.count(original)==1,"Invalid OFF gate "+name)
                config=config.replace(original,name+' = "true"')
            needle='TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED = "true"'
            config=config.replace(needle,needle+"\n"+
              'TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET = "'+HMAC+'"\n'+
              'TRENDOS_CUSTOMER_PORTAL_THROTTLE_HMAC_SECRET = "'+THROTTLE+'"')
            config+='\n[[d1_databases]]\n'
            config+='binding = "DB"\n'
            config+='database_name = "'+NAME+'"\n'
            config+='database_id = "'+DUMMY_UUID+'"\n'
            config+='migrations_dir = "migrations"\n'
            local.write_text(config)
            for f in MIGRATIONS:
                run(["d1","execute",NAME,"--local","--config",local.name,
                     "--persist-to",persist,"--file",CF/"migrations"/f])
            seed=working/"local-fixture-seed.sql"
            seed.write_text(seed_sql())
            run(["d1","execute",NAME,"--local","--config",local.name,
                 "--persist-to",persist,"--file",seed])
            port=ephemeral_port()
            proc=start_dev(local,persist,port)
            paths={"login":"/v1/customer/native/login",
                   "orders":"/v1/customer/native/orders?limit=40&offset=0",
                   "logout":"/v1/customer/native/logout"}
            status,forbid=request(port,paths["orders"],origin="https://evil.test")
            check(status==403 and forbid.get("code")=="CUSTOMER_STAGE_ORIGIN_FORBIDDEN",
                  "Origin not rejected")
            status,unknown=request(port,"/v1/legacy-api")
            check(status==404 and unknown.get("code")=="CUSTOMER_STAGE_ROUTE_NOT_FOUND",
                  "Legacy/employee path must not exist in standalone Stage")
            status,first=request(port,paths["login"],method="POST",
                                 payload={"portalCode":CODE,"password":PASSWORD})
            check(status==200 and first.get("customerSessionIssued") is True and
                  len(first.get("token",""))==64,
                  "Real-local login+Durable Object+PBKDF2+D1 failed: "+
                  str(status)+" "+str(first.get("code")))
            token=first["token"]
            status,own=request(port,paths["orders"],token=token)
            check(status==200 and own.get("success") is True and
                  {x["orderId"] for x in own.get("lines",[])}=={"LOCAL-ORDER-LOCAL-C1"},
                  "Real-local D1 order read violated exact owner scope")
            status,other=request(port,paths["login"],method="POST",
                                payload={"portalCode":CODE2,"password":PASSWORD2})
            check(status==200 and other.get("customerSessionIssued") is True,
                  "Second synthetic tenant login failed")
            token2=other["token"]
            status,otherorders=request(port,paths["orders"],token=token2)
            check(status==200 and
                  {x["orderId"] for x in otherorders.get("lines",[])}=={"LOCAL-ORDER-LOCAL-C2"},
                  "Cross-customer access isolation failed")
            status,bye=request(port,paths["logout"],method="POST",token=token)
            check(status==200 and bye.get("sessionRevoked") is True,
                  "Local true D1 CAS token revoke failed")
            status,denied=request(port,paths["orders"],token=token)
            check(status==401 and denied.get("code")=="CUSTOMER_SESSION_REJECTED",
                  "Revoked session was accepted")
            status,replay=request(port,paths["logout"],method="POST",token=token)
            check(status==401,"Replayed logout accepted")
            status,otherstill=request(port,paths["orders"],token=token2)
            check(status==200 and len(otherstill.get("lines",[]))==1,
                  "Other tenant lost session after first tenant revoke")
            # Run the unchanged original browser dispatcher in a TEST-ONLY
            # Node VM. Its test window.fetch diverts the exact pinned API
            # origin to THIS loopback Worker; it checks real HTTP OPTIONS
            # CORS preflight, C1-only orders, D1 CAS logout and no Google.
            # Never load/activate the browser switch on the real portal.
            bridge=subprocess.run(
                ["node",str(ROOT/"tests/customer_stage_browser_adapter_real_http_local.mjs")],
                cwd=ROOT,text=True,capture_output=True,timeout=45,
                env={**os.environ,"CUSTOMER_STAGE_LOCAL_PORT":str(port),
                     "CLOUDFLARE_API_TOKEN":"","CLOUDFLARE_ACCOUNT_ID":""}
            )
            if bridge.returncode:
                raise AssertionError("Local browser adapter bridge failed: "+
                                     bridge.stderr[-3000:])
            check("PASS: source customer browser adapter" in bridge.stdout,
                  "Browser adapter did not attest local preflight")
            print(bridge.stdout.strip())
            # REAL Chromium browser loads original Native adapter from an
            # isolated loopback origin and performs browser-enforced CORS.
            # Third C1 login leaves TWO wrong attempts before DO 5/15m cap.
            local_browser,thread=serve_browser_fixture(8000)
            # Deliberately unauthorized browser Origin for negative Chromium
            # CORS testing. Only HTTP loopback; never a public origin.
            hostile_browser,hostile_thread=serve_browser_fixture(8001)
            try:
                browser=subprocess.run(
                    ["node",str(ROOT/"tests/customer_stage_chromium_real_browser_local.cjs")],
                    cwd=ROOT,text=True,capture_output=True,timeout=100,
                    env={**os.environ,"CUSTOMER_STAGE_LOCAL_PORT":str(port),
                         "CLOUDFLARE_API_TOKEN":"","CLOUDFLARE_ACCOUNT_ID":""}
                )
                if browser.returncode:
                    raise AssertionError("Real Chromium portal bridge failed: "+
                                         browser.stderr[-5000:]+
                                         "\\nBROWSER_STDOUT:"+browser.stdout[-1500:])
                check("PASS: actual Chromium browser DOM customer login" in browser.stdout,
                      "Real browser did not confirm local D1/DO portal flow")
                print(browser.stdout.strip())
            finally:
                local_browser.shutdown()
                local_browser.server_close()
                thread.join(timeout=5)
                hostile_browser.shutdown()
                hostile_browser.server_close()
                hostile_thread.join(timeout=5)
            # C1 now performed three valid logins (Python+VM+Chromium).
            for i in range(2):
                status,wrong=request(port,paths["login"],method="POST",
                    payload={"portalCode":CODE,"password":"LOCAL-WRONG-PASSWORD-"+str(i)+"-NOT_REAL"})
                check(status==401,"Expected generic rejection for bad local password")
            status,blocked=request(port,paths["login"],method="POST",
                                 payload={"portalCode":CODE,"password":PASSWORD})
            check(status==429 and blocked.get("code")=="CUSTOMER_NATIVE_LOGIN_RATE_LIMITED",
                  "Real local Durable Object limiter did not enforce 5/15m code cap")
            stop_dev(proc);proc=None
            proc=start_dev(local,persist,port)
            status,persisted=request(port,paths["login"],method="POST",
                     payload={"portalCode":CODE,"password":PASSWORD})
            check(status==429 and persisted.get("code")=="CUSTOMER_NATIVE_LOGIN_RATE_LIMITED",
                  "Rate counter did not survive local Worker restart")
            status,otherafter=request(port,paths["orders"],token=token2)
            check(status==200 and len(otherafter.get("lines",[]))==1,
                  "D1 owner read did not survive local Worker restart")
            print("PASS: Wrangler local D1+SQLite Durable Object + original Node VM adapter + REAL Chromium browser: owner-isolated login/orders, CAS revoke, browser-native CORS, 5/15m and restart persistence")
            print("NO_DEPLOY=YES; CLOUD_CUSTOMER_DB_UNTOUCHED=YES; STAGE_REMOTE_UNPROVISIONED=YES")
        finally:
            stop_dev(proc)
            try: local.unlink(missing_ok=True)
            except Exception:pass

if __name__=="__main__":
    main()
