import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target, Users, Activity } from 'lucide-react';

interface CatadorEstadisticasProps {
  catadorId: string;
  mesaId?: number;
}

interface EstadisticasData {
  totalCatas: number;
  promedioPuntuacion: number;
  desviacionEstandar: number;
  consistencia: number;
  rankingMesa?: number;
  historial: {
    fecha: string;
    puntuacion: number;
    muestra: string;
    categoria: string;
  }[];
  comparativaMesa: {
    catador: string;
    promedio: number;
    total: number;
  }[];
  distribucionPuntuaciones: {
    rango: string;
    cantidad: number;
  }[];
}

export default function CatadorEstadisticas({ catadorId, mesaId }: CatadorEstadisticasProps) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadEstadisticas();
  }, [catadorId, mesaId, timeRange]);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Calcular fecha según rango
      const now = new Date();
      let fechaInicio: Date | null = null;
      
      if (timeRange === 'week') {
        fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'month') {
        fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Obtener puntuaciones del catador
      let query = supabase
        .from('puntuaciones')
        .select(`
          *,
          muestras:muestra_id (
            nombre,
            categoria,
            codigo
          )
        `)
        .eq('catador_id', catadorId)
        .order('created_at', { ascending: false });

      if (fechaInicio) {
        query = query.gte('created_at', fechaInicio.toISOString());
      }

      const { data: puntuaciones, error } = await query;
      if (error) throw error;

      // Calcular estadísticas básicas
      const totalCatas = puntuaciones?.length || 0;
      const puntuacionesNumeros = puntuaciones?.map(p => p.puntuacion) || [];
      const promedio = puntuacionesNumeros.length > 0
        ? puntuacionesNumeros.reduce((a, b) => a + b, 0) / puntuacionesNumeros.length
        : 0;

      // Desviación estándar
      const varianza = puntuacionesNumeros.length > 0
        ? puntuacionesNumeros.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / puntuacionesNumeros.length
        : 0;
      const desviacion = Math.sqrt(varianza);

      // Consistencia (inverso de la desviación, normalizado 0-100)
      const consistencia = Math.max(0, Math.min(100, 100 - (desviacion * 10)));

      // Historial formateado
      const historial = (puntuaciones || []).slice(0, 20).map(p => ({
        fecha: new Date(p.created_at).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        }),
        puntuacion: p.puntuacion,
        muestra: p.muestras?.nombre || `Muestra ${p.muestra_id}`,
        categoria: p.muestras?.categoria || 'N/A'
      }));

      // Distribución de puntuaciones
      const distribucion = [
        { rango: '0-50', cantidad: 0 },
        { rango: '51-70', cantidad: 0 },
        { rango: '71-80', cantidad: 0 },
        { rango: '81-85', cantidad: 0 },
        { rango: '86-90', cantidad: 0 },
        { rango: '91-100', cantidad: 0 }
      ];

      puntuacionesNumeros.forEach(p => {
        if (p <= 50) distribucion[0].cantidad++;
        else if (p <= 70) distribucion[1].cantidad++;
        else if (p <= 80) distribucion[2].cantidad++;
        else if (p <= 85) distribucion[3].cantidad++;
        else if (p <= 90) distribucion[4].cantidad++;
        else distribucion[5].cantidad++;
      });

      // Comparativa con otros catadores de la mesa
      let comparativaMesa: any[] = [];
      if (mesaId) {
        const { data: catadoresMesa } = await supabase
          .from('usuarios')
          .select('id, nombre')
          .eq('mesa', mesaId);

        if (catadoresMesa) {
          const promesas = catadoresMesa.map(async (cat) => {
            const { data: punts } = await supabase
              .from('puntuaciones')
              .select('puntuacion')
              .eq('catador_id', cat.id);

            const total = punts?.length || 0;
            const prom = punts && punts.length > 0
              ? punts.reduce((sum, p) => sum + p.puntuacion, 0) / punts.length
              : 0;

            return {
              catador: cat.nombre,
              promedio: Math.round(prom * 10) / 10,
              total
            };
          });

          comparativaMesa = await Promise.all(promesas);
          comparativaMesa.sort((a, b) => b.promedio - a.promedio);
        }
      }

      setEstadisticas({
        totalCatas,
        promedioPuntuacion: Math.round(promedio * 10) / 10,
        desviacionEstandar: Math.round(desviacion * 10) / 10,
        consistencia: Math.round(consistencia),
        historial,
        comparativaMesa,
        distribucionPuntuaciones: distribucion.filter(d => d.cantidad > 0)
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32 border border-gray-200"></div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-6 h-64 border border-gray-200"></div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No hay estadísticas disponibles</p>
      </div>
    );
  }

  const getConsistenciaColor = (consistencia: number) => {
    if (consistencia >= 80) return 'text-green-600 bg-green-100';
    if (consistencia >= 60) return 'text-blue-600 bg-blue-100';
    if (consistencia >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConsistenciaIcon = (consistencia: number) => {
    if (consistencia >= 70) return <TrendingUp className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Selector de rango temporal */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
            { value: 'all', label: 'Todo' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Catas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.totalCatas}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Promedio</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.promedioPuntuacion}</p>
          <p className="text-xs text-gray-500 mt-1">sobre 100 puntos</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getConsistenciaColor(estadisticas.consistencia)}`}>
              {getConsistenciaIcon(estadisticas.consistencia)}
            </div>
            <span className="text-sm font-medium text-gray-600">Consistencia</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.consistencia}%</p>
          <p className="text-xs text-gray-500 mt-1">σ = {estadisticas.desviacionEstandar}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Ranking Mesa</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {estadisticas.comparativaMesa.findIndex(c => c.catador === estadisticas.comparativaMesa[0]?.catador) + 1}°
          </p>
          <p className="text-xs text-gray-500 mt-1">de {estadisticas.comparativaMesa.length} catadores</p>
        </div>
      </div>

      {/* Gráfico de historial */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Puntuaciones</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={estadisticas.historial}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{data.muestra}</p>
                      <p className="text-sm text-gray-600">{data.categoria}</p>
                      <p className="text-lg font-bold text-blue-600">{data.puntuacion} pts</p>
                      <p className="text-xs text-gray-500">{data.fecha}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="puntuacion" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Puntuación"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribución y Comparativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de puntuaciones */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Puntuaciones</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={estadisticas.distribucionPuntuaciones}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" name="Cantidad">
                {estadisticas.distribucionPuntuaciones.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    index === 5 ? '#10b981' : // 91-100 verde
                    index === 4 ? '#3b82f6' : // 86-90 azul
                    index === 3 ? '#8b5cf6' : // 81-85 morado
                    index === 2 ? '#f59e0b' : // 71-80 amarillo
                    index === 1 ? '#ef4444' : // 51-70 rojo
                    '#6b7280' // 0-50 gris
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparativa con mesa */}
        {mesaId && estadisticas.comparativaMesa.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativa con Mesa</h3>
            <div className="space-y-3">
              {estadisticas.comparativaMesa.map((cat, index) => (
                <div key={cat.catador} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{cat.catador}</p>
                    <p className="text-sm text-gray-500">{cat.total} catas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{cat.promedio}</p>
                    <p className="text-xs text-gray-500">promedio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
