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
  PieChartIcon,
  Users,
  Trophy,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import StatsCard from "./StatsCard";

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

interface StatisticsManagerProps {
  onNavigateToSamples?: (category: string) => void;
}

export default function StatisticsManager({
  onNavigateToSamples: _onNavigateToSamples,
}: StatisticsManagerProps) {
  const [countsEM, setCountsEM] = useState<CountsEmpresasMuestras | null>(null);
  const [inscripcionesPorDia, setInscripcionesPorDia] = useState<
    InscripcionPorDia[]
  >([]);
  const [topEmpresas, setTopEmpresas] = useState<TopEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resumen" | "graficos">("resumen");

  useEffect(() => {
    fetchCountsEmpresasMuestras();
    fetchInscripcionesPorDia();
    fetchTopEmpresas();
  }, []);

  const fetchInscripcionesPorDia = async () => {
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const porDia: Record<string, number> = {};
      data?.forEach((emp: any) => {
        const fecha = new Date(emp.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        });
        porDia[fecha] = (porDia[fecha] || 0) + 1;
      });

      // Convertir a array y acumular
      const fechas = Object.keys(porDia);
      let acumulado = 0;
      const resultado = fechas.map((fecha) => {
        acumulado += porDia[fecha];
        return { fecha, inscripciones: acumulado };
      });

      setInscripcionesPorDia(resultado);
    } catch (error) {
      console.error("Error fetching inscripciones por día:", error);
    }
  };

  const fetchCountsEmpresasMuestras = async () => {
    setLoading(true);
    try {
      // Obtener datos de la vista
      const { data, error } = await supabase
        .from("v_counts_empresas_muestras")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching v_counts_empresas_muestras:", error);
        throw error;
      }

      console.log("📊 Datos de v_counts_empresas_muestras:", data);
      setCountsEM(data);
    } catch (error) {
      console.error("Error crítico:", error);
      // Valores por defecto en caso de error
      setCountsEM({
        empresas_count: 0,
        muestras_count: 0,
        cnt_vino_tinto: 0,
        cnt_vino_blanco: 0,
        cnt_espumoso: 0,
        cnt_generoso_seco: 0,
        cnt_generoso_dulce: 0,
        cnt_aceite_oliva_virgen_extra: 0,
        cnt_aceite_oliva_virgen_extra_organico: 0,
        cnt_espirituoso_vinico: 0,
        cnt_espirituoso_no_vinico: 0,
        cnt_vino_rosado: 0,
        cnt_vino_sin_alcohol: 0,
        cnt_aromatizado: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, name, muestras(count)")
        .limit(50);

      if (error) throw error;

      const normalized = (data || []).map((row: any) => ({
        id: row.id,
        nombre: row.name || "Sin nombre",
        muestras: Array.isArray(row.muestras)
          ? (row.muestras[0]?.count ?? 0)
          : 0,
      }));

      const sorted = normalized
        .sort((a, b) => b.muestras - a.muestras)
        .slice(0, 5);
      setTopEmpresas(sorted);
    } catch (error) {
      console.error("Error fetching top empresas:", error);
      setTopEmpresas([]);
    }
  };

  // Extraer valores de la vista
  const totalEmpresas = countsEM?.empresas_count ?? 0;
  const totalMuestras = countsEM?.muestras_count ?? 0;

  const sparklineData = useMemo(() => {
    return inscripcionesPorDia.map((item) => item.inscripciones);
  }, [inscripcionesPorDia]);

  const trendValue = useMemo(() => {
    if (inscripcionesPorDia.length < 2) return 0;
    const last =
      inscripcionesPorDia[inscripcionesPorDia.length - 1]?.inscripciones ?? 0;
    const prev =
      inscripcionesPorDia[inscripcionesPorDia.length - 2]?.inscripciones ?? 0;
    if (prev === 0) return 0;
    return Math.round(((last - prev) / prev) * 100);
  }, [inscripcionesPorDia]);

  const lastInscripciones = useMemo(() => {
    if (inscripcionesPorDia.length === 0) return 0;
    return (
      inscripcionesPorDia[inscripcionesPorDia.length - 1]?.inscripciones ?? 0
    );
  }, [inscripcionesPorDia]);

  // Datos para el gráfico de pie
  const pieData = useMemo(
    () =>
      [
        {
          name: "Tintos",
          value: countsEM?.cnt_vino_tinto ?? 0,
          color: "#DC2626",
        },
        {
          name: "Blancos",
          value: countsEM?.cnt_vino_blanco ?? 0,
          color: "#CA8A04",
        },
        {
          name: "Rosados",
          value: countsEM?.cnt_vino_rosado ?? 0,
          color: "#DB2777",
        },
        {
          name: "Espumosos",
          value: countsEM?.cnt_espumoso ?? 0,
          color: "#9333EA",
        },
        {
          name: "Generoso Seco",
          value: countsEM?.cnt_generoso_seco ?? 0,
          color: "#EA580C",
        },
        {
          name: "Generoso Dulce",
          value: countsEM?.cnt_generoso_dulce ?? 0,
          color: "#F59E0B",
        },
        {
          name: "Espirit. Vínico",
          value: countsEM?.cnt_espirituoso_vinico ?? 0,
          color: "#4F46E5",
        },
        {
          name: "Espirit. No Vínico",
          value: countsEM?.cnt_espirituoso_no_vinico ?? 0,
          color: "#475569",
        },
        {
          name: "Aceite V.E.",
          value: countsEM?.cnt_aceite_oliva_virgen_extra ?? 0,
          color: "#16A34A",
        },
        {
          name: "Aceite Org.",
          value: countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0,
          color: "#65A30D",
        },
        {
          name: "Aromatizado",
          value: countsEM?.cnt_aromatizado ?? 0,
          color: "#EC4899",
        },
      ].filter((item) => item.value > 0),
    [countsEM],
  );

  // Datos para el gráfico de barras
  const barData = useMemo(
    () => [
      { categoria: "Tintos", cantidad: countsEM?.cnt_vino_tinto ?? 0 },
      { categoria: "Blancos", cantidad: countsEM?.cnt_vino_blanco ?? 0 },
      { categoria: "Rosados", cantidad: countsEM?.cnt_vino_rosado ?? 0 },
      { categoria: "Espumosos", cantidad: countsEM?.cnt_espumoso ?? 0 },
      { categoria: "Gen. Seco", cantidad: countsEM?.cnt_generoso_seco ?? 0 },
      { categoria: "Gen. Dulce", cantidad: countsEM?.cnt_generoso_dulce ?? 0 },
      {
        categoria: "Espirit.",
        cantidad:
          (countsEM?.cnt_espirituoso_vinico ?? 0) +
          (countsEM?.cnt_espirituoso_no_vinico ?? 0),
      },
      {
        categoria: "Aceites",
        cantidad:
          (countsEM?.cnt_aceite_oliva_virgen_extra ?? 0) +
          (countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0),
      },
      { categoria: "Aromatiz.", cantidad: countsEM?.cnt_aromatizado ?? 0 },
    ],
    [countsEM],
  );

  // Datos para mini gráficos de barras por grupo
  const vinosData = useMemo(
    () => [
      {
        name: "Tintos",
        value: countsEM?.cnt_vino_tinto ?? 0,
        color: "#DC2626",
      },
      {
        name: "Blancos",
        value: countsEM?.cnt_vino_blanco ?? 0,
        color: "#CA8A04",
      },
      {
        name: "Rosados",
        value: countsEM?.cnt_vino_rosado ?? 0,
        color: "#DB2777",
      },
      {
        name: "Sin Alcohol",
        value: countsEM?.cnt_vino_sin_alcohol ?? 0,
        color: "#6B7280",
      },
    ],
    [countsEM],
  );

  const espumososGenerososData = useMemo(
    () => [
      {
        name: "Espumosos",
        value: countsEM?.cnt_espumoso ?? 0,
        color: "#9333EA",
      },
      {
        name: "Gen. Seco",
        value: countsEM?.cnt_generoso_seco ?? 0,
        color: "#EA580C",
      },
      {
        name: "Gen. Dulce",
        value: countsEM?.cnt_generoso_dulce ?? 0,
        color: "#F59E0B",
      },
    ],
    [countsEM],
  );

  const espirituososAromatizadosData = useMemo(
    () => [
      {
        name: "Vínico",
        value: countsEM?.cnt_espirituoso_vinico ?? 0,
        color: "#4F46E5",
      },
      {
        name: "No Vínico",
        value: countsEM?.cnt_espirituoso_no_vinico ?? 0,
        color: "#475569",
      },
      {
        name: "Aromatizado",
        value: countsEM?.cnt_aromatizado ?? 0,
        color: "#EC4899",
      },
    ],
    [countsEM],
  );

  const aceitesData = useMemo(
    () => [
      {
        name: "V. Extra",
        value: countsEM?.cnt_aceite_oliva_virgen_extra ?? 0,
        color: "#16A34A",
      },
      {
        name: "V.E. Orgánico",
        value: countsEM?.cnt_aceite_oliva_virgen_extra_organico ?? 0,
        color: "#65A30D",
      },
    ],
    [countsEM],
  );

  const MiniBarChart = ({
    title,
    data,
    icon: Icon,
  }: {
    title: string;
    data: Array<{ name: string; value: number; color: string }>;
    icon: any;
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            {title}
          </h3>
          <span className="ml-auto text-lg font-bold text-gray-900">
            {total}
          </span>
        </div>

        {/* Lista de items con cantidades individuales */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {item.value}
              </span>
            </div>
          ))}
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

  return (
    <div className="space-y-6 p-4">
      {/* Tabs con estilo destacado en rojo intenso */}
      <div className="bg-gray-50 rounded-lg p-1 inline-flex gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab("resumen")}
          className={`px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 ${
            activeTab === "resumen"
              ? "bg-red-700 text-white shadow-md"
              : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab("graficos")}
          className={`px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 ${
            activeTab === "graficos"
              ? "bg-red-700 text-white shadow-md"
              : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-900"
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Gráficos
        </button>
      </div>

      {/* Mini gráficos de barras por grupo - Solo en pestaña Resumen */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MiniBarChart title="VINOS" data={vinosData} icon={Wine} />
          <MiniBarChart
            title="ESPUMOSOS Y GENEROSOS"
            data={espumososGenerososData}
            icon={Sparkles}
          />
          <MiniBarChart
            title="ESPIRITUOSOS Y AROMATIZADOS"
            data={espirituososAromatizadosData}
            icon={Wine}
          />
          <MiniBarChart
            title="ACEITES DE OLIVA"
            data={aceitesData}
            icon={Droplet}
          />
        </div>
      )}

      {activeTab === "graficos" ? (
        <div className="space-y-6">
          {/* Gráfico de evolución de inscripciones */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">
                Evolución de Inscripciones
              </h3>
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
                    dot={{ fill: "#3B82F6", r: 4 }}
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
                <h3 className="text-lg font-bold text-gray-800">
                  Distribución por Categoría
                </h3>
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
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: "#666", strokeWidth: 1 }}
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
                <h3 className="text-lg font-bold text-gray-800">
                  Muestras por Categoría
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="categoria"
                      tick={{ fontSize: 11 }}
                      width={70}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="cantidad"
                      fill="#10B981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Principal */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard
                title="Total Empresas"
                value={totalEmpresas}
                icon={Building2}
                iconColorClass="bg-gradient-to-br from-sky-600 to-sky-700"
                trend={{
                  value: Math.abs(trendValue),
                  direction: trendValue >= 0 ? "up" : "down",
                  label: "vs día anterior",
                }}
                sparklineData={sparklineData}
                ariaLabel="Total de empresas inscritas"
              />
              <StatsCard
                title="Total Muestras"
                value={totalMuestras}
                icon={FlaskConical}
                iconColorClass="bg-gradient-to-br from-emerald-600 to-emerald-700"
                trend={{
                  value: Math.abs(trendValue),
                  direction: trendValue >= 0 ? "up" : "down",
                  label: "vs día anterior",
                }}
                sparklineData={sparklineData}
                ariaLabel="Total de muestras registradas"
              />
              <StatsCard
                title="Inscripciones"
                value={lastInscripciones}
                icon={Users}
                iconColorClass="bg-gradient-to-br from-indigo-600 to-indigo-700"
                trend={{
                  value: Math.abs(trendValue),
                  direction: trendValue >= 0 ? "up" : "down",
                  label: "últimas 24h",
                }}
                sparklineData={sparklineData}
                ariaLabel="Inscripciones acumuladas"
              />
              <StatsCard
                title="Top Empresas"
                value={topEmpresas.length}
                icon={Trophy}
                iconColorClass="bg-gradient-to-br from-amber-500 to-amber-600"
                sparklineData={sparklineData}
                ariaLabel="Empresas con más muestras"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Evolución de inscripciones
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">Últimos días</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={inscripcionesPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="inscripciones"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                        name="Inscripciones acumuladas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Distribución por tipo
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  {pieData.slice(0, 4).map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-700">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Top empresas
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  Muestras registradas
                </span>
              </div>
              <div className="space-y-3">
                {topEmpresas.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Sin datos disponibles.
                  </p>
                )}
                {topEmpresas.map((empresa, index) => (
                  <div key={empresa.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
                      {empresa.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                        <span className="truncate">{empresa.nombre}</span>
                        <span className="text-gray-600">
                          {empresa.muestras}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{
                            width: `${Math.min(100, ((empresa.muestras || 0) / Math.max(1, topEmpresas[0]?.muestras || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
