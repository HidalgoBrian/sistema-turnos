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
    const { token } = await req.json()
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Token es requerido' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('confirmation_token', token)
      .maybeSingle()

    if (fetchError) {
      console.error('Database error fetching appointment:', fetchError)
      return new Response(JSON.stringify({ success: false, error: `Error de base de datos: ${fetchError.message}` }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    if (!appointment) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    if (appointment.status === 'confirmed') {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    if (appointment.status === 'cancelled') {
      return new Response(JSON.stringify({ success: false, error: 'El turno fue cancelado (venció el tiempo límite de 5 minutos)' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Si está pendiente, lo confirmamos
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', appointment.id)
      .select('id')
      .single()

    if (error) {
      console.error('Database error confirming appointment:', error)
      return new Response(JSON.stringify({ success: false, error: `Error de base de datos: ${error.message}` }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
