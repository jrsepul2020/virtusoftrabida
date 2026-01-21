import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  count?: number;
  error?: any;
};

export default function DiagnosticoSupabase() {
  const [resultados, setResultados] = useState<TestResult[]>([]);
  const [ejecutando, setEjecutando] = useState(false);

  const ejecutarDiagnostico = async () => {
    setEjecutando(true);
    const tests: TestResult[] = [];

    // Test 1: Conexión general
    try {
      const { error } = await supabase.from('empresas').select('count').limit(1);
      if (error) throw error;
      tests.push({ name: 'Conexión a Supabase', status: 'success', message: 'Conectado correctamente' });
    } catch (e: any) {
      tests.push({ name: 'Conexión a Supabase', status: 'error', message: e.message, error: e });
    }

    // Test 2: Tabla usuarios
    try {
      const { data, error } = await supabase.from('usuarios').select('id').limit(1);
      if (error) throw error;
      const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const cnt = Number(count ?? 0);
      tests.push({ 
        name: 'Tabla usuarios (catadores)', 
        status: cnt === 0 ? 'warning' : 'success', 
        message: cnt === 0 ? 'Tabla existe pero vacía' : `${cnt} registros encontrados`,
        count: cnt
      });
    } catch (e: any) {
      tests.push({ name: 'Tabla usuarios', status: 'error', message: e.message, error: e });
    }

    // Test 3: Tabla muestras
    try {
      const { data, error } = await supabase.from('muestras').select('id').limit(1);
      if (error) throw error;
      const { count } = await supabase.from('muestras').select('*', { count: 'exact', head: true });
      const cnt = Number(count ?? 0);
      tests.push({ 
        name: 'Tabla muestras', 
        status: cnt === 0 ? 'warning' : 'success', 
        message: cnt === 0 ? 'Tabla existe pero vacía' : `${cnt} registros encontrados`,
        count: cnt
      });
    } catch (e: any) {
      tests.push({ name: 'Tabla muestras', status: 'error', message: e.message, error: e });
    }

    // Test 4: (deshabilitado) Tabla dispositivos eliminada del sistema

    // Test 5: Tabla empresas
    try {
      const { data, error } = await supabase.from('empresas').select('id').limit(1);
      if (error) throw error;
      const { count } = await supabase.from('empresas').select('*', { count: 'exact', head: true });
      const cnt = Number(count ?? 0);
      tests.push({ 
        name: 'Tabla empresas', 
        status: cnt === 0 ? 'warning' : 'success', 
        message: cnt === 0 ? 'Tabla existe pero vacía' : `${cnt} registros encontrados`,
        count: cnt
      });
    } catch (e: any) {
      tests.push({ name: 'Tabla empresas', status: 'error', message: e.message, error: e });
    }

    setResultados(tests);
    setEjecutando(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Diagnóstico de Base de Datos</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Este diagnóstico verifica la conexión con Supabase y el estado de las tablas principales.
              Si alguna tabla aparece vacía pero debería tener datos, revisa las políticas RLS en Supabase.
            </p>
          </div>

          <button
            onClick={ejecutarDiagnostico}
            disabled={ejecutando}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6 font-semibold transition-colors"
          >
            {ejecutando ? '⏳ Ejecutando diagnóstico...' : '🔍 Ejecutar Diagnóstico'}
          </button>

          {resultados.length > 0 && (
            <div className="space-y-3">
              {resultados.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-500' 
                      : result.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    {result.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                    {result.status === 'error' && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        result.status === 'success' 
                          ? 'text-green-800' 
                          : result.status === 'warning'
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        {result.name}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        result.status === 'success' 
                          ? 'text-green-700' 
                          : result.status === 'warning'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                      
                      {result.error && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                            {JSON.stringify(result.error, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Resumen */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Resumen</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resultados.filter(r => r.status === 'success').length}
                    </div>
                    <div className="text-gray-600">Exitosos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {resultados.filter(r => r.status === 'warning').length}
                    </div>
                    <div className="text-gray-600">Advertencias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {resultados.filter(r => r.status === 'error').length}
                    </div>
                    <div className="text-gray-600">Errores</div>
                  </div>
                </div>
              </div>

              {/* Soluciones sugeridas */}
              {resultados.some(r => r.status === 'error' || r.status === 'warning') && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 Soluciones Sugeridas</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    {/* Dispositivos removidos: no hay migración aplicable */}
                    {resultados.some(r => r.status === 'warning') && (
                      <li>• <strong>Tablas vacías:</strong> Verifica las políticas RLS en Supabase o inserta datos de prueba</li>
                    )}
                    {resultados.some(r => r.status === 'error' && !r.message.includes('NO EXISTE')) && (
                      <li>• <strong>Errores de permisos:</strong> Verifica que RLS esté deshabilitado o que las políticas permitan acceso público</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
