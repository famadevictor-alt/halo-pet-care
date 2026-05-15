import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { email, pet_name, download_url } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Halo Pet Care <invites@petsync.app>',
      to: email,
      subject: `Action Required: Join ${pet_name}'s Care Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4A8EB2;">Welcome to Halo Pet Care</h2>
          <p>You have been invited to join the clinical care team for <strong>${pet_name}</strong>.</p>
          <p>As an authorized caregiver, you will be able to monitor medication protocols and diagnostic data in real-time.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${download_url}" style="background-color: #4A8EB2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download the App</a>
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, please ignore this email.</p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { status: res.status })
})
