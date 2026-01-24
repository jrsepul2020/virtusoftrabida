import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  RefreshCw,
  Download,
  Eye,
  Edit,
  X,
  ChevronUp,
  ChevronDown,
  Save,
  PlusCircle,
  Mail,
  Printer,
  FileText,
  Building2,
  Phone,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

interface Muestra {
  id: string;
  nombre: string;
  categoria: string;
  anio: number | null;
  igp: string | null;
  grado: number | null;
  pais: string | null;
}

interface Inscripcion {
  id: string;
  created_at: string;
  pedido: number | null;
  name: string;
  email: string;
  phone: string;
  movil: string;
  pais: string;
  status: string;
  revisada: boolean;
  // Campos adicionales para detalle
  nif?: string;
  address?: string;
  poblacion?: string;
  ciudad?: string;
  codigo_postal?: string;
  contact_person?: string;
  pagina_web?: string;
  conocimiento?: string;
  observaciones?: string;
  metodo_pago?: string;
  referencia_pago?: string;
  pago_confirmado?: boolean;
  fecha_pago?: string;
  totalinscripciones?: number;
  muestras?: Muestra[];
  muestras_count?: number;
  precio_total?: number;
}

type SortField = "created_at" | "pedido" | "name" | "status" | "revisada";
type SortDirection = "asc" | "desc";

interface InscripcionesManagerProps {
  onNewInscripcion?: () => void;
}

const InscripcionesManager: React.FC<InscripcionesManagerProps> = ({
  onNewInscripcion,
}) => {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterRevisada, setFilterRevisada] = useState<string>("pendiente");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedInscripcion, setSelectedInscripcion] =
    useState<Inscripcion | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [loadingMuestras, setLoadingMuestras] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Inscripcion>>({});
  const [selectedInscripciones, setSelectedInscripciones] = useState<string[]>(
    [],
  );
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchInscripciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("empresas")
        .select(
          `
          id,
          created_at,
          pedido,
          name,
          email,
          phone,
          movil,
          pais,
          status,
          revisada,
          nif,
          address,
          poblacion,
          ciudad,
          codigo_postal,
          contact_person,
          pagina_web,
          conocimiento,
          observaciones,
          metodo_pago,
          referencia_pago,
          pago_confirmado,
          fecha_pago,
          totalinscripciones
        `,
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Obtener conteo de muestras por empresa
      const { data: muestrasCount, error: muestrasError } = await supabase
        .from("muestras")
        .select("empresa_id");

      if (muestrasError) throw muestrasError;

      // Contar muestras por empresa
      const countByEmpresa: Record<string, number> = {};
      muestrasCount?.forEach((m: any) => {
        const empresaId = m.empresa_id;
        countByEmpresa[empresaId] = (countByEmpresa[empresaId] || 0) + 1;
      });

      // Añadir conteo a cada inscripción
      const inscripcionesConMuestras = (data || []).map((insc: any) => ({
        ...insc,
        muestras_count: countByEmpresa[insc.id] || 0,
      }));

      setInscripciones(inscripcionesConMuestras);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMuestrasForInscripcion = async (
    empresaId: string,
  ): Promise<Muestra[]> => {
    const { data, error } = await supabase
      .from("muestras")
      .select("id, nombre, categoria, anio, igp, grado, pais")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  };

  useEffect(() => {
    fetchInscripciones();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleToggleRevisada = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ revisada: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setInscripciones((prev) =>
        prev.map((insc) =>
          insc.id === id ? { ...insc, revisada: !currentValue } : insc,
        ),
      );
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setInscripciones((prev) =>
        prev.map((insc) =>
          insc.id === id ? { ...insc, status: newStatus } : insc,
        ),
      );
      setEditingStatusId(null);
      toast.success("Estado actualizado");
    } catch (err: any) {
      toast.error("Error al actualizar estado: " + err.message);
    }
  };

  const openModal = async (inscripcion: Inscripcion, mode: "view" | "edit") => {
    setLoadingMuestras(true);
    setModalMode(mode);

    try {
      const muestras = await fetchMuestrasForInscripcion(inscripcion.id);
      setSelectedInscripcion({ ...inscripcion, muestras });
      if (mode === "edit") {
        setEditForm({ ...inscripcion });
      }
    } catch (err: any) {
      alert("Error al cargar muestras: " + err.message);
    } finally {
      setLoadingMuestras(false);
    }
  };

  const closeModal = () => {
    setSelectedInscripcion(null);
    setModalMode(null);
    setEditForm({});
  };

  const handleResendEmail = async (inscripcion: Inscripcion) => {
    try {
      // Mostrar loading toast
      const loadingToast = toast.loading("Reenviando email...");

      // Obtener las muestras de la inscripción
      const muestras = await fetchMuestrasForInscripcion(inscripcion.id);

      // Calcular precio correctamente: 150€ por muestra, con promoción 5x4
      const numMuestras = muestras.length;
      const gratis = Math.floor(numMuestras / 5);
      const pagadas = numMuestras - gratis;
      const total = pagadas * 150;

      // Preparar los datos para el email en el formato esperado por la API
      const emailPayload = {
        empresa: {
          nombre_empresa: inscripcion.name,
          nif: inscripcion.nif || "",
          email: inscripcion.email,
          telefono: inscripcion.phone || "",
          movil: inscripcion.movil || "",
          direccion: inscripcion.address || "",
          poblacion: inscripcion.poblacion || "",
          codigo_postal: inscripcion.codigo_postal || "",
          ciudad: inscripcion.ciudad || "",
          pais: inscripcion.pais || "",
          persona_contacto: inscripcion.contact_person || "",
          pagina_web: inscripcion.pagina_web || "",
          medio_conocio: inscripcion.conocimiento || "",
          observaciones: inscripcion.observaciones || "",
          num_muestras: numMuestras,
        },
        muestras: muestras.map((m) => ({
          nombre_muestra: m.nombre,
          categoria: m.categoria,
          origen: m.igp || "",
          pais: m.pais || "",
          anio: m.anio,
          grado: m.grado,
        })),
        precio: {
          pagadas,
          gratis,
          total,
        },
        metodoPago: inscripcion.metodo_pago || "transferencia",
        pedido: inscripcion.pedido,
      };

      // Enviar email
      const response = await fetch("/api/send-inscription-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar email");
      }

      toast.dismiss(loadingToast);
      toast.success(`Email reenviado correctamente a ${inscripcion.email}`);
    } catch (err: any) {
      toast.error("Error al reenviar email: " + err.message);
      console.error("Error reenviando email:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedInscripcion) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          movil: editForm.movil,
          pais: editForm.pais,
          address: editForm.address,
          poblacion: editForm.poblacion,
          ciudad: editForm.ciudad,
          codigo_postal: editForm.codigo_postal,
          nif: editForm.nif,
          contact_person: editForm.contact_person,
          pagina_web: editForm.pagina_web,
          status: editForm.status,
          observaciones: editForm.observaciones,
          revisada: editForm.revisada,
        })
        .eq("id", selectedInscripcion.id);

      if (error) throw error;

      setInscripciones((prev) =>
        prev.map((insc) =>
          insc.id === selectedInscripcion.id ? { ...insc, ...editForm } : insc,
        ),
      );

      closeModal();
      alert("Inscripción actualizada correctamente");
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtrado y ordenación
  const filteredInscripciones = inscripciones
    .filter((insc) => {
      if (filterRevisada === "revisada" && !insc.revisada) return false;
      if (filterRevisada === "pendiente" && insc.revisada) return false;
      if (filterStatus !== "all" && insc.status !== filterStatus) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          insc.name?.toLowerCase().includes(search) ||
          insc.email?.toLowerCase().includes(search) ||
          String(insc.pedido || "").includes(search) ||
          insc.pais?.toLowerCase().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredInscripciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInscripciones = filteredInscripciones.slice(
    startIndex,
    endIndex,
  );

  const exportToExcel = () => {
    const dataToExport = filteredInscripciones.map((insc) => ({
      Fecha: new Date(insc.created_at).toLocaleDateString("es-ES"),
      "Nº Pedido": insc.pedido || "",
      Estado: insc.status,
      Empresa: insc.name,
      Email: insc.email,
      Teléfono: insc.phone || "",
      Móvil: insc.movil || "",
      País: insc.pais,
      "Método Pago": insc.metodo_pago || "",
      Revisada: insc.revisada ? "Sí" : "No",
      Muestras: insc.muestras_count || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscripciones");
    XLSX.writeFile(
      wb,
      `inscripciones_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const toggleSelectInscripcion = (id: string) => {
    setSelectedInscripciones((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllInscripciones = () => {
    if (selectedInscripciones.length === filteredInscripciones.length)
      setSelectedInscripciones([]);
    else setSelectedInscripciones(filteredInscripciones.map((i) => i.id));
  };

  const handleDeleteSelectedInscripciones = async () => {
    if (selectedInscripciones.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${selectedInscripciones.length} inscripción(es) seleccionada(s)? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .in("id", selectedInscripciones);
      if (error) throw error;
      setSelectedInscripciones([]);
      await fetchInscripciones();
    } catch (err: any) {
      console.error("Error eliminando inscripciones seleccionadas", err);
      toast.error("Error eliminando inscripciones seleccionadas");
    }
  };

  const statusOptions = [
    {
      value: "pending",
      label: "Pendiente",
      color: "bg-yellow-500",
      dotColor: "#eab308",
    },
    {
      value: "pagado",
      label: "Pagado",
      color: "bg-green-500",
      dotColor: "#22c55e",
    },
    {
      value: "approved",
      label: "Aprobado",
      color: "bg-blue-500",
      dotColor: "#3b82f6",
    },
    {
      value: "rejected",
      label: "Rechazado",
      color: "bg-red-500",
      dotColor: "#ef4444",
    },
    {
      value: "contacted",
      label: "Contactado",
      color: "bg-purple-500",
      dotColor: "#a855f7",
    },
    {
      value: "working",
      label: "En proceso",
      color: "bg-orange-500",
      dotColor: "#f97316",
    },
    {
      value: "qualified",
      label: "Calificado",
      color: "bg-teal-500",
      dotColor: "#14b8a6",
    },
    {
      value: "customer",
      label: "Cliente",
      color: "bg-cyan-500",
      dotColor: "#06b6d4",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; dotColor: string; label: string }
    > = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        dotColor: "#eab308",
        label: "Pendiente",
      },
      pagado: {
        color: "bg-green-100 text-green-800",
        dotColor: "#22c55e",
        label: "Pagado",
      },
      approved: {
        color: "bg-blue-100 text-blue-800",
        dotColor: "#3b82f6",
        label: "Aprobado",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        dotColor: "#ef4444",
        label: "Rechazado",
      },
      contacted: {
        color: "bg-purple-100 text-purple-800",
        dotColor: "#a855f7",
        label: "Contactado",
      },
      working: {
        color: "bg-orange-100 text-orange-800",
        dotColor: "#f97316",
        label: "En proceso",
      },
      qualified: {
        color: "bg-teal-100 text-teal-800",
        dotColor: "#14b8a6",
        label: "Calificado",
      },
      customer: {
        color: "bg-cyan-100 text-cyan-800",
        dotColor: "#06b6d4",
        label: "Cliente",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      dotColor: "#6b7280",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${config.color}`}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.dotColor }}
        />
        {config.label}
      </span>
    );
  };

  const renderSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    return (
      <div className="flex flex-col ml-1">
        <ChevronUp
          className={`w-3 h-3 -mb-1 ${
            isActive && sortDirection === "asc"
              ? "text-gray-800"
              : "text-gray-400"
          }`}
        />
        <ChevronDown
          className={`w-3 h-3 ${
            isActive && sortDirection === "desc"
              ? "text-gray-800"
              : "text-gray-400"
          }`}
        />
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const stats = {
    total: inscripciones.length,
    revisadas: inscripciones.filter((i) => i.revisada).length,
    pendientes: inscripciones.filter((i) => !i.revisada).length,
    pagadas: inscripciones.filter((i) => i.status === "pagado").length,
    totalMuestras: inscripciones.reduce(
      (acc, i) => acc + (i.muestras_count || 0),
      0,
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 sm:p-4 w-full overflow-x-hidden">
      {/* Estadísticas compactas en una fila */}
      <div className="bg-white rounded-lg shadow p-3 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <button
            onClick={() => {
              setFilterRevisada("all");
              setFilterStatus("all");
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-gray-800">{stats.total}</span>
          </button>
          <button
            onClick={() => {
              setFilterRevisada("pendiente");
              setFilterStatus("all");
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            <span className="text-red-600">Pend.:</span>
            <span className="font-bold text-red-700">{stats.pendientes}</span>
          </button>
          <button
            onClick={() => {
              setFilterRevisada("revisada");
              setFilterStatus("all");
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors whitespace-nowrap"
          >
            <span className="text-green-600">Revis.:</span>
            <span className="font-bold text-green-700">{stats.revisadas}</span>
          </button>
          <button
            onClick={() => {
              setFilterStatus("pagado");
              setFilterRevisada("all");
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <span className="text-blue-600">Pagadas:</span>
            <span className="font-bold text-blue-700">{stats.pagadas}</span>
          </button>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-amber-50 whitespace-nowrap">
            <span className="text-amber-600">Muestras:</span>
            <span className="font-bold text-amber-700">
              {stats.totalMuestras}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 w-full">
        <div className="space-y-3">
          {/* Primera fila: Búsqueda, Filtros y Nueva Inscripción */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por nombre, pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            />

            <select
              value={filterRevisada}
              onChange={(e) => setFilterRevisada(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todas</option>
              <option value="pendiente">Pendientes revisión</option>
              <option value="revisada">Revisadas</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="contacted">Contactado</option>
              <option value="working">En proceso</option>
              <option value="qualified">Calificado</option>
              <option value="customer">Cliente</option>
            </select>

            {onNewInscripcion && (
              <button
                onClick={onNewInscripcion}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Nueva Inscripción
              </button>
            )}
          </div>

          {/* Acciones en fila con wrap */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchInscripciones}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              title="Imprimir"
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
              title="PDF"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleDeleteSelectedInscripciones}
              disabled={selectedInscripciones.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xs sm:text-sm ml-auto"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              Eliminar ({selectedInscripciones.length})
            </button>
          </div>
        </div>
      </div>

      {/* Cards móviles/tablet */}
      <div className="lg:hidden p-3">
        {loading ? (
          <div className="p-6 text-center text-gray-600">
            Cargando inscripciones...
          </div>
        ) : filteredInscripciones.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay inscripciones
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredInscripciones.map((insc) => (
              <div
                key={insc.id}
                className="rounded-lg shadow-sm p-4 bg-white border border-gray-100"
                role="article"
                aria-label={`Inscripción ${insc.name || "sin nombre"}`}
              >
                {/* Cabecera con checkbox y pedido */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <label className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedInscripciones.includes(insc.id)}
                      onChange={() => toggleSelectInscripcion(insc.id)}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {insc.name || "Sin nombre"}
                    </span>
                  </label>
                  <div className="text-sm font-bold text-red-600 flex-shrink-0">
                    #{insc.pedido || "—"}
                  </div>
                </div>

                {/* Detalles */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Fecha</span>
                    <span className="text-gray-800">
                      {new Date(insc.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Estado</span>
                    {editingStatusId === insc.id ? (
                      <select
                        value={insc.status}
                        onChange={(e) =>
                          handleStatusChange(insc.id, e.target.value)
                        }
                        onBlur={() => setEditingStatusId(null)}
                        autoFocus
                        className="text-xs rounded-full px-2 py-1 border border-gray-300 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="approved">Aprobado</option>
                        <option value="rejected">Rechazado</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(insc.id)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {getStatusBadge(insc.status)}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-800 truncate max-w-[150px]">
                      {insc.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Teléfono</span>
                    <span className="text-gray-800">
                      {insc.phone || insc.movil || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">País</span>
                    <span className="text-gray-800">{insc.pais || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Muestras</span>
                    <span className="text-gray-800 font-medium">
                      {insc.muestras_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Precio</span>
                    <span className="text-gray-800 font-medium">
                      {(() => {
                        const numMuestras = insc.muestras_count || 0;
                        const gratis = Math.floor(numMuestras / 5);
                        const pagadas = numMuestras - gratis;
                        const total = pagadas * 150;
                        return `${total}€`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Pago</span>
                    <span className="text-gray-800">
                      {insc.metodo_pago
                        ? insc.metodo_pago === "paypal"
                          ? "PayPal"
                          : "Transferencia"
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openModal(insc, "view")}
                    className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    title="Ver detalle"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleResendEmail(insc)}
                    className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                    title="Reenviar email"
                  >
                    <Mail className="w-3 h-3" />
                    Reenviar
                  </button>
                  <button
                    onClick={() => openModal(insc, "edit")}
                    className="px-3 py-1.5 text-xs rounded bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1"
                    title="Editar"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla (solo desktop) */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-gray-600">Cargando inscripciones...</p>
          </div>
        ) : filteredInscripciones.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay inscripciones que coincidan</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white border-b-2 border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedInscripciones.length ===
                        filteredInscripciones.length &&
                      filteredInscripciones.length > 0
                    }
                    onChange={toggleSelectAllInscripciones}
                    className="w-4 h-4"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Fecha {renderSortIcon("created_at")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("pedido")}
                >
                  <div className="flex items-center gap-1">
                    Pedido {renderSortIcon("pedido")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                  Muestras
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50 min-w-[200px]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Nombre {renderSortIcon("name")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Pago
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Estado {renderSortIcon("status")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  País
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInscripciones.map((insc) => (
                <tr key={insc.id} className="hover:bg-gray-50 bg-white">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedInscripciones.includes(insc.id)}
                      onChange={() => toggleSelectInscripcion(insc.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-black whitespace-nowrap">
                    {new Date(insc.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-base font-bold text-red-600 whitespace-nowrap">
                    {insc.pedido || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                      {insc.muestras_count || 0}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-bold text-black min-w-[200px]"
                    title={insc.name}
                  >
                    {insc.name}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {insc.phone || insc.movil ? (
                      <a
                        href={`tel:${insc.phone || insc.movil}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title={`Llamar a ${insc.phone || insc.movil}`}
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{insc.phone || insc.movil}</span>
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const numMuestras = insc.muestras_count || 0;
                      const gratis = Math.floor(numMuestras / 5);
                      const pagadas = numMuestras - gratis;
                      const total = pagadas * 150;
                      return (
                        <span className="text-sm font-semibold text-gray-900">
                          {total}€
                          {gratis > 0 && (
                            <span className="block text-xs text-green-600">
                              ({pagadas} + {gratis} gratis)
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {insc.metodo_pago ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          insc.metodo_pago === "paypal"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {insc.metodo_pago === "paypal"
                          ? "PayPal"
                          : "Transferencia"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap relative">
                    {editingStatusId === insc.id ? (
                      <div className="relative">
                        <div className="absolute top-0 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]">
                          <div className="p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Buscar estado..."
                              value={statusSearchTerm}
                              onChange={(e) =>
                                setStatusSearchTerm(e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {statusOptions
                              .filter((opt) =>
                                opt.label
                                  .toLowerCase()
                                  .includes(statusSearchTerm.toLowerCase()),
                              )
                              .map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    handleStatusChange(insc.id, opt.value);
                                    setStatusSearchTerm("");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: opt.dotColor }}
                                  />
                                  <span>{opt.label}</span>
                                </button>
                              ))}
                          </div>
                          <button
                            onClick={() => {
                              setEditingStatusId(null);
                              setStatusSearchTerm("");
                            }}
                            className="absolute top-1 right-1 p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(insc.id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {getStatusBadge(insc.status)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {insc.pais}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(insc, "view")}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResendEmail(insc)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reenviar email con datos de inscripción"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(insc, "edit")}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {filteredInscripciones.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
              <span className="font-medium">
                {Math.min(endIndex, filteredInscripciones.length)}
              </span>{" "}
              de{" "}
              <span className="font-medium">
                {filteredInscripciones.length}
              </span>{" "}
              resultados
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-lg ${
                            currentPage === page
                              ? "bg-amber-600 text-white border-amber-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-1 text-sm">
                          ...
                        </span>
                      );
                    }
                    return null;
                  },
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && selectedInscripcion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modalMode === "view"
                  ? "Detalle de Inscripción"
                  : "Editar Inscripción"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-amber-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingMuestras ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">
                        Datos de la Empresa
                      </h4>

                      {modalMode === "edit" ? (
                        <>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Nombre/Razón Social
                            </label>
                            <input
                              type="text"
                              value={editForm.name || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              NIF/CIF
                            </label>
                            <input
                              type="text"
                              value={editForm.nif || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  nif: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Dirección
                            </label>
                            <input
                              type="text"
                              value={editForm.address || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  address: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Población
                              </label>
                              <input
                                type="text"
                                value={editForm.poblacion || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    poblacion: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Ciudad
                              </label>
                              <input
                                type="text"
                                value={editForm.ciudad || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    ciudad: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                C.P.
                              </label>
                              <input
                                type="text"
                                value={editForm.codigo_postal || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    codigo_postal: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                País
                              </label>
                              <input
                                type="text"
                                value={editForm.pais || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    pais: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Nombre:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.name}
                            </span>
                          </div>
                          {selectedInscripcion.nif && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                NIF:
                              </span>{" "}
                              <span className="font-medium">
                                {selectedInscripcion.nif}
                              </span>
                            </div>
                          )}
                          {selectedInscripcion.address && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                Dirección:
                              </span>{" "}
                              <span className="font-medium">
                                {selectedInscripcion.address}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 text-sm">
                              Localidad:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.poblacion ||
                                selectedInscripcion.ciudad ||
                                "-"}{" "}
                              {selectedInscripcion.codigo_postal}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">País:</span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.pais}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">
                        Contacto y Estado
                      </h4>

                      {modalMode === "edit" ? (
                        <>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editForm.email || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Teléfono
                              </label>
                              <input
                                type="text"
                                value={editForm.phone || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    phone: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Móvil
                              </label>
                              <input
                                type="text"
                                value={editForm.movil || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    movil: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Persona de Contacto
                            </label>
                            <input
                              type="text"
                              value={editForm.contact_person || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  contact_person: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Web
                            </label>
                            <input
                              type="text"
                              value={editForm.pagina_web || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  pagina_web: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Estado
                            </label>
                            <select
                              value={editForm.status || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="pagado">Pagado</option>
                              <option value="approved">Aprobado</option>
                              <option value="rejected">Rechazado</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="editRevisada"
                              checked={editForm.revisada || false}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  revisada: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <label
                              htmlFor="editRevisada"
                              className="text-sm text-gray-600"
                            >
                              Marcada como revisada
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Observaciones
                            </label>
                            <textarea
                              value={editForm.observaciones || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  observaciones: e.target.value,
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Email:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Teléfono:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.phone || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Móvil:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.movil || "-"}
                            </span>
                          </div>
                          {selectedInscripcion.contact_person && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                Contacto:
                              </span>{" "}
                              <span className="font-medium">
                                {selectedInscripcion.contact_person}
                              </span>
                            </div>
                          )}
                          {selectedInscripcion.pagina_web && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                Web:
                              </span>{" "}
                              <a
                                href={selectedInscripcion.pagina_web}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {selectedInscripcion.pagina_web}
                              </a>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 text-sm">
                              Nº Pedido:
                            </span>{" "}
                            <span className="font-medium text-amber-700">
                              {selectedInscripcion.pedido || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Estado:
                            </span>{" "}
                            {getStatusBadge(selectedInscripcion.status)}
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">
                              Método Pago:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedInscripcion.metodo_pago || "-"}
                            </span>
                          </div>
                          {selectedInscripcion.referencia_pago && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                Ref. Pago:
                              </span>{" "}
                              <span className="font-medium text-xs">
                                {selectedInscripcion.referencia_pago}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 text-sm">
                              Revisada:
                            </span>{" "}
                            <span
                              className={`font-medium ${selectedInscripcion.revisada ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedInscripcion.revisada ? "Sí" : "No"}
                            </span>
                          </div>
                          {selectedInscripcion.observaciones && (
                            <div>
                              <span className="text-gray-500 text-sm">
                                Observaciones:
                              </span>{" "}
                              <span className="font-medium">
                                {selectedInscripcion.observaciones}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Muestras */}
                  <div>
                    <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">
                      Muestras ({selectedInscripcion.muestras?.length || 0})
                    </h4>

                    {selectedInscripcion.muestras &&
                    selectedInscripcion.muestras.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Nombre
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Categoría
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Año
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                D.O./IGP
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Grado
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedInscripcion.muestras.map(
                              (muestra, idx) => (
                                <tr
                                  key={muestra.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 text-gray-500">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    {muestra.nombre}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {muestra.categoria}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {muestra.anio || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {muestra.igp || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {muestra.grado ? `${muestra.grado}%` : "-"}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No hay muestras registradas
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {modalMode === "edit" && (
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {savingEdit ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InscripcionesManager;
