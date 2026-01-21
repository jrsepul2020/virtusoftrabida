import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Download,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Filter,
  Search,
  Eye,
} from "lucide-react";

interface PuntuacionDetalle {
  catador_id: string;
  catador_nombre: string;
  puntuacion: number;
  notas: string;
  created_at: string;
}

interface ResultadoMuestra {
  muestra_id: number;
  codigo: number;
  codigotexto: string;
  nombre: string;
  categoria: string;
  num_puntuaciones: number;
  puntuacion_total: number;
  medalla: string | null;
  catada: boolean;
  empresa_nombre: string;
  puntuaciones_detalle: PuntuacionDetalle[];
}

export default function ResultadosCatas() {
  const [resultados, setResultados] = useState<ResultadoMuestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filterMedalla, setFilterMedalla] = useState<string>("all");
  const [filterCatada, setFilterCatada] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadResultados();
  }, []);

  const loadResultados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vista_puntuaciones_resumen")
        .select("*")
        .order("puntuacion_total", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setResultados(data || []);
    } catch (error) {
      console.error("Error loading resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (muestraId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(muestraId)) {
      newExpanded.delete(muestraId);
    } else {
      newExpanded.add(muestraId);
    }
    setExpandedRows(newExpanded);
  };

  const getMedallaColor = (medalla: string | null) => {
    switch (medalla) {
      case "Oro":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-300",
        };
      case "Plata":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-300",
        };
      case "Bronce":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          border: "border-orange-300",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
        };
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Código",
      "Nombre",
      "Empresa",
      "Categoría",
      "Puntuación Total",
      "Medalla",
      "Nº Puntuaciones",
      "Catada",
      "Catador 1",
      "Punt. 1",
      "Catador 2",
      "Punt. 2",
      "Catador 3",
      "Punt. 3",
      "Catador 4",
      "Punt. 4",
      "Catador 5",
      "Punt. 5",
    ];

    const rows = filteredResultados.map((r) => {
      const puntuaciones = r.puntuaciones_detalle || [];
      return [
        r.codigotexto || r.codigo,
        r.nombre,
        r.empresa_nombre,
        r.categoria || "",
        r.puntuacion_total?.toFixed(2) || "",
        r.medalla || "",
        r.num_puntuaciones,
        r.catada ? "Sí" : "No",
        puntuaciones[0]?.catador_nombre || "",
        puntuaciones[0]?.puntuacion || "",
        puntuaciones[1]?.catador_nombre || "",
        puntuaciones[1]?.puntuacion || "",
        puntuaciones[2]?.catador_nombre || "",
        puntuaciones[2]?.puntuacion || "",
        puntuaciones[3]?.catador_nombre || "",
        puntuaciones[3]?.puntuacion || "",
        puntuaciones[4]?.catador_nombre || "",
        puntuaciones[4]?.puntuacion || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `resultados_catas_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDetailedCSV = () => {
    const headers = [
      "Código Muestra",
      "Nombre Muestra",
      "Empresa",
      "Categoría",
      "Catador",
      "Puntuación",
      "Notas",
      "Fecha",
    ];

    const rows: string[][] = [];
    filteredResultados.forEach((r) => {
      (r.puntuaciones_detalle || []).forEach((p) => {
        rows.push([
          r.codigotexto || r.codigo.toString(),
          r.nombre,
          r.empresa_nombre,
          r.categoria || "",
          p.catador_nombre,
          p.puntuacion.toString(),
          p.notas || "",
          new Date(p.created_at).toLocaleString("es-ES"),
        ]);
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `puntuaciones_detalladas_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado
  const filteredResultados = resultados.filter((r) => {
    // Filtro por medalla
    if (filterMedalla !== "all" && r.medalla !== filterMedalla) return false;

    // Filtro por catada
    if (filterCatada === "catadas" && !r.catada) return false;
    if (filterCatada === "pendientes" && r.catada) return false;

    // Búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        r.nombre.toLowerCase().includes(search) ||
        r.empresa_nombre.toLowerCase().includes(search) ||
        (r.codigotexto && r.codigotexto.toLowerCase().includes(search)) ||
        r.codigo.toString().includes(search)
      );
    }

    return true;
  });

  // Estadísticas
  const stats = {
    total: resultados.length,
    catadas: resultados.filter((r) => r.catada).length,
    pendientes: resultados.filter((r) => !r.catada).length,
    oro: resultados.filter((r) => r.medalla === "Oro").length,
    plata: resultados.filter((r) => r.medalla === "Plata").length,
    bronce: resultados.filter((r) => r.medalla === "Bronce").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow-600" />
            Resultados de Catas
          </h2>
          <p className="text-gray-600 mt-1">
            Puntuaciones y medallas asignadas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportDetailedCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Detallado
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Resumen
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Total Muestras</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Catadas</div>
          <div className="text-2xl font-bold text-green-700">
            {stats.catadas}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-700">
            {stats.pendientes}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-400">
          <div className="text-sm text-yellow-800">🥇 Oro</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.oro}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow border-l-4 border-gray-400">
          <div className="text-sm text-gray-800">🥈 Plata</div>
          <div className="text-2xl font-bold text-gray-700">{stats.plata}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow border-l-4 border-orange-400">
          <div className="text-sm text-orange-800">🥉 Bronce</div>
          <div className="text-2xl font-bold text-orange-700">
            {stats.bronce}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by Medal */}
          <select
            value={filterMedalla}
            onChange={(e) => setFilterMedalla(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las medallas</option>
            <option value="Oro">🥇 Oro</option>
            <option value="Plata">🥈 Plata</option>
            <option value="Bronce">🥉 Bronce</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterCatada}
            onChange={(e) => setFilterCatada(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las muestras</option>
            <option value="catadas">Solo catadas (5+ puntuaciones)</option>
            <option value="pendientes">Pendientes de catar</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ver
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntuaciones
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medalla
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResultados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No hay resultados que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredResultados.map((resultado) => {
                  const isExpanded = expandedRows.has(resultado.muestra_id);
                  const medallaColors = getMedallaColor(resultado.medalla);

                  return (
                    <>
                      <tr
                        key={resultado.muestra_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRow(resultado.muestra_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {resultado.codigotexto || resultado.codigo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {resultado.nombre}
                          </div>
                          {resultado.categoria && (
                            <div className="text-xs text-gray-500">
                              {resultado.categoria}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {resultado.empresa_nombre}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {resultado.num_puntuaciones} / 5
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {resultado.puntuacion_total ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-lg font-bold text-gray-900">
                                {resultado.puntuacion_total.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {resultado.medalla ? (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${medallaColors.bg} ${medallaColors.text} ${medallaColors.border}`}
                            >
                              <Award className="w-4 h-4" />
                              {resultado.medalla}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Sin medalla
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {resultado.catada ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ Catada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              ⏱ Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Puntuaciones Individuales
                              </h4>
                              {resultado.puntuaciones_detalle &&
                              resultado.puntuaciones_detalle.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {resultado.puntuaciones_detalle.map(
                                    (punt, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white p-3 rounded-lg border"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-gray-900">
                                            {punt.catador_nombre}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-lg font-bold text-gray-900">
                                              {punt.puntuacion}
                                            </span>
                                          </div>
                                        </div>
                                        {punt.notas && (
                                          <p className="text-sm text-gray-600 italic">
                                            "{punt.notas}"
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                          {new Date(
                                            punt.created_at,
                                          ).toLocaleString("es-ES")}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  No hay puntuaciones registradas
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        Mostrando {filteredResultados.length} de {resultados.length} muestras
      </div>
    </div>
  );
}
