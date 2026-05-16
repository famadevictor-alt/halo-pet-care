-- Add refusal tracking to activity logs
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS retry_at TIMESTAMP WITH TIME ZONE;

-- Add a comment for documentation
COMMENT ON COLUMN activity_logs.status IS 'Status of the activity: taken, missed, or refused';
COMMENT ON COLUMN activity_logs.retry_at IS 'When the medication was scheduled for a retry after a refusal';
