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
    "0013_employee_content_zero_google_v1.sql",
    "0032_customer_portal_identity_foundation_v1.sql",
    "0033_customer_portal_native_order_ownership_v1.sql",
    "0036_customer_portal_native_draft_create_v1.sql",
    "0037_customer_portal_native_draft_items_v1.sql",
    "0038_customer_portal_native_draft_file_r2_v1.sql",
    "0040_customer_portal_native_file_quarantine_v1.sql",
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

def file_request(port,path,data,token=None,origin=STAGE_ORIGIN,
                 content_type="image/png",request_key="f6"*16):
    headers={"Origin":origin,"Content-Type":content_type,
             "x-idempotency-key":request_key,
             "CF-Connecting-IP":"192.0.2.17"}
    if token is not None:
        headers["Authorization"]="Bearer "+token
    req=urllib.request.Request("http://127.0.0.1:%d%s"%(port,path),
            method="POST",data=data,headers=headers)
    try:
        response=urllib.request.urlopen(req,timeout=20)
    except urllib.error.HTTPError as e:
        response=e
    with response:
        return response.status,json.loads(response.read(100000).decode())

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
    # Serve the actual original customer-facing index/app/config, unmodified,
    # at a LOCAL browser-only path. No arbitrary filesystem exposure.
    customer_assets={
        "index.html", "config.js", "app.js", "styles.css",
        "matbagy_theme_v1860.css", "matbagy_theme_v1860.js",
        "browser-api-transport-v1.js",
        "customer-native-browser-transport-v0.js",
        "employee-api-dispatcher-v1.js",
        "trendos-return-traffic-quiet-v1.js",
        "customer_manager_d1_bridge_v1934.js",
        "customer_manager_v1933.js",
        "customer_manager_guard_v1933.js",
    }
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path=self.path.split("?",1)[0]
            if path in ("/","/index.html"):
                body,content_type=fixture,"text/html; charset=utf-8"
            elif path=="/customer-native-browser-transport-v0.js":
                body,content_type=native,"text/javascript; charset=utf-8"
            elif path.startswith("/real-portal/"):
                filename=path[len("/real-portal/"):] or "index.html"
                if filename not in customer_assets:
                    self.send_error(404)
                    return
                body=(ROOT/filename).read_bytes()
                content_type=("text/html" if filename.endswith(".html")
                              else "text/css" if filename.endswith(".css")
                              else "text/javascript")+"; charset=utf-8"
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
        "UPDATE customer_portal_native_control_v1 SET mode='GENERAL' WHERE singleton=1;",
        "UPDATE employee_content_control_v1 SET mode='READONLY' WHERE singleton=1;",
        "DELETE FROM employee_content_records_v1;",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('platform_sections','LOCAL-SEC','{"code":"LOCAL-SEC","name":"LOCAL SAFE SECTION","description":"LOCAL PUBLIC PRINT","internalNotes":"PRIVATE_EMPLOYEE_SECRET","commissionRate":93,"fileId":"PRIVATE_GOOGLE_FILE_ID"}',1,1,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('franchise_branches','LOCAL-PUBLIC','{"code":"LOCAL-PUBLIC","displayName":"LOCAL PUBLIC BRANCH","visibleArea":"LOCAL AREA","customerVisibility":"ظاهر كفرع مطبعجي","internalNotes":"PRIVATE_BRANCH_FINANCE","matbagyShare":91,"partnerPhone":"PRIVATE_PHONE"}',1,1,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('franchise_branches','LOCAL-HIDDEN','{"code":"LOCAL-HIDDEN","displayName":"SECRET BRANCH","customerVisibility":"مخفي","internalNotes":"PRIVATE_HIDDEN_SECRET"}',1,2,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('franchise_branches','LOCAL-UNREVIEWED','{"code":"LOCAL-UNREVIEWED","displayName":"UNREVIEWED PRIVATE BRANCH","internalNotes":"PRIVATE_MISSING_VISIBILITY"}',1,3,'LOCAL_FIXTURE');"""
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('marketplace_vendors','VEND-PUB','{"code":"VEND-PUB","vendorName":"LOCAL PUBLIC SHOP","category":"طباعة","whatsapp":"PRIVATE_VENDOR_PHONE","commission":83,"notes":"PRIVATE_ADMIN_NOTE","fileUrl":"https://drive.google.com/private"}',1,1,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('marketplace_vendors','VEND-HIDDEN','{"code":"VEND-HIDDEN","vendorName":"PRIVATE INACTIVE SHOP","notes":"PRIVATE_SHOP_NOTE"}',0,2,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('marketplace_products','PROD-PUB','{"code":"PROD-PUB","vendorCode":"VEND-PUB","productName":"LOCAL PUBLIC PRINT","description":"300 DPI","price":"25","unit":"قطعة","internalCost":6,"supplierPhone":"PRIVATE_SUPPLIER_PHONE","thumbnailUrl":"https://drive.google.com/private"}',1,1,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('marketplace_products','PROD-ORPHAN','{"code":"PROD-ORPHAN","vendorCode":"VEND-HIDDEN","productName":"PRIVATE ORPHAN PRODUCT"}',1,2,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('platform_ads','AD-TEXT','{"adId":"AD-TEXT","title":"LOCAL PUBLIC OFFER","placement":"top","fileId":"PRIVATE_AD_GOOGLE_ID","fileUrl":"https://drive.google.com/private","ownerNotes":"PRIVATE_CAMPAIGN_NOTE"}',1,1,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('platform_ads','AD-ONLY-IMAGE','{"adId":"AD-ONLY-IMAGE","fileId":"PRIVATE_FILE_ID","fileUrl":"https://drive.google.com/secret"}',1,2,'LOCAL_FIXTURE');""",
        """INSERT INTO employee_content_records_v1
           (collection,record_id,record_json,active,sort_order,updated_by)
           VALUES ('white_label','default','{"platformName":"LOCAL PUBLIC PLATFORM","primaryColor":"#224466","ownerName":"PRIVATE_OWNER_PERSON","whatsappNumber":"PRIVATE_PHONE","notes":"PRIVATE_LICENSE_NOTE","featurePhoneLeads":"نعم","logoUrl":"https://drive.google.com/private"}',1,1,'LOCAL_FIXTURE');"""
    ]
    for ident,code,password in [("LOCAL-C1",CODE,PASSWORD),("LOCAL-C2",CODE2,PASSWORD2)]:
        salt=("09" if ident=="LOCAL-C1" else "0a")*16
        verifier=hashlib.pbkdf2_hmac("sha256",password.encode(),
                                    bytes.fromhex(salt),100000).hex()
        statements+= [
          "INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,phone,source,legacy_chat_code) VALUES ('%s','عميل تجريبي','%s','01012345678','cloud-native','%s');"%(ident,ident,code),
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
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED",
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED",
              "TRENDOS_CUSTOMER_PORTAL_NATIVE_PASSWORD_CHANGE_V0_ENABLED",
              "TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED",
              "TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED",
              "TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED",
              "TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED",
              "TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED"
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
            # Only disposable generated-local Wrangler config gets R2 storage.
            config+='\n[[r2_buckets]]\n'
            config+='binding = "CUSTOMER_DRAFT_FILES_BUCKET"\n'
            config+='bucket_name = "trendos-local-customer-draft-not-real"\n'
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
            # Prove the Worker itself rejects a login from Chromium's
            # second (untrusted) loopback Origin, without issuing any bearer.
            status,foreign_login=request(port,paths["login"],method="POST",
                payload={"portalCode":CODE,"password":PASSWORD},
                origin="http://127.0.0.1:8001")
            check(status==403 and foreign_login.get("code")==
                  "CUSTOMER_STAGE_ORIGIN_FORBIDDEN" and
                  not foreign_login.get("token"),
                  "Untrusted browser Origin unexpectedly issued a session")
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
            # Five independent public read-only content views share VERIFIED
            # Native C1 D1 session; never expose employee JSON/finance or
            # hidden franchise branches. No direct Google or employee auth.
            for view,key,ident in [
                ("sections","sections","LOCAL-SEC"),
                ("branches","branches","LOCAL-PUBLIC"),
                ("marketplace","vendors","VEND-PUB"),
                ("ads","ads","LOCAL PUBLIC OFFER"),
                ("brand","settings","LOCAL PUBLIC PLATFORM")
            ]:
                route="/v1/customer/native/public-content?view="+view
                status,out=request(port,route,token=token)
                check(status==200 and out.get("success") is True and
                      out.get("readOnly") is True and
                      (len(out.get(key,[]))==1 if key!="settings" else
                       out.get("settings",{}).get("platformName")=="LOCAL PUBLIC PLATFORM"),
                      "Original D1 public "+view+" read not qualified")
                content=json.dumps(out,ensure_ascii=False)
                check(ident in content and
                      not any(word in content for word in [
                        "PRIVATE_", "commissionRate", "internalNotes",
                        "matbagyShare", "partnerPhone", "fileId", "SECRET BRANCH",
                        "whatsapp", "commission", "ownerName", "logoUrl",
                        "PRIVATE ORPHAN PRODUCT", "PRIVATE_SHOP_NOTE", "drive.google"
                      ]), "Private employee content or hidden branch escaped whitelist")
                status,unauth=request(port,route)
                check(status==401 and unauth.get("code")=="CUSTOMER_SESSION_REJECTED",
                      "Public D1 content allowed unauthenticated read")
                status,foreign=request(port,route,token=token,origin="https://evil.test")
                check(status==403 and not foreign.get("success"),
                      "Public D1 content CORS origin bypass")
            # Marketplace omits orphan products and any vendor admin metadata.
            status,market=request(port,
                  "/v1/customer/native/public-content?view=marketplace",token=token)
            check(status==200 and len(market.get("products",[]))==1 and
                  market["products"][0].get("productName")=="LOCAL PUBLIC PRINT",
                  "Marketplace private/hidden product filtering failed")
            for dangerous in [
              "/v1/customer/native/public-content?view=accounts",
              "/v1/customer/native/public-content?view=sections&customerId=LOCAL-C2",
              "/v1/customer/native/public-content?view=sections&view=branches"
            ]:
                status,body=request(port,dangerous,token=token)
                check(status==400,"Public content accepted unauthorized view/query")
            status,other=request(port,paths["login"],method="POST",
                                payload={"portalCode":CODE2,"password":PASSWORD2})
            check(status==200 and other.get("customerSessionIssued") is True,
                  "Second synthetic tenant login failed")
            token2=other["token"]
            # Native D1 draft staging is NOT an official T12 order. The same
            # ACTIVE Native bearer scopes both create and line append. Unique
            # client requestKeys are opaque 128-bit and never identify owner.
            draft_route="/v1/customer/native/drafts"
            draft_key="a1"*16
            draft_payload={"requestKey":draft_key}
            status,unauthorized_draft=request(port,draft_route,method="POST",
                payload=draft_payload)
            check(status==401 and not unauthorized_draft.get("success"),
                  "Draft create accepted a caller without a D1 session")
            status,forged_draft=request(port,draft_route,method="POST",token=token,
                payload={"requestKey":draft_key,"customerId":"LOCAL-C2"})
            check(status==400 and not forged_draft.get("success"),
                  "Draft create trusted a client-supplied customer id")
            status,foreign_draft=request(port,draft_route,method="POST",token=token,
                origin="https://evil.test",payload=draft_payload)
            check(status==403 and not foreign_draft.get("success"),
                  "Draft create ignored the isolated Stage Origin policy")
            status,created=request(port,draft_route,method="POST",token=token,
                payload=draft_payload)
            check(status==201 and created.get("success") is True and
                  created.get("officialOrderCreated") is False and
                  created.get("state")=="DRAFT" and
                  created.get("draftId","").startswith("CDR-"),
                  "D1 native draft did not insert a staged, nonofficial row")
            c1_draft=created["draftId"]
            status,repeat=request(port,draft_route,method="POST",token=token,
                payload=draft_payload)
            check(status==200 and repeat.get("draftId")==c1_draft and
                  repeat.get("alreadyCreated") is True,
                  "Draft idempotency failed, created duplicate customer draft")
            status,other_key=request(port,draft_route,method="POST",token=token2,
                payload=draft_payload)
            check(status==409 and "draftId" not in other_key,
                  "Foreign customer reused a requestKey and learned draft ID")
            item_route=draft_route+"/"+c1_draft+"/items"
            item_payload={"requestKey":"b2"*16,"department":"طباعة",
                          "itemName":"LOCAL SYNTHETIC PRINT ITEM",
                          "qty":2,"notes":"","heatPress":False,"flyPrint":False}
            status,item_unauth=request(port,item_route,method="POST",
                payload=item_payload)
            check(status==401 and not item_unauth.get("success"),
                  "Draft item append accepted missing bearer")
            status,item_foreign=request(port,item_route,method="POST",
                token=token2,payload=item_payload)
            check(status==409 and "itemId" not in item_foreign,
                  "Foreign customer appended item to C1 draft")
            status,item_forgery=request(port,item_route,method="POST",token=token,
                payload={**item_payload,"customerId":"LOCAL-C2"})
            check(status==400 and not item_forgery.get("success"),
                  "Item route trusted caller-supplied customerId")
            status,item_created=request(port,item_route,method="POST",token=token,
                payload=item_payload)
            check(status==201 and item_created.get("success") is True and
                  item_created.get("ordinal")==1 and
                  item_created.get("officialOrderCreated") is False,
                  "Staged Native D1 draft item insert failed")
            # Disposable *real local Wrangler R2* fake file bytes. This
            # signature-only fixture is NOT trusted printable media and
            # must never reach the original T12 writer or download API.
            file_route=draft_route+"/"+c1_draft+"/items/"+item_created["itemId"]+"/files"
            fixture_png=bytes([137,80,78,71,13,10,26,10,1,2,3,4,5])
            status,unauth_file=file_request(port,file_route,fixture_png)
            check(status==401 and not unauth_file.get("fileReady"),
                  "File upload allowed missing Native bearer")
            status,foreign_file=file_request(port,file_route,fixture_png,token=token2)
            check(status==409 and not foreign_file.get("fileReady") and
                  "fileId" not in foreign_file,
                  "C2 staged a file on C1 draft item")
            status,bad_origin_file=file_request(port,file_route,fixture_png,
                token=token,origin="https://evil.test")
            check(status==403 and not bad_origin_file.get("fileReady"),
                  "R2 upload accepted hostile Origin")
            status,bad_mime_file=file_request(port,file_route,fixture_png,
                token=token,content_type="application/pdf")
            check(status==415 and not bad_mime_file.get("fileReady"),
                  "R2 accepted forged PDF MIME for PNG magic bytes")
            status,saved_file=file_request(port,file_route,fixture_png,token=token)
            check(status==201 and saved_file.get("fileReady") is True and
                  saved_file.get("privateObject") is True and
                  saved_file.get("alreadyUploaded") is False and
                  saved_file.get("fileId","").startswith("CDF-") and
                  "customer-drafts/" not in json.dumps(saved_file),
                  "Local R2 put + D1 PENDING-to-READY finalize failed")
            status,repeat_file=file_request(port,file_route,fixture_png,token=token)
            check(status==200 and repeat_file.get("fileId")==saved_file.get("fileId")
                  and repeat_file.get("alreadyUploaded") is True,
                  "Repeated identical file request created another object")
            status,changed_file=file_request(port,file_route,fixture_png+b"UNTRUSTED",
                token=token)
            check(status==409 and not changed_file.get("fileReady"),
                  "Changed file replay with same key bypassed SHA256 check")
            status,get_blocked=request(port,file_route,token=token)
            check(status==405 and not get_blocked.get("success"),
                  "Customer R2 file upload route allowed GET download")
            # READONLY byte-integrity proof over the actual PRIVATE local R2
            # object. No file bytes, keys or per-file metadata in response.
            integrity_route=draft_route+"/"+c1_draft+"/files-integrity"
            status,integrity_unauth=request(port,integrity_route)
            check(status==401 and not integrity_unauth.get("integrityNowVerified"),
                  "Private R2 integrity route accepted no D1 session")
            status,integrity_cross=request(port,integrity_route,token=token2)
            check(status==404 and not integrity_cross.get("integrityNowVerified"),
                  "C2 could inspect C1 private R2 integrity status")
            status,integrity_wrong_origin=request(port,integrity_route,
                token=token,origin="https://evil.test")
            check(status==403 and not integrity_wrong_origin.get("integrityNowVerified"),
                  "Private R2 integrity route allowed foreign Origin")
            status,integrity_get=request(port,integrity_route,token=token)
            check(status==200 and integrity_get.get("integrityNowVerified") is True
                  and integrity_get.get("verifiedFileCount")==1
                  and integrity_get.get("provisionalReadOnlyObservation") is True
                  and integrity_get.get("malwareScanComplete") is False
                  and integrity_get.get("eligibleForT12FileHandoff") is False
                  and integrity_get.get("officialOrderCreated") is False
                  and integrity_get.get("productionWriteAuthorized") is False
                  and saved_file["fileId"] not in json.dumps(integrity_get)
                  and "customer-drafts/" not in json.dumps(integrity_get),
                  "Actual local R2 bytes/SHA256/D1 snapshot not verified read-only")
            status,integrity_query=request(port,integrity_route+"?customerId=LOCAL-C2",
                token=token)
            check(status==400 and not integrity_query.get("integrityNowVerified"),
                  "Private R2 integrity accepted caller supplied customerId")
            status,integrity_post=request(port,integrity_route,
                method="POST",token=token)
            check(status==405 and not integrity_post.get("integrityNowVerified"),
                  "Private R2 integrity accepted POST mutation")
            print("PASS: REAL LOCAL R2 byte SHA256 and D1 metadata/status recheck with ACTIVE C1 session, C2 isolation, NO malware scan or T12 approval")
            print("PASS: REAL LOCAL Wrangler private R2 plus D1 PENDING/READY CAS, binary MIME, idempotent replay, C1/C2 scope, no public GET")
            status,item_repeat=request(port,item_route,method="POST",token=token,
                payload=item_payload)
            check(status==200 and item_repeat.get("alreadyAdded") is True and
                  item_repeat.get("itemId")==item_created.get("itemId"),
                  "Item duplicate retry did not return first item idempotently")
            status,changed_payload=request(port,item_route,method="POST",token=token,
                payload={**item_payload,"qty":3})
            check(status==409 and "itemId" not in changed_payload,
                  "Same item key accepted changed request without HMAC match")
            status,c2created=request(port,draft_route,method="POST",token=token2,
                payload={"requestKey":"c3"*16})
            check(status==201 and c2created.get("officialOrderCreated") is False
                  and c2created.get("draftId")!=c1_draft,
                  "Independent C2 draft wasn't isolated")
            # READONLY T12 preflight: one item/no files CAN pass a provisional
            # shadow contract, but response must explicitly DENY production
            # create authority. A READY PRIVATE R2 file CANNOT silently cross
            # into the old T12 order writer.
            preflight_c1=draft_route+"/"+c1_draft+"/submit-preflight"
            preflight_c2=draft_route+"/"+c2created["draftId"]+"/submit-preflight"
            status,with_file=request(port,preflight_c1,token=token)
            check(status==409 and
                  with_file.get("code")=="T12_CUSTOMER_FILE_HANDOFF_NOT_YET_SUPPORTED" and
                  with_file.get("officialOrderCreated") is False,
                  "Preflight dangerously accepted READY R2 attachment into T12")
            status,cross_preflight=request(port,preflight_c1,token=token2)
            check(status==404 and not cross_preflight.get("success"),
                  "C2 could inspect C1 T12 draft preflight")
            status,without_bearer=request(port,preflight_c1)
            check(status==401 and not without_bearer.get("success"),
                  "Customer preflight was available without Native bearer")
            status,foreign_preflight=request(port,preflight_c1,token=token,
                                            origin="https://evil.test")
            check(status==403 and not foreign_preflight.get("success"),
                  "Preflight accepted unauthorized Origin")
            status,with_post=request(port,preflight_c1,method="POST",token=token)
            check(status==405 and not with_post.get("success"),
                  "GET-only preflight accepted HTTP mutation")
            status,empty_c2=request(port,preflight_c2,token=token2)
            check(status==409 and empty_c2.get("code")==
                  "T12_CUSTOMER_MULTI_ITEM_SUBMIT_NOT_YET_SUPPORTED",
                  "Empty staged draft gave positive submit preflight")
            status,c2item=request(port,
                    draft_route+"/"+c2created["draftId"]+"/items",
                    method="POST",token=token2,
                    payload={**item_payload,"requestKey":"d7"*16})
            check(status==201 and c2item.get("ordinal")==1 and
                  c2item.get("officialOrderCreated") is False,
                  "Second customer clean draft item setup failed")
            status,c2preflight=request(port,preflight_c2,token=token2)
            check(status==200 and c2preflight.get("preflightEligible") is True
                  and c2preflight.get("officialOrderCreated") is False
                  and c2preflight.get("productionWriteAuthorized") is False
                  and c2preflight.get("needsTrustedEmployeeDelegate") is True
                  and c2preflight.get("snapshotSealed") is False
                  and "01012345678" not in json.dumps(c2preflight) and
                  "customerId" not in json.dumps(c2preflight),
                  "One clean C2 draft didn't pass READONLY shadow preflight")
            print("PASS: REAL LOCAL D1 read-only preflight accepts one eligible C2 item but NEVER authorizes T12 write, and rejects C1 READY R2 attachment, cross-tenant, no token, empty draft")
            print("PASS: REAL local Worker/D1 Native customer DRAFT create + ITEM create, stable idempotency, no customer ID forgery, C1/C2 scope and no official order")
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
            status,revoked_draft=request(port,draft_route,method="POST",
                token=token,payload={"requestKey":"d4"*16})
            check(status in (401,409) and not revoked_draft.get("success"),
                  "Revoked Native C1 session created a new D1 draft")
            status,revoked_item=request(port,item_route,method="POST",
                token=token,payload={**item_payload,"requestKey":"e5"*16})
            check(status in (401,409) and not revoked_item.get("success"),
                  "Revoked Native C1 session appended an item to draft")
            status,revoked_file=file_request(port,file_route,fixture_png,
                token=token,request_key="e5"*16)
            check(status in (401,409) and not revoked_file.get("fileReady"),
                  "Revoked Native C1 session staged a new private file")
            status,revoked_preflight=request(port,preflight_c1,token=token)
            check(status==404 and not revoked_preflight.get("preflightEligible"),
                  "Revoked Native C1 session still saw a draft preflight")
            status,revoked_integrity=request(port,integrity_route,token=token)
            check(status==401 and not revoked_integrity.get("integrityNowVerified"),
                  "Revoked C1 D1 session could still verify private R2 file")
            status,revoked_public=request(port,
                    "/v1/customer/native/public-content?view=sections",token=token)
            check(status==401 and revoked_public.get("code")=="CUSTOMER_SESSION_REJECTED",
                  "Revoked session read public content")
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
                # Full original index.html/app.js actual Chromium test.
                # Its browser-only config flag is overridden ONLY in memory,
                # never in checked-in config.js or the real customer UI.
                full=subprocess.run(
                    ["node",str(ROOT/"tests/customer_stage_chromium_full_original_portal_local.cjs")],
                    cwd=ROOT,text=True,capture_output=True,timeout=100,
                    env={**os.environ,"CUSTOMER_STAGE_LOCAL_PORT":str(port),
                         "CLOUDFLARE_API_TOKEN":"","CLOUDFLARE_ACCOUNT_ID":""}
                )
                if full.returncode:
                    raise AssertionError("Full original customer portal Chromium audit failed: "+
                                         full.stderr[-5500:]+"\nFULL_STDOUT:"+full.stdout[-2500:])
                check("PASS: original full TrendOS index.html + app.js" in full.stdout,
                      "Original production HTML/app customer workflow was not proven")
                print(full.stdout.strip())
            finally:
                local_browser.shutdown()
                local_browser.server_close()
                thread.join(timeout=5)
                hostile_browser.shutdown()
                hostile_browser.server_close()
                hostile_thread.join(timeout=5)
            # C1 now performed four valid logins (Python+VM+mini+FULL UI).
            # One wrong password reaches the 5/15m local SQLite DO cap.
            for i in range(1):
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
            # NEW BACKEND ONLY: Stage Native password-rotation CAS, independent
            # of the unchanged source-only original customer UI. The route
            # is gated OFF in checked-in Wrangler; enabled ONLY in the fake
            # disposable test config used for this run.
            rotate="/v1/customer/native/change-password"
            updated_pass="LOCAL-C2-NEW-PASSWORD-2026-NOT-REAL!"
            invalid={"currentPassword":PASSWORD2,
                     "newPassword":updated_pass,
                     "customerId":"LOCAL-C1"}
            status,blocked_fields=request(port,rotate,method="POST",token=token2,
                                          payload=invalid)
            check(status==400 and not blocked_fields.get("passwordChanged"),
                  "Native password route trusted client customerId")
            status,bad_origin=request(port,rotate,method="POST",token=token2,
                origin="https://evil.test",
                payload={"currentPassword":PASSWORD2,"newPassword":updated_pass})
            check(status==403 and not bad_origin.get("passwordChanged"),
                  "Native password rotation allowed untrusted Origin")
            status,no_auth=request(port,rotate,method="POST",
                payload={"currentPassword":PASSWORD2,"newPassword":updated_pass})
            check(status==401 and no_auth.get("code")=="CUSTOMER_SESSION_REJECTED",
                  "Native password mutation did not require bearer")
            status,wrong_old=request(port,rotate,method="POST",token=token2,
                payload={"currentPassword":"LOCAL-WRONG-OLD-PASSWORD-NOT-REAL!",
                         "newPassword":updated_pass})
            check(status==401 and not wrong_old.get("passwordChanged"),
                  "Password rotation accepted wrong current credential")
            status,same=request(port,rotate,method="POST",token=token2,
                payload={"currentPassword":PASSWORD2,"newPassword":PASSWORD2})
            check(status==400 and not same.get("passwordChanged"),
                  "Password rotation accepted same old and new verifier")
            # Two verified sessions for the same independently enrolled C2
            # account: rotating via one MUST invalidate both by version.
            status,sibling=request(port,paths["login"],method="POST",
                payload={"portalCode":CODE2,"password":PASSWORD2})
            check(status==200 and sibling.get("customerSessionIssued"),
                  "Second current C2 D1 token could not be established")
            token2extra=sibling["token"]
            status,changed=request(port,rotate,method="POST",token=token2,
                payload={"currentPassword":PASSWORD2,"newPassword":updated_pass})
            check(status==200 and changed.get("passwordChanged") is True
                  and changed.get("forceRelogin") is True
                  and changed.get("allPreviousSessionsInvalidated") is True
                  and "password" not in json.dumps(changed).lower().replace("passwordchanged","").replace("customer-d1-native-password-rotate-stage-v0",""),
                  "D1 password CAS failed or leaked verifier or raw password")
            for old_token in (token2,token2extra):
                status,dead=request(port,paths["orders"],token=old_token)
                check(status==401 and dead.get("code")=="CUSTOMER_SESSION_REJECTED",
                      "Password changed but old/sibling customer token still valid")
                status,cannot_repeat=request(port,rotate,method="POST",
                    token=old_token,
                    payload={"currentPassword":PASSWORD2,"newPassword":updated_pass})
                check(status==401 and not cannot_repeat.get("passwordChanged"),
                      "Old bearer replayed password rotation after epoch bump")
            status,old_login=request(port,paths["login"],method="POST",
                 payload={"portalCode":CODE2,"password":PASSWORD2})
            check(status==401 and not old_login.get("customerSessionIssued"),
                  "Old password still issued session after D1 CAS")
            status,new_login=request(port,paths["login"],method="POST",
                 payload={"portalCode":CODE2,"password":updated_pass})
            check(status==200 and new_login.get("customerSessionIssued") is True,
                  "New PBKDF2 verifier was not accepted after rotation")
            status,own_after=request(port,paths["orders"],token=new_login["token"])
            check(status==200 and
                  {x["orderId"] for x in own_after.get("lines",[])}==
                    {"LOCAL-ORDER-LOCAL-C2"},
                  "Native password rotation altered order ownership/account scope")
            # Verify password-change cannot be used for online old-password
            # guessing with a stolen current session. 5 failed attempts
            # atomically share the original account lock counter; correct
            # password is then denied for the 15-minute D1 lock window.
            for attempt in range(5):
                status,wrong_again=request(port,rotate,method="POST",
                    token=new_login["token"],
                    payload={"currentPassword":"SYNTHETIC-WRONG-PASSWORD-"+str(attempt),
                             "newPassword":"LOCAL-OTHER-PASSWORD-ROTATION-2026"})
                check(status==401 and not wrong_again.get("passwordChanged"),
                      "Password change bypassed 5-attempt account lock")
            status,locked_change=request(port,rotate,method="POST",
                token=new_login["token"],
                payload={"currentPassword":updated_pass,
                         "newPassword":"LOCAL-OTHER-PASSWORD-ROTATION-2026"})
            check(status==401 and not locked_change.get("passwordChanged"),
                  "Correct old password bypassed account lock after five failures")
            status,locked_login=request(port,paths["login"],method="POST",
                payload={"portalCode":CODE2,"password":updated_pass})
            check(status in (401,429) and not locked_login.get("customerSessionIssued"),
                  "Locked D1 account issued fresh session after password guesses")
            print("PASS: Shared D1 password-rotation credential failure CAS locks account after 5 wrong OLD passwords, prevents guessing through existing token")
            print("PASS: Stage OFF-by-default Native D1 password change CAS after old-password proof, two previous sessions invalidated, new verifier live on LOCAL synthetic customers only")
            print("PASS: Wrangler local D1+SQLite Durable Object + original Node VM + fixture and FULL ORIGINAL UI Chromium: owner-isolated login/orders, CAS revoke, browser CORS, DO 5/15m restart persistence")
            print("NO_DEPLOY=YES; CLOUD_CUSTOMER_DB_UNTOUCHED=YES; STAGE_REMOTE_UNPROVISIONED=YES")
        finally:
            stop_dev(proc)
            try: local.unlink(missing_ok=True)
            except Exception:pass

if __name__=="__main__":
    main()
