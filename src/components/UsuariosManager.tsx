import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Mail,
  Shield,
  User,
  Smartphone,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Printer,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
    email: "",
    password: "",
    nombre: "",
    rol: "Catador",
    pais: "España",
  });

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

      const usuariosConDispositivos: UsuarioConDispositivos[] = await Promise.all(
        (usuariosData || []).map(async (usuario) => {
          const { data: dispositivosData } = await supabase
            .from("dispositivos")
            .select("*")
            .eq("user_id", usuario.user_id)
            .order("last_seen_at", { ascending: false });

          let auth_exists = false;
          let last_login_at: string | null = null;
          if (usuario.user_id) {
            const { data: authData, error: authError } =
              await supabase.auth.admin.getUserById(usuario.user_id);
            if (!authError) {
              auth_exists = !!authData.user;
              last_login_at = authData.user?.last_sign_in_at || null;
            }
          }

          return {
            ...usuario,
            dispositivos: dispositivosData || [],
            auth_exists,
            last_login_at,
          };
        })
      );

      setUsuarios(usuariosConDispositivos);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async () => {
    try {
      if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.nombre) {
        toast.error("Completa todos los campos obligatorios");
        return;
      }

      // Obtener token de sesión actual para autenticar el request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("No hay sesión activa. Por favor, inicia sesión.");
        return;
      }

      // Llamar al endpoint serverless que usa service role key
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
        throw new Error(result.error || 'Error al crear usuario');
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

  const actualizarUsuario = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: editingUser.nombre,
          rol: editingUser.rol,
          mesa: editingUser.mesa,
          puesto: editingUser.puesto,
          tablet: editingUser.tablet,
          pais: editingUser.pais,
          codigocatador: editingUser.codigocatador,
          activo: editingUser.activo,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("Usuario actualizado");
      setEditingUser(null);
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    if (
      !confirm(
        `¿Eliminar usuario ${usuario.nombre}? Esto eliminará también su acceso y dispositivos.`
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
    const matchNombre = u.nombre
      .toLowerCase()
      .includes(filters.nombre.toLowerCase());
    const matchEmail = u.email
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
          className={isActive && sortDirection === "asc" ? "text-white" : "text-white/40"}
        />
        <ChevronDown
          size={12}
          className={isActive && sortDirection === "desc" ? "text-white" : "text-white/40"}
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
        .map((d) => d.nombre_asignado || d.tablet_number || d.device_fingerprint)
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

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra usuarios, roles y dispositivos vinculados
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Plus className="w-5 h-5" />
            Crear Usuario
          </button>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition"
            title="Imprimir a PDF"
          >
            <FileDown className="w-4 h-4" />
            Imprimir PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={cargarUsuarios}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title="Refrescar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <input
            type="text"
            placeholder="Buscar nombre"
            value={filters.nombre}
            onChange={(e) => setFilters({ ...filters, nombre: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Buscar email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Mesa"
            value={filters.mesa}
            onChange={(e) => setFilters({ ...filters, mesa: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1C2716] border-b border-gray-200 text-white">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("nombre")}
                  >
                    <span className="inline-flex items-center">Usuario{renderSortIcon("nombre")}</span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("rol")}
                  >
                    <span className="inline-flex items-center">Rol{renderSortIcon("rol")}</span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("pais")}
                  >
                    <span className="inline-flex items-center">País{renderSortIcon("pais")}</span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("mesa")}
                  >
                    <span className="inline-flex items-center">Mesa/Puesto/Tablet{renderSortIcon("mesa")}</span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("codigocatador")}
                  >
                    <span className="inline-flex items-center">Código{renderSortIcon("codigocatador")}</span>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("last_login")}
                  >
                    <span className="inline-flex items-center">Último login{renderSortIcon("last_login")}</span>
                  </th>
                  
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Dispositivos
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#24311B]"
                    onClick={() => handleSort("activo")}
                    title="Controla el acceso al sistema"
                  >
                    <span className="inline-flex items-center">Estado (acceso){renderSortIcon("activo")}</span>
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosOrdenados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className={`hover:bg-gray-50 transition ${
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
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{usuario.nombre}</p>
                          <p className="text-xs text-gray-500">{usuario.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-medium ${usuario.rol === 'SuperAdmin' ? 'text-purple-600' : usuario.rol === 'Administrador' ? 'text-primary-600' : 'text-gray-900'}`}>
                          {usuario.rol}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">{usuario.pais || '—'}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-xs text-gray-600 space-y-1">
                        {usuario.mesa && <div>Mesa: {usuario.mesa}</div>}
                        {usuario.puesto && <div>Puesto: {usuario.puesto}</div>}
                        {usuario.tablet && <div>Tablet: {usuario.tablet}</div>}
                        {!usuario.mesa && !usuario.puesto && !usuario.tablet && '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">{usuario.codigocatador || '—'}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">
                        {usuario.last_login_at
                          ? new Date(usuario.last_login_at).toLocaleString()
                          : "—"}
                      </span>
                    </td>
                    
                    <td className="px-4 py-2">
                      {usuario.dispositivos.length > 0 ? (
                        <div className="space-y-1">
                          {usuario.dispositivos.map((disp) => (
                            <div
                              key={disp.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Smartphone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {disp.nombre_asignado || `Dispositivo ${disp.tablet_number || "?"}`}
                              </span>
                              {disp.activo ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {disp.activo && (
                                <button
                                  onClick={() => revocarDispositivo(disp.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Revocar
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin dispositivos</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {usuario.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Usuario puede acceder al sistema">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title="Usuario sin acceso (deshabilitado)">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => setEditingUser(usuario)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminarUsuario(usuario)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nuevo Usuario</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={nuevoUsuario.password}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                    }
                    className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Catador">Catador</option>
                  <option value="Presidente">Presidente</option>
                  <option value="Administrador">Administrador</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.pais || ""}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, pais: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto
                  </label>
                  <input
                    type="number"
                    value={nuevoUsuario.puesto || ""}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        puesto: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tablet
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.tablet || ""}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, tablet: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="number"
                    value={nuevoUsuario.codigocatador || ""}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        codigocatador: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.codigo || ""}
                    onChange={(e) =>
                      setNuevoUsuario({ ...nuevoUsuario, codigo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={crearUsuario}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Editar Usuario</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={editingUser.rol}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, rol: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Catador">Catador</option>
                    <option value="Presidente">Presidente</option>
                    <option value="Administrador">Administrador</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={editingUser.pais || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, pais: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesa
                  </label>
                  <input
                    type="number"
                    value={editingUser.mesa || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        mesa: parseInt(e.target.value) || null,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto
                  </label>
                  <input
                    type="number"
                    value={editingUser.puesto || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        puesto: parseInt(e.target.value) || null,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tablet
                  </label>
                  <input
                    type="text"
                    value={editingUser.tablet || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, tablet: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="number"
                  value={editingUser.codigocatador || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      codigocatador: parseInt(e.target.value) || null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.activo}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, activo: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Usuario activo (puede acceder al sistema)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarUsuario}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
