import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Protected endpoint to sync new empresas to Mailrelay.
// Requires env vars set in deployment (Vercel):
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MAILRELAY_API_BASE, MAILRELAY_API_KEY, MAILRELAY_LIST_ID, MAILRELAY_ADMIN_SECRET

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminHeader = req.headers['x-admin-secret'] || req.body?.admin_secret;
  if (!adminHeader || adminHeader !== process.env.MAILRELAY_ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid admin secret' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MAILRELAY_API_BASE = process.env.MAILRELAY_API_BASE;
  const MAILRELAY_API_KEY = process.env.MAILRELAY_API_KEY;
  const MAILRELAY_LIST_ID = process.env.MAILRELAY_LIST_ID;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Missing Supabase env' });
  if (!MAILRELAY_API_BASE || !MAILRELAY_API_KEY) return res.status(500).json({ error: 'Missing Mailrelay env' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Obtener empresas sin sync
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id,name,email,phone,movil,conocimiento,created_at')
      .not('email', 'is', null)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    // Obtener ids ya sincronizados
    const { data: syncedRows } = await supabase.from('mailrelay_sync').select('empresa_id');
    const syncedIds = new Set((syncedRows || []).map((r: any) => r.empresa_id));

    const toSync = (empresas || []).filter((e: any) => e.email && !syncedIds.has(e.id));

    let synced = 0;
    let skipped = 0;

    for (const comp of toSync) {
      try {
        const url = `${MAILRELAY_API_BASE.replace(/\/+$/,'')}/subscribers`;
        const body = {
          email: comp.email,
          name: comp.name || comp.contact_person || '',
          custom_fields: { empresa_id: comp.id, telefono: comp.phone || null, movil: comp.movil || null, conocimiento: comp.conocimiento || null },
          lists: MAILRELAY_LIST_ID ? [MAILRELAY_LIST_ID] : undefined,
        };

        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MAILRELAY_API_KEY}`, 'X-Auth-Token': MAILRELAY_API_KEY }, body: JSON.stringify(body) });

        if (r.status === 201 || r.status === 200) {
          const data = await r.json();
          await supabase.from('mailrelay_sync').upsert({ empresa_id: comp.id, mailrelay_id: data.id || null, synced: true }, { onConflict: 'empresa_id' });
          synced++;
        } else if (r.status === 422) {
          // ya existe
          skipped++;
        } else {
          const txt = await r.text();
          console.warn('Mailrelay error for', comp.email, r.status, txt);
        }
      } catch (e) {
        console.error('Error syncing', comp.email, e);
      }
    }

    return res.json({ synced, skipped, total: toSync.length });
  } catch (err: any) {
    console.error('sync-mailrelay api error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
