-- READ ONLY / ONE SELECT ONLY / NO INSERT-UPDATE-DELETE / TEST UUID confirmation in Console required.
-- TEST: trendos-t12-synthetic-test (54a3c05e-cde9-4979-814f-d40f941edcd5).
-- Match the exact four fabricated mirror rows and two synthetic catalog records.
-- Does not prove a D1 atomic batch, writer fencing, or production safety.
WITH
expected_catalog(sheet_name, sheet_id) AS (
  SELECT 'الأوردرات', 'SYNTHETIC_TEST_MIRROR_9001'
  UNION ALL SELECT 'بنود الأوردرات', 'SYNTHETIC_TEST_MIRROR_9002'
),
expected_rows(sheet_name, row_number, value_json) AS (
  SELECT 'الأوردرات', 1, '["synthetic_header"]'
  UNION ALL SELECT 'الأوردرات', 2, '["SYNTHETIC TEST MIRROR OLD ORDER"]'
  UNION ALL SELECT 'بنود الأوردرات', 1, '["synthetic_header"]'
  UNION ALL SELECT 'بنود الأوردرات', 2, '["SYNTHETIC TEST MIRROR OLD LINE"]'
)
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM t12_synth_control
    WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY'
  )
  AND (SELECT COUNT(*) FROM sheet_catalog)=2
  AND (SELECT COUNT(*) FROM sheet_rows)=4
  AND (SELECT COUNT(*) FROM sheet_migration_runs)=0
  AND (
    SELECT COUNT(*) FROM expected_catalog e
    JOIN sheet_catalog c ON c.sheet_name=e.sheet_name
      AND c.sheet_id=e.sheet_id
      AND c.headers_json='["synthetic_header"]'
      AND c.source_last_row=2 AND c.source_last_col=1
      AND c.row_count=2 AND c.status='ready'
      AND c.note='TrendOS orders live sync V2 quota-aware'
  )=2
  AND (
    SELECT COUNT(*) FROM expected_rows e
    JOIN sheet_rows r ON r.sheet_name=e.sheet_name
      AND r.row_number=e.row_number
      AND r.values_json=e.value_json
      AND r.display_json=e.value_json
      AND r.formulas_json='[""]'
  )=4
THEN 'PASS_EXACT_SYNTHETIC_BASELINE_READ_ONLY'
ELSE 'STOP_BASELINE_MISMATCH_NO_WRITE'
END AS exact_fixture_gate;
