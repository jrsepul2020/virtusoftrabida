import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Evitar prefijo SUPABASE_ (plataforma lo bloquea). Permitimos ambos nombres para compatibilidad.
    const sourceUrl =
      Deno.env.get('SOURCE_SUPABASE_URL') ??
      Deno.env.get('SUPABASE_URL')
    const sourceKey =
      Deno.env.get('SOURCE_SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_ANON_KEY')
    const targetUrl = Deno.env.get('CATAS_SUPABASE_URL')
    const targetKey = Deno.env.get('CATAS_SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('CATAS_SUPABASE_ANON_KEY')

    if (!sourceUrl || !sourceKey || !targetUrl || !targetKey) {
      throw new Error('Faltan variables de entorno: SOURCE_SUPABASE_URL/SOURCE_SUPABASE_SERVICE_ROLE_KEY y CATAS_SUPABASE_URL/CATAS_SUPABASE_SERVICE_ROLE_KEY')
    }

    const sourceClient = createClient(sourceUrl, sourceKey, {
      global: { headers: { 'x-client-info': 'sync-inscripciones-catas' } },
    })
    const targetClient = createClient(targetUrl, targetKey, {
      global: { headers: { 'x-client-info': 'sync-inscripciones-catas' } },
    })

    const { data: inscripciones, error: fetchError } = await sourceClient.from('inscripciones').select('*')
    if (fetchError) {
      throw new Error(`Error leyendo inscripciones: ${fetchError.message}`)
    }

    if (!inscripciones || inscripciones.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay inscripciones para copiar', copied: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    const { error: upsertError } = await targetClient
      .from('asistentes')
      .upsert(inscripciones, { onConflict: 'id' })

    if (upsertError) {
      throw new Error(`Error copiando a asistentes: ${upsertError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, copied: inscripciones.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})

