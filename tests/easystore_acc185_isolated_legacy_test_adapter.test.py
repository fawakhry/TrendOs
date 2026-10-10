#!/usr/bin/env python3
import importlib.util
spec=importlib.util.spec_from_file_location(
    "adapter", "scripts/easystore_acc185_isolated_legacy_test_adapter.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
index="<title>ES47 V1922 Unified Safe Build</title>"+mod.MARKER
original="assert.match(code,/ok/);\n"+mod.OLD+"\nassert.match(app,/ok/);"
fixed=mod.adapt_test(index,original)
assert fixed.replace(mod.NEW,mod.OLD)==original
assert fixed.count(mod.NEW)==1
def deny(i,t,why):
    try: mod.adapt_test(i,t)
    except mod.AdapterStop as e:
        assert why in str(e),(why,str(e))
    else: raise AssertionError("ACC185_BAD_ADAPTER_"+why)
deny(index,original+mod.OLD,"EXPECTED_ONE_EXACT_STALE_ASSERTION")
deny(index,fixed,"EXPECTED_ONE_EXACT_STALE_ASSERTION")
deny(index.replace(mod.MARKER,"changed"),original,"REAL_INDEX_TAG_DRIFT")
deny(index.replace("ES47 V1922 Unified Safe Build","OTHER"),original,"INDEX_VERSION_DRIFT")
deny(index+"entry619-d1-readonly-sso2-20261004",original,"OLD_TAG_STILL_LIVE")
deny(index,"test unchanged", "EXPECTED_ONE_EXACT_STALE_ASSERTION")
print("ACC185_ISOLATED_UPSTREAM_STALE_TEST_MARKER_ADAPTER_NEGATIVES=PASS")
print("ACC185_UPSTREAM_EASYSTORE_SOURCE_PRESERVED=PASS")
