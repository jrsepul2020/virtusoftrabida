import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Eye,
  Edit,
  X,
  CheckCircle,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  RefreshCw,
  Printer,
  ChevronDown,
  Building2,
  Trash2,
  ChevronUp,
  Hash,
  User,
  Calendar,
  Database,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import DetailModal, { DetailGroup, DetailItem } from "./DetailModal";

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

type SortField = "created_at" | "pedido" | "name" | "status";
type SortDirection = "asc" | "desc";

interface InscripcionesManagerProps {
  onNewInscripcion: () => void;
  onViewProfile?: (id: string) => void;
}

export default function InscripcionesManager({
  onNewInscripcion,
  onViewProfile,
}: InscripcionesManagerProps) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedInscripcion, setSelectedInscripcion] =
    useState<Inscripcion | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Inscripcion>>({});
  const [selectedInscripciones, setSelectedInscripciones] = useState<string[]>(
    [],
  );
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingStatusId(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".status-popover-container")) {
        setEditingStatusId(null);
      }
    };

    if (editingStatusId) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingStatusId]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchInscripciones = async () => {
    setLoading(true);
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
      toast.error(err.message);
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
    // Cargar filtros guardados
    const savedFilters = localStorage.getItem("inscripciones_filters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.filterStatus) setFilterStatus(parsed.filterStatus);
        if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
      } catch (e) {
        console.error("Error loading filters", e);
      }
    }
    fetchInscripciones();
  }, []);

  useEffect(() => {
    // Guardar filtros
    localStorage.setItem(
      "inscripciones_filters",
      JSON.stringify({ filterStatus, searchTerm }),
    );
  }, [filterStatus, searchTerm]);

  const resetFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setCurrentPage(1);
    toast.success("Filtros limpiados");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setEditingStatusId(null);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedInscripciones.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ status: newStatus })
        .in("id", selectedInscripciones);

      if (error) throw error;

      setInscripciones((prev) =>
        prev.map((insc) =>
          selectedInscripciones.includes(insc.id)
            ? { ...insc, status: newStatus }
            : insc,
        ),
      );
      setSelectedInscripciones([]);
      toast.success(`${selectedInscripciones.length} registros actualizados`);
    } catch {
      toast.error("Error en cambio masivo");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInscripciones.length === 0) return;
    if (
      !window.confirm(
        `¿Estás seguro de eliminar ${selectedInscripciones.length} inscripciones?`,
      )
    )
      return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .in("id", selectedInscripciones);

      if (error) throw error;

      setInscripciones((prev) =>
        prev.filter((insc) => !selectedInscripciones.includes(insc.id)),
      );
      setSelectedInscripciones([]);
      toast.success(`${selectedInscripciones.length} registros eliminados`);
    } catch {
      toast.error("Error al eliminar registros");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (inscripcion: Inscripcion, mode: "view" | "edit") => {
    setModalMode(mode);

    try {
      const muestras = await fetchMuestrasForInscripcion(inscripcion.id);
      setSelectedInscripcion({ ...inscripcion, muestras });
      if (mode === "edit") {
        setEditForm({ ...inscripcion });
      }
    } catch (err: any) {
      alert("Error al cargar muestras: " + err.message);
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
        color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        dotColor: "#ef4444",
        label: "Pendiente",
      },
      pagado: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        dotColor: "#22c55e",
        label: "Pagado",
      },
      approved: {
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        dotColor: "#3b82f6",
        label: "Aprobado",
      },
      rejected: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        dotColor: "#ef4444",
        label: "Rechazado",
      },
      contacted: {
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        dotColor: "#a855f7",
        label: "Contactado",
      },
      working: {
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        dotColor: "#f97316",
        label: "En proceso",
      },
      qualified: {
        color:
          "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
        dotColor: "#14b8a6",
        label: "Calificado",
      },
      customer: {
        color:
          "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
        dotColor: "#06b6d4",
        label: "Cliente",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      dotColor: "#6b7280",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${config.color}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
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

  const handlePrintPDF = () => {
    const doc = new jsPDF();

    // Brand Colors (Simplified for B&W print)
    const darkGray: [number, number, number] = [31, 41, 55]; // #1f2937
    const slateGray: [number, number, number] = [71, 85, 105]; // #475569

    // Logo & Header
    try {
      // Fixed aspect ratio (Logo is 477x108 -> ~4.4:1)
      doc.addImage("/logo-bandera-1.png", "PNG", 14, 10, 44, 10);
    } catch {
      // Fallback text if logo fails
      doc.setFontSize(14);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("VIRTUS", 14, 18);
    }

    // Header Title
    doc.setFontSize(14); // Reduced from 18
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("INTERNATIONAL VIRTUS LA RABIDA 2026", 105, 22, {
      align: "center",
    });

    doc.setFontSize(9); // Reduced from 10
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text(
      `Listado de Inscripciones - Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`,
      105,
      28,
      { align: "center" },
    );

    // Summary Report
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(
      `Nº de Empresas: ${stats.total} | Nº de Muestras: ${stats.totalMuestras}`,
      14,
      38,
    );

    const tableData: any[][] = [];

    // Prepare data - Single row per record for simplicity
    filteredInscripciones.forEach((insc) => {
      tableData.push([
        new Date(insc.created_at).toLocaleDateString("es-ES"),
        insc.pedido?.toString() || "-",
        insc.name || "S/N",
        (insc.muestras_count || 0).toString(),
      ]);
    });

    autoTable(doc, {
      startY: 42,
      head: [["FECHA", "PEDIDO", "EMPRESA", "MUESTRAS"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [255, 255, 255], // No color in header background
        textColor: [0, 0, 0], // Black text
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      styles: {
        cellPadding: 1.5, // Reduced padding for compact layout
        fontSize: 8.5,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 30, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          data.cell.styles.lineColor = [226, 232, 240];
          data.cell.styles.lineWidth = 0.1;
        }
      },
      margin: { top: 35 },
      didDrawPage: () => {
        // Footer
        const pageCount = doc.internal.pages.length - 1;
        const str = `Página ${pageCount}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          str,
          doc.internal.pageSize.width - 25,
          doc.internal.pageSize.height - 10,
        );
        doc.text(
          "International Virtus La Rabida - Gestión de Inscripciones",
          14,
          doc.internal.pageSize.height - 10,
        );
      },
    });

    doc.save(
      `listado_virtus_2026_${new Date().toISOString().split("T")[0]}.pdf`,
    );
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

  return (
    <div className="min-h-full bg-[#E6EBEE] dark:bg-slate-950 transition-colors">
      <main className="flex-1 p-4 lg:p-8 transition-all overflow-x-hidden">
        {/* Top Header & Stats Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Inscripciones
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-primary-500" />
                Gestión centralizada 2026
              </p>
            </div>

            {/* Resumen al lado del título */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                  Pagadas
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
                  {stats.pagadas}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Muestras
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
                  {stats.totalMuestras}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => window.print()}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="Imprimir"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrintPDF}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all font-black text-xs uppercase tracking-wider"
              >
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all font-black text-xs uppercase tracking-wider"
              >
                XLS
              </button>
            </div>
            <button
              onClick={onNewInscripcion}
              className="group flex items-center gap-2 px-5 py-2.5 bg-red-800 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-900/10 active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Inscripción
            </button>
          </div>
        </div>

        {/* New Horizontal Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4">
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-red-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por empresa, email, pedido o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-400 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Status Select Simplified */}
            <div className="relative md:w-64">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 appearance-none text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                <option value="all">Todos los estados</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-4 xl:pt-0 xl:pl-4">
            {/* Stats within the bar */}
            <div className="flex gap-4 px-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Empresas
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {stats.total}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 hidden md:block" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Muestras
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {stats.totalMuestras}
                </span>
              </div>
            </div>

            <div className="flex gap-2 ml-auto lg:ml-0">
              <button
                onClick={resetFilters}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                title="Resetear filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={fetchInscripciones}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all active:scale-95"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "..." : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions (Mobile/Floating) */}
        {selectedInscripciones.length > 0 && (
          <div className="sticky top-6 z-50 mx-auto max-w-2xl p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-6 shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <div className="bg-primary-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-inner text-lg">
                {selectedInscripciones.length}
              </div>
              <p className="font-bold whitespace-nowrap">Registros</p>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("pagado")}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-green-600 transition-all rounded-xl text-xs font-bold"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Pagados
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-600 transition-all rounded-xl text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button
                onClick={() => setSelectedInscripciones([])}
                className="p-2 text-white/40 hover:text-white transition-colors ml-auto"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Print-only Summary Report */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black text-black">
                INTERNATIONAL VIRTUS LA RABIDA 2026
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Listado de Inscripciones •{" "}
                {new Date().toLocaleDateString("es-ES")}
              </p>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nº Empresas
                </p>
                <p className="text-xl font-black text-black">{stats.total}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nº Muestras
                </p>
                <p className="text-xl font-black text-black">
                  {stats.totalMuestras}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Móvil / Cards */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
          {paginatedInscripciones.map((insc) => (
            <div
              key={insc.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                <input
                  type="checkbox"
                  checked={selectedInscripciones.includes(insc.id)}
                  onChange={() => toggleSelectInscripcion(insc.id)}
                  className="w-5 h-5 rounded-md text-primary-600 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-[10px] font-bold text-red-400 uppercase leading-none mb-1">
                    Pedido
                  </p>
                  <p className="text-lg font-extrabold text-red-600">
                    #{insc.pedido || "S/N"}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-slate-900 dark:text-white truncate"
                    title={insc.name}
                  >
                    {insc.name || "Sin Nombre"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(insc.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Muestras
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {insc.muestras_count || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    País
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                    {insc.pais || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Estado
                  </p>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(insc.status)}
                    {insc.metodo_pago && (
                      <span className="text-[9px] font-medium text-slate-400 italic">
                        {insc.metodo_pago}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Revisión
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insc.revisada ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {insc.revisada ? "Revisada" : "Pendiente"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button
                  onClick={() => openModal(insc, "view")}
                  className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Detalles
                </button>
                <button
                  onClick={() => handleResendEmail(insc)}
                  className="p-2 text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openModal(insc, "edit")}
                  className="p-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {paginatedInscripciones.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                No se encontraron inscripciones
              </p>
            </div>
          )}
        </div>

        {/* Tabla Desktop */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
          {loading && !inscripciones.length ? (
            <div className="p-32 text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary-500 mb-6 opacity-20" />
              <p className="text-slate-400 font-medium">
                Cargando registros...
              </p>
            </div>
          ) : filteredInscripciones.length === 0 ? (
            <div className="p-32 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sin resultados
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                No hay inscripciones que coincidan con los filtros
                seleccionados.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 text-primary-600 font-bold hover:underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#00273A] border-b border-white/10 text-white/90">
                  <tr>
                    <th className="p-2 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedInscripciones.length ===
                            filteredInscripciones.length &&
                          filteredInscripciones.length > 0
                        }
                        onChange={toggleSelectAllInscripciones}
                        className="w-4 h-4 rounded border-white/30 text-red-600 focus:ring-red-500 bg-transparent"
                      />
                    </th>
                    <th
                      className="p-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer group w-[80px]"
                      onClick={() => handleSort("pedido")}
                    >
                      <div className="flex items-center gap-1.5 group-hover:text-white justify-center">
                        <Hash className="w-3.5 h-3.5" />
                        Ped. {renderSortIcon("pedido")}
                      </div>
                    </th>
                    <th
                      className="p-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer group w-[110px]"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1.5 group-hover:text-white">
                        <Calendar className="w-3.5 h-3.5" />
                        Fecha {renderSortIcon("created_at")}
                      </div>
                    </th>
                    <th
                      className="p-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer group w-auto"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1.5 group-hover:text-white">
                        <User className="w-3.5 h-3.5" />
                        Empresa {renderSortIcon("name")}
                      </div>
                    </th>
                    <th className="p-2 text-[10px] font-bold uppercase tracking-widest w-[130px]">
                      Conoció
                    </th>
                    <th className="p-2 text-[10px] font-bold uppercase tracking-widest text-center w-[85px]">
                      Mué.
                    </th>
                    <th
                      className="p-2 text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer group w-[160px]"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1.5 group-hover:text-white justify-center">
                        Estado {renderSortIcon("status")}
                      </div>
                    </th>
                    <th className="p-2 text-[10px] font-bold uppercase tracking-widest text-right w-[120px]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-800 transition-colors">
                  {paginatedInscripciones.map((insc) => (
                    <tr
                      key={insc.id}
                      onClick={() =>
                        onViewProfile
                          ? onViewProfile(insc.id)
                          : openModal(insc, "view")
                      }
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                    >
                      <td
                        className="p-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInscripciones.includes(insc.id)}
                          onChange={() => toggleSelectInscripcion(insc.id)}
                          className="w-5 h-5 rounded-md text-primary-600 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-extrabold text-sm border border-red-100 dark:border-red-900/30">
                          #{insc.pedido || "-"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {new Date(insc.created_at).toLocaleDateString(
                              "es-ES",
                            )}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">
                            {new Date(insc.created_at).toLocaleTimeString(
                              "es-ES",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px]"
                          title={insc.name}
                        >
                          {insc.name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[250px]">
                          {insc.email}
                        </p>
                      </td>
                      <td className="p-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {insc.conocimiento || (
                            <span className="text-slate-300">—</span>
                          )}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          {insc.muestras_count || 0}
                        </span>
                      </td>
                      <td
                        className="p-2 text-center relative status-popover-container"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (insc.status !== "pagado") {
                                  handleStatusChange(insc.id, "pagado");
                                }
                              }}
                              className={`p-1 rounded-full transition-colors ${insc.status === "pagado" ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
                              title={
                                insc.status === "pagado"
                                  ? "Pagado"
                                  : "Marcar como pagado"
                              }
                            >
                              {insc.status === "pagado" ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </button>
                            <div
                              onClick={() => setEditingStatusId(insc.id)}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {getStatusBadge(insc.status)}
                            </div>
                          </div>
                          {insc.metodo_pago && (
                            <span className="text-[9px] font-medium text-slate-400 italic">
                              {insc.metodo_pago}
                            </span>
                          )}
                        </div>
                        {editingStatusId === insc.id && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-1 w-48 animate-in zoom-in-95 duration-200">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  handleStatusChange(insc.id, opt.value)
                                }
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: opt.dotColor }}
                                />
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td
                        className="p-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(insc, "view")}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResendEmail(insc)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                            title="Reenviar email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(insc, "edit")}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
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
            </div>
          )}

          {/* Improved Pagination */}
          {filteredInscripciones.length > 0 && (
            <div className="p-2 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mostrando{" "}
                <span className="text-slate-900 dark:text-white">
                  {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredInscripciones.length)}
                </span>{" "}
                de{" "}
                <span className="text-slate-900 dark:text-white">
                  {filteredInscripciones.length}
                </span>{" "}
                registros
              </p>
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
          )}
        </div>
      </main>

      {selectedInscripcion && (
        <DetailModal
          isOpen={true}
          onClose={closeModal}
          title={
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                Pedido #{selectedInscripcion.pedido || "S/N"}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${selectedInscripcion.revisada ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                >
                  {selectedInscripcion.revisada ? "Revisada" : "Pendiente"}
                </div>
                {getStatusBadge(selectedInscripcion.status)}
              </div>
            </div>
          }
          isEditing={modalMode === "edit"}
          isSaving={savingEdit}
          onEdit={() => setModalMode("edit")}
          onSave={handleSaveEdit}
          canEdit={true}
        >
          {modalMode === "view" ? (
            <>
              {/* Header Hero */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-500 dark:text-slate-400">
                  {selectedInscripcion.name}
                </h2>
              </div>

              {/* Samples Section - Excel like Table */}
              <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    Listado de Muestras (
                    {selectedInscripcion.muestras?.length || 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-tighter">
                      <tr>
                        <th className="px-4 py-2 whitespace-nowrap">#</th>
                        <th className="px-4 py-2 w-full">
                          Nombre de la Muestra
                        </th>
                        <th className="px-4 py-2 whitespace-nowrap">
                          Categoría
                        </th>
                        <th className="px-4 py-2 whitespace-nowrap">
                          IGP/Origen
                        </th>
                        <th className="px-4 py-2 whitespace-nowrap">Año</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedInscripcion.muestras?.map((muestra, idx) => (
                        <tr
                          key={muestra.id}
                          className="hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900"
                        >
                          <td className="px-4 py-3 font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                            {muestra.nombre}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                            {muestra.categoria}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                            {muestra.igp || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                            {muestra.anio || "-"}
                          </td>
                        </tr>
                      ))}
                      {(!selectedInscripcion.muestras ||
                        selectedInscripcion.muestras.length === 0) && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-slate-400 italic bg-white dark:bg-slate-900"
                          >
                            No hay muestras registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compact Company Details */}
              <DetailGroup hideTitle noBorder>
                <DetailItem label="NIF" value={selectedInscripcion.nif} />
                <DetailItem label="País" value={selectedInscripcion.pais} />
                <DetailItem
                  label="Población"
                  value={selectedInscripcion.poblacion}
                />
                <DetailItem
                  label="Persona Contacto"
                  value={selectedInscripcion.contact_person}
                />

                <DetailItem
                  label="Teléfono"
                  value={
                    selectedInscripcion.phone ? (
                      <a
                        href={`tel:${selectedInscripcion.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedInscripcion.phone}
                      </a>
                    ) : null
                  }
                />
                <DetailItem
                  label="Móvil"
                  value={
                    selectedInscripcion.movil ? (
                      <a
                        href={`tel:${selectedInscripcion.movil}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedInscripcion.movil}
                      </a>
                    ) : null
                  }
                />

                <DetailItem
                  label="Email"
                  fullWidth
                  value={
                    selectedInscripcion.email ? (
                      <a
                        href={`mailto:${selectedInscripcion.email}`}
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selectedInscripcion.email}
                      </a>
                    ) : null
                  }
                />

                <DetailItem
                  label="Web"
                  fullWidth
                  value={
                    selectedInscripcion.pagina_web ? (
                      <a
                        href={
                          selectedInscripcion.pagina_web.startsWith("http")
                            ? selectedInscripcion.pagina_web
                            : `https://${selectedInscripcion.pagina_web}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block"
                      >
                        {selectedInscripcion.pagina_web}
                      </a>
                    ) : null
                  }
                />

                <DetailItem
                  label="Dirección"
                  value={selectedInscripcion.address}
                  fullWidth
                />

                <DetailItem
                  label="Método Pago"
                  value={selectedInscripcion.metodo_pago}
                />
                <DetailItem
                  label="Ref. Pago"
                  value={selectedInscripcion.referencia_pago}
                />
              </DetailGroup>

              {selectedInscripcion.observaciones && (
                <DetailGroup hideTitle noBorder>
                  <DetailItem
                    label="Notas"
                    value={selectedInscripcion.observaciones}
                    fullWidth
                  />
                </DetailGroup>
              )}
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Persona Contacto
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
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Estado
                  </label>
                  <select
                    value={editForm.status || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Número Pedido
                  </label>
                  <input
                    type="number"
                    value={editForm.pedido || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        pedido: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Observaciones
                </label>
                <textarea
                  rows={4}
                  value={editForm.observaciones || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, observaciones: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="revisada"
                  checked={editForm.revisada || false}
                  onChange={(e) =>
                    setEditForm({ ...editForm, revisada: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="revisada"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Inscripción Revisada
                </label>
              </div>
            </div>
          )}
        </DetailModal>
      )}
    </div>
  );
}
