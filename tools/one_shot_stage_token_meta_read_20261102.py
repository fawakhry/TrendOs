#!/usr/bin/env python3
"""Read-only Cloudflare Stage service-token metadata check. No writes."""
import os
import json
import urllib.request
import urllib.parse
import hmac
name = "TrendOS Customer Isolated Stage Service Auth"
api = os.environ["CLOUDFLARE_SERVICE_TOKENS_READ_API_TOKEN"]
account = os.environ["CLOUDFLARE_ACCOUNT_ID"]
wanted = os.environ["CF_STAGE_ACCESS_CLIENT_ID"]
url = "https://api.cloudflare.com/client/v4/accounts/" + account + "/access/service_tokens?per_page=100"
request = urllib.request.Request(url, method="GET", headers={"Authorization":"Bearer "+api})
with urllib.request.urlopen(request,timeout=25) as response:
    data = json.load(response)
assert data.get("success") is True
records=data.get("result",[])
assert isinstance(records,list)
named=[t for t in records if t.get("name")==name]
matches=[t for t in records if isinstance(t.get("client_id"),str) and hmac.compare_digest(t["client_id"],wanted)]
print("STAGE_SERVICE_TOKEN_NAME_COUNT="+str(len(named)))
print("STAGE_CLIENT_ID_MATCH_COUNT="+str(len(matches)))
assert len(named)==1 and len(matches)==1 and named[0] is matches[0]
assert named[0].get("enabled") is True
print("STAGE_DEDICATED_SERVICE_TOKEN_READ_ONLY_MATCH=PASS")
print("CUSTOMER_GO_LIVE=NO_GO")
