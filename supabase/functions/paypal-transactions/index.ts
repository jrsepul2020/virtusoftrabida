import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Leer body de forma segura
    const bodyText = await req.text()
    let parsedBody: Record<string, unknown> = {}
    if (bodyText) {
      try {
        parsedBody = JSON.parse(bodyText)
      } catch {
        parsedBody = {}
      }
    }

    // Variables de entorno
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET')
    const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox'

    // Debug mode
    const url = new URL(req.url)
    if (url.searchParams.get('debug') === 'true' || parsedBody.debug === true) {
      return new Response(JSON.stringify({
        success: true,
        debug: true,
        has_client_id: !!PAYPAL_CLIENT_ID,
        has_secret: !!PAYPAL_SECRET,
        mode: PAYPAL_MODE
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verificar credenciales
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'PayPal credentials not configured'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    // URL base según modo
    const baseURL = PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    // Obtener token
    const authRes = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!authRes.ok) {
      const errText = await authRes.text()
      return new Response(JSON.stringify({
        success: false,
        error: 'PayPal auth failed',
        details: errText
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const authData = await authRes.json()
    const accessToken = authData.access_token

    // Fechas
    const now = new Date()
    const start = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
    const formatDate = (d: Date) => d.toISOString().replace('Z', '+0000').replace(/\.\d{3}/, '')
    
    const startDate = parsedBody.start_date ? formatDate(new Date(String(parsedBody.start_date))) : formatDate(start)
    const endDate = parsedBody.end_date ? formatDate(new Date(String(parsedBody.end_date))) : formatDate(now)

    // Obtener transacciones
    const txUrl = `${baseURL}/v1/reporting/transactions?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&fields=all&page_size=100`
    
    const txRes = await fetch(txUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const txText = await txRes.text()

    if (!txRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch transactions',
        status: txRes.status,
        details: txText.substring(0, 500)
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const txData = JSON.parse(txText)
    const transactions = (txData.transaction_details || []).map((t: Record<string, unknown>) => {
      const info = t.transaction_info as Record<string, unknown> || {}
      const payer = t.payer_info as Record<string, unknown> || {}
      const amount = info.transaction_amount as Record<string, unknown> || {}
      const payerName = payer.payer_name as Record<string, unknown> || {}
      
      return {
        id: info.transaction_id,
        status: info.transaction_status === 'S' ? 'COMPLETED' : info.transaction_status === 'P' ? 'PENDING' : 'OTHER',
        amount: { value: amount.value, currency_code: amount.currency_code },
        payer: {
          email_address: payer.email_address,
          name: { given_name: payerName.given_name, surname: payerName.surname }
        },
        description: info.transaction_subject || info.transaction_note,
        create_time: info.transaction_initiation_date
      }
    })

    return new Response(JSON.stringify({
      success: true,
      transactions,
      total_count: transactions.length,
      mode: PAYPAL_MODE,
      date_range: { start: startDate, end: endDate }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
