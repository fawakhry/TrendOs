#!/usr/bin/env python3
"""SOURCE-ONLY Cloudflare Access service-auth admission gate.

Does not call an API, issue credentials, start traffic, enable a route, or
mutate Cloudflare. Judge remote readback only after a *separate* authorized
private Stage Service Token is created and stored outside this repository.
The existing DENY EVERYONE rule MUST survive as a second policy.
"""
import re

STAGE_WORKER="trendos-customer-portal-isolated-stage-v0"
STAGE_APP="TrendOS ZG Customer Isolated Stage DENY ALL 20261101"
STAGE_TOKEN="TrendOS Customer Isolated Stage Service Auth"
UUID=re.compile(r"^[0-9a-fA-F-]{32,36}$")

def policy_gate_v1(*,app,worker,subdomain,token):
    errors=[]
    def must(ok,reason):
        if not ok:errors.append(reason)
    must(isinstance(worker,dict) and worker.get("name")==STAGE_WORKER and
         isinstance(worker.get("id"),str) and
         bool(UUID.fullmatch(worker.get("id",""))),"WORKER_UNVERIFIED")
    wid=worker.get("id") if isinstance(worker,dict) else None
    must(isinstance(subdomain,dict) and subdomain.get("enabled") is False and
         subdomain.get("previews_enabled") is False,"PUBLIC_OR_PREVIEW_ENABLED")
    must(isinstance(app,dict) and app.get("name")==STAGE_APP,
         "APP_WRONG_OR_MISSING")
    destinations=app.get("destinations") if isinstance(app,dict) else None
    must(isinstance(destinations,list) and len(destinations)==1 and
         isinstance(destinations[0],dict) and
         destinations[0].get("type")=="worker" and
         destinations[0].get("worker_id")==wid and
         not destinations[0].get("overrides"),
         "DESTINATION_NOT_EXACT_PRIVATE_WORKER")
    must(isinstance(token,dict) and token.get("name")==STAGE_TOKEN and
         token.get("enabled") is True and
         isinstance(token.get("id"),str) and
         bool(UUID.fullmatch(token.get("id",""))),"TOKEN_NOT_DEDICATED_OR_DISABLED")
    policies=app.get("policies") if isinstance(app,dict) else None
    if not isinstance(policies,list):
        policies=[]
    must(len(policies)==2,"POLICY_COUNT_NOT_EXACT_TWO")
    denied=[p for p in policies if isinstance(p,dict)
            and p.get("decision")=="deny"]
    authorized=[p for p in policies if isinstance(p,dict)
                and p.get("decision")=="non_identity"]
    must(len(denied)==1 and denied[0].get("include")==[{"everyone":{}}]
         and not denied[0].get("exclude") and
         not denied[0].get("require"),
         "DENY_EVERYONE_NOT_PRESERVED")
    token_id=token.get("id") if isinstance(token,dict) else None
    must(len(authorized)==1 and authorized[0].get("include")==[
         {"service_token":{"token_id":token_id}}] and
         not authorized[0].get("exclude") and
         not authorized[0].get("require"),
         "EXACT_SINGLE_SERVICE_TOKEN_REQUIRED")
    # A matching hash/name isn't a secret and doesn't prove HTTP Access
    # enforcement; no backend/customer flow can be released based on this.
    return {"version":"CUSTOMER_STAGE_SERVICE_AUTH_POLICY_GATE_OFF_V1",
            "readbackPolicyAdmissible":not errors,
            "errors":errors,
            "sourceOnly":True,
            "workerPublic":False if isinstance(subdomain,dict) and
                          subdomain.get("enabled") is False else None,
            "serviceClientSecretReceived":False,
            "remoteAuthenticatedE2ePassed":False,
            "customerProduction":"NO_GO"}

if __name__=="__main__":
    # Unbound by default: deliberately fails without authoritative readback.
    print(policy_gate_v1(app=None,worker=None,subdomain=None,token=None))
