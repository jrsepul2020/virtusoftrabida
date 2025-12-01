import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CreditCard, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Copy,
  Info,
  Loader2
} from 'lucide-react';

interface PayPalConfig {
  id?: number;
  client_id: string;
  mode: 'sandbox' | 'live';
  currency: string;
  enabled: boolean;
  updated_at?: string;
}

export default function PayPalConfigManager() {
  const [config, setConfig] = useState<PayPalConfig>({
    client_id: '',
    mode: 'sandbox',
    currency: 'EUR',
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showClientId, setShowClientId] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [envClientId, setEnvClientId] = useState<string>('');

  useEffect(() => {
    loadConfig();
    // Cargar el Client ID desde las variables de entorno
    const envId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
    setEnvClientId(envId);
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar configuración desde la base de datos
      const { data, error } = await supabase
        .from('configuracion_paypal')
        .select('*')
        .single();

      if (error) {
        // Si no existe la tabla o no hay datos, usamos valores por defecto
        console.log('No se encontró configuración de PayPal, usando valores por defecto');
        const envClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
        setConfig({
          client_id: envClientId,
          mode: 'sandbox',
          currency: 'EUR',
          enabled: true
        });
      } else if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading PayPal config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Verificar que el Client ID no esté vacío
      if (!config.client_id.trim()) {
        setMessage({ type: 'error', text: 'El Client ID es obligatorio' });
        return;
      }

      // Intentar guardar en la base de datos
      const { error } = await supabase
        .from('configuracion_paypal')
        .upsert({
          id: config.id || 1,
          client_id: config.client_id.trim(),
          mode: config.mode,
          currency: config.currency,
          enabled: config.enabled,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // Si la tabla no existe, mostrar instrucciones
        if (error.code === '42P01') {
          setMessage({ 
            type: 'info', 
            text: 'La tabla no existe. Ejecuta la migración SQL primero (ver instrucciones abajo).' 
          });
        } else {
          throw error;
        }
      } else {
        setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' });
        loadConfig();
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error al guardar: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Intentar cargar el SDK de PayPal con el Client ID configurado
      const testUrl = `https://www.paypal.com/sdk/js?client-id=${config.client_id}&currency=${config.currency}`;
      
      // Verificar si el Client ID tiene el formato correcto
      if (!config.client_id || config.client_id === 'test' || config.client_id.length < 20) {
        setTestResult('error');
        setMessage({ type: 'error', text: 'El Client ID no parece válido. Debe tener al menos 20 caracteres.' });
        return;
      }

      // Hacer una petición para verificar que la URL es accesible
      await fetch(testUrl, { mode: 'no-cors' });
      
      // Si llegamos aquí, la conexión básica funciona
      setTestResult('success');
      setMessage({ type: 'success', text: '¡Conexión exitosa! El Client ID parece válido.' });
    } catch (error: any) {
      setTestResult('error');
      setMessage({ type: 'error', text: 'Error de conexión: ' + error.message });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'info', text: 'Copiado al portapapeles' });
    setTimeout(() => setMessage(null), 2000);
  };

  const sqlMigration = `-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS configuracion_paypal (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  mode TEXT DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live')),
  currency TEXT DEFAULT 'EUR',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion_paypal (client_id, mode, currency, enabled)
VALUES ('TU_CLIENT_ID_AQUI', 'sandbox', 'EUR', true)
ON CONFLICT (id) DO NOTHING;

-- Permisos RLS
ALTER TABLE configuracion_paypal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all" ON configuracion_paypal
  FOR SELECT USING (true);

CREATE POLICY "Allow update for authenticated" ON configuracion_paypal
  FOR UPDATE USING (true);

CREATE POLICY "Allow insert for authenticated" ON configuracion_paypal
  FOR INSERT WITH CHECK (true);`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuración de PayPal</h1>
            <p className="text-blue-100 mt-1">
              Configura las credenciales de PayPal para recibir pagos
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {message.type === 'info' && <Info className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Estado actual */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Estado Actual
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${config.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-sm text-gray-600">Estado</p>
            <p className={`text-lg font-semibold ${config.enabled ? 'text-green-700' : 'text-gray-700'}`}>
              {config.enabled ? '✅ Activo' : '⏸️ Inactivo'}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            config.mode === 'live' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <p className="text-sm text-gray-600">Modo</p>
            <p className={`text-lg font-semibold ${
              config.mode === 'live' ? 'text-orange-700' : 'text-blue-700'
            }`}>
              {config.mode === 'live' ? '🔴 PRODUCCIÓN' : '🔵 Sandbox (Pruebas)'}
            </p>
          </div>
          
          <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
            <p className="text-sm text-gray-600">Moneda</p>
            <p className="text-lg font-semibold text-gray-700">{config.currency}</p>
          </div>
        </div>

        {envClientId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> También hay un Client ID en variables de entorno (.env): 
              <code className="ml-2 bg-yellow-100 px-2 py-0.5 rounded">
                {envClientId.substring(0, 10)}...
              </code>
            </p>
          </div>
        )}
      </div>

      {/* Formulario de configuración */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Credenciales de PayPal</h2>
        
        <div className="space-y-4">
          {/* Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PayPal Client ID *
            </label>
            <div className="relative">
              <input
                type={showClientId ? 'text' : 'password'}
                value={config.client_id}
                onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24 font-mono text-sm"
                placeholder="AeA1QIjFE_2BZqL5h8YmH8ztYz5..."
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowClientId(!showClientId)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showClientId ? 'Ocultar' : 'Mostrar'}
                >
                  {showClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(config.client_id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Obtén tu Client ID desde el{' '}
              <a 
                href="https://developer.paypal.com/dashboard/applications" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Panel de Desarrolladores de PayPal
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Modo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de Operación
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                config.mode === 'sandbox' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="sandbox"
                  checked={config.mode === 'sandbox'}
                  onChange={() => setConfig({ ...config, mode: 'sandbox' })}
                  className="hidden"
                />
                <div className="text-center">
                  <span className="text-2xl">🧪</span>
                  <p className="font-medium text-gray-800 mt-1">Sandbox</p>
                  <p className="text-xs text-gray-500">Para pruebas</p>
                </div>
              </label>
              
              <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                config.mode === 'live' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="live"
                  checked={config.mode === 'live'}
                  onChange={() => setConfig({ ...config, mode: 'live' })}
                  className="hidden"
                />
                <div className="text-center">
                  <span className="text-2xl">🔴</span>
                  <p className="font-medium text-gray-800 mt-1">Producción</p>
                  <p className="text-xs text-gray-500">Pagos reales</p>
                </div>
              </label>
            </div>
            {config.mode === 'live' && (
              <p className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                ⚠️ En modo producción se procesarán pagos reales. Asegúrate de usar el Client ID correcto.
              </p>
            )}
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR - Euro €</option>
              <option value="USD">USD - Dólar $</option>
              <option value="GBP">GBP - Libra £</option>
            </select>
          </div>

          {/* Habilitado */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Habilitar PayPal</p>
              <p className="text-sm text-gray-500">Permite pagos con PayPal en la aplicación</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={testConnection}
            disabled={testing || !config.client_id}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : testResult === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : testResult === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Probar Conexión
          </button>
          
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Instrucciones de migración SQL */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Instrucciones de Configuración
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Paso 1: Crear tabla en Supabase</h3>
            <p className="text-sm text-gray-600 mb-3">
              Ejecuta el siguiente SQL en el Editor SQL de Supabase:
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-48">
                {sqlMigration}
              </pre>
              <button
                onClick={() => copyToClipboard(sqlMigration)}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Paso 2: Obtener credenciales de PayPal</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>
                Ve a{' '}
                <a 
                  href="https://developer.paypal.com/dashboard/applications" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  developer.paypal.com
                </a>
              </li>
              <li>Inicia sesión con tu cuenta PayPal Business</li>
              <li>Ve a "Apps & Credentials"</li>
              <li>Selecciona "Sandbox" o "Live" según corresponda</li>
              <li>Crea una nueva app o selecciona una existente</li>
              <li>Copia el "Client ID" y pégalo arriba</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Usa credenciales de <strong>Sandbox</strong> para pruebas</li>
              <li>Usa credenciales de <strong>Live</strong> solo cuando estés listo para producción</li>
              <li>El Client ID de Sandbox y Live son diferentes</li>
              <li>Después de cambiar la configuración, recarga la página de pagos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
