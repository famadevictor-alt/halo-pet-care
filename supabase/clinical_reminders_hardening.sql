-- Clinical Adherence Reminders Hardening
-- Adds configuration for reminder intervals and repetition counts

-- 1. Medications Table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS reminder_interval_mins INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 12;

-- 2. Appointments Table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_interval_mins INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 2;

-- 3. Comment for documentation
COMMENT ON COLUMN medications.reminder_interval_mins IS 'Interval in minutes between nagging reminders for medication.';
COMMENT ON COLUMN medications.reminder_count IS 'Number of times to remind the user if administration is not confirmed.';
