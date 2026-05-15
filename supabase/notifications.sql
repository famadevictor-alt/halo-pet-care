-- Email Notification System for Caregivers
-- This script sets up the infrastructure for email notifications using Supabase Edge Functions.

-- 1. Create a log table for notifications if needed (optional but good for debugging)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Trigger Function for New Caregiver Invitation
CREATE OR REPLACE FUNCTION public.on_caregiver_invited()
RETURNS TRIGGER AS $$
DECLARE
    resend_key TEXT;
BEGIN
    -- 1. Fetch the secret key from the Vault
    -- Note: Ensure 'vault' extension is enabled and the secret 'resend_api_key' exists.
    SELECT decrypted_secret INTO resend_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'resend_api_key';

    -- 2. Log the notification attempt
    INSERT INTO public.notification_logs (recipient_email, notification_type, metadata)
    VALUES (NEW.caregiver_email, 'invitation', jsonb_build_object('pet_id', NEW.pet_id, 'invited_by', NEW.invited_by));
    
    -- 3. Direct Integration: Calling Resend API using the secure key
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(resend_key, 'MISSING_SECRET')
      ),
      body := jsonb_build_object(
          'from', 'Halo Pet Care <invites@petsync.app>',
          'to', NEW.caregiver_email,
          'subject', 'Join the Care Team for ' || (SELECT name FROM public.pets WHERE id = NEW.pet_id),
          'html', '<div style="font-family: sans-serif; padding: 20px;">' ||
                  '<h2>Welcome to Halo Pet Care</h2>' ||
                  '<p>You have been invited to monitor <strong>' || (SELECT name FROM public.pets WHERE id = NEW.pet_id) || '</strong>.</p>' ||
                  '<p><a href="https://petsync.app/download" style="background: #4A8EB2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>' ||
                  '</div>'
      )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set up the Triggers
DROP TRIGGER IF EXISTS tr_caregiver_invited ON public.pet_caregivers;
CREATE TRIGGER tr_caregiver_invited
    AFTER INSERT ON public.pet_caregivers
    FOR EACH ROW EXECUTE FUNCTION public.on_caregiver_invited();

-- NOTE: Dose administration alerts have been removed per user request.
