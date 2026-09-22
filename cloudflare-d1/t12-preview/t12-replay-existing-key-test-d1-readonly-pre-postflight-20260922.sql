-- T12 isolated D1 replay qualification, READ-ONLY preflight + postflight.
-- Run in Cloudflare D1 Console for database trendos-t12-synthetic-test ONLY.
-- Never run on actual business D1. No INSERT, UPDATE, DELETE, DDL or HTTP here.
-- Same SELECT twice: first BEFORE any temporary TEST enable, next AFTER immediate relock.
-- All metric values BEFORE/AFTER the single exact-key replay must be identical:
-- fixture_and_fences_pass=1, next_order_number=2002,
-- request_ledger_count=1, order_count=1, line_count=1, event_count=1,
-- outbox_count=1, matching_original_request_rows=1, linked_complete_count=1.
-- If any metric differs before the test, STOP and keep the Worker disabled.
-- If a metric differs afterward, STOP; don't retry; retain TEST-only evidence.
-- Do not select canonical_json, response_json, bearer, customers or business payload.

SELECT 'fixture_and_fences_pass' AS metric, COUNT(*) AS value
FROM t12_synth_control
WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY'
  AND google_writer_fenced=1 AND r5_mirror_writer_fenced=1
UNION ALL
SELECT 'next_order_number', COALESCE(MAX(next_order_number), -1)
FROM t12_synth_control WHERE singleton=1
UNION ALL
SELECT 'request_ledger_count', COUNT(*) FROM t12_synth_request_ledger
UNION ALL
SELECT 'order_count', COUNT(*) FROM t12_synth_orders
UNION ALL
SELECT 'line_count', COUNT(*) FROM t12_synth_lines
UNION ALL
SELECT 'event_count', COUNT(*) FROM t12_synth_events
UNION ALL
SELECT 'outbox_count', COUNT(*) FROM t12_synth_outbox
UNION ALL
SELECT 'matching_original_request_rows', COUNT(*)
FROM t12_synth_request_ledger
WHERE request_key='cld1_1790071200000_T12SYNTHETICQUAL0001'
  AND status='COMMITTED'
UNION ALL
SELECT 'linked_complete_count', COUNT(*)
FROM t12_synth_request_ledger r
JOIN t12_synth_orders o
  ON o.request_key=r.request_key AND o.order_id=r.order_id
JOIN t12_synth_lines l
  ON l.request_key=r.request_key AND l.order_id=o.order_id
JOIN t12_synth_events e
  ON e.request_key=r.request_key AND e.order_id=o.order_id AND e.event_key='create'
JOIN t12_synth_outbox b
  ON b.request_key=r.request_key AND b.order_id=o.order_id
 AND b.line_id=l.line_id AND b.event_key='queue:01' AND b.status='pending'
WHERE r.request_key='cld1_1790071200000_T12SYNTHETICQUAL0001'
  AND r.status='COMMITTED';
