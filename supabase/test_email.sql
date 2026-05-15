-- TEST SCRIPT: Run this to see why your emails aren't sending.
-- 1. Run this entire block in the Supabase SQL Editor.
-- 2. Then check the result at the bottom.

-- STEP A: Attempt to send a test email manually
SELECT net.http_post(
  url := 'https://api.resend.com/emails',
  headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer re_G1zcL7dd_DMyijEsL6kc9GZvK3GVzoQCi'
  ),
  body := jsonb_build_object(
      'from', 'onboarding@resend.dev', 
      'to', 'delivered@resend.dev', -- This is Resend's test recipient
      'subject', 'Test from Supabase',
      'html', '<p>Testing connection...</p>'
  )
) as request_id;

-- STEP B: Wait 5 seconds, then run this to see the result:
-- SELECT * FROM net.http_log ORDER BY created_at DESC LIMIT 1;
