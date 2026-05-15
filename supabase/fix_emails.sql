-- STEP 1: Enable the pg_net extension
-- This is required for the database to send emails via Resend.
CREATE SCHEMA IF NOT EXISTS net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

-- STEP 2: Update the trigger with a verified test sender
-- Resend will REJECT any domain that isn't verified in your dashboard.
-- We are switching to 'onboarding@resend.dev' which is the default test domain.

CREATE OR REPLACE FUNCTION public.on_caregiver_invited()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the notification attempt to our local table
    INSERT INTO public.notification_logs (recipient_email, notification_type, metadata)
    VALUES (NEW.caregiver_email, 'invitation', jsonb_build_object('pet_id', NEW.pet_id, 'invited_by', NEW.invited_by));
    
    -- Calling Resend API via pg_net
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer re_G1zcL7dd_DMyijEsL6kc9GZvK3GVzoQCi'
      ),
      body := jsonb_build_object(
          'from', 'onboarding@resend.dev', 
          'to', NEW.caregiver_email,
          'subject', 'Care Team Invitation for ' || (SELECT name FROM public.pets WHERE id = NEW.pet_id),
          'html', '<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">' ||
                  '<h2 style="color: #4A8EB2;">Halo Pet Care Invitation</h2>' ||
                  '<p>You have been invited as a caregiver for <strong>' || (SELECT name FROM public.pets WHERE id = NEW.pet_id) || '</strong>.</p>' ||
                  '<p>Stay synced with the care team and monitor vitals in real-time.</p>' ||
                  '<div style="margin-top: 30px;">' ||
                  '<a href="https://petsync.app/download" style="background: #4A8EB2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get Started</a>' ||
                  '</div>' ||
                  '</div>'
      )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Diagnostic Check
-- After adding a caregiver, run this in the Supabase SQL Editor to see the exact error message from Resend.
/*
SELECT 
    created_at, 
    status, 
    response_body, 
    request_id 
FROM net.http_log 
ORDER BY created_at DESC 
LIMIT 5;
*/
