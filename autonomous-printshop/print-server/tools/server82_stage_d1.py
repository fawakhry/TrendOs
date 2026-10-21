"""SERVER-82: guarded *synthetic-only* D1 setup for an isolated Cloudflare Worker.

No customer data, real orders, production queries or secrets in source/output.
--validate is fully offline; --create-seed is a one-shot, owner-gated action.
"""
import json
import os
import re
import sqlite3
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPSHandler, HTTPRedirectHandler, ProxyHandler

STAGE = "trendos-server68-isolated-stage"
DATABASE = "trendos-server82-synthetic-20261021"
EXPECTED_STAGE_VERSION = "4e833020-dc49-4e4a-9fcf-1874fa812b60"
FIXTURE = Path("cloudflare-d1/fixtures/server82_stage_only_synthetic.sql")
STAGE_TOML = Path("cloudflare-d1/wrangler.server68-isolated-stage.toml")
UUID = re.compile(r"^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$")
TABLES = {"sheet_catalog", "sheet_rows", "t12_prod_create_control",
          "t12_prod_lines", "t12_prod_line_runtime"}
BASE = "https://api.cloudflare.com/client/v4/accounts/"


class StageBlocked(Exception):
    pass


def fixture_statements(text):
    if not isinstance(text, str) or not 0 < len(text) < 12000:
        raise StageBlocked("SERVER82_FIXTURE_INVALID")
    if not text.lstrip().startswith("-- SERVER-82: completely synthetic"):
        raise StageBlocked("SERVER82_FIXTURE_MARKER_MISSING")
    for term in ("trendos-main", "5c4b92bf", "DROP ", "ALTER ", "DELETE ",
                 "UPDATE ", "ATTACH ", "PRAGMA ", "http", "customer_phone",
                 "customer_name", "PRIVATE_CUSTOMER", "CLOUDFLARE_API_TOKEN"):
        if term.casefold() in text.casefold():
            raise StageBlocked("SERVER82_UNSAFE_FIXTURE")
    statements, buffer = [], ""
    for line in text.splitlines():
        if line.lstrip().startswith("--") or not line.strip():
            continue
        buffer += line + "\n"
        if sqlite3.complete_statement(buffer):
            statement = buffer.strip().rstrip(";").strip()
            m = re.match(
                r"^(CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS|INSERT\s+INTO)\s+([A-Za-z_]\w*)\b",
                statement, re.IGNORECASE)
            if not m or m.group(2) not in TABLES or ";" in statement:
                raise StageBlocked("SERVER82_SQL_NOT_ALLOWLISTED")
            statements.append(statement)
            buffer = ""
    if buffer.strip() or len(statements) != 9 or text.count("FAKE-S82-ORDER") != 2:
        raise StageBlocked("SERVER82_SYNTHETIC_SCHEMA_NOT_QUALIFIED")
    db = sqlite3.connect(":memory:")
    try:
        for sql in statements:
            db.execute(sql)
        result = db.execute(
            "SELECT department,COUNT(*) FROM t12_prod_lines GROUP BY department"
        ).fetchall()
        if sorted(result) != [("طباعة", 1), ("ليزر", 1)]:
            raise StageBlocked("SERVER82_FAKE_DEPARTMENTS_INVALID")
    except sqlite3.DatabaseError as exc:
        raise StageBlocked("SERVER82_FIXTURE_SQL_INVALID") from exc
    finally:
        db.close()
    return statements


def check_toml(text):
    if not isinstance(text, str) or f'name = "{STAGE}"' not in text:
        raise StageBlocked("SERVER82_WRONG_STAGE")
    for entry in ("workers_dev = false", "preview_urls = false",
                  'TRENDOSSHOP_SERVICE_READ_ENABLED = "false"',
                  'MIRROR_SERVICE_READ_ENABLED = "false"'):
        if text.splitlines().count(entry) != 1:
            raise StageBlocked("SERVER82_PUBLIC_OR_READER_FLAG")
    if ("[[d1_databases]]" in text or "database_id =" in text
            or 'database_name = "trendos-main"' in text):
        raise StageBlocked("SERVER82_EXISTING_D1_UNQUALIFIED")
    return True


def ephemeral_bound_toml(original, database_id):
    check_toml(original)
    if not isinstance(database_id, str) or not UUID.fullmatch(database_id):
        raise StageBlocked("SERVER82_BAD_DATABASE_ID")
    return (original.rstrip() + "\n\n"
            + "# SERVER-82 ephemeral only; never committed to GitHub.\n"
            + "[[d1_databases]]\n"
            + 'binding = "DB"\n'
            + f'database_name = "{DATABASE}"\n'
            + f'database_id = "{database_id}"\n')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Cloudflare:
    def __init__(self, account, token, opener=None):
        if not isinstance(account, str) or not re.fullmatch(r"[a-fA-F0-9]{32}", account):
            raise StageBlocked("SERVER82_ACCOUNT_INVALID")
        if not isinstance(token, str) or len(token) < 16:
            raise StageBlocked("SERVER82_TOKEN_ABSENT")
        self.base = BASE + account
        self.token = token
        self.opener = opener or build_opener(
            ProxyHandler({}), HTTPSHandler(), NoRedirect())

    def call(self, method, path, payload=None):
        listing = re.fullmatch(r"/d1/database\?per_page=100&page=[1-9]\d{0,2}", path)
        query = re.fullmatch(r"/d1/database/[a-f0-9-]{36}/query", path)
        worker = path in {
            f"/workers/scripts/{STAGE}/deployments",
            f"/workers/scripts/{STAGE}/settings",
            f"/workers/scripts/{STAGE}/subdomain"}
        if not ((method == "GET" and (bool(listing) or worker)) or
                (method == "POST" and (path == "/d1/database" or bool(query)))):
            raise StageBlocked("SERVER82_ENDPOINT_NOT_ALLOWLISTED")
        data = json.dumps(payload).encode() if payload is not None else None
        req = Request(self.base + path, method=method, data=data, headers={
            "Authorization": "Bearer " + self.token, "Accept": "application/json",
            "Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=20) as response:
                body = response.read(131073)
                if response.status not in (200, 201) or len(body) > 131072:
                    raise StageBlocked("SERVER82_HTTP_BODY_UNQUALIFIED")
        except HTTPError as exc:
            code = exc.code
            exc.close()
            raise StageBlocked(f"SERVER82_CLOUDFLARE_HTTP_{code}") from None
        except (URLError, OSError, TimeoutError):
            raise StageBlocked("SERVER82_NETWORK_UNAVAILABLE") from None
        try:
            result = json.loads(body)
            if not isinstance(result, dict) or result.get("success") is not True:
                raise StageBlocked("SERVER82_API_NOT_SUCCESS")
            return result
        except (TypeError, ValueError):
            raise StageBlocked("SERVER82_BAD_API_RESPONSE") from None

    def confirm_stage(self):
        for suffix in ("deployments", "settings", "subdomain"):
            obj = self.call("GET", f"/workers/scripts/{STAGE}/{suffix}").get("result")
            if not isinstance(obj, dict):
                raise StageBlocked("SERVER82_STAGE_METADATA_UNVERIFIED")
            if suffix == "deployments":
                deps = obj.get("deployments")
                if (not isinstance(deps, list) or len(deps) != 1 or
                    not isinstance(deps[0], dict) or
                    not isinstance(deps[0].get("versions"), list) or
                    len(deps[0]["versions"]) != 1 or
                    deps[0]["versions"][0].get("version_id") != EXPECTED_STAGE_VERSION or
                    deps[0]["versions"][0].get("percentage") != 100):
                    raise StageBlocked("SERVER82_STAGE_VERSION_CHANGED")
            elif suffix == "settings":
                bindings = obj.get("bindings")
                if not isinstance(bindings, list):
                    raise StageBlocked("SERVER82_BINDINGS_UNVERIFIED")
                names = {x.get("name"): x for x in bindings if isinstance(x, dict)}
                if ("DB" in names or
                    names.get("MIRROR_SERVICE_READ_REPLAY_DO", {}).get("type")
                        != "durable_object_namespace" or
                    names.get("TRENDOSSHOP_SERVICE_READ_ENABLED", {}).get("text")
                        != "false" or
                    names.get("MIRROR_SERVICE_READ_ENABLED", {}).get("text")
                        != "false"):
                    raise StageBlocked("SERVER82_STAGE_NOT_SYNTHETIC_READY")
            elif obj.get("enabled") is not False or obj.get("previews_enabled") is not False:
                raise StageBlocked("SERVER82_STAGE_PUBLICATION_ON")
        return True

    def name_absent(self):
        for page in range(1, 6):
            raw = self.call("GET", f"/d1/database?per_page=100&page={page}")
            items, info = raw.get("result"), raw.get("result_info")
            if (not isinstance(items, list) or not isinstance(info, dict) or
                type(info.get("total_pages")) is not int or
                not 1 <= info["total_pages"] <= 5):
                raise StageBlocked("SERVER82_D1_LIST_INCOMPLETE")
            if any(isinstance(x, dict) and x.get("name") == DATABASE for x in items):
                raise StageBlocked("SERVER82_STAGE_D1_ALREADY_EXISTS")
            if page >= info["total_pages"]:
                return True
        raise StageBlocked("SERVER82_D1_PAGE_COUNT_LIMIT")

    def create(self):
        result = self.call("POST", "/d1/database", {"name": DATABASE}).get("result")
        if not isinstance(result, dict) or result.get("name") != DATABASE:
            raise StageBlocked("SERVER82_DB_CREATE_RESPONSE_UNVERIFIED")
        dbid = result.get("uuid") or result.get("id")
        if not isinstance(dbid, str) or not UUID.fullmatch(dbid):
            raise StageBlocked("SERVER82_DB_IDENTIFIER_UNVERIFIED")
        return dbid

    def seed_and_verify(self, dbid, statements):
        if not UUID.fullmatch(dbid):
            raise StageBlocked("SERVER82_WRONG_DB_ID")
        for statement in statements:
            res = self.call("POST", f"/d1/database/{dbid}/query",
                            {"sql": statement}).get("result")
            if (not isinstance(res, list) or not res or
                not all(isinstance(item, dict) and item.get("success") is True
                        for item in res)):
                raise StageBlocked("SERVER82_FIXTURE_QUERY_FAILED")
        result = self.call("POST", f"/d1/database/{dbid}/query", {
            "sql": "SELECT line_id,order_id,department,qty FROM t12_prod_lines ORDER BY line_id"
        }).get("result")
        if not isinstance(result, list) or len(result) != 1:
            raise StageBlocked("SERVER82_FIXTURE_VERIFY_INVALID")
        rows = result[0].get("results")
        expected = [
            ("FAKE-S82-LASER", "FAKE-S82-ORDER", "ليزر", 1),
            ("FAKE-S82-PRINT", "FAKE-S82-ORDER", "طباعة", 2)]
        if (not isinstance(rows, list) or len(rows) != 2 or
            sorted((x.get("line_id"), x.get("order_id"), x.get("department"),
                    x.get("qty")) for x in rows if isinstance(x, dict)) != expected):
            raise StageBlocked("SERVER82_D1_FAKE_ROWS_MISMATCH")
        return True


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    try:
        statements = fixture_statements(FIXTURE.read_text(encoding="utf-8"))
        conf = STAGE_TOML.read_text(encoding="utf-8")
        check_toml(conf)
        if args == ["--validate"]:
            print("SERVER82_SYNTHETIC_FIXTURE_OFFLINE=PASS")
            return 0
        if args != ["--create-seed"]:
            raise StageBlocked("SERVER82_MODE_NOT_ALLOWED")
        if os.environ.get("SERVER82_OWNER_CONTINUATION_ALLOWED") != "true":
            raise StageBlocked("SERVER82_OWNER_CONTINUATION_REQUIRED")
        cf = Cloudflare(os.environ.get("CLOUDFLARE_ACCOUNT_ID", ""),
                        os.environ.get("CLOUDFLARE_API_TOKEN", ""))
        cf.confirm_stage()
        cf.name_absent()
        dbid = cf.create()
        print("SERVER82_NEW_SYNTHETIC_D1_CREATED=YES", flush=True)
        cf.seed_and_verify(dbid, statements)
        Path("/tmp/server82-db-id").write_text(dbid, encoding="utf-8")
        # NEVER commit DB IDs, credentials, or this ephemeral config.
        Path("/tmp/server82-stage-toml").write_text(
            ephemeral_bound_toml(conf, dbid), encoding="utf-8")
        print("SERVER82_TWO_FAKE_LINES_ONE_FAKE_ORDER=VERIFIED", flush=True)
        return 0
    except (StageBlocked, OSError, ValueError, TypeError) as exc:
        msg = str(exc)
        print(msg if msg.startswith("SERVER82_") else "SERVER82_UNKNOWN_FAILURE",
              file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
