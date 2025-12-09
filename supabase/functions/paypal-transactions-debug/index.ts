import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET')
    const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox'

    return new Response(JSON.stringify({
      success: true,
      debug: true,
      has_client_id: !!PAYPAL_CLIENT_ID,
      has_secret: !!PAYPAL_SECRET,
      mode: PAYPAL_MODE
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
