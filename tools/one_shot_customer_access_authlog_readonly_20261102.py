#!/usr/bin/env python3
"""Single-use, read-only scoped Access audit. Print counts, never PII or secrets."""
import json,os,urllib.error,urllib.parse,urllib.request
account=os.environ["CLOUDFLARE_ACCOUNT_ID"]
admin=os.environ["CLOUDFLARE_ACCESS_API_TOKEN"]
generic=os.environ["CLOUDFLARE_API_TOKEN"]
root="https://api.cloudflare.com/client/v4/accounts/"+account
def get(path,token):
    request=urllib.request.Request(root+path,method="GET",
        headers={"Authorization":"Bearer "+token,"Accept":"application/json"})
    try:
        with urllib.request.urlopen(request,timeout=20) as r: data=json.load(r);status=r.status
    except urllib.error.HTTPError as e:
        return e.code,None
    except (urllib.error.URLError,ValueError):
        return 0,None
    if not isinstance(data,dict) or data.get("success") is not True:return status,None
    return status,data.get("result")
status,apps=get("/access/apps?per_page=100",admin)
assert status==200 and isinstance(apps,list),"ACCESS_APP_LIST_NOT_VERIFIED"
name="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
found=[a for a in apps if isinstance(a,dict) and a.get("name")==name]
assert len(found)==1 and isinstance(found[0].get("id"),str)
appid=found[0]["id"]
query=urllib.parse.urlencode({"app_uid":appid,"app_uidOp":"eq",
    "since":"2026-11-02T05:00:00Z","direction":"desc","limit":100})
for label,token in [("SCOPED_APP",admin),("GENERIC",generic)]:
    code,records=get("/access/logs/access_requests?"+query,token)
    print(label+"_ACCESS_AUDIT_HTTP_STATUS="+str(code))
    if code==200 and isinstance(records,list):
        scoped=[r for r in records if isinstance(r,dict) and r.get("app_uid")==appid]
        print(label+"_EXACT_STAGE_AUDIT_ROWS="+str(len(scoped)))
        print(label+"_AUTH_ALLOWED_COUNT="+str(sum(r.get("allowed") is True for r in scoped)))
        print(label+"_AUTH_DENIED_COUNT="+str(sum(r.get("allowed") is False for r in scoped)))
        break
else:
    print("ACCESS_AUDIT_READ_PERMISSION=NOT_VERIFIED")
print("ACCESS_POLICY_WRITES=NONE")
print("WORKER_URL=OFF")
print("CUSTOMER_GO_LIVE=NO_GO")
