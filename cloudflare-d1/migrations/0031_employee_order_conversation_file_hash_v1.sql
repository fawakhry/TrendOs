PRAGMA foreign_keys = ON;

-- Autonomous Printshop / Entry614 comms file content hash.
-- Additive only. Existing files remain explicitly unhashed until independently verified.
ALTER TABLE employee_order_conversation_files_v1
ADD COLUMN content_sha256 TEXT NOT NULL DEFAULT ''
CHECK(
  content_sha256=''
  OR (
    length(content_sha256)=64
    AND content_sha256=lower(content_sha256)
    AND content_sha256 NOT GLOB '*[^0-9a-f]*'
  )
);
