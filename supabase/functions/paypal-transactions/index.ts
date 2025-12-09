/**
 * Supabase Edge Function: paypal-transactions
 * Obtiene transacciones reales de PayPal usando su REST API
 * 
 * Configuración necesaria:
 * - PAYPAL_CLIENT_ID: Tu Client ID de PayPal
 * - PAYPAL_SECRET: Tu Secret de PayPal
 * - PAYPAL_MODE: 'sandbox' o 'live'
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { start_date, end_date } = await req.json()

    // Configuración de PayPal desde variables de entorno
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET')
    const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox'

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      throw new Error('PayPal credentials not configured')
    }

    // Base URL según el modo
    const baseURL = PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    // 1. Obtener Access Token de PayPal
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('PayPal auth error:', errorText)
      throw new Error(`PayPal authentication failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // 2. Obtener transacciones usando la Transactions API
    // Formato de fechas: YYYY-MM-DDTHH:MM:SS-0000
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    // Endpoint de transacciones
    const transactionsURL = `${baseURL}/v1/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=all&page_size=100`

    const transactionsResponse = await fetch(transactionsURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!transactionsResponse.ok) {
      const errorText = await transactionsResponse.text()
      console.error('PayPal transactions error:', errorText)
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.status}`)
    }

    const transactionsData = await transactionsResponse.json()

    // Filtrar solo transacciones completadas (pagos recibidos)
    const completedTransactions = (transactionsData.transaction_details || []).filter(
      (t: any) => t.transaction_info?.transaction_status === 'S' || // Success
                  t.transaction_info?.transaction_status === 'V' || // Completed/Verified
                  t.transaction_info?.transaction_status === 'P'    // Pending (optional)
    )

    // Formatear las transacciones para el frontend
    const formattedTransactions = completedTransactions.map((t: any) => ({
      id: t.transaction_info?.transaction_id,
      status: t.transaction_info?.transaction_status === 'S' ? 'COMPLETED' : 
              t.transaction_info?.transaction_status === 'P' ? 'PENDING' : 'OTHER',
      amount: {
        value: t.transaction_info?.transaction_amount?.value,
        currency_code: t.transaction_info?.transaction_amount?.currency_code
      },
      payer: {
        email_address: t.payer_info?.email_address,
        name: {
          given_name: t.payer_info?.payer_name?.given_name,
          surname: t.payer_info?.payer_name?.surname
        }
      },
      description: t.transaction_info?.transaction_subject || t.transaction_info?.transaction_note,
      create_time: t.transaction_info?.transaction_initiation_date,
      update_time: t.transaction_info?.transaction_updated_date
    }))

    return new Response(
      JSON.stringify({
        success: true,
        transactions: formattedTransactions,
        total_count: formattedTransactions.length,
        mode: PAYPAL_MODE,
        date_range: {
          start: startDate,
          end: endDate
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in paypal-transactions function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
