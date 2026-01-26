import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Building2,
  FlaskConical,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Wine,
  Droplet,
  Sparkles,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

interface Stats {
  totalEmpresas: number;
  totalMuestras: number;
  totalInscripciones: number;
  comparison: {
    empresas: number;
    muestras: number;
  };
}

interface InscripcionReciente {
  id: string;
  created_at: string;
  pedido: number | null;
  name: string;
  pais: string;
  status: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  subcategories?: { name: string; value: number }[];
  [key: string]: any;
}

export default function AdminResumen({
  onVerDetalle,
}: {
  onVerDetalle: (id: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInscriptions, setRecentInscriptions] = useState<
    InscripcionReciente[]
  >([]);
  const [dailyEvolution, setDailyEvolution] = useState<
    { fecha: string; count: number }[]
  >([]);
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryData[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch General Stats
      const { data: companies } = await supabase
        .from("empresas")
        .select("id, created_at, totalinscripciones");
      const { data: samples } = await supabase
        .from("muestras")
        .select("id, created_at, categoria");

      if (!companies || !samples) throw new Error("Error fetching data");

      const totalEmpresas = companies.length;
      const totalMuestras = samples.length;
      const totalInscripciones = companies.reduce(
        (acc: number, curr: any) => acc + (curr.totalinscripciones || 0),
        0,
      );

      // Yesterday comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const countToday = companies.filter(
        (c: any) => new Date(c.created_at) >= today,
      ).length;
      const countYesterday = companies.filter((c: any) => {
        const d = new Date(c.created_at);
        return d >= yesterday && d < today;
      }).length;

      const samplesToday = samples.filter(
        (s: any) => new Date(s.created_at) >= today,
      ).length;
      const samplesYesterday = samples.filter((s: any) => {
        const d = new Date(s.created_at);
        return d >= yesterday && d < today;
      }).length;

      setStats({
        totalEmpresas,
        totalMuestras,
        totalInscripciones,
        comparison: {
          empresas: countToday - countYesterday,
          muestras: samplesToday - samplesYesterday,
        },
      });

      // 2. Daily Evolution (Line Chart)
      const porDia: Record<string, number> = {};
      companies.forEach((emp: any) => {
        const fecha = new Date(emp.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        });
        porDia[fecha] = (porDia[fecha] || 0) + 1;
      });
      const evolution = Object.entries(porDia)
        .map(([fecha, count]) => ({ fecha, count }))
        .slice(-10);
      setDailyEvolution(evolution);

      // 3. Category Distribution (Pie Chart & Summary)
      const dist: Record<string, number> = {};
      const subDist: Record<string, Record<string, number>> = {
        Vinos: {},
        Aceites: {},
        Espirituosos: {},
      };

      samples.forEach((s: any) => {
        const cat = s.categoria || "Otros";
        if (cat.toLowerCase().includes("vino")) {
          dist["Vinos"] = (dist["Vinos"] || 0) + 1;
          subDist["Vinos"][cat] = (subDist["Vinos"][cat] || 0) + 1;
        } else if (cat.toLowerCase().includes("aceite")) {
          dist["Aceites"] = (dist["Aceites"] || 0) + 1;
          subDist["Aceites"][cat] = (subDist["Aceites"][cat] || 0) + 1;
        } else if (
          cat.toLowerCase().includes("espirituoso") ||
          cat.toLowerCase().includes("destilado")
        ) {
          dist["Espirituosos"] = (dist["Espirituosos"] || 0) + 1;
          subDist["Espirituosos"][cat] =
            (subDist["Espirituosos"][cat] || 0) + 1;
        } else {
          dist["Otros"] = (dist["Otros"] || 0) + 1;
        }
      });

      const catData: CategoryData[] = [
        {
          name: "Vinos",
          value: dist["Vinos"] || 0,
          color: "#991b1b",
          subcategories: Object.entries(subDist["Vinos"]).map(
            ([name, value]) => ({ name, value }),
          ),
        },
        {
          name: "Aceites",
          value: dist["Aceites"] || 0,
          color: "#166534",
          subcategories: Object.entries(subDist["Aceites"]).map(
            ([name, value]) => ({ name, value }),
          ),
        },
        {
          name: "Espirituosos",
          value: dist["Espirituosos"] || 0,
          color: "#d97706",
          subcategories: Object.entries(subDist["Espirituosos"]).map(
            ([name, value]) => ({ name, value }),
          ),
        },
        { name: "Otros", value: dist["Otros"] || 0, color: "#475569" },
      ].filter((c) => c.value > 0);

      setCategoryDistribution(catData);

      // 4. Recent Inscriptions
      const { data: recent } = await supabase
        .from("empresas")
        .select("id, created_at, pedido, name, pais, status")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentInscriptions(recent || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Empresas Inscritas"
          value={stats?.totalEmpresas || 0}
          icon={<Building2 className="w-6 h-6" />}
          trend={stats?.comparison.empresas}
          color="blue"
        />
        <StatCard
          title="Muestras Recibidas"
          value={stats?.totalMuestras || 0}
          icon={<FlaskConical className="w-6 h-6" />}
          trend={stats?.comparison.muestras}
          color="green"
        />
        <StatCard
          title="Total Inscripciones"
          value={stats?.totalInscripciones || 0}
          icon={<ClipboardList className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Subcategorías"
          value={categoryDistribution.reduce(
            (acc, curr) => acc + (curr.subcategories?.length || 0),
            0,
          )}
          icon={<PieChartIcon className="w-6 h-6" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Daily Evolution */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Evolución de Inscripciones
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Últimos 10 días
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={dailyEvolution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="fecha"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{ r: 6, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  name="Inscripciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary-500" />
            Distribución por Tipo
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {stats?.totalMuestras}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Muestras
              </span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryDistribution.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {cat.name}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {cat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categoryDistribution
          .filter((c) => c.subcategories)
          .map((cat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                {cat.name === "Vinos" ? (
                  <Wine className="w-20 h-20" />
                ) : cat.name === "Aceites" ? (
                  <Droplet className="w-20 h-20" />
                ) : (
                  <Sparkles className="w-20 h-20" />
                )}
              </div>
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                {cat.name}
              </h4>
              <div className="space-y-3">
                {cat.subcategories?.slice(0, 4).map((sub, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {sub.name}
                    </span>
                    <span className="text-sm font-black text-primary-600">
                      {sub.value}
                    </span>
                  </div>
                ))}
                {cat.subcategories && cat.subcategories.length > 4 && (
                  <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
                    +{cat.subcategories.length - 4} más
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Recent Inscriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Últimas Inscripciones
          </h3>
          <button
            onClick={() => {
              /* Manage Tab */
            }}
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Fecha
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Pedido
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Empresa
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  País
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Estado
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentInscriptions.map((insc, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Date(insc.created_at).toLocaleDateString("es-ES")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Hace{" "}
                      {Math.floor(
                        (new Date().getTime() -
                          new Date(insc.created_at).getTime()) /
                          (1000 * 60 * 60),
                      )}
                      h
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-extrabold text-xs">
                      #{insc.pedido || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p
                      className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]"
                      title={insc.name}
                    >
                      {insc.name}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      🌍 {insc.pais}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        insc.status === "pagado"
                          ? "bg-green-100 text-green-700"
                          : insc.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {insc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onVerDetalle(insc.id)}
                      className="p-2 text-slate-300 group-hover:text-primary-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  trend?: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div
          className={`p-3 rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-110 duration-300`}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
          {value}
        </p>
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 bg-slate-50 dark:bg-slate-800 rounded-full opacity-50 pointer-events-none" />
    </div>
  );
}
