import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { appointmentId } = await req.json()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, confirmation_token, user_id, appointment_date, service:services(name)')
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    const email = user?.email
    if (!email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const confirmUrl = `${appUrl}/confirmar?token=${appointment.confirmation_token}`

    const sendPigeonKey = Deno.env.get('SENDPIGEON_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@sendpigeon-sandbox.dev'

    const sendRes = await fetch('https://api.sendpigeon.dev/v1/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sendPigeonKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: 'Confirmá tu turno',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">¡Turno reservado!</h2>
            <p>Reservaste un turno de <strong>${appointment.service?.name || 'peluquería'}</strong>
            para el <strong>${new Date(appointment.appointment_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            <p>Hacé clic en el siguiente botón para confirmarlo:</p>
            <a href="${confirmUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
              Confirmar turno
            </a>
            <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este turno, ignorá este correo.</p>
          </div>
        `,
      }),
    })

    const sendResult = await sendRes.json()

    if (!sendRes.ok) {
      console.error('SendPigeon error:', sendResult)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: sendResult }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ success: true, id: sendResult.id }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
