import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@^2"

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
      return new Response(null, { headers: corsHeaders })
    }

    try {
      const { token } = await req.json()
      if (!token) {
        return Response.json({ success: false, error: "Token es requerido" }, { status: 400, headers: corsHeaders })
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("confirmation_token", token)
        .eq("status", "pending")
        .select("id")
        .single()

      if (error || !data) {
        return Response.json({ success: false, error: "Token inválido o turno ya confirmado" }, { status: 400, headers: corsHeaders })
      }

      return Response.json({ success: true }, { headers: corsHeaders })
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders })
    }
  },
}
