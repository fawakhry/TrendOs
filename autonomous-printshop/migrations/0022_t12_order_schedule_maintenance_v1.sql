-- Autonomous Printshop Native Order Schedule Maintenance V1
-- Additive triggers only. They maintain t12_prod_order_schedule for future Native Orders.
-- No order/line status or business authority changes.

CREATE TRIGGER IF NOT EXISTS trg_t12_order_schedule_after_order_insert
AFTER INSERT ON t12_prod_orders
BEGIN
  INSERT OR IGNORE INTO t12_prod_order_schedule (
    order_id,
    expected_delivery_date,
    policy_code,
    source,
    updated_by
  ) VALUES (
    NEW.order_id,
    date(datetime(NEW.created_at,'+3 hours'),'+2 days'),
    'LEGACY_D0_FLY_D2_STANDARD_V1',
    'AUTONOMOUS_PRINTSHOP_SCHEDULE_TRIGGER_V1',
    'd1-trigger'
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_t12_order_schedule_after_line_insert
AFTER INSERT ON t12_prod_lines
BEGIN
  UPDATE t12_prod_order_schedule
     SET expected_delivery_date =
       CASE
         WHEN EXISTS (
           SELECT 1
             FROM t12_prod_lines l
            WHERE l.order_id=NEW.order_id
              AND l.fly_print=1
         )
         THEN date(datetime(
           (SELECT o.created_at FROM t12_prod_orders o WHERE o.order_id=NEW.order_id),
           '+3 hours'
         ))
         ELSE date(datetime(
           (SELECT o.created_at FROM t12_prod_orders o WHERE o.order_id=NEW.order_id),
           '+3 hours'
         ),'+2 days')
       END,
       policy_code='LEGACY_D0_FLY_D2_STANDARD_V1',
       source='AUTONOMOUS_PRINTSHOP_SCHEDULE_TRIGGER_V1',
       updated_by='d1-trigger',
       updated_at=CURRENT_TIMESTAMP
   WHERE order_id=NEW.order_id;
END;
