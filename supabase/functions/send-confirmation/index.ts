import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { appointmentId } = await req.json()
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: 'appointmentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, confirmation_token, user_id, appointment_date, service:service_id(name)')
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(appointment.user_id)
    const email = user?.email
    if (!email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const confirmUrl = `${appUrl}/confirmar?token=${appointment.confirmation_token}`

    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@tudominio.com'

    const { error: brevoError } = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Sistema de Turnos', email: fromEmail },
        to: [{ email }],
        subject: 'Confirmá tu turno',
        htmlContent: `
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
    }).then((r) => r.json())

    if (brevoError) {
      return new Response(JSON.stringify({ error: 'Failed to send email', details: brevoError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
