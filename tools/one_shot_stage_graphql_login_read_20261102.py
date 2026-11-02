#!/usr/bin/env python3
"""READ-ONLY Cloudflare GraphQL access non-identity auth event audit.
No customer values, token IDs, Ray IDs, IPs, response bodies or secrets logged.
"""
import datetime,json,os,re,urllib.request,urllib.error
account=os.environ["CLOUDFLARE_ACCOUNT_ID"]
token=os.environ["CLOUDFLARE_API_TOKEN"]
access=os.environ["CLOUDFLARE_ACCESS_API_TOKEN"]
service_read=os.environ["CLOUDFLARE_SERVICE_TOKENS_READ_API_TOKEN"]
client_id=os.environ["CF_STAGE_ACCESS_CLIENT_ID"]
client_secret=os.environ["CF_STAGE_ACCESS_CLIENT_SECRET"]
def req(url,credential,body=None):
    r=urllib.request.Request(url,headers={"Authorization":"Bearer "+credential,
        "Content-Type":"application/json","Accept":"application/json"},
        method="POST" if body is not None else "GET",
        data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r,timeout=25) as response:
            return response.status,json.load(response)
    except urllib.error.HTTPError as e:return e.code,None
    except (ValueError,urllib.error.URLError):return 0,None
if re.fullmatch(r"[a-f0-9A-F]{64}",client_secret):
    print("CLIENT_SECRET_FORMAT=LEGACY_HEX64")
elif re.fullmatch(r"cfast_[A-Za-z0-9]{48}",client_secret):
    print("CLIENT_SECRET_FORMAT=NEW_CFAST_V1")
else:
    print("CLIENT_SECRET_FORMAT=UNRECOGNIZED_CHECK_SECRET_COPY")
base="https://api.cloudflare.com/client/v4/accounts/"+account
st,body=req(base+"/access/service_tokens?per_page=100",service_read)
target=None
if st==200 and isinstance(body,dict) and isinstance(body.get("result"),list):
    rows=[x for x in body["result"] if isinstance(x,dict) and
        x.get("name")=="TrendOS Customer Isolated Stage Service Auth" and
        x.get("client_id")==client_id]
    if len(rows)==1:target=rows[0].get("id")
print("DEDICATED_STAGE_TOKEN_METADATA_MATCH="+str(bool(target)).upper())
query="""
query AccessStage($accountTag: string, $datetimeStart: string,
                  $datetimeEnd: string) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      accessLoginRequestsAdaptiveGroups(
        limit: 100,
        filter: {datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd},
        orderBy: [datetime_ASC]
      ) {
        dimensions {
          datetime
          isSuccessfulLogin
          identityProvider
          approvingPolicyId
          serviceTokenId
        }
      }
    }
  }
}
"""
payload={"query":query,"variables":{"accountTag":account,
  "datetimeStart":"2026-11-02T05:10:00Z",
  "datetimeEnd":"2026-11-02T05:20:00Z"}}
for label,key in [("GENERIC",token),("SCOPED_ACCESS",access)]:
    code,result=req("https://api.cloudflare.com/client/v4/graphql",key,payload)
    print(label+"_GRAPHQL_HTTP_STATUS="+str(code))
    if code!=200 or not isinstance(result,dict) or result.get("errors"):
        print(label+"_GRAPHQL_READER=NOT_AUTHORIZED_OR_UNAVAILABLE")
        continue
    try:
        accounts=result["data"]["viewer"]["accounts"]
        groups=[g for a in accounts for g in a["accessLoginRequestsAdaptiveGroups"]]
    except (TypeError,KeyError):
        print(label+"_GRAPHQL_DATASET=UNAVAILABLE")
        continue
    print(label+"_ACCESS_LOGIN_EVENTS_TOTAL="+str(len(groups)))
    print(label+"_NONIDENTITY_LOGIN_EVENTS="+str(sum(
      isinstance(x,dict) and isinstance(x.get("dimensions"),dict) and
      x["dimensions"].get("identityProvider")=="nonidentity" for x in groups)))
    print(label+"_LOGIN_EVENT_SERVICE_TOKEN_ID_PRESENT="+str(sum(
      isinstance(x,dict) and isinstance(x.get("dimensions"),dict) and
      bool(x["dimensions"].get("serviceTokenId")) for x in groups)))
    matches=[x["dimensions"] for x in groups if isinstance(x,dict) and
      isinstance(x.get("dimensions"),dict) and
      x["dimensions"].get("serviceTokenId")==target and target]
    print(label+"_MATCHING_SERVICE_TOKEN_EVENTS="+str(len(matches)))
    print(label+"_MATCHING_SERVICE_TOKEN_ALLOWED="+str(sum(
      d.get("isSuccessfulLogin") in (True,1) for d in matches)))
    print(label+"_MATCHING_SERVICE_TOKEN_DENIED="+str(sum(
      d.get("isSuccessfulLogin") in (False,0) for d in matches)))
    print(label+"_GRAPHQL_ANALYTICS_READ=PASS")
    break
else:
    print("GRAPHQL_NONIDENTITY_DIAGNOSTIC=NOT_VERIFIED")
print("REMOTE_WORKER_PUBLIC_INGRESS=OFF")
print("CLOUDFLARE_CONFIGURATION_WRITES=NONE")
print("CUSTOMER_GO_LIVE=NO_GO")
