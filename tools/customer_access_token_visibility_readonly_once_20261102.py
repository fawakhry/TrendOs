#!/usr/bin/env python3
"""One-shot READ ONLY comparison of Cloudflare Access token visibility.
Never logs token id, client id, client secret, response bodies or API token.
No mutation, no access policy writes, no Worker deployment, no HTTP POST.
"""
import hmac,json,os,re,urllib.request,urllib.error,urllib.parse
EXPECTED="TrendOS Customer Isolated Stage Service Auth"
account=os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
reader=os.environ.get("CLOUDFLARE_API_TOKEN","")
access=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN","")
client=os.environ.get("CF_STAGE_ACCESS_CLIENT_ID","")
secret=os.environ.get("CF_STAGE_ACCESS_CLIENT_SECRET","")
assert os.environ.get("GITHUB_HEAD_REF")=="ops/access-service-token-visibility-audit-20261102"
assert os.environ.get("GITHUB_EVENT_NAME")=="pull_request"
assert re.fullmatch(r"[A-Fa-f0-9]{32}",account)
assert len(reader)>20 and len(access)>20 and reader!=access
assert len(client)>20 and len(secret)>20
# SHA-256 of the account ID visible in the user's own Cloudflare API Tokens
# screenshot URL. Compare without publishing either account ID.
import hashlib
DASHBOARD_ACCOUNT_SHA256="c06325502840123b0349e3347d0e0a74bc0f229c2518e20b2846cc054e06724d"
print("GITHUB_WORKER_ACCOUNT_MATCHES_USER_DASHBOARD="+str(
    hmac.compare_digest(hashlib.sha256(account.lower().encode()).hexdigest(),
                        DASHBOARD_ACCOUNT_SHA256)).upper())
base="https://api.cloudflare.com/client/v4/accounts/"+account

def get(path,token):
    req=urllib.request.Request(base+path,method="GET",
        headers={"Accept":"application/json","Authorization":"Bearer "+token})
    try:
        with urllib.request.urlopen(req,timeout=25) as r:
            obj=json.load(r); code=r.status
    except urllib.error.HTTPError as e:
        return e.code,None
    except (ValueError,urllib.error.URLError):
        return 0,None
    if not isinstance(obj,dict) or obj.get("success") is not True:
        return code,None
    return code,obj.get("result")

def inventory(label,token):
    records=[]
    for page in range(1,11):
        suffix=urllib.parse.urlencode({"page":page,"per_page":100})
        status,items=get("/access/service_tokens?"+suffix,token)
        if status!=200 or not isinstance(items,list):
            print(label+"_INVENTORY_HTTP_STATUS="+str(status))
            return None
        records+=items
        if len(items)<100: break
    else:
        print(label+"_INVENTORY_PAGINATION_STOP")
        return None
    named=[item for item in records if isinstance(item,dict)
           and item.get("name")==EXPECTED]
    exact=[item for item in records if isinstance(item,dict)
           and isinstance(item.get("client_id"),str)
           and hmac.compare_digest(item["client_id"],client)]
    print(label+"_INVENTORY_HTTP_STATUS=200")
    print(label+"_INVENTORY_TOKEN_COUNT="+str(len(records)))
    print(label+"_EXPECTED_NAME_COUNT="+str(len(named)))
    print(label+"_CLIENT_ID_MATCH_COUNT="+str(len(exact)))
    print(label+"_MATCHES_SAME_RECORD="+str(
        int(len(named)==1 and len(exact)==1 and named[0] is exact[0])))
    if len(named)==1:
        print(label+"_DEDICATED_TOKEN_ENABLED="+str(named[0].get("enabled")).upper())
        print(label+"_DEDICATED_TOKEN_EXPIRY_FIELD_PRESENT="+str(
           any(isinstance(named[0].get(k),str) for k in
               ("expires_at","expires_on","expiration_date"))).upper())
    return {"name":len(named)==1,"id":len(exact)==1,
            "same":len(named)==1 and len(exact)==1 and named[0] is exact[0]}

# Previous failure used general token; new dedicated Access API token might
# have different inventory authority. Compare without weakening any gates.
old=inventory("GENERAL",reader)
new=inventory("SCOPED_ACCESS",access)
# Even if both fail, audit exits normally and reports an unverified blocker.
# Never invent matching token details.
if new and new["same"]:
    print("STAGE_DEDICATED_CLIENT_ID_VISIBLE_WITH_SCOPED_TOKEN=YES")
elif old and old["same"]:
    print("STAGE_DEDICATED_CLIENT_ID_VISIBLE_WITH_GENERAL_TOKEN=YES")
else:
    print("STAGE_DEDICATED_CLIENT_ID_MATCH=NOT_VERIFIED")
print("CLOUDFLARE_WRITES=NONE")
print("CURRENT_ACCESS_DENY_ALL=NOT_MODIFIED")
print("CUSTOMER_GO_LIVE=NO_GO")
