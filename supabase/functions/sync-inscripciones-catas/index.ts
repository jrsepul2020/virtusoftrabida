import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) (out as any)[k] = v
  }
  return out
}

function extractMissingColumn(errMsg: string): string | null {
  const m1 = errMsg.match(/Could not find the '([^']+)' column/i)
  if (m1?.[1]) return m1[1]
  const m2 = errMsg.match(/column "([^"]+)" .* does not exist/i)
  if (m2?.[1]) return m2[1]
  return null
}

async function upsertWithAutoSchemaPrune(
  targetClient: ReturnType<typeof createClient>,
  table: string,
  records: Array<Record<string, unknown>>,
  onConflict = 'id'
): Promise<{ inserted: number; prunedColumns: string[] }> {
  let payload = records.map(r => ({ ...r }))
  const prunedColumns: string[] = []

  const strategies: Array<{ kind: 'upsert' | 'insert'; onConflict?: string }> = [
    { kind: 'upsert', onConflict },
    { kind: 'upsert', onConflict: 'email' },
    { kind: 'insert' },
  ]

  for (const strat of strategies) {
    for (let i = 0; i < 25; i++) {
      const op =
        strat.kind === 'upsert'
          ? targetClient.from(table).upsert(payload as any, { onConflict: strat.onConflict })
          : targetClient.from(table).insert(payload as any)

      const { error } = await op
      if (!error) {
        return { inserted: payload.length, prunedColumns }
      }

      const msg = error.message || String(error)
      const missing = extractMissingColumn(msg)
      if (!missing) {
        break
      }

      prunedColumns.push(missing)
      payload = payload.map((r) => {
        const next = { ...r }
        delete (next as any)[missing]
        return next
      })
    }
  }

  throw new Error(`No se pudo insertar en Catas: el esquema de ${table} no es compatible.`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // ==========================================
    // PASO 1: SINCRONIZAR EMPRESAS
    // ==========================================
    const { data: empresas, error: empresasError } = await sourceClient
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresasError) {
      throw new Error(`Error leyendo empresas: ${empresasError.message}`)
    }

    let empresasCopiadas = 0
    if (empresas && empresas.length > 0) {
      const empresasPayload = empresas.map((e: any) => pickDefined(e) as Record<string, unknown>)
      const result = await upsertWithAutoSchemaPrune(targetClient, 'empresas', empresasPayload, 'id')
      empresasCopiadas = result.inserted
    }

    // ==========================================
    // PASO 2: SINCRONIZAR MUESTRAS (con mapeo de empresa_id)
    // ==========================================
    const { data: muestras, error: muestrasError } = await sourceClient
      .from('muestras')
      .select('*')
      .order('created_at', { ascending: false })

    if (muestrasError) {
      throw new Error(`Error leyendo muestras: ${muestrasError.message}`)
    }

    let muestrasCopiadas = 0
    if (muestras && muestras.length > 0) {
      // Las muestras ya tienen empresa_id que coincide (mismo UUID)
      // Solo necesitamos copiar los datos tal cual
      const muestrasPayload = muestras.map((m: any) => pickDefined(m) as Record<string, unknown>)
      const result = await upsertWithAutoSchemaPrune(targetClient, 'muestras', muestrasPayload, 'id')
      muestrasCopiadas = result.inserted
    }

    return new Response(
      JSON.stringify({
        success: true,
        empresas: empresasCopiadas,
        muestras: muestrasCopiadas,
        message: `Sincronizadas ${empresasCopiadas} empresas y ${muestrasCopiadas} muestras`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error en sync:', message)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
