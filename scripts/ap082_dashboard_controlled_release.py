"""Pinned AP082 release; reuse the same isolated Dashboard-only lease checks."""
from pathlib import Path
import ap081_dashboard_controlled_release as release
release.BASE='cbe270a553df6f7de326a6934f5f7fa978aa18ef'
release.TARGET='6bcd4f676ce2aa2414b8e709afa932d2ae012b3c'
release.RELEASE_ID='AP082'
release.TARGET_VERSION='AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1_7_20261008'
release.STAGE=Path('/tmp/ap082-qualified-release');release.STAGE.mkdir(exist_ok=True)
release.EXPECTED_DIFF={
 'autonomous-printshop/core/control-tower-panel-status-v1.mjs',
 'autonomous-printshop/dashboard/worker.mjs',
 'autonomous-printshop/tests/control_tower_panel_status_v1.test.mjs',
 'autonomous-printshop/tests/dashboard_panel_status_v1.test.mjs',
 'autonomous-printshop/tests/dashboard_v1.test.mjs',
 '.github/workflows/autonomous-printshop-policy-v1-ci.yml',
 'autonomous-printshop/MASTER_BOOK.md'
}
release.CONTRACT_TESTS+=['control_tower_panel_status_v1','dashboard_panel_status_v1']
release.REPORT['source']=release.TARGET
release.run_release()
