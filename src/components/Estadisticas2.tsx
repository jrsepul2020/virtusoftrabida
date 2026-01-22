import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Building2,
  FlaskConical,
  Wine,
  Droplet,
  Sparkles,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";

type CountsEmpresasMuestras = {
  empresas_count?: number;
  muestras_count?: number;
  cnt_vino_tinto?: number;
  cnt_vino_blanco?: number;
  cnt_espumoso?: number;
  cnt_generoso_seco?: number;
  cnt_generoso_dulce?: number;
  cnt_aceite_oliva_virgen_extra?: number;
  cnt_aceite_oliva_virgen_extra_organico?: number;
  cnt_espirituoso_vinico?: number;
  cnt_espirituoso_no_vinico?: number;
  cnt_vino_rosado?: number;
  cnt_vino_sin_alcohol?: number;
  cnt_aromatizado?: number;
};

interface InscripcionPorDia {
  fecha: string;
  inscripciones: number;
}

type TopEmpresa = {
  id: string;
  nombre: string;
  muestras: number;
};

export default function Estadisticas2() {
  const [countsEM, setCountsEM] = useState<CountsEmpresasMuestras | null>(null);
  const [inscripcionesPorDia, setInscripcionesPorDia] = useState<InscripcionPorDia[]>([]);
  const [topEmpresas, setTopEmpresas] = useState<TopEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountsEmpresasMuestras();
    fetchInscripcionesPorDia();
    fetchTopEmpresas();
  }, []);

  const fetchCountsEmpresasMuestras = async () => {
    try {
      const { data, error } = await supabase.rpc("get_counts_empresas_muestras");
      if (error) throw error;
      setCountsEM(data);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchInscripcionesPorDia = async () => {
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const porDia: Record<string, number> = {};
      data?.forEach((emp: any) => {
        const fecha = new Date(emp.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        });
        porDia[fecha] = (porDia[fecha] || 0) + 1;
      });

      const fechas = Object.keys(porDia);
      let acumulado = 0;
      const result: InscripcionPorDia[] = fechas.map((fecha) => {
        acumulado += porDia[fecha];
        return { fecha, inscripciones: acumulado };
      });

      setInscripcionesPorDia(result);
    } catch (error) {
      console.error("Error fetching inscripciones por día:", error);
    }
  };

  const fetchTopEmpresas = async () => {
    try {
      const { data, error } = await supabase.rpc("get_top_empresas_por_muestras", {
        limit_count: 10,
      });
      if (error) throw error;
      setTopEmpresas(data || []);
    } catch (error) {
      console.error("Error fetching top empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalEmpresas = countsEM?.empresas_count || 0;
  const totalMuestras = countsEM?.muestras_count || 0;

  const vinosData = useMemo(() => {
    if (!countsEM) return [];
    return [
      { name: "Tintos", value: countsEM.cnt_vino_tinto || 0, color: "#DC2626" },
      { name: "Blancos", value: countsEM.cnt_vino_blanco || 0, color: "#FCD34D" },
      { name: "Rosados", value: countsEM.cnt_vino_rosado || 0, color: "#F472B6" },
      { name: "Sin Alcohol", value: countsEM.cnt_vino_sin_alcohol || 0, color: "#9CA3AF" },
    ];
  }, [countsEM]);

  const espumososData = useMemo(() => {
    if (!countsEM) return [];
    return [
      { name: "Espumosos", value: countsEM.cnt_espumoso || 0, color: "#8B5CF6" },
      { name: "Gen. Seco", value: countsEM.cnt_generoso_seco || 0, color: "#F97316" },
      { name: "Gen. Dulce", value: countsEM.cnt_generoso_dulce || 0, color: "#FB923C" },
    ];
  }, [countsEM]);

  const espirituososData = useMemo(() => {
    if (!countsEM) return [];
    return [
      { name: "Vínico", value: countsEM.cnt_espirituoso_vinico || 0, color: "#8B5CF6" },
      { name: "No Vínico", value: countsEM.cnt_espirituoso_no_vinico || 0, color: "#6B7280" },
      { name: "Aromatizado", value: countsEM.cnt_aromatizado || 0, color: "#F472B6" },
    ];
  }, [countsEM]);

  const aceitesData = useMemo(() => {
    if (!countsEM) return [];
    return [
      { name: "V. Extra", value: countsEM.cnt_aceite_oliva_virgen_extra || 0, color: "#22C55E" },
      { name: "V.E. Orgánico", value: countsEM.cnt_aceite_oliva_virgen_extra_organico || 0, color: "#84CC16" },
    ];
  }, [countsEM]);

  const totalVinosEspirituosos = useMemo(() => {
    return vinosData.reduce((sum, item) => sum + item.value, 0) +
           espumososData.reduce((sum, item) => sum + item.value, 0) +
           espirituososData.reduce((sum, item) => sum + item.value, 0);
  }, [vinosData, espumososData, espirituososData]);

  const totalAceites = useMemo(() => {
    return aceitesData.reduce((sum, item) => sum + item.value, 0);
  }, [aceitesData]);

  const trendValue = useMemo(() => {
    if (inscripcionesPorDia.length < 2) return 0;
    const ultimos = inscripcionesPorDia.slice(-2);
    const diff = ultimos[1].inscripciones - ultimos[0].inscripciones;
    const prev = ultimos[0].inscripciones || 1;
    return Math.round((diff / prev) * 100);
  }, [inscripcionesPorDia]);

  const refrescar = () => {
    setLoading(true);
    fetchCountsEmpresasMuestras();
    fetchInscripcionesPorDia();
    fetchTopEmpresas();
  };

  return (
    <div className="space-y-4 p-2 sm:p-3 md:p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-amber-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Estadísticas</h2>
            <p className="text-primary-100 text-xs sm:text-sm">
              Resumen del concurso en tiempo real
            </p>
          </div>
          <button
            onClick={refrescar}
            disabled={loading}
            className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Total Empresas */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
                Total Empresas
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {totalEmpresas}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          {trendValue !== 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="text-green-600 font-medium">+{trendValue}%</span>
              <span className="text-gray-500">vs día anterior</span>
            </div>
          )}
        </div>

        {/* Total Muestras */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
                Total Muestras
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {totalMuestras}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
              <FlaskConical className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-xs sm:text-sm text-gray-600">
            Promedio: <span className="font-semibold">{totalEmpresas > 0 ? (totalMuestras / totalEmpresas).toFixed(1) : 0}</span> por empresa
          </div>
        </div>
      </div>

      {/* VINOS */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">VINOS</h3>
          <span className="ml-auto text-sm sm:text-base font-semibold text-gray-600">
            {vinosData.reduce((sum, item) => sum + item.value, 0)}
          </span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {vinosData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalVinosEspirituosos > 0 ? (item.value / totalVinosEspirituosos) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ESPUMOSOS Y GENEROSOS */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">ESPUMOSOS Y GENEROSOS</h3>
          <span className="ml-auto text-sm sm:text-base font-semibold text-gray-600">
            {espumososData.reduce((sum, item) => sum + item.value, 0)}
          </span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {espumososData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalVinosEspirituosos > 0 ? (item.value / totalVinosEspirituosos) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ESPIRITUOSOS Y AROMATIZADOS */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">ESPIRITUOSOS Y AROMATIZADOS</h3>
          <span className="ml-auto text-sm sm:text-base font-semibold text-gray-600">
            {espirituososData.reduce((sum, item) => sum + item.value, 0)}
          </span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {espirituososData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalVinosEspirituosos > 0 ? (item.value / totalVinosEspirituosos) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACEITES DE OLIVA */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">ACEITES DE OLIVA</h3>
          <span className="ml-auto text-sm sm:text-base font-semibold text-gray-600">
            {totalAceites}
          </span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {aceitesData.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalAceites > 0 ? (item.value / totalAceites) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Empresas */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
          Top 10 Empresas por Muestras
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : topEmpresas.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No hay datos disponibles</p>
        ) : (
          <div className="space-y-2">
            {topEmpresas.map((empresa, index) => (
              <div
                key={empresa.id}
                className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs sm:text-sm font-bold text-primary-700">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {empresa.nombre}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-amber-100 text-amber-800 rounded-full">
                    {empresa.muestras}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
