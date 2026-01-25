import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  Mail,
  X,
  Edit2,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Settings,
  User,
  Hash,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { type CompanyWithSamples, type Company } from "../lib/supabase";
import * as queries from "../lib/supabaseQueries";
import ListadoEmpresas from "./ListadoEmpresas";

type SortField =
  | "name"
  | "email"
  | "created_at"
  | "pais"
  | "totalinscripciones"
  | "pedido";
type SortDirection = "asc" | "desc";

type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
};

export default function CompaniesManager() {
  const [activeSubTab, setActiveSubTab] = useState<"empresas" | "listado">(
    "empresas",
  );
  const [companiesData, setCompaniesData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await queries.getAllCompanies();
      setCompaniesData(data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Error desconocido al cargar empresas"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const refetch = fetchCompanies;

  const [companiesWithSamples, setCompaniesWithSamples] = useState<
    CompanyWithSamples[]
  >([]);
  const [filteredCompanies, setFilteredCompanies] = useState<
    CompanyWithSamples[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithSamples | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<CompanyWithSamples | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusConfigs, setStatusConfigs] = useState<any[]>([]);
  const [changingStatus, setChangingStatus] = useState<{
    companyId: string;
    currentStatus: string;
  } | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "pedido", label: "Pedido", visible: true },
    { key: "name", label: "Nombre", visible: true },
    { key: "totalinscripciones", label: "Nº Muestras", visible: true },
    { key: "telefono", label: "Teléfonos", visible: true },
    { key: "email", label: "Email", visible: true },
    { key: "pagado", label: "Pagado", visible: true },
    { key: "status", label: "Estado", visible: true },
    { key: "pais", label: "País", visible: true },
  ]);

  // ✅ NUEVO: Cargar muestras para cada empresa cuando cambien los datos
  useEffect(() => {
    if (companiesData) {
      loadCompaniesWithSamples(companiesData);
    }
  }, [companiesData]);

  // ✅ MEJORADO: Función más limpia para cargar muestras
  const loadCompaniesWithSamples = async (companies: Company[]) => {
    try {
      const companiesWithSamples = await Promise.all(
        companies.map(async (company) => {
          const samples = await queries.getSamplesByCompany(company.id);
          return {
            ...company,
            samples: samples || [],
          } as CompanyWithSamples;
        }),
      );
      setCompaniesWithSamples(companiesWithSamples);
    } catch (error) {
      console.error("Error loading samples:", error);
    }
  };

  useEffect(() => {
    const defaultConfigs = [
      {
        value: "pending",
        label: "Pendiente",
        bg_color: "bg-yellow-100",
        text_color: "text-yellow-800",
      },
      {
        value: "approved",
        label: "Aprobada",
        bg_color: "bg-green-100",
        text_color: "text-green-800",
      },
      {
        value: "rejected",
        label: "Rechazada",
        bg_color: "bg-red-100",
        text_color: "text-red-800",
      },
    ];

    const loadStatusConfigs = async () => {
      try {
        const { data: configs } = await queries.supabase
          .from("status_configs")
          .select("*")
          .order("is_default", { ascending: false });

        if (configs && configs.length > 0) {
          setStatusConfigs(configs);
        } else {
          setStatusConfigs(defaultConfigs);
        }
      } catch (error) {
        console.log("Status configs not available, using defaults");
        setStatusConfigs(defaultConfigs);
      }
    };
    loadStatusConfigs();
  }, []);

  // ✅ MEJORADO: Usar useMemo para filtrado y ordenamiento
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companiesWithSamples];

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(term) ||
          company.email.toLowerCase().includes(term) ||
          company.pais?.toLowerCase().includes(term) ||
          company.contact_person?.toLowerCase().includes(term),
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((company) => company.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "pais":
          aValue = (a.pais || "").toLowerCase();
          bValue = (b.pais || "").toLowerCase();
          break;
        case "totalinscripciones":
          aValue = a.totalinscripciones || 0;
          bValue = b.totalinscripciones || 0;
          break;
        case "pedido":
          aValue = a.pedido || 0;
          bValue = b.pedido || 0;
          break;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    companiesWithSamples,
    searchTerm,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  // Actualizar filteredCompanies cuando cambie el resultado del memo
  useEffect(() => {
    setFilteredCompanies(filteredAndSortedCompanies);
  }, [filteredAndSortedCompanies]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-white" />
    ) : (
      <ChevronDown className="w-4 h-4 text-white" />
    );
  };

  const isColumnVisible = (key: string) => {
    return columns.find((col) => col.key === key)?.visible ?? true;
  };

  // ✅ MEJORADO: Función de guardado más clara
  const handleSave = async () => {
    if (!editingCompany) return;

    setSaving(true);
    try {
      await queries.updateCompany(editingCompany.id, editingCompany);

      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();

      setEditingCompany(null);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error("Error updating company:", error);
      alert("Error al actualizar la empresa: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ MEJORADO: Función de eliminación más clara
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    setDeleting(true);
    try {
      await queries.deleteCompany(showDeleteConfirm.id);

      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();

      setShowDeleteConfirm(null);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error("Error deleting company:", error);
      alert("Error al eliminar la empresa: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // ✅ MEJORADO: Cambio de estado más claro
  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      await queries.updateCompany(companyId, { status: newStatus as any });

      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();

      setChangingStatus(null);
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Error al cambiar el estado: " + error.message);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredCompanies.map((company) => ({
      Pedido: company.pedido || "",
      Nombre: company.name,
      Email: company.email,
      Teléfono: company.telefono || company.phone || "",
      Móvil: company.movil || "",
      NIF: company.nif || "",
      Dirección: company.address || "",
      "Código Postal": company.postal || company.codigo_postal || "",
      Ciudad: company.city || company.ciudad || company.poblacion || "",
      País: company.country || company.pais || "",
      "Persona Contacto": company.contact_person || "",
      "Página Web": company.pagina_web || "",
      Conocimiento: company.conocimiento || "",
      "Nº Muestras": company.totalinscripciones || company.samples.length,
      Estado: company.status,
      Fecha: new Date(company.created_at).toLocaleDateString(),
      Observaciones: company.observaciones || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(
      wb,
      `empresas_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const getStatusConfig = (status: string) => {
    return (
      statusConfigs.find((config) => config.value === status) || {
        value: status,
        label: status,
        bg_color: "bg-gray-100",
        text_color: "text-gray-800",
      }
    );
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  // ✅ MEJORADO: Mostrar error si hay
  const stats = {
    total: companiesWithSamples.length,
    filtradas: filteredCompanies.length,
    aprobadas: companiesWithSamples.filter((c) => c.status === "approved")
      .length,
    muestras: companiesWithSamples.reduce(
      (acc, c) => acc + (c.totalinscripciones || c.samples.length),
      0,
    ),
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error al cargar empresas: {error.message}
          <button onClick={() => refetch()} className="ml-4 underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Vista
            </h2>
          </div>

          <div className="space-y-6">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-full">
              <button
                onClick={() => setActiveSubTab("empresas")}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === "empresas" ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Gestión
              </button>
              <button
                onClick={() => setActiveSubTab("listado")}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === "listado" ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Listado
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Buscador
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium dark:text-white"
                />
              </div>
            </div>

            {activeSubTab === "empresas" && (
              <>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Estado
                  </label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === "all" ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                    >
                      Todos
                      <span
                        className={`w-2 h-2 rounded-full ${statusFilter === "all" ? "bg-white" : "bg-slate-300"}`}
                      />
                    </button>
                    {statusConfigs.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === opt.value ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        {opt.label}
                        <span
                          className={`w-2 h-2 rounded-full ${statusFilter === opt.value ? "bg-white" : "bg-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowColumnConfig(!showColumnConfig)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${showColumnConfig ? "bg-slate-900 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      Columnas
                    </div>
                    {showColumnConfig ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showColumnConfig && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                      {columns.map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => toggleColumnVisibility(col.key)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                            {col.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <button
                onClick={exportToExcel}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </button>
              <button
                onClick={() => refetch()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <ChevronDown
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualizar Datos
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">
                  Total
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">
                  Muestras
                </p>
                <p className="text-xl font-black text-primary-600">
                  {stats.muestras}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 transition-all overflow-hidden flex flex-col">
          {activeSubTab === "listado" ? (
            <ListadoEmpresas />
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Gestión de Empresas
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium flex items-center gap-2">
                  Administración y seguimiento de entidades registradas
                </p>
              </div>

              {loading && !companiesWithSamples.length ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                  <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Cargando información...
                  </p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    No se encontraron empresas
                  </h3>
                  <p className="text-slate-500 text-sm max-w-xs text-center">
                    Prueba a cambiar los filtros o el término de búsqueda para
                    encontrar lo que buscas.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                  {/* Responsive View Switch base display logic already present */}
                  <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredCompanies.map((company) => {
                      const pagadoStatus = company.status?.toLowerCase();
                      const isPagado =
                        (company as any).pago_confirmado ||
                        pagadoStatus === "approved" ||
                        pagadoStatus === "aprobada";

                      return (
                        <div
                          key={company.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="text-sm sm:text-base font-semibold text-gray-900 truncate"
                                  title={company.name}
                                >
                                  {company.name}
                                </span>
                                {company.pedido ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                                    Pedido {company.pedido}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 truncate">
                                {company.contact_person || company.email}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold rounded-full px-2 py-1 flex-shrink-0 ${getStatusConfig(company.status).bg_color} ${getStatusConfig(company.status).text_color}`}
                            >
                              {getStatusConfig(company.status).label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <p className="text-[10px] text-gray-500">
                                Muestras
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {company.totalinscripciones ||
                                  company.samples.length}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500">
                                Pagado
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {isPagado ? "Sí" : "Pend."}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-gray-500">Email</p>
                              <a
                                href={`mailto:${company.email}`}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                                title={company.email}
                              >
                                {company.email}
                              </a>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-gray-500">País</p>
                              <p className="text-sm text-gray-900 truncate">
                                {company.pais || company.country || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedCompany(company)}
                              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 whitespace-nowrap"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(company)}
                              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                            {isColumnVisible("pedido") && (
                              <th
                                onClick={() => handleSort("pedido")}
                                className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group whitespace-nowrap"
                              >
                                <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                                  <Hash className="w-3.5 h-3.5" />
                                  Pedido {getSortIcon("pedido")}
                                </div>
                              </th>
                            )}
                            {isColumnVisible("name") && (
                              <th
                                onClick={() => handleSort("name")}
                                className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group min-w-[200px]"
                              >
                                <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                                  <User className="w-3.5 h-3.5" />
                                  Empresa {getSortIcon("name")}
                                </div>
                              </th>
                            )}
                            {isColumnVisible("totalinscripciones") && (
                              <th
                                onClick={() => handleSort("totalinscripciones")}
                                className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group text-center"
                              >
                                <div className="flex items-center justify-center gap-1.5 group-hover:text-primary-600">
                                  Muestras {getSortIcon("totalinscripciones")}
                                </div>
                              </th>
                            )}
                            {isColumnVisible("telefono") && (
                              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  Contacto
                                </div>
                              </th>
                            )}
                            {isColumnVisible("email") && (
                              <th
                                onClick={() => handleSort("email")}
                                className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                              >
                                <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                                  <Mail className="w-3.5 h-3.5" />
                                  Email {getSortIcon("email")}
                                </div>
                              </th>
                            )}
                            {isColumnVisible("pagado") && (
                              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                Pago
                              </th>
                            )}
                            {isColumnVisible("status") && (
                              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                Estado
                              </th>
                            )}
                            {isColumnVisible("pais") && (
                              <th
                                onClick={() => handleSort("pais")}
                                className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group"
                              >
                                <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                                  <MapPin className="w-3.5 h-3.5" />
                                  País {getSortIcon("pais")}
                                </div>
                              </th>
                            )}
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredCompanies.map((company) => (
                            <tr
                              key={company.id}
                              className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              {isColumnVisible("pedido") && (
                                <td className="p-4 whitespace-nowrap">
                                  <span className="text-xs font-black text-slate-400 group-hover:text-primary-600 transition-colors">
                                    #{company.pedido || "S/N"}
                                  </span>
                                </td>
                              )}
                              {isColumnVisible("name") && (
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-black text-xs border border-slate-200 dark:border-slate-700 group-hover:border-primary-200 transition-colors">
                                      {company.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div
                                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                                        title={company.name}
                                      >
                                        {company.name}
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                        {company.contact_person ||
                                          "Sin contacto"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              )}
                              {isColumnVisible("totalinscripciones") && (
                                <td className="p-4 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-black border border-slate-200 dark:border-slate-700">
                                    {company.totalinscripciones ||
                                      company.samples.length}
                                  </span>
                                </td>
                              )}
                              {isColumnVisible("telefono") && (
                                <td className="p-4">
                                  <div className="flex flex-col gap-0.5 min-w-[120px]">
                                    {(company.telefono || company.phone) && (
                                      <a
                                        href={`tel:${company.telefono || company.phone}`}
                                        className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors"
                                      >
                                        {company.telefono || company.phone}
                                      </a>
                                    )}
                                    {company.movil && (
                                      <a
                                        href={`tel:${company.movil}`}
                                        className="text-[10px] font-medium text-slate-400 hover:text-primary-600 transition-colors"
                                      >
                                        {company.movil} (M)
                                      </a>
                                    )}
                                    {!company.telefono &&
                                      !company.phone &&
                                      !company.movil && (
                                        <span className="text-xs text-slate-300">
                                          -
                                        </span>
                                      )}
                                  </div>
                                </td>
                              )}
                              {isColumnVisible("email") && (
                                <td className="p-4">
                                  <a
                                    href={`mailto:${company.email}`}
                                    className="text-xs font-bold text-primary-600 hover:underline truncate block max-w-[150px]"
                                    title={company.email}
                                  >
                                    {company.email}
                                  </a>
                                </td>
                              )}
                              {isColumnVisible("pagado") && (
                                <td className="p-4 text-center">
                                  {(() => {
                                    const status =
                                      company.status?.toLowerCase();
                                    const isPagado = (company as any)
                                      .pago_confirmado;
                                    const pagadoLabel =
                                      status === "approved" ||
                                      status === "aprobada" ||
                                      isPagado;

                                    return pagadoLabel ? (
                                      <div className="flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800">
                                          <XCircle className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>
                              )}
                              {isColumnVisible("status") && (
                                <td className="p-4 text-center">
                                  {changingStatus?.companyId === company.id ? (
                                    <div className="flex justify-center">
                                      <select
                                        value={company.status}
                                        onChange={(e) =>
                                          handleStatusChange(
                                            company.id,
                                            e.target.value,
                                          )
                                        }
                                        className="text-[10px] font-black uppercase rounded-lg px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                        onBlur={() => setChangingStatus(null)}
                                      >
                                        {statusConfigs.map((config) => (
                                          <option
                                            key={config.value}
                                            value={config.value}
                                          >
                                            {config.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <button
                                        onClick={() =>
                                          setChangingStatus({
                                            companyId: company.id,
                                            currentStatus: company.status,
                                          })
                                        }
                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2 group/status ${getStatusConfig(company.status).bg_color} ${getStatusConfig(company.status).text_color}`}
                                      >
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                            company.status === "approved"
                                              ? "bg-green-500"
                                              : company.status === "rejected"
                                                ? "bg-red-500"
                                                : "bg-amber-500"
                                          }`}
                                        />
                                        {getStatusConfig(company.status).label}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}
                              {isColumnVisible("pais") && (
                                <td className="p-4">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {company.pais || company.country || "-"}
                                  </span>
                                </td>
                              )}
                              <td className="p-4">
                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                  <button
                                    onClick={() => setSelectedCompany(company)}
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    title="Ver detalles"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setShowDeleteConfirm(company)
                                    }
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedCompany && !editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedCompany.name}
                  </h2>
                  <span
                    className={`inline-flex text-xs leading-5 font-semibold rounded-full px-3 py-1 mt-2 ${getStatusConfig(selectedCompany.status).bg_color} ${getStatusConfig(selectedCompany.status).text_color}`}
                  >
                    {getStatusConfig(selectedCompany.status).label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCompany(selectedCompany)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Información de Contacto
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedCompany.email}
                    </p>
                    <p>
                      <span className="font-medium">Teléfono:</span>{" "}
                      {selectedCompany.telefono || selectedCompany.phone || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Móvil:</span>{" "}
                      {selectedCompany.movil || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Contacto:</span>{" "}
                      {selectedCompany.contact_person || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Página Web:</span>{" "}
                      {selectedCompany.pagina_web || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Información de la Empresa
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">NIF:</span>{" "}
                      {selectedCompany.nif || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Dirección:</span>{" "}
                      {selectedCompany.address || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Código Postal:</span>{" "}
                      {selectedCompany.postal ||
                        selectedCompany.codigo_postal ||
                        "-"}
                    </p>
                    <p>
                      <span className="font-medium">Ciudad:</span>{" "}
                      {selectedCompany.city ||
                        selectedCompany.ciudad ||
                        selectedCompany.poblacion ||
                        "-"}
                    </p>
                    <p>
                      <span className="font-medium">País:</span>{" "}
                      {selectedCompany.pais || selectedCompany.country || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Conoció por:</span>{" "}
                      {selectedCompany.conocimiento || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCompany.observaciones && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedCompany.observaciones}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Muestras ({selectedCompany.samples.length})
                </h3>
                {selectedCompany.samples.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay muestras registradas
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Código
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Categoría
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCompany.samples.map((sample) => (
                          <tr key={sample.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {sample.codigotexto || sample.codigo}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {sample.nombre}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {sample.categoria || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Editar Empresa
                </h2>
                <button
                  onClick={() => {
                    setEditingCompany(null);
                    setSelectedCompany(null);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCompany.name}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editingCompany.email}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={editingCompany.nif || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          nif: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={editingCompany.contact_person || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={
                        editingCompany.telefono || editingCompany.phone || ""
                      }
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          telefono: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Móvil
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.movil || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          movil: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editingCompany.address || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={
                        editingCompany.postal ||
                        editingCompany.codigo_postal ||
                        ""
                      }
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          postal: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={
                        editingCompany.city ||
                        editingCompany.ciudad ||
                        editingCompany.poblacion ||
                        ""
                      }
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          ciudad: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={
                        editingCompany.pais || editingCompany.country || ""
                      }
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          pais: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Página Web
                    </label>
                    <input
                      type="url"
                      value={editingCompany.pagina_web || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          pagina_web: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={editingCompany.status}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {statusConfigs.map((config) => (
                        <option key={config.value} value={config.value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={editingCompany.observaciones || ""}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          observaciones: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompany(null);
                      setSelectedCompany(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la empresa "
              {showDeleteConfirm.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
