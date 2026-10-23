"""SERVER-87: make a deny-all Cloudflare Access app for ONE unpublished stage.

No production Worker, DNS, public link, customer data, machine identity or D1
mutation. Owner's "نفذ" authorizes stage connection setup, not go-live.
Do not emit secrets, Worker UUID, account ID, policy identifiers or app data.
"""
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPSHandler, HTTPRedirectHandler, ProxyHandler

STAGE = "trendos-server68-isolated-stage"
VERSION = "d1a19c15-b745-405f-a926-38148eb12688"
APP_NAME = "TrendOS isolated stage - DENY ALL - S87"
ROOT = "https://api.cloudflare.com/client/v4/accounts/"
HEX32 = re.compile(r"^[a-fA-F0-9]{32}$")
UUID = re.compile(r"^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12})$")


class StageDenied(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def exact_deny_payload(worker_id):
    if type(worker_id) is not str or not UUID.fullmatch(worker_id):
        raise StageDenied("SERVER87_INVALID_WORKER_ID")
    return {
        "type": "self_hosted",
        "name": APP_NAME,
        "destinations": [{"type": "worker", "worker_id": worker_id}],
        "policies": [{
            "name": "Deny all until owner-approved machine identity",
            "decision": "block",
            "include": [{"everyone": {}}],
        }],
    }


class API:
    def __init__(self, acct, token, opener=None, worker_read_token=None):
        if type(acct) is not str or not HEX32.fullmatch(acct):
            raise StageDenied("SERVER87_ACCOUNT_DENIED")
        if type(token) is not str or len(token) < 16:
            raise StageDenied("SERVER87_TOKEN_DENIED")
        if worker_read_token is not None and (type(worker_read_token) is not str
                                              or len(worker_read_token) < 16):
            raise StageDenied("SERVER87_WORKER_METADATA_TOKEN_DENIED")
        # Access-only WRITE token must never be used for broad Worker scripts.
        # Old existing token stays READ-only inside this Access workflow.
        self.acct, self.token = acct, token
        self.worker_read_token = worker_read_token if worker_read_token else token
        self.opener = opener or build_opener(
            ProxyHandler({}), HTTPSHandler(), NoRedirect())

    def call(self, method, suffix, body=None):
        base = f"/accounts/{self.acct}"
        fixed_gets = {
            f"{base}/workers/workers",
            f"{base}/workers/scripts/{STAGE}/deployments",
            f"{base}/workers/scripts/{STAGE}/settings",
            f"{base}/workers/scripts/{STAGE}/subdomain",
            f"{base}/access/apps?page=1&per_page=100",
        }
        app_detail = re.fullmatch(
            re.escape(base) + r"/access/apps/([a-fA-F0-9-]{32,36})", suffix)
        policies = re.fullmatch(
            re.escape(base) + r"/access/apps/([a-fA-F0-9-]{32,36})/policies", suffix)
        if not ((method == "GET" and (suffix in fixed_gets or app_detail or policies))
                or (method == "POST" and suffix == f"{base}/access/apps"
                    and type(body) is dict and body.get("name") == APP_NAME
                    and body.get("type") == "self_hosted")):
            raise StageDenied("SERVER87_ENDPOINT_OR_METHOD_DENIED")
        is_worker_get = (method == "GET" and (suffix.startswith(
            f"{base}/workers/scripts/{STAGE}/") or suffix == f"{base}/workers/workers"))
        request = Request(
            "https://api.cloudflare.com/client/v4" + suffix, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={
                "Authorization": "Bearer " + (
                    self.worker_read_token if is_worker_get else self.token),
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        )
        try:
            with self.opener.open(request, timeout=18) as res:
                buf = res.read(262145)
                if res.status not in (200, 201) or len(buf) > 262144:
                    raise StageDenied("SERVER87_UNQUALIFIED_HTTP_RESPONSE")
        except HTTPError as err:
            code = err.code
            err.close()
            raise StageDenied(
                "SERVER87_ACCESS_WRITE_PERMISSION_DENIED" if code in (401, 403)
                else f"SERVER87_CLOUDFLARE_HTTP_{code}") from None
        except (URLError, OSError, TimeoutError):
            raise StageDenied("SERVER87_NETWORK_UNVERIFIED") from None
        try:
            packet = json.loads(buf)
        except (ValueError, TypeError):
            raise StageDenied("SERVER87_INVALID_JSON") from None
        if type(packet) is not dict or packet.get("success") is not True:
            raise StageDenied("SERVER87_API_RESULT_NOT_SUCCESS")
        return packet.get("result")

    def inspect(self):
        base = f"/accounts/{self.acct}"
        deploy = self.call("GET", f"{base}/workers/scripts/{STAGE}/deployments")
        dep = deploy.get("deployments") if type(deploy) is dict else None
        # Cloudflare retains multiple historical deployments. Only the FIRST
        # (most recent, actively serving) deployment determines current safety.
        ver = dep[0].get("versions") if type(dep) is list and len(dep) >= 1 and type(dep[0]) is dict else None
        if (type(ver) is not list or len(ver) != 1 or
                ver[0].get("version_id") != VERSION or ver[0].get("percentage") != 100):
            raise StageDenied("SERVER87_STAGE_VERSION_DRIFT")
        st = self.call("GET", f"{base}/workers/scripts/{STAGE}/settings")
        raw = st.get("bindings") if type(st) is dict else None
        if type(raw) is not list:
            raise StageDenied("SERVER87_STAGE_BINDINGS_UNVERIFIED")
        by_name = {i.get("name"): i for i in raw if type(i) is dict}
        if (by_name.get("DB", {}).get("type") != "d1" or
            by_name.get("TRENDOSSHOP_SERVICE_READ_ENABLED", {}).get("text") != "false" or
            by_name.get("MIRROR_SERVICE_READ_ENABLED", {}).get("text") != "false" or
            "TRENDOSSHOP_READER_TOKEN_SHA256_HEX" in by_name):
            raise StageDenied("SERVER87_STAGE_READERS_OR_DATA_NOT_ISOLATED")
        publication = self.call("GET", f"{base}/workers/scripts/{STAGE}/subdomain")
        if (type(publication) is not dict or
            publication.get("enabled") is not False or
            publication.get("previews_enabled") is not False):
            raise StageDenied("SERVER87_STAGE_PUBLICATION_NOT_DISABLED")
        workers = self.call("GET", f"{base}/workers/workers")
        candidates = [
            w for w in workers if type(w) is dict and w.get("name") == STAGE
        ] if type(workers) is list else []
        if len(candidates) != 1:
            raise StageDenied("SERVER87_STAGE_WORKER_UNRESOLVED")
        wid = candidates[0].get("id")
        if type(wid) is not str or not UUID.fullmatch(wid):
            raise StageDenied("SERVER87_STAGE_WORKER_ID_INVALID")
        apps = self.call("GET", f"{base}/access/apps?page=1&per_page=100")
        if type(apps) is not list or len(apps) >= 100:
            raise StageDenied("SERVER87_ACCESS_LIST_INCOMPLETE")
        for item in apps:
            if type(item) is not dict:
                raise StageDenied("SERVER87_ACCESS_LIST_ITEM_UNQUALIFIED")
            dest = item.get("destinations")
            if item.get("name") == APP_NAME or (
                type(dest) is list and any(
                    type(d) is dict and d.get("type") == "worker"
                    and d.get("worker_id") == wid for d in dest)):
                raise StageDenied("SERVER87_STAGE_ACCESS_APP_ALREADY_EXISTS")
        return wid

    def create_and_verify(self):
        worker_id = self.inspect()
        base = f"/accounts/{self.acct}/access/apps"
        result = self.call("POST", base, exact_deny_payload(worker_id))
        if type(result) is not dict:
            raise StageDenied("SERVER87_ACCESS_CREATE_RESPONSE_INVALID")
        app_id = result.get("id")
        if type(app_id) is not str or not UUID.fullmatch(app_id):
            raise StageDenied("SERVER87_ACCESS_APP_ID_UNVERIFIED")
        # Re-read the actual policy; never rely on the submitted request only.
        app = self.call("GET", f"{base}/{app_id}")
        dest = app.get("destinations") if type(app) is dict else None
        if (type(app) is not dict or app.get("type") != "self_hosted"
                or app.get("name") != APP_NAME or type(dest) is not list
                or dest != [{"type": "worker", "worker_id": worker_id}]):
            raise StageDenied("SERVER87_ACCESS_DESTINATION_MISMATCH_MANUAL_HOLD")
        pol = self.call("GET", f"{base}/{app_id}/policies")
        if type(pol) is not list or len(pol) != 1:
            raise StageDenied("SERVER87_ACCESS_POLICY_NOT_SINGLE_DENY")
        first = pol[0]
        if (type(first) is not dict or first.get("decision") != "block" or
                first.get("include") != [{"everyone": {}}]):
            raise StageDenied("SERVER87_ACCESS_POLICY_NOT_DENY_ALL")
        pub = self.call("GET", f"/accounts/{self.acct}/workers/scripts/{STAGE}/subdomain")
        if pub.get("enabled") is not False or pub.get("previews_enabled") is not False:
            raise StageDenied("SERVER87_STAGE_PUBLISHED_UNEXPECTEDLY")
        return True


def main(args=None, environ=None):
    argv = sys.argv[1:] if args is None else args
    env = os.environ if environ is None else environ
    if argv != ["--install-exact-deny-all"]:
        print("SERVER87_DENY_ALL_INSTALL_REQUIRES_EXPLICIT_ARG")
        return 64
    if env.get("SERVER87_OWNER_STAGE_AUTH_ONLY") != "true":
        print("SERVER87_STAGE_OWNER_AUTH_NOT_SET")
        return 2
    try:
        api = API(env.get("CLOUDFLARE_ACCOUNT_ID", ""),
                  env.get("CLOUDFLARE_ACCESS_API_TOKEN", ""),
                  worker_read_token=env.get("CLOUDFLARE_API_TOKEN", ""))
        api.create_and_verify()
        print("SERVER87_STAGE_ONLY_ACCESS_DENY_ALL=VERIFIED")
        print("SERVER87_STAGE_PUBLICATION=OFF;PRODUCTION_TOUCHED=NO;UBUNTU=OFF")
        return 0
    except StageDenied as exc:
        print(str(exc) if str(exc).startswith("SERVER87_") else "SERVER87_FAILED")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
