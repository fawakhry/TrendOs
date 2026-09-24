-- PROPOSAL ONLY. Only owner may paste one statement at a time in the exact
-- TEST D1 UUID 54a3c05e-cde9-4979-814f-d40f941edcd5 after checking resource.
-- Source originally empty 0/0/0 and legacy test control marker is required by
-- BOTH inserts. Stop if first SELECT readback is not exactly 2/0/0.
-- Do NOT run on trendos-main, rerun after unknown outcome, or bulk-paste SQL.
-- Fake values only. These rows are NOT source Google order rows.
-- Stage 1 (paste starting INSERT, without any leading SQL comment).
INSERT INTO sheet_catalog (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,row_count,status,note)
SELECT seed.sheet_name,seed.sheet_id,'["synthetic_header"]',2,1,2,'ready','TrendOS orders live sync V2 quota-aware'
FROM (
  SELECT 'الأوردرات' AS sheet_name,'SYNTHETIC_TEST_MIRROR_9001' AS sheet_id
  UNION ALL SELECT 'بنود الأوردرات','SYNTHETIC_TEST_MIRROR_9002'
) AS seed
WHERE EXISTS (
  SELECT 1 FROM t12_synth_control
  WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY'
)
AND (SELECT COUNT(*) FROM sheet_catalog)=0
AND (SELECT COUNT(*) FROM sheet_rows)=0
AND (SELECT COUNT(*) FROM sheet_migration_runs)=0;

-- Check stage 1 before stage 2: SELECT-only expected 2/0/0.
SELECT (SELECT COUNT(*) FROM sheet_catalog) AS catalog_rows,
       (SELECT COUNT(*) FROM sheet_rows) AS mirror_rows,
       (SELECT COUNT(*) FROM sheet_migration_runs) AS migration_run_rows;

-- Stage 2 (paste starting INSERT, without any leading SQL comment).
INSERT INTO sheet_rows (sheet_name,row_number,values_json,display_json,formulas_json)
SELECT seed.sheet_name,seed.row_number,seed.value_json,seed.value_json,'[""]'
FROM (
  SELECT 'الأوردرات' AS sheet_name,1 AS row_number,'["synthetic_header"]' AS value_json
  UNION ALL SELECT 'الأوردرات',2,'["SYNTHETIC TEST MIRROR OLD ORDER"]'
  UNION ALL SELECT 'بنود الأوردرات',1,'["synthetic_header"]'
  UNION ALL SELECT 'بنود الأوردرات',2,'["SYNTHETIC TEST MIRROR OLD LINE"]'
) AS seed
WHERE EXISTS (
  SELECT 1 FROM t12_synth_control
  WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY'
)
AND (SELECT COUNT(*) FROM sheet_catalog)=2
AND EXISTS (
 SELECT 1 FROM sheet_catalog
 WHERE sheet_name='الأوردرات' AND sheet_id='SYNTHETIC_TEST_MIRROR_9001'
 AND headers_json='["synthetic_header"]' AND source_last_row=2
 AND source_last_col=1 AND row_count=2 AND status='ready'
 AND note='TrendOS orders live sync V2 quota-aware'
)
AND EXISTS (
 SELECT 1 FROM sheet_catalog
 WHERE sheet_name='بنود الأوردرات' AND sheet_id='SYNTHETIC_TEST_MIRROR_9002'
 AND headers_json='["synthetic_header"]' AND source_last_row=2
 AND source_last_col=1 AND row_count=2 AND status='ready'
 AND note='TrendOS orders live sync V2 quota-aware'
)
AND (SELECT COUNT(*) FROM sheet_rows)=0
AND (SELECT COUNT(*) FROM sheet_migration_runs)=0;

-- Stage 3: read-only postflight expected 2/4/0/2/2.
SELECT
  (SELECT COUNT(*) FROM sheet_catalog) AS catalog_rows,
  (SELECT COUNT(*) FROM sheet_rows) AS mirror_rows,
  (SELECT COUNT(*) FROM sheet_migration_runs) AS migration_run_rows,
  (SELECT COUNT(*) FROM sheet_rows WHERE sheet_name='الأوردرات') AS fake_order_tab_rows,
  (SELECT COUNT(*) FROM sheet_rows WHERE sheet_name='بنود الأوردرات') AS fake_line_tab_rows;
