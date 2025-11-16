import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, FlaskConical, Wine, Droplet, Sparkles } from 'lucide-react';

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

interface StatisticsManagerProps {
  onNavigateToSamples?: (category: string) => void;
}

export default function StatisticsManager({ onNavigateToSamples }: StatisticsManagerProps) {
  const [countsEM, setCountsEM] = useState<CountsEmpresasMuestras | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountsEmpresasMuestras();
  }, []);

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

  return (
    <div className="space-y-6 p-4">
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
    </div>
  );
}
