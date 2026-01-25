import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  Printer,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Save,
  Eye,
  Hash,
  User,
  MapPin,
} from "lucide-react";
import type { Company } from "../lib/supabase";
import * as XLSX from "xlsx";

interface Sample {
  id: string;
  nombre_muestra: string;
  categoria: string;
  pais: string;
  created_at: string;
}

type SortField =
  | "created_at"
  | "pedido"
  | "name"
  | "totalinscripciones"
  | "pais"
  | "status";
type SortOrder = "asc" | "desc";

export default function ListadoEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    companyId: string;
    field: string;
  } | null>(null);
  const [viewingSamples, setViewingSamples] = useState<{
    company: Company;
    samples: Sample[];
  } | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      console.log("🔄 Iniciando carga de empresas...");

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📡 Respuesta de Supabase:", {
        data: data?.length,
        error,
        hasData: !!data,
      });

      if (error) {
        console.error("❌ Error fetching companies:", error);
        console.error("❌ Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log("✅ Empresas cargadas:", data?.length);
      console.log("📊 Primeras 3 empresas:", data?.slice(0, 3));
      setCompanies(data || []);
    } catch (error) {
      console.error("💥 Error en fetchCompanies:", error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const filteredCompanies = companies
    .filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.pedido?.toString() || "").includes(searchTerm) ||
        (company.pais || company.country || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "pais") {
        aValue = a.pais || a.country || "";
        bValue = b.pais || b.country || "";
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          name: editingCompany.name,
          email: editingCompany.email,
          phone: editingCompany.phone,
          movil: editingCompany.movil,
          address: editingCompany.address,
          contact_person: editingCompany.contact_person,
          nif: editingCompany.nif,
          codigo_postal: editingCompany.codigo_postal,
          poblacion: editingCompany.poblacion,
          ciudad: editingCompany.ciudad,
          pais: editingCompany.pais,
          observaciones: editingCompany.observaciones,
          conocimiento: editingCompany.conocimiento,
          pagina_web: editingCompany.pagina_web,
          pedido: editingCompany.pedido,
          totalinscripciones: editingCompany.totalinscripciones,
          status: editingCompany.status,
        })
        .eq("id", editingCompany.id);

      if (error) throw error;

      await fetchCompanies();
      setEditingCompany(null);
    } catch (error) {
      console.error("Error updating company:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (
    companyId: string,
    companyName: string,
  ) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la empresa "${companyName}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .eq("id", companyId);

      if (error) throw error;

      await fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Error al eliminar la empresa");
    }
  };

  const handleViewSamples = async (company: Company) => {
    setLoadingSamples(true);
    setViewingSamples({ company, samples: [] });

    try {
      const { data, error } = await supabase
        .from("muestras")
        .select("id, nombre_muestra, categoria, pais, created_at")
        .eq("empresa_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setViewingSamples({ company, samples: data || [] });
    } catch (error) {
      console.error("Error loading samples:", error);
      alert("Error al cargar las muestras");
      setViewingSamples(null);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleInlineEdit = async (
    companyId: string,
    field: keyof Company,
    value: any,
  ) => {
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ [field]: value })
        .eq("id", companyId);

      if (error) throw error;

      // Actualizar el estado local
      setCompanies(
        companies.map((c) =>
          c.id === companyId ? { ...c, [field]: value } : c,
        ),
      );

      setEditingCell(null);
    } catch (error) {
      console.error("Error updating field:", error);
      alert("Error al actualizar el campo");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pendiente",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Aprobado",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rechazado" },
    };

    const config = statusColors[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status || "Sin estado",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectCompany = (id: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCompanies = () => {
    if (selectedCompanies.length === filteredCompanies.length)
      setSelectedCompanies([]);
    else setSelectedCompanies(filteredCompanies.map((c) => c.id));
  };

  const handleDeleteSelectedCompanies = async () => {
    if (selectedCompanies.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${selectedCompanies.length} empresa(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .in("id", selectedCompanies);
      if (error) throw error;
      setSelectedCompanies([]);
      await fetchCompanies();
    } catch (err) {
      console.error("Error eliminando empresas seleccionadas", err);
      alert("Error eliminando empresas seleccionadas");
    }
  };

  const handleExportExcel = () => {
    // Preparar datos para el Excel
    const data = filteredCompanies.map((company) => ({
      Fecha: new Date(company.created_at).toLocaleDateString("es-ES"),
      Pedido: company.pedido || "-",
      Nombre: company.name,
      Email: company.email || "-",
      Teléfono: company.phone || "-",
      Móvil: company.movil || "-",
      "Nº Muestras": company.totalinscripciones || 0,
      Estado:
        company.status === "pending"
          ? "Pendiente"
          : company.status === "approved"
            ? "Aprobado"
            : company.status === "rejected"
              ? "Rechazado"
              : "-",
      País: company.country || company.pais || "-",
      Observaciones: company.observaciones || "-",
    }));

    // Crear libro de trabajo y hoja
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");

    // Ajustar anchos de columna
    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 }, // Pedido
      { wch: 35 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Móvil
      { wch: 10 }, // Nº Muestras
      { wch: 12 }, // Estado
      { wch: 15 }, // País
      { wch: 40 }, // Observaciones
    ];
    worksheet["!cols"] = columnWidths;

    // Descargar archivo
    XLSX.writeFile(
      workbook,
      `listado-empresas-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Cargando empresas...</p>
      </div>
    );
  }

  console.log("🎯 Renderizando con:", {
    totalCompanies: companies.length,
    filteredCompanies: filteredCompanies.length,
    searchTerm,
    sortField,
    sortOrder,
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
        <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 lg:h-[calc(100vh-120px)] lg:sticky lg:top-0 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Filtros
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Buscador
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Imprimir Listado
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </button>
              <button
                onClick={handleDeleteSelectedCompanies}
                disabled={selectedCompanies.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar ({selectedCompanies.length})
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">
                Empresas Encontradas
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {filteredCompanies.length}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-hidden flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Listado Detallado
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Visualización exhaustiva de entidades y sus registros asociados
            </p>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No se encontraron resultados
              </h3>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all"
                >
                  Limpiar Búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="lg:hidden space-y-4">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary-600">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {company.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                            #{company.pedido || "S/N"}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.id)}
                        onChange={() => toggleSelectCompany(company.id)}
                        className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-medium">
                      <div>
                        <span className="block text-slate-400 mb-1">País</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {company.country || company.pais || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-1">
                          Muestras
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md font-bold">
                          {company.totalinscripciones || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center">
                        {getStatusBadge(company.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewSamples(company)}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteCompany(company.id, company.name)
                          }
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                        <th className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedCompanies.length ===
                                filteredCompanies.length &&
                              filteredCompanies.length > 0
                            }
                            onChange={toggleSelectAllCompanies}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                        </th>
                        <th
                          onClick={() => handleSort("created_at")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                            Fecha {getSortIcon("created_at")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("pedido")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group text-center whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5 group-hover:text-primary-600">
                            <Hash className="w-3.5 h-3.5" />
                            Ped {getSortIcon("pedido")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("name")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group min-w-[200px]"
                        >
                          <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                            <User className="w-3.5 h-3.5" />
                            Empresa {getSortIcon("name")}
                          </div>
                        </th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Contacto
                        </th>
                        <th
                          onClick={() => handleSort("totalinscripciones")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group text-center whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5 group-hover:text-primary-600">
                            Muestras {getSortIcon("totalinscripciones")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("status")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group text-center"
                        >
                          <div className="flex items-center justify-center gap-1.5 group-hover:text-primary-600">
                            Estado {getSortIcon("status")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("pais")}
                          className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5 group-hover:text-primary-600">
                            <MapPin className="w-3.5 h-3.5" />
                            País {getSortIcon("pais")}
                          </div>
                        </th>
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
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(company.id)}
                              onChange={() => toggleSelectCompany(company.id)}
                              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="p-4 whitespace-nowrap text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(company.created_at).toLocaleDateString(
                              "es-ES",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              },
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs font-black text-slate-400 group-hover:text-primary-600 transition-colors">
                              #{company.pedido || "S/N"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-primary-600 group-hover:bg-primary-50 transition-colors">
                                {company.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]"
                                  title={company.name}
                                >
                                  {company.name}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[180px]">
                                  {company.contact_person || "Sin contacto"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              {company.email && (
                                <a
                                  href={`mailto:${company.email}`}
                                  className="text-xs font-bold text-primary-600 hover:underline truncate max-w-[140px]"
                                >
                                  {company.email}
                                </a>
                              )}
                              {(company.phone || company.movil) && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  {company.phone || company.movil}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-black border border-slate-200 dark:border-slate-700">
                              {company.totalinscripciones || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(company.status)}
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {company.country || company.pais || "-"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => handleViewSamples(company)}
                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditCompany(company)}
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCompany(company.id, company.name)
                                }
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        </main>
      </div>

      {/* Modal de Edición */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveCompany}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Editar Empresa
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={editingCompany.name}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editingCompany.email}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.phone || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Móvil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Móvil
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.movil || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          movil: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* NIF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIF/CIF
                    </label>
                    <input
                      type="text"
                      value={editingCompany.nif || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          nif: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Persona de Contacto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={editingCompany.contact_person || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editingCompany.address || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Código Postal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={editingCompany.codigo_postal || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          codigo_postal: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Población */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Población
                    </label>
                    <input
                      type="text"
                      value={editingCompany.poblacion || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          poblacion: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* País */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={editingCompany.pais || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          pais: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Página Web */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Página Web
                    </label>
                    <input
                      type="url"
                      value={editingCompany.pagina_web || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          pagina_web: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Pedido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Pedido
                    </label>
                    <input
                      type="number"
                      value={editingCompany.pedido || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          pedido: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  {/* Total Inscripciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Muestras
                    </label>
                    <input
                      type="number"
                      value={editingCompany.totalinscripciones || 0}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          totalinscripciones: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={editingCompany.status}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          status: e.target.value as
                            | "pending"
                            | "approved"
                            | "rejected",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={editingCompany.observaciones || ""}
                      onChange={(e) =>
                        editingCompany &&
                        setEditingCompany({
                          ...editingCompany,
                          observaciones: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Muestras */}
      {viewingSamples && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Muestras de {viewingSamples?.company.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {viewingSamples?.samples.length} muestras
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSamples(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingSamples ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">
                    Cargando muestras...
                  </span>
                </div>
              ) : viewingSamples?.samples.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No hay muestras inscritas para esta empresa
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingSamples?.samples.map((sample, index) => (
                    <div
                      key={sample.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm font-bold">
                              {index + 1}
                            </span>
                            <h4 className="text-base font-semibold text-gray-900">
                              {sample.nombre_muestra}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 ml-11">
                            <div>
                              <span className="text-xs text-gray-500">
                                Categoría:
                              </span>
                              <p className="text-sm font-medium text-gray-700">
                                {sample.categoria}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                País:
                              </span>
                              <p className="text-sm font-medium text-gray-700">
                                {sample.pais}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Fecha:
                              </span>
                              <p className="text-sm font-medium text-gray-700">
                                {new Date(sample.created_at).toLocaleDateString(
                                  "es-ES",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingSamples(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-7xl, .max-w-7xl * {
            visibility: visible;
          }
          .max-w-7xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
          .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
