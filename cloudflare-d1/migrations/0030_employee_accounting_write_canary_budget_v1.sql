PRAGMA foreign_keys = ON;

-- EasyStore A2.7 first-write canary command budget.
-- Additive only. Defaults preserve closed authority until ARM explicitly sets max_commands.
ALTER TABLE employee_accounting_write_canary_v1
ADD COLUMN max_commands INTEGER NOT NULL DEFAULT 0 CHECK(max_commands>=0);

ALTER TABLE employee_accounting_write_canary_v1
ADD COLUMN commands_started INTEGER NOT NULL DEFAULT 0 CHECK(commands_started>=0);
