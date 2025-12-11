import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';

export default function MailrelayManager() {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    // Pedir secreto administrativo (no lo guardamos)
    const secret = window.prompt(t('mailrelay.prompt_secret'));
    if (!secret) return;
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/sync-mailrelay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ mode: 'sync' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data?.error || res.statusText}`);
      } else {
        setMessage(`Sincronizados: ${data.synced || 0}, omitidos: ${data.skipped || 0}`);
      }
    } catch (e: any) {
      setMessage(String(e.message || e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-2">{t('mailrelay.title')}</h3>
      <p className="text-sm text-gray-600 mb-4">{t('mailrelay.description')}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={running}
          className="bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {running ? t('mailrelay.running') : t('mailrelay.button_sync')}
        </button>
        {message && <div className="text-sm text-gray-700">{message}</div>}
      </div>
    </div>
  );
}
