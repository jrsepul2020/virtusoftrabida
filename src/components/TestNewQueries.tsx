/**
 * Componente de Prueba del Nuevo Sistema de Consultas
 * 
 * Este componente demuestra cómo usar:
 * 1. Hooks personalizados (useCompanies, useSamples, etc.)
 * 2. Funciones de consulta directas (queries.*)
 * 3. Manejo automático de loading y errores
 */

import { useState } from 'react';
import { RefreshCw, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useCompanies, useSamples, useGeneralStats } from '../lib/useSupabaseQuery';
import * as queries from '../lib/supabaseQueries';

export default function TestNewQueries() {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  // ✅ EJEMPLO 1: Usar hooks - Carga automática al montar el componente
  const { 
    data: companies, 
    loading: loadingCompanies, 
    error: errorCompanies,
    refetch: refetchCompanies 
  } = useCompanies();

  const { 
    data: samples, 
    loading: loadingSamples, 
    error: errorSamples,
    refetch: refetchSamples 
  } = useSamples();

  const { 
    data: stats, 
    loading: loadingStats,
    error: errorStats 
  } = useGeneralStats();

  // ✅ EJEMPLO 2: Función para probar queries directas
  const testDirectQuery = async () => {
    setTesting(true);
    setTestResult('');

    try {
      // Probar obtener todas las empresas
      const allCompanies = await queries.getAllCompanies();
      setTestResult(`✅ Query directa exitosa: ${allCompanies.length} empresas obtenidas`);
    } catch (error: any) {
      setTestResult(`❌ Error en query directa: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // ✅ EJEMPLO 3: Función para probar búsqueda
  const testSearch = async () => {
    setTesting(true);
    setTestResult('');

    try {
      const results = await queries.searchCompanies('aceite');
      setTestResult(`✅ Búsqueda exitosa: ${results.length} resultados para "aceite"`);
    } catch (error: any) {
      setTestResult(`❌ Error en búsqueda: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🧪 Prueba del Nuevo Sistema de Consultas
        </h1>
        <p className="text-gray-600">
          Este panel muestra cómo funciona el nuevo sistema de consultas a Supabase
        </p>
      </div>

      {/* Sección 1: Datos cargados con Hooks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Empresas */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Empresas</h3>
            <button
              onClick={() => refetchCompanies()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recargar"
            >
              <RefreshCw className={`w-5 h-5 text-blue-500 ${loadingCompanies ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingCompanies ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Cargando...</span>
            </div>
          ) : errorCompanies ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Error: {errorCompanies.message}</span>
            </div>
          ) : (
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {companies?.length || 0}
              </div>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Hook useCompanies()</span>
              </div>
            </div>
          )}
        </div>

        {/* Card: Muestras */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Muestras</h3>
            <button
              onClick={() => refetchSamples()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recargar"
            >
              <RefreshCw className={`w-5 h-5 text-purple-500 ${loadingSamples ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingSamples ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              <span>Cargando...</span>
            </div>
          ) : errorSamples ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Error: {errorSamples.message}</span>
            </div>
          ) : (
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {samples?.length || 0}
              </div>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Hook useSamples()</span>
              </div>
            </div>
          )}
        </div>

        {/* Card: Estadísticas */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Estadísticas</h3>
            <Database className="w-5 h-5 text-green-500" />
          </div>

          {loadingStats ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <span>Cargando...</span>
            </div>
          ) : errorStats ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Empresas:</span>
                <span className="font-semibold">{stats?.totalCompanies || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Muestras:</span>
                <span className="font-semibold">{stats?.totalSamples || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Catadores:</span>
                <span className="font-semibold">{stats?.totalCatadores || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 text-xs mt-2">
                <CheckCircle className="w-3 h-3" />
                <span>Hook useGeneralStats()</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección 2: Pruebas de Queries Directas */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🔬 Pruebas de Queries Directas
        </h2>
        <p className="text-gray-600 mb-4">
          Prueba las funciones de consulta directa sin usar hooks
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={testDirectQuery}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Probando...' : 'Probar getAllCompanies()'}
          </button>

          <button
            onClick={testSearch}
            disabled={testing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Probando...' : 'Probar searchCompanies("aceite")'}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={testResult.startsWith('✅') ? 'text-green-700' : 'text-red-700'}>
              {testResult}
            </p>
          </div>
        )}
      </div>

      {/* Sección 3: Información del Sistema */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          Cómo Funciona
        </h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-blue-600 mb-2">✅ Ventajas de los Hooks</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Carga automática de datos al montar el componente</li>
              <li>Manejo automático de estados (loading, error, data)</li>
              <li>Función refetch() para recargar datos fácilmente</li>
              <li>Actualización automática de la UI cuando cambian los datos</li>
              <li>Type-safe con TypeScript completo</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-purple-600 mb-2">🔧 Queries Directas</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Úsalas en funciones asíncronas (handlers, eventos)</li>
              <li>Perfectas para operaciones CRUD (crear, actualizar, eliminar)</li>
              <li>Control total sobre cuándo ejecutar la consulta</li>
              <li>Ideales para lógica fuera de componentes React</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-green-600 mb-2">📚 Código de Ejemplo</h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Usando Hook
const { data, loading, error, refetch } = useCompanies();

// Usando Query Directa
const companies = await queries.getAllCompanies();
await queries.updateCompany(id, { name: "Nuevo nombre" });
await refetch(); // Recargar datos`}
            </pre>
          </div>
        </div>
      </div>

      {/* Footer con Lista de Empresas */}
      {companies && companies.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 Primeras 5 Empresas (Ejemplo)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.slice(0, 5).map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{company.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{company.email}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                        company.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : company.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {companies.length > 5 && (
            <p className="mt-3 text-sm text-gray-500 text-center">
              ... y {companies.length - 5} empresas más
            </p>
          )}
        </div>
      )}
    </div>
  );
}
