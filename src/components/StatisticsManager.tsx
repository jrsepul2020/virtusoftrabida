import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, FlaskConical, Wine, Droplet, Sparkles, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

type CountsEmpresasMuestras = {
  empresas_count?: number;
  muestras_count?: number;
  cnt_vino_tinto?: number;
  cnt_vino_blanco?: number;
  cnt_espumoso?: number;
  cnt_generoso_seco?: number;
  cnt_aceite_oliva_virgen_extra?: number;
  cnt_aceite_oliva_virgen_extra_organico?: number;
  cnt_espirituoso_vinico?: number;
  cnt_espirituoso_no_vinico?: number;
  cnt_vino_rosado?: number;
  cnt_vino_sin_alcohol?: number;
};

interface InscripcionPorDia {
  fecha: string;
  inscripciones: number;
}

interface StatisticsManagerProps {
  onNavigateToSamples?: (category: string) => void;
}

export default function StatisticsManager({ onNavigateToSamples }: StatisticsManagerProps) {
  const [countsEM, setCountsEM] = useState<CountsEmpresasMuestras | null>(null);
  const [inscripcionesPorDia, setInscripcionesPorDia] = useState<InscripcionPorDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'graficos'>('resumen');

  useEffect(() => {
    fetchCountsEmpresasMuestras();
    fetchInscripcionesPorDia();
  }, []);

  const fetchInscripcionesPorDia = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const porDia: Record<string, number> = {};
      data?.forEach((emp: any) => {
        const fecha = new Date(emp.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        porDia[fecha] = (porDia[fecha] || 0) + 1;
      });

      // Convertir a array y acumular
      const fechas = Object.keys(porDia);
      let acumulado = 0;
      const resultado = fechas.map(fecha => {
        acumulado += porDia[fecha];
        return { fecha, inscripciones: acumulado };
      });

      setInscripcionesPorDia(resultado);
    } catch (error) {
      console.error('Error fetching inscripciones por día:', error);
    }
  };

  const fetchCountsEmpresasMuestras = async () => {
    setLoading(true);
    try {
      // Obtener datos de la vista
      const { data, error } = await supabase
        .from('v_counts_empresas_muestras')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching v_counts_empresas_muestras:', error);
        throw error;
      }
      
      console.log('📊 Datos de v_counts_empresas_muestras:', data);
      setCountsEM(data);
    } catch (error) {
      console.error('Error crítico:', error);
      // Valores por defecto en caso de error
      setCountsEM({
        empresas_count: 0,
        muestras_count: 0,
        cnt_vino_tinto: 0,
        cnt_vino_blanco: 0,
        cnt_espumoso: 0,
        cnt_generoso_seco: 0,
        cnt_aceite_oliva_virgen_extra: 0,
        cnt_aceite_oliva_virgen_extra_organico: 0,
        cnt_espirituoso_vinico: 0,
        cnt_espirituoso_no_vinico: 0,
        cnt_vino_rosado: 0,
        cnt_vino_sin_alcohol: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const BigStatCard = ({
    label,
    count,
    icon: Icon,
    gradient,
  }: {
    label: string;
    count: number;
    icon: any;
    gradient: string;
  }) => {
    return (
      <div className={`${gradient} rounded-xl shadow-lg p-6 border border-white/20`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {label}
          </h3>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="text-5xl font-bold text-white mb-2">
          {count.toLocaleString()}
        </div>
      </div>
    );
  };

  const StatCard = ({
    label,
    count,
    color,
    category,
  }: {
    label: string;
    count: number;
    color: string;
    category?: string;
  }) => {
    const isClickable = category && onNavigateToSamples;
    
    return (
      <div 
        className={`${color} rounded-lg p-4 shadow-md ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        onClick={() => {
          if (isClickable) {
            onNavigateToSamples(category);
          }
        }}
        title={isClickable ? `Ver muestras de ${label}` : undefined}
      >
        <div className="text-[11px] font-bold text-white uppercase tracking-wide mb-2 text-center leading-tight">
          {label}
        </div>
        <div className="text-3xl font-bold text-white text-center">
          {count}
        </div>
      </div>
    );
  };

  const SectionTitle = ({
    title,
    icon: Icon,
  }: {
    title: string;
    icon: any;
  }) => {
    return (
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando estadísticas...</div>
      </div>
    );
  }

  // Extraer valores de la vista
  const totalEmpresas = countsEM?.empresas_count ?? 0;
  const totalMuestras = countsEM?.muestras_count ?? 0;

  // Datos para el gráfico de pie
  const pieData = [
    { name: 'Tintos', value: countsEM?.cnt_vino_tinto ?? 0, color: '#DC2626' },
    { name: 'Blancos', value: countsEM?.cnt_vino_blanco ?? 0, color: '#CA8A04' },
    { name: 'Rosados', value: countsEM?.cnt_vino_rosado ?? 0, color: '#DB2777' },
    { name: 'Espumosos', value: countsEM?.cnt_espumoso ?? 0, color: '#9333EA' },
    { name: 'Generosos', value: countsEM?.cnt_generoso_seco ?? 0, color: '#EA580C' },
    { name: 'Espirit. Vínico', value: countsEM?.cnt_espirituoso_vinico ?? 0, color: '#4F46E5' },
    { name: 'Espirit. No Vínico', value: countsEM?.cnt_espirituoso_no_vinico ?? 0, color: '#475569' },
    { name: 'Aceite V.E.', value: countsEM?.cnt_aceite_oliva_virgen_extra ?? 0, color: '#16A34A' },
    { name: 'Aceite Org.', value: countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0, color: '#65A30D' },
  ].filter(item => item.value > 0);

  // Datos para el gráfico de barras
  const barData = [
    { categoria: 'Tintos', cantidad: countsEM?.cnt_vino_tinto ?? 0 },
    { categoria: 'Blancos', cantidad: countsEM?.cnt_vino_blanco ?? 0 },
    { categoria: 'Rosados', cantidad: countsEM?.cnt_vino_rosado ?? 0 },
    { categoria: 'Espumosos', cantidad: countsEM?.cnt_espumoso ?? 0 },
    { categoria: 'Generosos', cantidad: countsEM?.cnt_generoso_seco ?? 0 },
    { categoria: 'Espirit.', cantidad: (countsEM?.cnt_espirituoso_vinico ?? 0) + (countsEM?.cnt_espirituoso_no_vinico ?? 0) },
    { categoria: 'Aceites', cantidad: (countsEM?.cnt_aceite_oliva_virgen_extra ?? 0) + (countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0) },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'resumen' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('graficos')}
          className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'graficos' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Gráficos
        </button>
      </div>

      {activeTab === 'graficos' ? (
        <div className="space-y-6">
          {/* Gráfico de evolución de inscripciones */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">Evolución de Inscripciones</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inscripcionesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="inscripciones" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    name="Inscripciones acumuladas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pie */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">Distribución por Categoría</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#666', strokeWidth: 1 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-800">Muestras por Categoría</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Dashboard Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-3xl">
        <BigStatCard
          label="Total Empresas"
          count={totalEmpresas}
          icon={Building2}
          gradient="bg-gradient-to-br from-blue-600 to-blue-700"
        />
        <BigStatCard
          label="Total Muestras"
          count={totalMuestras}
          icon={FlaskConical}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
        />
      </div>

      {/* Vinos */}
      <div>
        <SectionTitle title="Vinos" icon={Wine} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl">
          <StatCard
            label="TINTOS"
            count={countsEM?.cnt_vino_tinto ?? 0}
            color="bg-gradient-to-br from-red-600 to-red-700"
            category="VINO TINTO"
          />
          <StatCard
            label="BLANCOS"
            count={countsEM?.cnt_vino_blanco ?? 0}
            color="bg-gradient-to-br from-yellow-600 to-yellow-700"
            category="VINO BLANCO"
          />
          <StatCard
            label="ROSADOS"
            count={countsEM?.cnt_vino_rosado ?? 0}
            color="bg-gradient-to-br from-pink-600 to-pink-700"
            category="VINO ROSADO"
          />
          <StatCard
            label="SIN ALCOHOL"
            count={countsEM?.cnt_vino_sin_alcohol ?? 0}
            color="bg-gradient-to-br from-gray-600 to-gray-700"
            category="VINO SIN ALCOHOL"
          />
        </div>
      </div>

      {/* Espumosos y Generosos */}
      <div>
        <SectionTitle title="Espumosos y Generosos" icon={Sparkles} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
          <StatCard
            label="ESPUMOSOS"
            count={countsEM?.cnt_espumoso ?? 0}
            color="bg-gradient-to-br from-purple-600 to-purple-700"
            category="ESPUMOSO"
          />
          <StatCard
            label="GENEROSOS SECOS"
            count={countsEM?.cnt_generoso_seco ?? 0}
            color="bg-gradient-to-br from-orange-600 to-orange-700"
            category="GENEROSO SECO"
          />
        </div>
      </div>

      {/* Espirituosos */}
      <div>
        <SectionTitle title="Espirituosos" icon={Wine} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
          <StatCard
            label="ESPIRITUOSOS VÍNICOS"
            count={countsEM?.cnt_espirituoso_vinico ?? 0}
            color="bg-gradient-to-br from-indigo-600 to-indigo-700"
            category="ESPIRITUOSO VÍNICO"
          />
          <StatCard
            label="ESPIRITUOSOS NO VÍNICOS"
            count={countsEM?.cnt_espirituoso_no_vinico ?? 0}
            color="bg-gradient-to-br from-slate-600 to-slate-700"
            category="ESPIRITUOSO NO VÍNICO"
          />
        </div>
      </div>

      {/* Aceites */}
      <div>
        <SectionTitle title="Aceites de Oliva" icon={Droplet} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
          <StatCard
            label="VIRGEN EXTRA"
            count={countsEM?.cnt_aceite_oliva_virgen_extra ?? 0}
            color="bg-gradient-to-br from-green-600 to-green-700"
            category="ACEITE OLIVA VIRGEN EXTRA"
          />
          <StatCard
            label="VIRGEN EXTRA ORGÁNICO"
            count={countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0}
            color="bg-gradient-to-br from-lime-600 to-lime-700"
            category="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO"
          />
        </div>
      </div>
        </>
      )}
    </div>
  );
}
