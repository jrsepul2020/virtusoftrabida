import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SyncCatasManager() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{
    empresas: number;
    muestras: number;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const toastId = toast.loading('Sincronizando con Catas...', {
        duration: 30000,
      });

      const { data, error: syncError } = await supabase.functions.invoke(
        'sync-inscripciones-catas',
        {
          method: 'POST',
          body: {},
        }
      );

      toast.dismiss(toastId);

      if (syncError) {
        throw syncError;
      }

      if (data?.success) {
        setLastSync({
          empresas: data.empresas || 0,
          muestras: data.muestras || 0,
          timestamp: new Date().toLocaleString('es-ES'),
        });

        toast.success(
          `✅ Sincronizado: ${data.empresas || 0} empresas y ${data.muestras || 0} muestras`,
          { duration: 5000 }
        );
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al sincronizar';
      setError(errorMessage);
      toast.error(`❌ Error: ${errorMessage}`, { duration: 5000 });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sincronización con Catas
        </h2>
        <p className="text-gray-600">
          Copia datos de <strong>empresas</strong> y <strong>muestras</strong> desde Gestión a
          Catas.
        </p>
      </div>

      {/* Estado de última sincronización */}
      {lastSync && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">
              Última sincronización exitosa
            </span>
          </div>
          <div className="text-sm text-green-700 ml-7">
            <p>
              <strong>{lastSync.empresas}</strong> empresas sincronizadas
            </p>
            <p>
              <strong>{lastSync.muestras}</strong> muestras sincronizadas
            </p>
            <p className="text-gray-600 mt-1">Fecha: {lastSync.timestamp}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">Error</span>
          </div>
          <p className="text-sm text-red-700 ml-7">{error}</p>
        </div>
      )}

      {/* Información */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">¿Qué hace esta sincronización?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                Copia todas las <strong>empresas</strong> desde Gestión a Catas
              </li>
              <li>
                Copia todas las <strong>muestras</strong> desde Gestión a Catas
              </li>
              <li>
                Actualiza registros existentes si ya están en Catas (por ID)
              </li>
              <li>
                Las relaciones empresa-muestra se mantienen automáticamente
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botón de sincronización */}
      <div className="flex justify-center">
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`
            flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-white
            transition-all duration-200 shadow-lg
            ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
            }
          `}
        >
          <RefreshCw
            className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
          />
          <span>
            {syncing ? 'Sincronizando...' : 'Sincronizar con Catas'}
          </span>
        </button>
      </div>
    </div>
  );
}

