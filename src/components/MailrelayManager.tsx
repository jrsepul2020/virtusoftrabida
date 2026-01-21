import { useState } from "react";
import { useI18n } from "../lib/i18n";

export default function MailrelayManager() {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    // In dev you can set VITE_MAILRELAY_ADMIN_SECRET to avoid the prompt.
    const devSecret = (import.meta as any)?.env?.VITE_MAILRELAY_ADMIN_SECRET;
    // DEBUG: mostrar si la variable VITE está presente en runtime (se eliminará después)
    if (typeof window !== "undefined") {
      console.debug(
        "DEV: VITE_MAILRELAY_ADMIN_SECRET=",
        devSecret ? "[present]" : "[missing]",
      );
    }
    const secret = devSecret || window.prompt(t("mailrelay.prompt_secret"));
    if (!secret) return;
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync-mailrelay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ mode: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data?.error || res.statusText}`);
      } else {
        setMessage(
          `Sincronizados: ${data.synced || 0}, omitidos: ${data.skipped || 0}`,
        );
      }
    } catch (err) {
      setMessage(String((err as any)?.message || err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2">{t("mailrelay.title")}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t("mailrelay.description")}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={running}
            className="bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {running ? t("mailrelay.running") : t("mailrelay.button_sync")}
          </button>
          {message && <div className="text-sm text-gray-700">{message}</div>}
        </div>
      </div>
    </div>
  );
}
