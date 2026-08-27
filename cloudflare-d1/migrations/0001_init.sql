PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_code TEXT NOT NULL DEFAULT '',
  whatsapp_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);

CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  expected_delivery TEXT NOT NULL DEFAULT '',
  total REAL,
  remaining REAL,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'in',
  text TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source TEXT NOT NULL DEFAULT 'TrendOS',
  send_status TEXT NOT NULL DEFAULT '',
  meta_id TEXT NOT NULL DEFAULT '',
  needs_manager INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  by_user TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_meta_unique
  ON messages(meta_id)
  WHERE meta_id <> '';
CREATE INDEX IF NOT EXISTS idx_messages_phone_at ON messages(phone, at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id);

CREATE TABLE IF NOT EXISTS conversations (
  phone TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  last_message TEXT NOT NULL DEFAULT '',
  last_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  direction TEXT NOT NULL DEFAULT 'in',
  needs_manager INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_at ON conversations(last_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_manager ON conversations(needs_manager, last_at DESC);

CREATE TABLE IF NOT EXISTS migration_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'google-sheets',
  entity TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL DEFAULT ''
);
