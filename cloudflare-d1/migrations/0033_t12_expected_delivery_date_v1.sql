-- T12 immutable delivery date contract. Schema-only change; historical orders remain unchanged.
-- Apply migration BEFORE deploying the candidate writer/read overlay.
-- No UPDATE / backfill: historical missing dates are computed with explicit provenance on reads.
ALTER TABLE t12_prod_orders ADD COLUMN expected_delivery_date TEXT NOT NULL DEFAULT '';
ALTER TABLE t12_prod_orders ADD COLUMN expected_delivery_source TEXT NOT NULL DEFAULT '';
ALTER TABLE t12_prod_lines ADD COLUMN expected_delivery_date TEXT NOT NULL DEFAULT '';
ALTER TABLE t12_prod_lines ADD COLUMN expected_delivery_source TEXT NOT NULL DEFAULT '';
