import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Building2, FlaskConical, BarChart3 } from 'lucide-react';

type CountsEmpresasMuestras = {
  empresas_count?: number;
  muestras_count?: number;
  // Campos legacy por si acaso
  total_empresas?: number;
  total_muestras?: number;
  empresas?: number;
  muestras?: number;
};

type StatsData = {
  total_muestras: number;
  total_empresas: number;
  vinos_tranquilos: number;
  generosos_espirituosos: number;
  espumosos_cata: number;
  aoves_cata: number;
  vino_tinto: number;
  vino_blanco: number;
  vino_rosado: number;
  vino_sin_alcohol: number;
  espumoso_categoria: number;
  generoso_seco: number;
  generoso_dulce: number;
  espirituoso_origen_vinico: number;
  espirituoso_origen_no_vinico: number;
  aceite_virgen_extra: number;
  aceite_virgen_extra_organico: number;
};

export default function StatisticsManager() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countsEM, setCountsEM] = useState<CountsEmpresasMuestras | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchCountsEmpresasMuestras();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_recuento_productos')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountsEmpresasMuestras = async () => {
    setLoadingCounts(true);
    try {
      const { data, error } = await supabase
        .from('v_counts_empresas_muestras')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching v_counts_empresas_muestras:', error);
        throw error;
      }
      
      console.log('=== DATOS COMPLETOS DE LA VISTA ===');
      console.log('Data recibida:', data);
      console.log('Campos disponibles:', data ? Object.keys(data) : 'null');
      console.log('Valores:', data ? Object.entries(data) : 'null');
      console.log('===================================');
      
      setCountsEM(data ?? null);
    } catch (error) {
      console.error('Error fetching v_counts_empresas_muestras:', error);
      setCountsEM(null);
    } finally {
      setLoadingCounts(false);
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
      <div className={`${gradient} rounded-xl shadow-lg p-6 border-2 border-white/20`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
            {label}
          </h3>
          <Icon className="w-8 h-8 text-white/80" />
        </div>
        <div className="text-5xl font-bold text-white mb-1">
          {count.toLocaleString()}
        </div>
        <div className="text-xs text-white/70">Vista Principal</div>
      </div>
    );
  };

  const StatCard = ({
    label,
    count,
    color,
  }: {
    label: string;
    count: number;
    color: string;
  }) => {
    return (
      <div className={`${color} border-2 rounded-lg w-full sm:w-52 h-20 sm:h-24 p-2 shadow-sm flex flex-col items-center justify-center`}>
        <div className="text-[9px] sm:text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1 text-center leading-tight">
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          {count}
        </div>
      </div>
    );
  };

  if (loading || loadingCounts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando estadísticas...</div>
      </div>
    );
  }

  const totalEmpresas = countsEM?.empresas_count ?? countsEM?.total_empresas ?? countsEM?.empresas ?? 0;
  const totalMuestras = countsEM?.muestras_count ?? countsEM?.total_muestras ?? countsEM?.muestras ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas Generales</h1>
          <p className="text-sm text-gray-600">Vista consolidada de empresas y muestras</p>
        </div>
      </div>

      {/* Dashboard Principal - Vista v_counts_empresas_muestras */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-800">Dashboard Principal</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
            v_counts_empresas_muestras
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BigStatCard
            label="Total Empresas"
            count={totalEmpresas}
            icon={Building2}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <BigStatCard
            label="Total Muestras"
            count={totalMuestras}
            icon={FlaskConical}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
        </div>

        {/* Ratio */}
        {totalEmpresas > 0 && (
          <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Promedio de Muestras por Empresa</div>
              <div className="text-3xl font-bold text-gray-900">
                {(totalMuestras / totalEmpresas).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas Detalladas */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Desglose por Categorías</h2>
          
          {/* Categorías principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="VINOS TRANQUILOS"
              count={stats.vinos_tranquilos}
              color="bg-blue-50 border-blue-200"
            />
            <StatCard
              label="GENEROSOS ESPIRITUOSOS"
              count={stats.generosos_espirituosos}
              color="bg-orange-50 border-orange-200"
            />
            <StatCard
              label="ESPUMOSOS"
              count={stats.espumosos_cata}
              color="bg-purple-50 border-purple-200"
            />
            <StatCard
              label="AOVES"
              count={stats.aoves_cata}
              color="bg-green-50 border-green-200"
            />
          </div>

          {/* Vinos tranquilos */}
          <h3 className="text-sm font-bold text-gray-800 mb-3">Vinos Tranquilos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="VINOS TINTOS"
              count={stats.vino_tinto}
              color="bg-red-50 border-red-200"
            />
            <StatCard
              label="VINOS BLANCOS"
              count={stats.vino_blanco}
              color="bg-yellow-50 border-yellow-200"
            />
            <StatCard
              label="VINOS ROSADOS"
              count={stats.vino_rosado}
              color="bg-pink-50 border-pink-200"
            />
            <StatCard
              label="VINOS SIN ALCOHOL"
              count={stats.vino_sin_alcohol}
              color="bg-gray-50 border-gray-200"
            />
          </div>

          {/* Espumosos */}
          <h3 className="text-sm font-bold text-gray-800 mb-3">Espumosos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="ESPUMOSOS"
              count={stats.espumoso_categoria}
              color="bg-purple-50 border-purple-200"
            />
          </div>

          {/* Generosos Espirituosos */}
          <h3 className="text-sm font-bold text-gray-800 mb-3">Generosos y Espirituosos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="GENEROSOS SECOS"
              count={stats.generoso_seco}
              color="bg-orange-50 border-orange-200"
            />
            <StatCard
              label="GENEROSOS DULCES"
              count={stats.generoso_dulce}
              color="bg-red-50 border-red-200"
            />
            <StatCard
              label="ESPIRITUOSOS VÍNICOS"
              count={stats.espirituoso_origen_vinico}
              color="bg-purple-50 border-purple-200"
            />
            <StatCard
              label="ESPIRITUOSOS NO VÍNICOS"
              count={stats.espirituoso_origen_no_vinico}
              color="bg-slate-50 border-slate-200"
            />
          </div>

          {/* Aceites */}
          <h3 className="text-sm font-bold text-gray-800 mb-3">Aceites</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              label="ACEITE VIRGEN EXTRA"
              count={stats.aceite_virgen_extra}
              color="bg-green-50 border-green-200"
            />
            <StatCard
              label="ACEITE VIRGEN EXTRA ORGÁNICO"
              count={stats.aceite_virgen_extra_organico}
              color="bg-lime-50 border-lime-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
