#!/usr/bin/env node
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

/**
 * Script de sincronización manual con Mailrelay.
 * Uso:
 *  node ./scripts/sync-mailrelay.mjs --mode=dry-run --days=7
 *  node ./scripts/sync-mailrelay.mjs --mode=sync --days=30
 *
 * Requiere las variables de entorno:
 *  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *  MAILRELAY_API_BASE, MAILRELAY_API_KEY
 *  MAILRELAY_LIST_ID (opcional)
 *
 * Nota: este script intentará insertar un registro en la tabla `mailrelay_sync`
 * para marcar las empresas sincronizadas. Si esa tabla no existe, imprimirá
 * un SQL sugerido para crearla; no la crea automáticamente.
 */

const argv = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.split('=');
  return [k.replace(/^--/, ''), v ?? true];
}));

const MODE = argv.mode || 'dry-run';
const DAYS = parseInt(argv.days || '30', 10);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAILRELAY_API_BASE = process.env.MAILRELAY_API_BASE; // e.g. https://your.mailrelay.instance/api/v1
const MAILRELAY_API_KEY = process.env.MAILRELAY_API_KEY;
const MAILRELAY_LIST_ID = process.env.MAILRELAY_LIST_ID; // optional

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

if (MODE === 'sync' && (!MAILRELAY_API_BASE || !MAILRELAY_API_KEY)) {
  console.error('Faltan MAILRELAY_API_BASE o MAILRELAY_API_KEY en el entorno. Para dry-run no son necesarias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function mailrelayCreateSubscriber(company) {
  // Ejemplo genérico: ajustar según la API real de tu Mailrelay
  const url = `${MAILRELAY_API_BASE.replace(/\/+$/,'')}/subscribers`;
  const body = {
    email: company.email,
    name: company.name || company.contact_person || company.nombre_empresa || '',
    custom_fields: {
      empresa_id: company.id,
      telefono: company.phone || company.telefono || null,
      movil: company.movil || null,
      conocimiento: company.conocimiento || null,
    },
    lists: MAILRELAY_LIST_ID ? [MAILRELAY_LIST_ID] : undefined,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': MAILRELAY_API_KEY,
      'Authorization': `Bearer ${MAILRELAY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mailrelay API error ${res.status}: ${txt}`);
  }

  return res.json();
}

async function checkMailrelaySyncTableExists() {
  try {
    const { data, error } = await supabase
      .from('mailrelay_sync')
      .select('empresa_id')
      .limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    return false;
  }
}

async function getSyncedIds() {
  try {
    const { data, error } = await supabase.from('mailrelay_sync').select('empresa_id');
    if (error) throw error;
    return new Set((data || []).map(r => r.empresa_id));
  } catch (err) {
    return new Set();
  }
}

async function main() {
  console.log('Mailrelay sync script — mode:', MODE, 'days:', DAYS);

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Obtener empresas candidatas
  // Seleccionar columnas existentes en la tabla `empresas`. Evitar `telefono` si no existe.
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id,name,email,phone,movil,conocimiento,created_at')
    .gt('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al consultar empresas:', error);
    process.exit(1);
  }

  console.log(`Encontradas ${empresas.length} empresas creadas desde ${since}`);

  const tableExists = await checkMailrelaySyncTableExists();
  if (!tableExists) {
    console.warn('La tabla `mailrelay_sync` NO existe. El script seguirá, pero no podrá marcar registros como sincronizados.');
    console.warn('SQL sugerido para crear la tabla (ejecutar con cuidado en Supabase SQL):');
    console.warn(`
CREATE TABLE mailrelay_sync (
  empresa_id uuid PRIMARY KEY,
  mailrelay_id text,
  synced boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
    `);
  }

  const syncedIds = await getSyncedIds();

  const candidates = empresas.filter(e => e.email && !syncedIds.has(e.id));

  console.log(`Candidatos a sincronizar: ${candidates.length}`);

  if (MODE === 'dry-run') {
    console.table(candidates.map(c => ({ id: c.id, email: c.email, name: c.name || c.contact_person, created_at: c.created_at })));
    console.log('Dry-run completo. Para ejecutar la sincronización: --mode=sync');
    return;
  }

  // Modo sync
  for (const comp of candidates) {
    try {
      console.log('Sincronizando:', comp.id, comp.email);
      const res = await mailrelayCreateSubscriber(comp);
      console.log('Mailrelay response:', res);

      if (tableExists) {
        const upsert = await supabase.from('mailrelay_sync').insert([{ empresa_id: comp.id, mailrelay_id: res.id || null, synced: true }]).onConflict('empresa_id');
        if (upsert.error) {
          console.warn('No se pudo insertar estado de sync en DB:', upsert.error.message || upsert.error);
        } else {
          console.log('Marcado como sincronizado en mailrelay_sync');
        }
      } else {
        console.log('Tabla mailrelay_sync no existe — no se marcará en DB. Puedes ejecutar el SQL sugerido anteriormente.');
      }

      // Respect rate limits pequeños
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error('Error sincronizando', comp.id, comp.email, err.message || err);
    }
  }

  console.log('Sincronización finalizada');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
