PRAGMA foreign_keys = ON;

-- Entry614 / Zero-Google employee operational core.
-- Additive only. Runtime control starts OFF; applying schema alone cannot cut traffic over.
CREATE TABLE IF NOT EXISTS employee_ops_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  marker TEXT NOT NULL CHECK(marker='ENTRY614_EMPLOYEE_OPS_V1'),
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF','READONLY','GENERAL')),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_ops_control_v1(singleton,marker,mode,policy_epoch)
VALUES(1,'ENTRY614_EMPLOYEE_OPS_V1','OFF',1);

CREATE TABLE IF NOT EXISTS employee_ops_request_ledger_v1 (
  request_key TEXT PRIMARY KEY,
  username_key TEXT NOT NULL,
  action TEXT NOT NULL,
  op TEXT NOT NULL DEFAULT '',
  canonical_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PREPARED','COMMITTED')),
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_ops_ledger_actor
ON employee_ops_request_ledger_v1(username_key,created_at DESC);

CREATE TABLE IF NOT EXISTS employee_attendance_settings_v1 (
  setting_key TEXT PRIMARY KEY,
  value_text TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_attendance_special_times_v1 (
  date_key TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_attendance_days_v1 (
  attendance_id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  username_key TEXT NOT NULL,
  username TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  scheduled_start TEXT NOT NULL DEFAULT '',
  clock_in_time TEXT NOT NULL DEFAULT '',
  difference_minutes INTEGER NOT NULL DEFAULT 0,
  attendance_status TEXT NOT NULL DEFAULT '',
  started_at_ms INTEGER NOT NULL,
  ended_at_ms INTEGER,
  day_status TEXT NOT NULL DEFAULT 'OPEN' CHECK(day_status IN ('OPEN','ENDED')),
  source TEXT NOT NULL DEFAULT 'trendos-cloud',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date_key,username_key)
);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_user_date
ON employee_attendance_days_v1(username_key,date_key DESC);

CREATE TABLE IF NOT EXISTS employee_attendance_pulses_v1 (
  pulse_id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id TEXT NOT NULL REFERENCES employee_attendance_days_v1(attendance_id) ON DELETE CASCADE,
  pulse_type TEXT NOT NULL CHECK(pulse_type IN (
    'start','pause','resume','rest_start','prayer_break_start',
    'presence_confirmed','heartbeat','missed_check','end_day'
  )),
  source TEXT NOT NULL DEFAULT 'TrendOS',
  note TEXT NOT NULL DEFAULT '',
  response_seconds INTEGER NOT NULL DEFAULT 0,
  review_required INTEGER NOT NULL DEFAULT 0 CHECK(review_required IN (0,1)),
  review_reason TEXT NOT NULL DEFAULT '',
  auto_generated INTEGER NOT NULL DEFAULT 0 CHECK(auto_generated IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_pulses_day
ON employee_attendance_pulses_v1(attendance_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_hr_employees_v1 (
  employee_id TEXT PRIMARY KEY,
  username_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL,
  primary_department TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  relationship_type TEXT NOT NULL DEFAULT '',
  compensation_system TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'نشط',
  start_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_hr_requests_v1 (
  request_id TEXT PRIMARY KEY,
  requested_at_ms INTEGER NOT NULL,
  username_key TEXT NOT NULL,
  username TEXT NOT NULL,
  request_type TEXT NOT NULL,
  from_value TEXT NOT NULL DEFAULT '',
  to_value TEXT NOT NULL DEFAULT '',
  duration_text TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'قيد المراجعة',
  reviewed_by TEXT NOT NULL DEFAULT '',
  reviewed_at_ms INTEGER,
  management_notes TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_hr_requests_user
ON employee_hr_requests_v1(username_key,requested_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_employee_hr_requests_status
ON employee_hr_requests_v1(status,requested_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_hr_skills_v1 (
  skill_id TEXT PRIMARY KEY,
  username_key TEXT NOT NULL,
  username TEXT NOT NULL,
  skill_department TEXT NOT NULL,
  skill_level TEXT NOT NULL DEFAULT '',
  can_work_solo INTEGER NOT NULL DEFAULT 0 CHECK(can_work_solo IN (0,1)),
  trained_by TEXT NOT NULL DEFAULT '',
  last_assessment TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_hr_skills_user
ON employee_hr_skills_v1(username_key,skill_department);

CREATE TABLE IF NOT EXISTS employee_hr_performance_v1 (
  performance_id TEXT PRIMARY KEY,
  period_key TEXT NOT NULL,
  username_key TEXT NOT NULL,
  username TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  on_time_score REAL,
  first_time_quality_score REAL,
  reprint_waste_score REAL,
  status_discipline_score REAL,
  service_collaboration_score REAL,
  strengths TEXT NOT NULL DEFAULT '',
  development_points TEXT NOT NULL DEFAULT '',
  training_plan TEXT NOT NULL DEFAULT '',
  human_review TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_hr_performance_user
ON employee_hr_performance_v1(username_key,period_key DESC);

CREATE TABLE IF NOT EXISTS employee_cleaning_daily_v1 (
  cleaning_id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  username_key TEXT NOT NULL,
  username TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  scheduled_start TEXT NOT NULL DEFAULT '',
  completed_at_ms INTEGER NOT NULL,
  machine_cleaned INTEGER NOT NULL DEFAULT 1 CHECK(machine_cleaned IN (0,1)),
  work_surface_cleaned INTEGER NOT NULL DEFAULT 1 CHECK(work_surface_cleaned IN (0,1)),
  yesterday_waste_cleared INTEGER NOT NULL DEFAULT 1 CHECK(yesterday_waste_cleared IN (0,1)),
  visual_check INTEGER NOT NULL DEFAULT 1 CHECK(visual_check IN (0,1)),
  tools_materials_arranged INTEGER NOT NULL DEFAULT 1 CHECK(tools_materials_arranged IN (0,1)),
  area_clean INTEGER NOT NULL DEFAULT 1 CHECK(area_clean IN (0,1)),
  status TEXT NOT NULL DEFAULT 'مكتمل',
  problem_found INTEGER NOT NULL DEFAULT 0 CHECK(problem_found IN (0,1)),
  problem_details TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date_key,username_key)
);
CREATE INDEX IF NOT EXISTS idx_employee_cleaning_user_date
ON employee_cleaning_daily_v1(username_key,date_key DESC);

CREATE TABLE IF NOT EXISTS employee_press_settings_v1 (
  setting_key TEXT PRIMARY KEY,
  value_text TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO employee_press_settings_v1(setting_key,value_text,description,active) VALUES
('PRESS_BATCH_START','17:00','ميعاد التشغيل الثابت للمكبس',1),
('PRESS_GRACE_MINUTES','15','مهلة قبل تنبيه التأخير',1),
('PRESS_PRIMARY_OPERATOR','ريفان','المسؤولة الأساسية',1),
('PRESS_SUPPORT_OPERATOR','وائل','الدعم والمتابعة',1),
('PRESS_POWER_KW','','قدرة المكبس الفعلية بالكيلووات',1),
('ELECTRICITY_RATE_EGP_KWH','','تعريفة الكهرباء الفعلية جنيه/ك.و.س',1);

CREATE TABLE IF NOT EXISTS employee_press_sessions_v1 (
  session_id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  started_at_ms INTEGER NOT NULL,
  ended_at_ms INTEGER,
  operator_username_key TEXT NOT NULL,
  operator_username TEXT NOT NULL,
  support_operator TEXT NOT NULL DEFAULT '',
  queue_at_start INTEGER NOT NULL DEFAULT 0,
  urgent_queue_at_start INTEGER NOT NULL DEFAULT 0,
  queue_at_end INTEGER,
  orders_pressed INTEGER NOT NULL DEFAULT 0,
  duration_minutes REAL,
  minutes_per_order REAL,
  power_kw REAL,
  consumption_kwh REAL,
  electricity_rate REAL,
  electricity_cost REAL,
  electricity_cost_per_order REAL,
  notes TEXT NOT NULL DEFAULT '',
  source_legacy_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_press_single_open
ON employee_press_sessions_v1((1)) WHERE ended_at_ms IS NULL;
CREATE INDEX IF NOT EXISTS idx_employee_press_date
ON employee_press_sessions_v1(date_key,started_at_ms DESC);

CREATE TABLE IF NOT EXISTS employee_ops_events_v1 (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_ops_events_entity
ON employee_ops_events_v1(domain,entity_id,created_at_ms DESC);
