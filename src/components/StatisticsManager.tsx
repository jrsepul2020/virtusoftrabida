import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    fetchStatistics();
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
      <div className={`${color} border-2 rounded-lg w-full sm:w-44 h-20 sm:h-24 p-2 shadow-sm flex flex-col items-center justify-center`}>
        <div className="text-[9px] sm:text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1 text-center leading-tight">
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          {count}
        </div>
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
        Estadísticas International Virtus 2026
      </h2>

      {/* Muestras y Empresas */}
      <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-5 mb-3">
        <StatCard
          label="MUESTRAS"
          count={stats.total_muestras}
          color="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300"
        />
        <StatCard
          label="EMPRESAS"
          count={stats.total_empresas}
          color="bg-gradient-to-br from-green-50 to-green-100 border-green-300"
        />
      </div>

      {/* Categorías principales */}
      <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-5 mb-3">
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
      <h3 className="text-sm font-bold text-gray-800 mb-1">Vinos tranquilos</h3>
      <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-5 mb-3 sm:flex-wrap">
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
      <h3 className="text-sm font-bold text-gray-800 mb-1">Espumosos</h3>
      <div className="grid grid-cols-1 sm:flex gap-3 sm:gap-5 mb-3">
        <StatCard
          label="ESPUMOSOS"
          count={stats.espumoso_categoria}
          color="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Generosos Espirituosos */}
      <h3 className="text-sm font-bold text-gray-800 mb-1">Generosos Espirituosos</h3>
      <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-5 mb-3 sm:flex-wrap">
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
          label="ESPIRITUOSOS"
          count={stats.espirituoso_origen_vinico}
          color="bg-purple-50 border-purple-200"
        />
        <StatCard
          label="ESPIRITUOSOS NO VINICOS"
          count={stats.espirituoso_origen_no_vinico}
          color="bg-slate-50 border-slate-200"
        />
      </div>

      {/* Aceites */}
      <h3 className="text-sm font-bold text-gray-800 mb-1">Aceites</h3>
      <div className="grid grid-cols-1 sm:flex gap-3 sm:gap-5 sm:flex-wrap">
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
  );
}
