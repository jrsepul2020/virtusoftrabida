import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  User,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Printer,
  FileDown,
  FileSpreadsheet,
  Barcode,
  ShieldCheck,
  Calendar,
  Grid3X3,
} from "lucide-react";
import DetailSidebar, { DetailGroup, DetailItem } from "./DetailSidebar";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

interface Usuario {
  id: string;
  user_id: string | null;
  nombre: string;
  email: string;
  rol: string;
  mesa?: number | null;
  puesto?: number | null;
  codigocatador?: number | null;
  tablet?: string | null;
  pais?: string | null;
  tandaencurso?: number | null;
  codigo?: string | null;
  clave?: string | null;
  activo: boolean;
  created_at?: string;
}

interface Dispositivo {
  id: string;
  device_fingerprint: string;
  nombre_asignado?: string | null;
  tablet_number?: number | null;
  activo: boolean;
  last_seen_at?: string;
}

interface UsuarioConDispositivos extends Usuario {
  dispositivos: Dispositivo[];
  auth_exists: boolean;
  last_login_at?: string | null;
}

interface NuevoUsuario {
  email: string;
  password: string;
  nombre: string;
  rol: string;
  mesa?: number;
  puesto?: number;
  tablet?: string;
  pais?: string;
  codigocatador?: number;
  codigo?: string;
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<UsuarioConDispositivos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [filters, setFilters] = useState({
    nombre: "",
    email: "",
    pais: "",
    mesa: "",
    codigocatador: "",
    codigo: "",
    tandaencurso: "",
    estado: "",
  });
  const [sortField, setSortField] = useState<
    | "nombre"
    | "rol"
    | "pais"
    | "mesa"
    | "codigocatador"
    | "codigo"
    | "tandaencurso"
    | "created_at"
    | "last_login"
    | "activo"
  >("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsuario, setSelectedUsuario] =
    useState<UsuarioConDispositivos | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
    email: "",
    password: "",
    nombre: "",
    rol: "Catador",
    pais: "España",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioConDispositivos | null>(
    null,
  );

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (usuariosError) throw usuariosError;

      const usuariosConDispositivos: UsuarioConDispositivos[] =
        await Promise.all(
          (usuariosData || []).map(async (usuario) => {
            const { data: dispositivosData } = await supabase
              .from("dispositivos")
              .select("*")
              .eq("user_id", usuario.user_id)
              .order("last_seen_at", { ascending: false });

            const auth_exists = false;
            const last_login_at: string | null = null;

            // NOTE: supabase.auth.admin is not available in the client.
            // To get this data, we would need a server-side API or Edge Function.
            // For now, we disable this check to prevent runtime errors.
            /*
            if (usuario.user_id) {
              const { data: authData, error: authError } =
                await supabase.auth.admin.getUserById(usuario.user_id);
              if (!authError) {
                auth_exists = !!authData.user;
                last_login_at = authData.user?.last_sign_in_at || null;
              }
            }
            */

            return {
              ...usuario,
              dispositivos: dispositivosData || [],
              auth_exists,
              last_login_at,
            };
          }),
        );

      setUsuarios(usuariosConDispositivos);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      console.error("Detalle del error:", error.message || error);
      toast.error(`Error al cargar usuarios: ${error.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async () => {
    try {
      if (
        !nuevoUsuario.email ||
        !nuevoUsuario.password ||
        !nuevoUsuario.nombre
      ) {
        toast.error("Completa todos los campos obligatorios");
        return;
      }

      // Obtener token de sesión actual para autenticar el request
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("No hay sesión activa. Por favor, inicia sesión.");
        return;
      }

      // Llamar al endpoint serverless que usa service role key
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
          nombre: nuevoUsuario.nombre,
          rol: nuevoUsuario.rol,
          mesa: nuevoUsuario.mesa,
          puesto: nuevoUsuario.puesto,
          tablet: nuevoUsuario.tablet,
          pais: nuevoUsuario.pais,
          codigocatador: nuevoUsuario.codigocatador,
          codigo: nuevoUsuario.codigo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear usuario");
      }

      toast.success("Usuario creado correctamente");
      setShowCreateModal(false);
      setNuevoUsuario({
        email: "",
        password: "",
        nombre: "",
        rol: "Catador",
        pais: "España",
      });
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      toast.error(error.message || "Error al crear usuario");
    }
  };

  const openModal = (
    usuario: UsuarioConDispositivos,
    mode: "view" | "edit",
  ) => {
    setSelectedUsuario(usuario);
    setModalMode(mode);
  };

  const closeModal = () => {
    setSelectedUsuario(null);
    setModalMode(null);
  };

  const actualizarUsuario = async () => {
    if (!selectedUsuario) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: selectedUsuario.nombre,
          rol: selectedUsuario.rol,
          mesa: selectedUsuario.mesa,
          puesto: selectedUsuario.puesto,
          tablet: selectedUsuario.tablet,
          pais: selectedUsuario.pais,
          codigocatador: selectedUsuario.codigocatador,
          codigo: selectedUsuario.codigo,
          activo: selectedUsuario.activo,
        })
        .eq("id", selectedUsuario.id);

      if (error) throw error;

      toast.success("Usuario actualizado");
      closeModal();
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    if (
      !confirm(
        `¿Eliminar usuario ${usuario.nombre}? Esto eliminará también su acceso y dispositivos.`,
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuario.id);

      if (deleteError) throw deleteError;

      if (usuario.user_id) {
        await supabase.auth.admin.deleteUser(usuario.user_id);
      }

      toast.success("Usuario eliminado");
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const revocarDispositivo = async (dispositivoId: string) => {
    try {
      const { error } = await supabase
        .from("dispositivos")
        .update({ activo: false })
        .eq("id", dispositivoId);

      if (error) throw error;

      toast.success("Dispositivo revocado");
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error revocando dispositivo:", error);
      toast.error("Error al revocar dispositivo");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchNombre = (u.nombre || "")
      .toLowerCase()
      .includes(filters.nombre.toLowerCase());
    const matchEmail = (u.email || "")
      .toLowerCase()
      .includes(filters.email.toLowerCase());
    const matchPais = (u.pais || "")
      .toLowerCase()
      .includes(filters.pais.toLowerCase());
    const matchMesa = filters.mesa
      ? String(u.mesa || "").includes(filters.mesa)
      : true;
    const matchCodigoCatador = filters.codigocatador
      ? String(u.codigocatador || "").includes(filters.codigocatador)
      : true;
    const matchCodigo = (u.codigo || "")
      .toLowerCase()
      .includes(filters.codigo.toLowerCase());
    const matchTanda = filters.tandaencurso
      ? String(u.tandaencurso || "").includes(filters.tandaencurso)
      : true;
    const matchEstado =
      filters.estado === ""
        ? true
        : filters.estado === "activo"
          ? u.activo
          : !u.activo;
    const matchRol = filterRol === "todos" || u.rol === filterRol;
    return (
      matchNombre &&
      matchEmail &&
      matchPais &&
      matchMesa &&
      matchCodigoCatador &&
      matchCodigo &&
      matchTanda &&
      matchEstado &&
      matchRol
    );
  });

  const handleSort = (
    field:
      | "nombre"
      | "rol"
      | "pais"
      | "mesa"
      | "codigocatador"
      | "codigo"
      | "tandaencurso"
      | "created_at"
      | "last_login"
      | "activo",
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const renderSortIcon = (field: typeof sortField) => {
    const isActive = sortField === field;
    return (
      <span className="ml-2 inline-flex flex-col leading-none">
        <ChevronUp
          size={12}
          className={
            isActive && sortDirection === "asc" ? "text-white" : "text-white/40"
          }
        />
        <ChevronDown
          size={12}
          className={
            isActive && sortDirection === "desc"
              ? "text-white"
              : "text-white/40"
          }
        />
      </span>
    );
  };

  const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    const getValue = (u: UsuarioConDispositivos) => {
      switch (sortField) {
        case "rol":
          return u.rol || "";
        case "pais":
          return u.pais || "";
        case "mesa":
          return u.mesa ?? -1;
        case "codigocatador":
          return u.codigocatador ?? -1;
        case "codigo":
          return u.codigo || "";
        case "tandaencurso":
          return u.tandaencurso ?? -1;
        case "created_at":
          return u.created_at ? new Date(u.created_at).getTime() : 0;
        case "last_login":
          return u.last_login_at ? new Date(u.last_login_at).getTime() : 0;
        case "activo":
          return u.activo ? 1 : 0;
        case "nombre":
        default:
          return u.nombre || "";
      }
    };

    const aValue = getValue(a);
    const bValue = getValue(b);
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * direction;
    }
    return String(aValue).localeCompare(String(bValue)) * direction;
  });

  const exportToExcel = () => {
    const rows = usuariosOrdenados.map((u) => ({
      Nombre: u.nombre,
      Email: u.email,
      Rol: u.rol,
      Pais: u.pais || "",
      Mesa: u.mesa ?? "",
      Puesto: u.puesto ?? "",
      Tablet: u.tablet || "",
      CodigoCatador: u.codigocatador ?? "",
      Codigo: u.codigo || "",
      TandaEnCurso: u.tandaencurso ?? "",
      Registro: u.created_at || "",
      UltimoLogin: u.last_login_at || "",
      Estado: u.activo ? "Activo" : "Inactivo",
      UserId: u.user_id || "",
      Id: u.id,
      Dispositivos: u.dispositivos
        .map(
          (d) => d.nombre_asignado || d.tablet_number || d.device_fingerprint,
        )
        .join(" | "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, "usuarios.xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  const exportarPDFBarcodes = () => {
    try {
      const usuariosConCodigo = usuariosFiltrados.filter(
        (u) => u.codigo && u.codigo.trim() !== "",
      );

      if (usuariosConCodigo.length === 0) {
        toast.error("No hay usuarios con código de barras para exportar");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const cols = 2;
      const colWidth = (pageWidth - margin * 2) / cols;
      const itemHeight = 50;
      let x = margin;
      let y = margin;

      usuariosConCodigo.forEach((usuario, index) => {
        // Pagination: 5 rows per page (10 items)
        if (index > 0 && index % (cols * 5) === 0) {
          doc.addPage();
          x = margin;
          y = margin;
        }

        const canvas = document.createElement("canvas");
        JsBarcode(canvas, usuario.codigo || "", {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
        });

        const imgData = canvas.toDataURL("image/png");

        // Dibujar borde suave
        doc.setDrawColor(220);
        doc.rect(x, y, colWidth - 5, itemHeight - 5);

        // Nombre del usuario
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(usuario.nombre.substring(0, 30), x + 5, y + 10);

        // Rol/País
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const detailText = `${usuario.rol}${usuario.pais ? ` - ${usuario.pais}` : ""}`;
        doc.text(detailText, x + 5, y + 15);

        // Imagen del código de barras
        doc.addImage(imgData, "PNG", x + 5, y + 18, colWidth - 15, 25);

        // Actualizar coordenadas
        if ((index + 1) % cols === 0) {
          x = margin;
          y += itemHeight;
        } else {
          x += colWidth;
        }
      });

      doc.save(
        `barcodes_usuarios_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      toast.success("PDF de códigos de barras generado");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const generarAutoBarcode = (
    codigocatador: number | null | undefined,
    nombre: string | null | undefined,
  ) => {
    if (!codigocatador) return "";
    const nameToClean = nombre || "";
    const cleanName = nameToClean
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z]/g, "") // Keep only letters
      .toUpperCase()
      .substring(0, 4);
    return `${codigocatador}${cleanName}`;
  };

  const generarCodigosMasivos = async () => {
    try {
      const usuariosSinCodigo = usuarios.filter(
        (u) => !u.codigo || u.codigo.trim() === "",
      );

      if (usuariosSinCodigo.length === 0) {
        toast.success("No hay usuarios sin código");
        return;
      }

      setLoading(true);
      const updates = usuariosSinCodigo.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        codigocatador: u.codigocatador,
        codigo: generarAutoBarcode(u.codigocatador, u.nombre),
      }));

      for (const update of updates) {
        if (!update.codigo) continue;

        const { error } = await supabase
          .from("usuarios")
          .update({ codigo: update.codigo })
          .eq("id", update.id);

        if (error) {
          console.error(
            `Error actualizando usuario ${update.nombre || update.id}:`,
            error,
          );
          throw error;
        }
      }

      toast.success(`${updates.length} códigos generados con éxito`);
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error al generar códigos masivos:", error);
      toast.error(
        `Error al generar códigos: ${error.message || "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-2 sm:p-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Administra usuarios, roles y dispositivos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Crear Usuario
          </button>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs sm:text-sm whitespace-nowrap"
          >
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition text-xs sm:text-sm whitespace-nowrap"
            title="Imprimir a PDF"
          >
            <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition text-xs sm:text-sm whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportarPDFBarcodes}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition text-xs sm:text-sm whitespace-nowrap"
            title="Exportar Códigos de Barras a PDF"
          >
            <Barcode className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Barcodes</span>
          </button>
          <button
            onClick={generarCodigosMasivos}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition text-xs sm:text-sm whitespace-nowrap"
            title="Generar códigos faltantes para catadores"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Generar Códigos</span>
          </button>
          <button
            onClick={cargarUsuarios}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title="Refrescar"
          >
            <RefreshCw
              className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <input
            type="text"
            placeholder="Buscar nombre"
            value={filters.nombre}
            onChange={(e) => setFilters({ ...filters, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Buscar email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Rol (todos)</option>
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="Administrador">Administrador</option>
            <option value="Presidente">Presidente</option>
            <option value="Catador">Catador</option>
          </select>
          <input
            type="text"
            placeholder="País"
            value={filters.pais}
            onChange={(e) => setFilters({ ...filters, pais: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Mesa"
            value={filters.mesa}
            onChange={(e) => setFilters({ ...filters, mesa: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Estado (todos)</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <input
            type="text"
            placeholder="Código"
            value={filters.codigocatador}
            onChange={(e) =>
              setFilters({ ...filters, codigocatador: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Cards móviles/tablet */}
      <div className="lg:hidden p-3">
        {loading ? (
          <div className="p-6 text-center text-gray-600">
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay usuarios que coincidan
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {usuariosOrdenados.map((usuario) => (
              <div
                key={usuario.id}
                className={`rounded-lg shadow-sm p-4 bg-white ${
                  usuario.rol === "SuperAdmin"
                    ? "bg-purple-50/50"
                    : usuario.rol === "Administrador"
                      ? "bg-primary-50/50"
                      : usuario.rol === "Presidente"
                        ? "bg-blue-50/50"
                        : usuario.rol === "Catador"
                          ? "bg-emerald-50/40"
                          : ""
                }`}
                role="article"
                aria-label={`Usuario ${usuario.nombre || usuario.email}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {usuario.nombre}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {usuario.email}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    {usuario.rol}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">País</span>
                    <span className="text-gray-800">{usuario.pais || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      Mesa / Puesto / Tablet
                    </span>
                    <span className="text-gray-800">
                      {usuario.mesa ?? "-"} / {usuario.puesto ?? "-"} /{" "}
                      {usuario.tablet ?? "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Código</span>
                    <span className="text-gray-800">
                      {usuario.codigocatador || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Último login</span>
                    <span className="text-gray-800">
                      {usuario.last_login_at
                        ? new Date(usuario.last_login_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Dispositivos</div>
                  {usuario.dispositivos.length > 0 ? (
                    <div className="space-y-1">
                      {usuario.dispositivos.map((disp) => (
                        <div
                          key={disp.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="text-gray-700">
                            {disp.nombre_asignado ||
                              `Dispositivo ${disp.tablet_number || "?"}`}
                          </span>
                          {disp.activo && (
                            <button
                              onClick={() => revocarDispositivo(disp.id)}
                              className="text-red-600 text-xs"
                            >
                              Revocar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Sin dispositivos
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  {usuario.activo ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      Inactivo
                    </span>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(usuario)}
                      className="px-2 py-1 text-xs rounded bg-primary-600 text-white"
                      aria-label={`Editar ${usuario.nombre || usuario.email}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarUsuario(usuario)}
                      className="px-2 py-1 text-xs rounded bg-red-500 text-white"
                      aria-label={`Eliminar ${usuario.nombre || usuario.email}`}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de Usuarios */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay usuarios que coincidan</p>
          </div>
        ) : (
          <div>
            <table className="w-full">
              <thead className="bg-[#00273A] border-b border-white/10 text-white/90">
                <tr>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-auto"
                    onClick={() => handleSort("nombre")}
                  >
                    <span className="inline-flex items-center">
                      Usuario{renderSortIcon("nombre")}
                    </span>
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[120px]"
                    onClick={() => handleSort("rol")}
                  >
                    <span className="inline-flex items-center">
                      Rol{renderSortIcon("rol")}
                    </span>
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[150px]"
                    onClick={() => handleSort("mesa")}
                  >
                    <span className="inline-flex items-center">
                      Mesa/Puesto/Tablet{renderSortIcon("mesa")}
                    </span>
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[110px]"
                    onClick={() => handleSort("codigocatador")}
                  >
                    <span className="inline-flex items-center">
                      Cód. Catador{renderSortIcon("codigocatador")}
                    </span>
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[110px]"
                    onClick={() => handleSort("codigo")}
                  >
                    <span className="inline-flex items-center">
                      Cód. Barras{renderSortIcon("codigo")}
                    </span>
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[110px]"
                    onClick={() => handleSort("last_login")}
                  >
                    <span className="inline-flex items-center">
                      Último login{renderSortIcon("last_login")}
                    </span>
                  </th>

                  <th className="p-2 text-left text-xs font-medium uppercase tracking-wider w-[120px]">
                    Dispositivos
                  </th>
                  <th
                    className="p-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B] w-[130px]"
                    onClick={() => handleSort("activo")}
                    title="Controla el acceso al sistema"
                  >
                    <span className="inline-flex items-center">
                      Estado (acceso){renderSortIcon("activo")}
                    </span>
                  </th>
                  <th className="p-2 text-right text-xs font-medium uppercase tracking-wider w-[100px]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosOrdenados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    onClick={() => openModal(usuario, "view")}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            usuario.rol === "SuperAdmin"
                              ? "bg-purple-600"
                              : usuario.rol === "Administrador"
                                ? "bg-primary-600"
                                : "bg-slate-400"
                          }`}
                        >
                          {usuario.nombre?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {usuario.nombre}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary-500" />
                        <span
                          className={`text-xs font-bold ${usuario.rol === "SuperAdmin" ? "text-purple-600" : usuario.rol === "Administrador" ? "text-primary-600" : "text-slate-700"}`}
                        >
                          {usuario.rol}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-medium">
                        {usuario.mesa && (
                          <div>
                            Mesa:{" "}
                            <span className="font-bold text-slate-900">
                              #{usuario.mesa}
                            </span>
                          </div>
                        )}
                        {usuario.tablet && (
                          <div>
                            Tablet:{" "}
                            <span className="font-bold text-slate-900">
                              {usuario.tablet}
                            </span>
                          </div>
                        )}
                        {!usuario.mesa && !usuario.tablet && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="text-sm font-bold text-slate-700">
                        {usuario.codigocatador || (
                          <span className="text-slate-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {usuario.codigo || (
                          <span className="text-slate-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {usuario.last_login_at ? (
                          new Date(usuario.last_login_at).toLocaleDateString()
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {usuario.dispositivos.map((disp) => (
                          <div
                            key={disp.id}
                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${disp.activo ? "bg-green-100" : "bg-red-100"}`}
                            title={
                              disp.nombre_asignado ||
                              `Tablet ${disp.tablet_number}`
                            }
                          >
                            <Smartphone
                              className={`w-3 h-3 ${disp.activo ? "text-green-600" : "text-red-600"}`}
                            />
                          </div>
                        ))}
                        {usuario.dispositivos.length === 0 && (
                          <span className="text-xs text-slate-300">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${usuario.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(usuario, "edit");
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarUsuario(usuario);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
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
        )}
      </div>

      {/* Sidebar de Detalles del Usuario */}
      {selectedUsuario && (
        <DetailSidebar
          isOpen={modalMode === "view"}
          onClose={closeModal}
          title={`Detalle - ${selectedUsuario.nombre}`}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 ${
                selectedUsuario.rol === "SuperAdmin"
                  ? "bg-purple-600"
                  : selectedUsuario.rol === "Administrador"
                    ? "bg-primary-600"
                    : "bg-slate-400"
              }`}
            >
              {selectedUsuario.nombre?.charAt(0).toUpperCase() || "U"}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {selectedUsuario.nombre}
            </h3>
            <p className="text-slate-500 font-medium">
              {selectedUsuario.email}
            </p>
          </div>

          <DetailGroup
            title="Información de Perfil"
            icon={<User className="w-4 h-4" />}
          >
            <DetailItem
              label="Rol del Sistema"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedUsuario.rol === "SuperAdmin"
                      ? "bg-purple-100 text-purple-700"
                      : selectedUsuario.rol === "Administrador"
                        ? "bg-primary-100 text-primary-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selectedUsuario.rol}
                </span>
              }
            />
            <DetailItem
              label="Estado de Cuenta"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedUsuario.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedUsuario.activo
                    ? "Cuenta Activa"
                    : "Cuenta Desactivada"}
                </span>
              }
            />
            <DetailItem
              label="País"
              value={selectedUsuario.pais || "No especificado"}
            />
            <DetailItem
              label="Fecha Registro"
              value={
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedUsuario.created_at
                      ? new Date(
                          selectedUsuario.created_at,
                        ).toLocaleDateString()
                      : "S/N"}
                  </span>
                </div>
              }
            />
          </DetailGroup>

          <DetailGroup
            title="Configuración de Cata"
            icon={<Grid3X3 className="w-4 h-4" />}
          >
            <DetailItem
              label="Mesa Asignada"
              value={
                selectedUsuario.mesa ? `#${selectedUsuario.mesa}` : "Sin mesa"
              }
            />
            <DetailItem
              label="Puesto"
              value={
                selectedUsuario.puesto
                  ? `#${selectedUsuario.puesto}`
                  : "Sin puesto"
              }
            />
            <DetailItem
              label="Código Catador"
              value={selectedUsuario.codigocatador || "Sin código"}
            />
            <DetailItem
              label="Tanda Actual"
              value={
                selectedUsuario.tandaencurso
                  ? `Tanda ${selectedUsuario.tandaencurso}`
                  : "Ninguna"
              }
            />
            <DetailItem
              label="Código de Acceso"
              value={
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-sm font-bold text-slate-600">
                  {selectedUsuario.codigo || "—"}
                </span>
              }
              fullWidth
            />
          </DetailGroup>

          {selectedUsuario.dispositivos.length > 0 && (
            <DetailGroup
              title="Dispositivos Autorizados"
              icon={<Smartphone className="w-4 h-4" />}
            >
              <div className="col-span-2 space-y-3">
                {selectedUsuario.dispositivos.map((disp) => (
                  <div
                    key={disp.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${disp.activo ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {disp.nombre_asignado ||
                            `Tablet ${disp.tablet_number || "?"}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Fingerprint: {disp.device_fingerprint.substring(0, 8)}
                          ...
                        </p>
                      </div>
                    </div>
                    {disp.activo && (
                      <button
                        onClick={() => revocarDispositivo(disp.id)}
                        className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </DetailGroup>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => openModal(selectedUsuario, "edit")}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
            >
              <Edit2 className="w-4 h-4" />
              Editar Usuario
            </button>
            <button
              onClick={() => eliminarUsuario(selectedUsuario)}
              className="flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </DetailSidebar>
      )}

      {/* Modal Editar Usuario (Refinado) */}
      {modalMode === "edit" && selectedUsuario && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Edit2 className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Editar Usuario
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={selectedUsuario.nombre}
                    onChange={(e) =>
                      setSelectedUsuario({
                        ...selectedUsuario,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={selectedUsuario.rol}
                    onChange={(e) =>
                      setSelectedUsuario({
                        ...selectedUsuario,
                        rol: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Presidente">Presidente</option>
                    <option value="Catador">Catador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={selectedUsuario.pais || ""}
                    onChange={(e) =>
                      setSelectedUsuario({
                        ...selectedUsuario,
                        pais: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mesa
                  </label>
                  <input
                    type="number"
                    value={selectedUsuario.mesa || ""}
                    onChange={(e) =>
                      setSelectedUsuario({
                        ...selectedUsuario,
                        mesa: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código Catador
                  </label>
                  <input
                    type="number"
                    value={selectedUsuario.codigocatador || ""}
                    onChange={(e) =>
                      setSelectedUsuario({
                        ...selectedUsuario,
                        codigocatador: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="user-active"
                  checked={selectedUsuario.activo}
                  onChange={(e) =>
                    setSelectedUsuario({
                      ...selectedUsuario,
                      activo: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="user-active"
                  className="text-sm font-bold text-slate-700 cursor-pointer"
                >
                  Usuario Activo (Permite el acceso al sistema)
                </label>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarUsuario}
                className="flex-1 px-6 py-3 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-200"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario (Refinado) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Nuevo Usuario
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoUsuario.nombre}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={nuevoUsuario.email}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={nuevoUsuario.password}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Rol del Sistema
                  </label>
                  <select
                    value={nuevoUsuario.rol}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="Catador">Catador</option>
                    <option value="Presidente">Presidente</option>
                    <option value="Administrador">Administrador</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.pais || ""}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, pais: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mesa
                  </label>
                  <input
                    type="number"
                    value={nuevoUsuario.mesa || ""}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        mesa: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código Catador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={nuevoUsuario.codigocatador || ""}
                      onChange={(e) =>
                        setNuevoUsuario({
                          ...nuevoUsuario,
                          codigocatador: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código de Acceso (Login)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoUsuario.codigo || ""}
                      onChange={(e) =>
                        setNuevoUsuario({
                          ...nuevoUsuario,
                          codigo: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoUsuario({
                          ...nuevoUsuario,
                          codigo: generarAutoBarcode(
                            nuevoUsuario.codigocatador,
                            nuevoUsuario.nombre,
                          ),
                        })
                      }
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold"
                    >
                      Autogenerar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crearUsuario}
                className="flex-1 px-6 py-3 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-200"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
