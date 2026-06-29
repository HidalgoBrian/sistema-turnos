import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@^2"

const SENDPIGEON_API_KEY = Deno.env.get("SENDPIGEON_API_KEY")!
const APP_URL = Deno.env.get("APP_URL") || "https://sistema-turnos-swart.vercel.app"
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@sendpigeon-sandbox.dev"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { appointmentId } = await req.json()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, confirmation_token, user_id, appointment_date, service:services(name)')
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return Response.json({ error: 'Appointment not found' }, { status: 404, headers: corsHeaders })
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    const email = user?.email
    if (!email) {
      return Response.json({ error: 'User email not found' }, { status: 400, headers: corsHeaders })
    }

    const confirmUrl = `${APP_URL}/confirmar?token=${appointment.confirmation_token}`
    const date = new Date(appointment.appointment_date)
    const formattedDate = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">¡Turno reservado!</h2>
        <p>Reservaste un turno de <strong>${appointment.service?.name || 'peluquería'}</strong>
        para el <strong>${formattedDate}</strong></p>
        <p><strong>Horario:</strong> ${formattedTime}</p>
        <p>Hacé clic en el siguiente botón para confirmarlo:</p>
        <a href="${confirmUrl}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Confirmar turno
        </a>
        <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este turno, ignorá este correo.</p>
      </div>
    `

    const res = await fetch("https://api.sendpigeon.dev/v1/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENDPIGEON_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Confirmá tu turno",
        html,
      }),
    })

    const sendResult = await res.json()

    if (!res.ok) {
      console.error("SendPigeon error:", sendResult)
      return Response.json({ error: 'Failed to send email', details: sendResult }, { status: 500, headers: corsHeaders })
    }

    return Response.json({ success: true, id: sendResult.id }, { status: 200, headers: corsHeaders })
  },
}
