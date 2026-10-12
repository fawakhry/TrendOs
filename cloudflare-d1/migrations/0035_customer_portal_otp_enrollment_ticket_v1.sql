-- Entry659 SOURCE ONLY, UNAPPLIED: add one-time password enrollment proof
-- to the UNAPPLIED Entry654 customer native account table (0032).
-- Not authorized for Production. No INSERT/UPDATE to existing customer rows.
PRAGMA foreign_keys = ON;

ALTER TABLE customer_portal_native_accounts_v1
ADD COLUMN enrollment_ticket_mac_hex TEXT NOT NULL DEFAULT ''
  CHECK (enrollment_ticket_mac_hex='' OR (
    length(enrollment_ticket_mac_hex)=64
    AND enrollment_ticket_mac_hex NOT GLOB '*[^0-9a-f]*'
  ));

ALTER TABLE customer_portal_native_accounts_v1
ADD COLUMN enrollment_ticket_challenge_id TEXT NOT NULL DEFAULT ''
  CHECK (length(enrollment_ticket_challenge_id)<=100);

ALTER TABLE customer_portal_native_accounts_v1
ADD COLUMN enrollment_ticket_issued_at_ms INTEGER NOT NULL DEFAULT 0
  CHECK (enrollment_ticket_issued_at_ms>=0);

ALTER TABLE customer_portal_native_accounts_v1
ADD COLUMN enrollment_ticket_expires_at_ms INTEGER NOT NULL DEFAULT 0
  CHECK (enrollment_ticket_expires_at_ms>=0);

-- No login, SMS sender, token write, automated enrollment or trigger.
-- Only a future controlled server-side OTP verification/issuance path may
-- populate a customer's proof columns. Its password activation must blank them
-- atomically with the new PBKDF2 password and session_version increment.
