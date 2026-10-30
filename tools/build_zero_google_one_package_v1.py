#!/usr/bin/env python3
"""Build one reproducible offline Zero Google source ZIP. No cloud or secrets.

Build only files allowlisted in packages/zero-google-one-package-v1/manifest.json.
This deliberately does not generate a production deploy config, apply D1
migrations, package credentials, or enable original Google/Printshop writers.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import tempfile
import zipfile

ROOT=Path(__file__).resolve().parents[1]
MANIFEST_PATH=Path("packages/zero-google-one-package-v1/manifest.json")
VERSION="TRENDOS_ZERO_GOOGLE_ONE_PACKAGE_V1_OFF_20261031"
FIXED_DT=(2026,10,31,0,0,0)
MAX_FILE=32*1024*1024
MAX_TOTAL=55*1024*1024


def allowlisted_files():
    m=json.loads((ROOT/MANIFEST_PATH).read_text(encoding="utf-8"))
    items=m["sourceFiles"]+m["packageFiles"]
    if len(items)!=len(set(items)):
        raise ValueError("PACKAGE_FILE_DUPLICATE")
    total=0
    for name in items:
        p=PurePosixPath(name)
        if (p.is_absolute() or ".." in p.parts or "." in p.parts
            or not p.parts or name.startswith(".") or "\\" in name
            or any(x in {".git",".env",".wrangler","node_modules",
                          "secrets","credentials"} for x in p.parts)):
            raise ValueError("PACKAGE_UNSAFE_PATH")
        src=ROOT.joinpath(*p.parts)
        if not src.is_file() or src.is_symlink() or not src.resolve().is_relative_to(ROOT):
            raise ValueError("PACKAGE_FILE_ABSENT_OR_SYMLINK:"+name)
        mode=src.stat().st_mode
        if not stat.S_ISREG(mode) or src.stat().st_size>MAX_FILE:
            raise ValueError("PACKAGE_FILE_OVERSIZE_OR_UNSAFE:"+name)
        total+=src.stat().st_size
        if total>MAX_TOTAL:
            raise ValueError("PACKAGE_TOTAL_TOO_LARGE")
        yield name,src


def checked_source_audit():
    completed=subprocess.run(
        ["node",str(ROOT/"tools/zero_google_one_package_v1.mjs"),str(ROOT)],
        cwd=ROOT,check=True,encoding="utf-8",capture_output=True,timeout=20,
    )
    report=json.loads(completed.stdout)
    if (report.get("sourceChecksPassed") is not True
        or report.get("releaseDecision")!="NO_GO_PENDING_EXTERNAL_AUTHORITIES_AND_LIVE_PARITY"
        or report.get("productionDeploymentApproved") is not False
        or report.get("productionDeploymentPerformed") is not False
        or report.get("printReleaseAllowed") is not False
        or report.get("appsScriptMayBeDisabled") is not False
        or report.get("customerGoogleActionsRetiredInProductionLastProven") != 0):
        raise ValueError("PACKAGE_SOURCE_OR_LIVE_RELEASE_GUARDS_FAILED")
    return report


def build(output):
    report=checked_source_audit()
    sources=sorted(allowlisted_files())
    index={
        "schemaVersion":"trendos.zero-google.offline-zip.v1",
        "packageVersion":VERSION,
        "contentType":"SOURCE_ONLY_NO_DEPLOY_NO_LIVE_CUTOVER",
        "sourceChecksPassed":report["sourceChecksPassed"],
        "releaseDecision":report["releaseDecision"],
        "productionCustomerGoogleActionsRetiredLastProven":0,
        "cloudflareAccessCase":"02394197",
        "remoteStageDeployed":False,
        "writerCutoverAuthorized":False,
        "financeWriteAuthorized":False,
        "printReleaseAuthorized":False,
        "files":{},
    }
    out=Path(output).expanduser().resolve()
    if out.is_dir():
        raise ValueError("OUTPUT_MUST_BE_A_FILE")
    out.parent.mkdir(parents=True,exist_ok=True)
    # Single archive only; no extra unpacked customer/source data in output.
    with tempfile.TemporaryDirectory(prefix="zero-google-package-only-") as tmp:
        candidate=Path(tmp)/"bundle.zip"
        with zipfile.ZipFile(candidate,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for name,src in sources:
                raw=src.read_bytes()
                index["files"][name]={"sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw)}
                info=zipfile.ZipInfo(name,FIXED_DT)
                info.compress_type=zipfile.ZIP_DEFLATED
                info.external_attr=0o100644<<16
                z.writestr(info,raw,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
            index_data=(json.dumps(index,ensure_ascii=False,sort_keys=True,indent=2)+"\n").encode()
            info=zipfile.ZipInfo("ZERO_GOOGLE_PACKAGE_INDEX.json",FIXED_DT)
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16
            z.writestr(info,index_data)
        # Do not add archive to the source file list: self-referential.
        out.write_bytes(candidate.read_bytes())
    print(json.dumps({"path":str(out),"fileCount":len(sources),
                      "sha256":hashlib.sha256(out.read_bytes()).hexdigest(),
                      "sourcePass":True,"productionRelease":"NO_GO"},
                     sort_keys=True))


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output",default="dist/TrendOS-ZeroGoogle-OnePackage-V1-OFF.zip")
    args=parser.parse_args()
    try:
        build(args.output)
    except (ValueError,subprocess.CalledProcessError,subprocess.TimeoutExpired) as exc:
        print("ZERO_GOOGLE_PACKAGE_BUILD_DENIED:"+str(exc),file=sys.stderr)
        raise SystemExit(1)
