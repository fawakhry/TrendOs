-- T12 isolated D1 replay qualification. READ ONLY. Cloudflare console only
-- for database trendos-t12-synthetic-test. NEVER actual business D1.
-- Cloudflare Console returned SQLITE_ERROR "too many terms in compound SELECT"
-- for the previous nine-way UNION ALL. Run EACH of the three SELECTs below
-- SEPARATELY in TEST D1 Console. They contain no mutation.
-- Before enabling and after owner re-lock: fixture marker T12_SYNTHETIC_ONLY;
-- two fences=1, next_order_number=2002, all five counts=1,
-- original_request_count=1, linked_complete_count=1.
-- If any metric drifts, STOP, leave TEST disabled, do not send/retry any POST.
-- Do not select canonical_json, response_json, customer/business payload, bearer.

-- QUERY 1: control/counter and four visible source row counts. RUN ALONE.
SELECT fixture_marker,
       google_writer_fenced,
       r5_mirror_writer_fenced,
       next_order_number,
       (SELECT COUNT(*) FROM t12_synth_request_ledger) AS replay_count,
       (SELECT COUNT(*) FROM t12_synth_orders) AS order_count,
       (SELECT COUNT(*) FROM t12_synth_lines) AS line_count,
       (SELECT COUNT(*) FROM t12_synth_events) AS event_count
FROM t12_synth_control
WHERE singleton=1;

-- QUERY 2: outbox as one left-visible column; do not rely on horizontal scroll.
-- RUN ALONE.
SELECT COUNT(*) AS outbox_count FROM t12_synth_outbox;

-- QUERY 3: exact old fabricated request COMMITTED and full five-row linkage.
-- RUN ALONE.
SELECT
  (SELECT COUNT(*) FROM t12_synth_request_ledger
   WHERE request_key='cld1_1790071200000_T12SYNTHETICQUAL0001'
     AND status='COMMITTED') AS original_request_count,
  (SELECT COUNT(*) FROM t12_synth_request_ledger r
   JOIN t12_synth_orders o
     ON o.request_key=r.request_key AND o.order_id=r.order_id
   JOIN t12_synth_lines l
     ON l.request_key=r.request_key AND l.order_id=o.order_id
   JOIN t12_synth_events e
     ON e.request_key=r.request_key AND e.order_id=o.order_id
    AND e.event_key='create'
   JOIN t12_synth_outbox b
     ON b.request_key=r.request_key AND b.order_id=o.order_id
    AND b.line_id=l.line_id AND b.event_key='queue:01'
    AND b.status='pending'
   WHERE r.request_key='cld1_1790071200000_T12SYNTHETICQUAL0001'
     AND r.status='COMMITTED') AS linked_complete_count;
