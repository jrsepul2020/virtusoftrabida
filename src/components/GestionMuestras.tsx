import React, { useEffect, useState, useCallback } from "react";
import { supabase, type Sample } from "../lib/supabase";
import {
  Search,
  ChevronDown,
  Trash2,
  Filter,
  X,
  Building,
  Tag,
  Globe,
  Calendar,
  Hash,
  ArrowUpDown,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import SampleEditModal from "./SampleEditModal";

type SortField =
  | "created_at"
  | "codigo"
  | "nombre"
  | "empresa"
  | "categoria"
  | "recibida"
  | "anio";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 15;

export default function GestionMuestras({
  initialCategoryFilter,
}: {
  initialCategoryFilter?: string;
}) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filtered, setFiltered] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("muestras")
        .select(`*, empresas:empresa_id (name, pedido)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) {
        setSamples([]);
        setLoading(false);
        return;
      }

      const mapped = data.map((s: any) => ({
        ...s,
        empresa_nombre: s.empresas?.name || s.empresa || "",
        empresa_pedido: s.empresas?.pedido || null,
      }));

      setSamples(mapped);

      const cats = Array.from(
        new Set(mapped.map((m: any) => m.categoria).filter(Boolean)),
      ).sort();
      setAvailableCategories(cats);
      const countries = Array.from(
        new Set(mapped.map((m: any) => m.pais).filter(Boolean)),
      ).sort();
      setAvailableCountries(countries);
      const years = Array.from(
        new Set(mapped.map((m: any) => Number(m.anio)).filter(Boolean)),
      ).sort((a, b) => b - a);
      setAvailableYears(years as number[]);
    } catch (err) {
      console.error("Error fetching samples:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let res = [...samples];

    // Búsqueda
    if (search) {
      const term = search.toLowerCase();
      res = res.filter(
        (r) =>
          (r.nombre || "").toLowerCase().includes(term) ||
          (r.empresa_nombre || "").toLowerCase().includes(term) ||
          (r.codigotexto || String(r.codigo || ""))
            .toLowerCase()
            .includes(term) ||
          (r.pais || "").toLowerCase().includes(term),
      );
    }

    // Filtros
    if (categoryFilter) res = res.filter((r) => r.categoria === categoryFilter);
    if (countryFilter) res = res.filter((r) => r.pais === countryFilter);
    if (yearFilter) res = res.filter((r) => String(r.anio) === yearFilter);

    // Ordenación
    res.sort((a, b) => {
      let va: any, vb: any;

      switch (sortField) {
        case "codigo":
          va = a.codigo || 0;
          vb = b.codigo || 0;
          break;
        case "nombre":
          va = (a.nombre || "").toLowerCase();
          vb = (b.nombre || "").toLowerCase();
          break;
        case "empresa":
          va = (a.empresa_nombre || a.empresa || "").toLowerCase();
          vb = (b.empresa_nombre || b.empresa || "").toLowerCase();
          break;
        case "categoria":
          va = (a.categoria || "").toLowerCase();
          vb = (b.categoria || "").toLowerCase();
          break;
        case "recibida":
          va = (a as any).recibida ? 1 : 0;
          vb = (b as any).recibida ? 1 : 0;
          break;
        case "anio":
          va = a.anio || 0;
          vb = b.anio || 0;
          break;
        case "created_at":
        default:
          va = new Date(a.created_at || 0).getTime();
          vb = new Date(b.created_at || 0).getTime();
          break;
      }

      if (va < vb) return sortDirection === "asc" ? -1 : 1;
      if (va > vb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFiltered(res);
  }, [
    samples,
    search,
    categoryFilter,
    countryFilter,
    yearFilter,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  useEffect(() => {
    if (initialCategoryFilter) setCategoryFilter(initialCategoryFilter);
  }, [initialCategoryFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, countryFilter, yearFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortDirection === "asc" ? (
      <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
    ) : (
      <ChevronDown className="w-3 h-3 transition-transform" />
    );
  };

  const getCategoryStyle = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("vino"))
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    if (c.includes("aceite"))
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    if (c.includes("espirituoso") || c.includes("destilado"))
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    if (c.includes("espumoso"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };

  const handleRecibidaToggle = async (sampleId: string, current: boolean) => {
    const newVal = !current;
    try {
      const { error } = await supabase
        .from("muestras")
        .update({
          recibida: newVal,
          recibida_at: newVal ? new Date().toISOString() : null,
        })
        .eq("id", sampleId);

      if (error) throw error;

      setSamples((prev) =>
        prev.map((s) => (s.id === sampleId ? { ...s, recibida: newVal } : s)),
      );
      toast.success(newVal ? "Muestra recibida" : "Recepción cancelada");
    } catch (err) {
      console.error("Error updating recibida:", err);
      toast.error("Error al actualizar estado");
    }
  };

  const deleteSample = async (s: Sample) => {
    if (!confirm(`¿Eliminar muestra ${s.nombre || s.codigotexto || s.codigo}?`))
      return;
    try {
      const { error } = await supabase.from("muestras").delete().eq("id", s.id);
      if (error) throw error;
      fetchSamples();
    } catch (err) {
      console.error("Error deleting sample:", err);
      alert("Error al eliminar muestra");
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const clearFilters = () => {
    setCategoryFilter("");
    setCountryFilter("");
    setYearFilter("");
    setSearch("");
    setShowFilters(false);
  };

  const hasActiveFilters =
    categoryFilter || countryFilter || yearFilter || search;

  return (
    <div className="p-3 sm:p-4 max-w-full overflow-x-hidden min-h-screen bg-[#E6EBEE]">
      {/* Header con búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 sticky top-2 z-10">
        <div className="flex flex-col gap-3">
          {/* Búsqueda */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa, código o país"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botones de filtro en móvil */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  showFilters || hasActiveFilters
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && !showFilters && (
                  <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {filtered.length} {filtered.length === 1 ? "muestra" : "muestras"}
            </div>
          </div>

          {/* Filtros - responsive */}
          <div
            className={`
            ${showFilters ? "grid" : "hidden"}
            md:flex md:flex-row md:items-center md:gap-3
            grid-cols-1 sm:grid-cols-3 gap-3
            transition-all duration-300
          `}
          >
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1 ml-1">
                Categoría
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                >
                  <option value="">Todas las categorías</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1 ml-1">
                País
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                >
                  <option value="">Todos los países</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1 ml-1">
                Año
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                >
                  <option value="">Todos los años</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mostrar filtros activos en desktop */}
          {hasActiveFilters && (
            <div className="hidden md:flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 mr-2">
                Filtros activos:
              </span>
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                  <Tag className="w-3 h-3" />
                  {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter("")}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {countryFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                  <Globe className="w-3 h-3" />
                  {countryFilter}
                  <button
                    onClick={() => setCountryFilter("")}
                    className="ml-1 hover:text-green-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {yearFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200">
                  <Calendar className="w-3 h-3" />
                  {yearFilter}
                  <button
                    onClick={() => setYearFilter("")}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs border border-amber-200">
                  <Search className="w-3 h-3" />"{search}"
                  <button
                    onClick={() => setSearch("")}
                    className="ml-1 hover:text-amber-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
              >
                Limpiar todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards móviles - CON MEJOR SEPARACIÓN */}
      <div className="md:hidden space-y-3 mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando muestras...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-2">
              No se encontraron muestras
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {hasActiveFilters
                ? "Intenta ajustar los filtros de búsqueda"
                : "No hay muestras registradas"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Ver todas las muestras
              </button>
            )}
          </div>
        ) : (
          filtered
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .map((s, index) => (
              <div
                key={s.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                style={{
                  borderLeft: "4px solid",
                  borderLeftColor:
                    index % 3 === 0
                      ? "#3b82f6"
                      : index % 3 === 1
                        ? "#10b981"
                        : "#8b5cf6",
                }}
              >
                {/* Encabezado de la card */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full">
                          <Hash className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-mono font-bold text-gray-800">
                            {s.codigotexto || s.codigo}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {s.pais}
                        </span>
                      </div>

                      <h3
                        className="text-base font-semibold text-gray-900 truncate"
                        title={s.nombre}
                      >
                        {s.nombre}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        <p
                          className="text-sm text-gray-600 truncate"
                          title={s.empresa_nombre || s.empresa}
                        >
                          {s.empresa_nombre || s.empresa}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSample(s)}
                      className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detalles de la muestra */}
                <div className="px-4 py-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-gray-500">Categoría</span>
                      </div>
                      <div className="font-medium text-gray-800">
                        <span
                          className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryStyle(s.categoria || "")}`}
                        >
                          {s.categoria || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-gray-500">Año</span>
                      </div>
                      <div className="font-medium text-gray-800">
                        {s.anio ? (
                          <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                            {s.anio}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {(s as any).recibida ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="text-xs text-gray-500">Recibida</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecibidaToggle(s.id, (s as any).recibida);
                        }}
                        className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${(s as any).recibida ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                      >
                        {(s as any).recibida ? "RECIBIDA" : "PENDIENTE"}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-gray-500">Código</span>
                      </div>
                      <div className="font-medium text-gray-800 font-mono text-sm">
                        {s.codigotexto || s.codigo}
                      </div>
                    </div>
                  </div>

                  {/* Información adicional si existe */}
                  {(s.igp || s.grado) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {s.igp && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                            D.O.: {s.igp}
                          </span>
                        )}
                        {s.grado && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                            {s.grado}% alc.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Table desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-slate-600">Cargando muestras...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold mb-2">
              No hay muestras que coincidan
            </p>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? "Prueba con otros criterios de búsqueda"
                : "No hay muestras registradas en el sistema"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr className="transition-colors">
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                  onClick={() => handleSort("codigo")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                    <Hash className="w-3.5 h-3.5" />
                    Código {renderSortIcon("codigo")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                  onClick={() => handleSort("nombre")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                    Muestra {renderSortIcon("nombre")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                  onClick={() => handleSort("empresa")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                    <Building className="w-3.5 h-3.5" />
                    Empresa {renderSortIcon("empresa")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                  onClick={() => handleSort("categoria")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                    <Tag className="w-3.5 h-3.5" />
                    Categoría {renderSortIcon("categoria")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center cursor-pointer group"
                  onClick={() => handleSort("recibida")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600 justify-center">
                    Recibida {renderSortIcon("recibida")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center cursor-pointer group"
                  onClick={() => handleSort("anio")}
                >
                  <div className="flex items-center gap-1.5 group-hover:text-primary-600 justify-center">
                    Año {renderSortIcon("anio")}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered
                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                .map((s, index) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group border-b border-slate-100 dark:border-slate-800 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-extrabold text-sm border border-red-100 dark:border-red-900/30">
                        #{s.codigotexto || s.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={s.nombre}
                        >
                          {s.nombre}
                        </span>
                        <span className="text-red-600 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                          {s.pais}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={s.empresa_nombre || s.empresa}
                        >
                          {s.empresa_nombre || s.empresa}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          ID: {s.empresa_id?.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCategoryStyle(s.categoria || "")}`}
                      >
                        {s.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecibidaToggle(s.id, (s as any).recibida);
                        }}
                        className={`p-2 rounded-full transition-all ${
                          (s as any).recibida
                            ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                            : "bg-slate-100 text-slate-300 hover:bg-green-50 hover:text-green-500 dark:bg-slate-800"
                        }`}
                        title={
                          (s as any).recibida
                            ? "Muestra recibida"
                            : "Marcar como recibida"
                        }
                      >
                        <Check
                          className={`w-5 h-5 ${(s as any).recibida ? "scale-100 opacity-100" : "scale-75 opacity-50"} transition-all`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.anio ? (
                        <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                          {s.anio}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(s);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSample(s);
                          }}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Eliminar muestra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination - Mejorado */}
      {filtered.length > 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Mostrando{" "}
              <span className="font-semibold text-gray-800">
                {Math.min(
                  PAGE_SIZE,
                  Math.max(0, filtered.length - (currentPage - 1) * PAGE_SIZE),
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-gray-800">
                {filtered.length}
              </span>{" "}
              muestras
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => {
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" : "text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2)
                      return (
                        <span key={p} className="text-slate-300">
                          ...
                        </span>
                      );
                    return null;
                  },
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <SampleEditModal
          sample={selectedSample}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSample(null);
          }}
          onSave={() => {
            fetchSamples();
            toast.success("Muestra actualizada con éxito");
          }}
        />
      )}
    </div>
  );
}
