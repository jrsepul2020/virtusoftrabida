import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { Mail, RefreshCw, Copy, Check, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const ACCESS_CODE = "VIRTUS_MAIL_2026";

export default function MailrelayManager() {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ACCESS_CODE);
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync-mailrelay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ACCESS_CODE,
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
      <div className="bg-white shadow-xl rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header section with code display */}
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">
                  {t("mailrelay.title")}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Sincronización automatizada con Mailrelay
                </p>
              </div>
            </div>

            {/* Secret Code Display */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start md:self-center">
              <div className="px-3 py-1 bg-slate-100 rounded-lg font-mono font-bold text-slate-700 text-sm">
                {ACCESS_CODE}
              </div>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all ${
                  copied
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title="Copiar código de acceso"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 italic text-sm text-amber-800 font-medium">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p>
              Este proceso sincroniza las empresas registradas que aún no están
              en Mailrelay. Usa el código de arriba para autorizar la
              sincronización de datos.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <button
              onClick={handleSync}
              disabled={running}
              className="w-full md:w-auto min-w-[200px] flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 disabled:opacity-50"
            >
              {running ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {running ? "Sincronizando..." : "Sincronizar Ahora"}
            </button>

            {message && (
              <div className="flex-1 p-4 bg-slate-100 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 text-center md:text-left">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
