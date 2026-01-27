import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Plus,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  Barcode,
  ArrowLeft,
} from "lucide-react";
import { showError, showWarning } from "../lib/toast";
import JsBarcode from "jsbarcode";

interface Catador {
  id: string;
  codigocatador: string | null;
  nombre: string;
  pais: string | null;
  rol: string | null;
  mesa: number | null;
  puesto: number | null;
  tablet: string | null;
  email: string | null;
  telefono: string | null;
  especialidad: string | null;
  estado: string | null;
  activo: boolean | null;
  created_at: string;
}

type SortField =
  | "codigocatador"
  | "nombre"
  | "pais"
  | "rol"
  | "mesa"
  | "puesto"
  | "tablet";

export default function CatadoresManager() {
  const [catadores, setCatadores] = useState<Catador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [sortField, setSortField] = useState<SortField>("mesa");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [mesasDisponibles, setMesasDisponibles] = useState<number[]>([]);
  const [tabletsDisponibles, setTabletsDisponibles] = useState<string[]>([]);

  const PUESTOS = Array.from({ length: 5 }, (_, i) => i + 1);

  const [formData, setFormData] = useState({
    codigocatador: "",
    nombre: "",
    email: "",
    password: "",
    pais: "",
    rol: "Catador",
    mesa: "",
    puesto: "",
    tablet: "",
  });

  useEffect(() => {
    fetchCatadores();
    fetchMesasYTablets();
  }, []);

  const fetchMesasYTablets = async () => {
    try {
      // Mesas configurables desde tabla de configuración
      const { data: configMesas, error: configErr } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "numero_mesas")
        .single();

      let numMesas = 5; // Default
      if (!configErr && configMesas?.valor) {
        numMesas = parseInt(configMesas.valor);
      }
      setMesasDisponibles(Array.from({ length: numMesas }, (_, i) => i + 1));

      // Tablets 1-25
      setTabletsDisponibles(
        Array.from({ length: 25 }, (_, i) => String(i + 1)),
      );
    } catch {
      setMesasDisponibles(Array.from({ length: 5 }, (_, i) => i + 1));
      setTabletsDisponibles(
        Array.from({ length: 25 }, (_, i) => String(i + 1)),
      );
    }
  };

  const fetchCatadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar catadores:", error);
        throw error;
      }

      console.log(`Catadores: ${data?.length || 0} cargados de la BD`);

      // Filtrar Administradores y SuperAdmin
      const filteredData = (data || []).filter(
        (c) =>
          c.rol !== "Administrador" &&
          c.rol !== "SuperAdmin" &&
          c.rol !== "admin",
      );

      setCatadores(filteredData);
    } catch (error) {
      console.error("Error crítico en catadores:", error);
      showError("Error al cargar catadores");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedCatadores = () => {
    return [...catadores].sort((a, b) => {
      // Orden primario
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal !== bVal) {
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Orden secundario (siempre puesto si el primario es mesa)
      if (sortField === "mesa") {
        const aPuesto = a.puesto || 99;
        const bPuesto = b.puesto || 99;
        return aPuesto - bPuesto;
      }

      return 0;
    });
  };

  // Función para obtener la bandera del país como emoji
  const getCountryFlag = (countryName: string | null): string => {
    if (!countryName) return "";

    const countryFlags: { [key: string]: string } = {
      españa: "🇪🇸",
      spain: "🇪🇸",
      francia: "🇫🇷",
      france: "🇫🇷",
      italia: "🇮🇹",
      italy: "🇮🇹",
      portugal: "🇵🇹",
      alemania: "🇩🇪",
      germany: "🇩🇪",
      "reino unido": "🇬🇧",
      uk: "🇬🇧",
      usa: "🇺🇸",
      "estados unidos": "🇺🇸",
      argentina: "🇦🇷",
      chile: "🇨🇱",
      méxico: "🇲🇽",
      mexico: "🇲🇽",
      brasil: "🇧🇷",
      brazil: "🇧🇷",
      japón: "🇯🇵",
      japan: "🇯🇵",
      china: "🇨🇳",
      australia: "🇦🇺",
      canadá: "🇨🇦",
      canada: "🇨🇦",
      perú: "🇵🇪",
      peru: "🇵🇪",
      cuba: "🇨🇺",
      uruguay: "🇺🇾",
    };

    return countryFlags[countryName.toLowerCase()] || "🌍";
  };

  // Obtener puestos disponibles para una mesa específica
  const getPuestosDisponibles = (mesaId: number | null, catadorId: string) => {
    if (!mesaId) return PUESTOS;

    // Obtener puestos ocupados en esa mesa (excluyendo el catador actual)
    const puestosOcupados = catadores
      .filter(
        (c) => c.id !== catadorId && c.mesa === mesaId && c.puesto !== null,
      )
      .map((c) => c.puesto);

    // Filtrar los puestos que no están ocupados
    return PUESTOS.filter((p) => !puestosOcupados.includes(p));
  };

  // Obtener tablets disponibles (no asignadas)
  const getTabletsDisponibles = (catadorId: string) => {
    // Obtener tablets ocupadas (excluyendo el catador actual)
    const tabletsOcupadas = catadores
      .filter((c) => c.id !== catadorId && c.tablet)
      .map((c) => c.tablet);

    // Filtrar las tablets que no están ocupadas
    return tabletsDisponibles.filter((t) => !tabletsOcupadas.includes(t));
  };

  // Obtener información de mesas
  const getMesasInfo = () => {
    const mesas = mesasDisponibles.map((mesaNum) => {
      const catadoresEnMesa = catadores.filter((c) => c.mesa === mesaNum);
      const puestosOcupados = catadoresEnMesa.filter(
        (c) => c.puesto !== null,
      ).length;
      const totalPuestos = 5; // Máximo de puestos por mesa
      const completa = puestosOcupados === totalPuestos;

      return {
        numero: mesaNum,
        catadores: catadoresEnMesa,
        puestosOcupados,
        totalPuestos,
        completa,
      };
    });

    const mesasCompletas = mesas.filter((m) => m.completa);
    const mesasPendientes = mesas.filter(
      (m) => !m.completa && m.puestosOcupados > 0,
    );
    const mesasVacias = mesas.filter((m) => m.puestosOcupados === 0);

    return {
      mesasCompletas,
      mesasPendientes,
      mesasVacias,
      todasLasMesas: mesas,
    };
  };

  const handleFieldChange = (id: string, field: keyof Catador, value: any) => {
    // Actualizar localmente sin guardar aún
    setCatadores((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat)),
    );
  };

  const handleFieldUpdate = async (
    id: string,
    field: keyof Catador,
    value: any,
  ) => {
    console.log("Actualizando campo:", { id, field, value });

    // Validar puesto duplicado en la misma mesa
    if (field === "puesto" || field === "mesa") {
      const catador = catadores.find((c) => c.id === id);
      const mesaActual = field === "mesa" ? value : catador?.mesa;
      const puestoActual = field === "puesto" ? value : catador?.puesto;

      if (mesaActual !== null && puestoActual !== null) {
        const duplicado = catadores.find(
          (c) =>
            c.id !== id && c.mesa === mesaActual && c.puesto === puestoActual,
        );

        if (duplicado) {
          showWarning(
            `El puesto ${puestoActual} de la mesa ${mesaActual} ya está ocupado por ${duplicado.nombre}`,
          );
          await fetchCatadores(); // Recargar para revertir
          return;
        }
      }
    }

    // Validar tablet duplicada
    if (field === "tablet" && value) {
      const duplicado = catadores.find(
        (c) => c.id !== id && c.tablet === value,
      );

      if (duplicado) {
        showWarning(
          `La tablet ${value} ya está asignada a ${duplicado.nombre}`,
        );
        await fetchCatadores(); // Recargar para revertir
        return;
      }
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("usuarios")
        .update({ [field]: value })
        .eq("id", id);

      if (error) {
        console.error("Error de Supabase:", error);
        throw error;
      }

      console.log("Actualización exitosa en BD");

      // Actualizar el estado local después de guardar exitosamente
      setCatadores((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat)),
      );
    } catch (error) {
      console.error("Error al actualizar:", error);
      showError("Error al actualizar el campo");
      // Recargar para revertir el cambio
      await fetchCatadores();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      showWarning("El nombre es obligatorio");
      return;
    }

    // Validar email y password para nuevos usuarios
    if (!editingId) {
      if (!formData.email?.trim() || !formData.email.includes("@")) {
        showWarning("El email es obligatorio y debe ser válido");
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        showWarning(
          "La contraseña es obligatoria y debe tener al menos 6 caracteres",
        );
        return;
      }
    }

    try {
      setSaving(true);

      let userId = editingId;

      // Si es un nuevo catador, crear usuario en Supabase Auth primero
      if (!editingId) {
        console.log("Creando usuario en Supabase Auth...");

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email.trim(),
            password: formData.password,
            options: {
              data: {
                nombre: formData.nombre.trim(),
                rol: formData.rol || "Catador",
              },
              emailRedirectTo: undefined, // No enviar email de confirmación
            },
          },
        );

        if (authError) {
          console.error("Error en Auth signUp:", authError);
          throw new Error(
            `Error al crear usuario en Auth: ${authError.message}`,
          );
        }

        if (!authData.user) {
          throw new Error("No se pudo crear el usuario en Auth");
        }

        userId = authData.user.id;
        console.log("Usuario creado en Auth con ID:", userId);

        // Confirmar el email automáticamente (solo admin puede hacer esto)
        // Nota: Esto requiere que el admin tenga permisos service_role en producción
        // Por ahora, el usuario podrá hacer login directamente sin confirmar email
      }

      const dataToSave: any = {
        codigocatador: formData.codigocatador?.trim() || null,
        nombre: formData.nombre.trim(),
        email: formData.email?.trim() || null,
        pais: formData.pais?.trim() || null,
        rol: formData.rol || "Catador",
        mesa: formData.mesa ? parseInt(formData.mesa) : null,
        puesto: formData.puesto ? parseInt(formData.puesto) : null,
        tablet: formData.tablet || null,
      };

      console.log("Guardando en tabla usuarios:", dataToSave);

      if (editingId) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from("usuarios")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) {
          console.error("Error en update:", error);
          throw error;
        }
        console.log("Catador actualizado exitosamente");
      } else {
        // Insertar nuevo usuario con el ID de Auth
        dataToSave.id = userId;
        const { error } = await supabase.from("usuarios").insert([dataToSave]);

        if (error) {
          console.error("Error en insert:", error);
          throw error;
        }
        console.log("Catador creado exitosamente en tabla usuarios");
      }

      await fetchCatadores();
      resetForm();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      showError(
        `Error al guardar el catador: ${error?.message || "Error desconocido"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (catador: Catador) => {
    setEditingId(catador.id);
    setFormData({
      codigocatador: (catador as any).codigocatador || "",
      nombre: catador.nombre,
      email: catador.email || "",
      password: "", // No mostrar password en edición
      pais: catador.pais || "",
      rol: catador.rol || "",
      mesa: catador.mesa?.toString() || "",
      puesto: catador.puesto?.toString() || "",
      tablet: catador.tablet || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (
      !confirm(`¿Estás seguro de que quieres eliminar al catador "${nombre}"?`)
    ) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("usuarios").delete().eq("id", id);

      if (error) {
        console.error("Error al eliminar:", error);
        throw error;
      }

      await fetchCatadores();
      console.log("Catador eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      showError(
        `Error al eliminar el catador: ${(error as any)?.message || "Error desconocido"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigocatador: "",
      nombre: "",
      email: "",
      password: "",
      pais: "",
      rol: "Catador",
      mesa: "",
      puesto: "",
      tablet: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleVaciarCampo = async (
    campo: "rol" | "mesa" | "puesto" | "tablet",
  ) => {
    const mensajes = {
      rol: "roles",
      mesa: "mesas",
      puesto: "puestos",
      tablet: "tablets",
    };

    if (
      !confirm(
        `¿Estás seguro de que quieres vaciar todos los ${mensajes[campo]}?`,
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      // Actualizar todos los registros poniendo el campo a null
      const { error } = await supabase
        .from("usuarios")
        .update({ [campo]: null })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Actualizar todos los registros

      if (error) {
        console.error(`Error al vaciar ${campo}:`, error);
        throw error;
      }

      await fetchCatadores();
      console.log(`${campo} vaciados exitosamente`);
    } catch (error) {
      console.error(`Error al vaciar ${campo}:`, error);
      showError(
        `Error al vaciar ${mensajes[campo]}: ${(error as any)?.message || "Error desconocido"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600"
    >
      {label}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        ))}
    </button>
  );

  const getMesaBg = (mesa: number | null) => {
    if (!mesa || mesa <= 0) return "bg-white";
    const colors = [
      "bg-rose-100",
      "bg-orange-100",
      "bg-amber-100",
      "bg-lime-100",
      "bg-emerald-100",
      "bg-teal-100",
      "bg-sky-100",
      "bg-indigo-100",
      "bg-fuchsia-100",
      "bg-pink-100",
    ];
    return colors[(mesa - 1) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando catadores...</div>
      </div>
    );
  }

  if (showBarcodes) {
    return (
      <div className="space-y-6 p-4 bg-white min-h-screen">
        <div className="flex justify-between items-center print:hidden border-b pb-4">
          <button
            onClick={() => setShowBarcodes(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Volver a Gestión</span>
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              Cómputo de Catadores (Barcodes)
            </h2>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center gap-2"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          {catadores
            .sort((a, b) => {
              if (a.mesa !== b.mesa) return (a.mesa || 99) - (b.mesa || 99);
              return (a.puesto || 99) - (b.puesto || 99);
            })
            .map((cat) => (
              <div
                key={cat.id}
                className="p-6 border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 bg-white"
              >
                <div className="w-full border-b pb-2 mb-1 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-400">
                    #{cat.codigocatador}
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                      Mesa {cat.mesa}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                      Puesto {cat.puesto}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 text-center uppercase tracking-tight">
                  {cat.nombre}
                </h3>

                <div className="bg-white p-4 rounded-xl border border-gray-50 w-full flex justify-center">
                  <BarcodeItem value={cat.codigocatador || ""} />
                </div>

                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                  {cat.rol || "Catador"}
                </p>
              </div>
            ))}
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .grid { display: block !important; }
            .grid > div { 
              break-inside: avoid; 
              margin-bottom: 20px; 
              border: 1px solid #eee !important;
              page-break-inside: avoid;
            }
          }
        `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold">
            Gestión de Catadores
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Nuevo Catador
        </button>
        <button
          onClick={() => setShowBarcodes(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 whitespace-nowrap"
        >
          <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
          Ver Códigos
        </button>
      </div>

      {/* Botones para vaciar campos */}
      <div className="flex flex-wrap gap-2 w-full">
        <button
          onClick={() => handleVaciarCampo("rol")}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Roles
        </button>
        <button
          onClick={() => handleVaciarCampo("mesa")}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Mesas
        </button>
        <button
          onClick={() => handleVaciarCampo("puesto")}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Puestos
        </button>
        <button
          onClick={() => handleVaciarCampo("tablet")}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Tablets
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Editar Catador" : "Nuevo Catador"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input
                type="text"
                value={formData.codigocatador}
                onChange={(e) =>
                  setFormData({ ...formData, codigocatador: e.target.value })
                }
                className="w-full p-2 border rounded text-sm sm:text-base"
                placeholder="Código"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email {!editingId && "*"}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="email@ejemplo.com"
                disabled={!!editingId}
                title={
                  editingId
                    ? "No se puede cambiar el email de un usuario existente"
                    : ""
                }
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">País</label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) =>
                  setFormData({ ...formData, pais: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="País"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, rol: "Presidente" })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                    formData.rol === "Presidente"
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  {formData.rol === "Presidente" && (
                    <Check className="w-5 h-5" />
                  )}
                  Presidente
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rol: "Catador" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                    formData.rol === "Catador"
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]"
                      : "bg-blue-50/50 border-blue-100 text-blue-400 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  {formData.rol === "Catador" && <Check className="w-5 h-5" />}
                  Catador
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tablet</label>
              <select
                value={formData.tablet}
                onChange={(e) =>
                  setFormData({ ...formData, tablet: e.target.value })
                }
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {tabletsDisponibles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mesa</label>
              <select
                value={formData.mesa}
                onChange={(e) =>
                  setFormData({ ...formData, mesa: e.target.value })
                }
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {mesasDisponibles.map((m) => {
                  const mesaInfo = getMesasInfo().todasLasMesas.find(
                    (info) => info.numero === m,
                  );
                  const isFull = mesaInfo?.completa;
                  // Si estamos editando y es la mesa actual del catador, mostrarla aunque esté llena
                  const isCurrentMesa =
                    editingId &&
                    catadores.find((c) => c.id === editingId)?.mesa === m;

                  if (isFull && !isCurrentMesa) return null;

                  return (
                    <option key={m} value={String(m)}>
                      Mesa {m} {isFull ? "(Llena)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Puesto</label>
              <select
                value={formData.puesto}
                onChange={(e) =>
                  setFormData({ ...formData, puesto: e.target.value })
                }
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={String(p)}>
                    Puesto {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {catadores.length}
          </div>
          <div className="text-sm text-gray-600">Total Catadores</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {getMesasInfo().mesasCompletas.length}
          </div>
          <div className="text-sm text-gray-600">Mesas Completas</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {getMesasInfo().mesasPendientes.length}
          </div>
          <div className="text-sm text-gray-600">Mesas Pendientes</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {catadores.filter((c) => c.mesa !== null).length}
          </div>
          <div className="text-sm text-gray-600">Asignados a Mesa</div>
        </div>
      </div>

      {/* Resumen de Distribución por Mesas */}
      <div className="bg-white border shadow-sm rounded-xl p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Resumen de Mesas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {getMesasInfo().todasLasMesas.map((mesa) => {
            const mesaColors = [
              {
                bg: "bg-rose-50",
                border: "border-rose-200",
                text: "text-rose-700",
                header: "bg-rose-100",
              },
              {
                bg: "bg-orange-50",
                border: "border-orange-200",
                text: "text-orange-700",
                header: "bg-orange-100",
              },
              {
                bg: "bg-amber-50",
                border: "border-amber-200",
                text: "text-amber-700",
                header: "bg-amber-100",
              },
              {
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                text: "text-emerald-700",
                header: "bg-emerald-100",
              },
              {
                bg: "bg-blue-50",
                border: "border-blue-200",
                text: "text-blue-700",
                header: "bg-blue-100",
              },
            ];
            const color = mesaColors[(mesa.numero - 1) % mesaColors.length];

            return (
              <div
                key={mesa.numero}
                className={`rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${color.bg} ${color.border}`}
              >
                <div
                  className={`px-3 py-2 border-b flex justify-between items-center ${color.header} ${color.border}`}
                >
                  <span className={`font-black text-sm ${color.text}`}>
                    MESA {mesa.numero}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/50 rounded-full text-gray-600">
                    {mesa.puestosOcupados}/5
                  </span>
                </div>

                <div className="p-2 min-h-[110px]">
                  {mesa.catadores.length > 0 ? (
                    <div className="space-y-1">
                      {mesa.catadores
                        .sort((a, b) => (a.puesto || 0) - (b.puesto || 0))
                        .map((c) => (
                          <div
                            key={c.id}
                            className={`flex justify-between items-center text-[10px] leading-tight px-1.5 py-1 rounded ${
                              c.rol === "Presidente"
                                ? "bg-slate-900 text-white font-bold"
                                : "text-gray-700"
                            }`}
                          >
                            <span className="truncate flex-1">
                              {c.puesto}. {c.nombre}
                            </span>
                            <div className="flex items-center gap-1.5 ml-2">
                              {c.tablet && (
                                <span
                                  className={`text-[9px] px-1 rounded font-mono ${
                                    c.rol === "Presidente"
                                      ? "bg-white/20 text-white"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  T{c.tablet}
                                </span>
                              )}
                              {c.rol === "Presidente" && (
                                <span className="text-[8px] opacity-80 uppercase tracking-tighter">
                                  Pres.
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full py-6">
                      <span className="text-[10px] text-gray-400 italic">
                        Mesa vacía
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla completa de todos los catadores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300">
          <h3 className="text-lg font-bold text-gray-800">
            Todos los Catadores - Gestión Completa
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="codigocatador" label="Código" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="nombre" label="Nombre" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  Email
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="pais" label="País" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="rol" label="Rol" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="mesa" label="Mesa" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="puesto" label="Puesto" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="tablet" label="Tablet" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  Activo
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedCatadores().map((catador) => (
                <tr
                  key={catador.id}
                  className={`${getMesaBg(catador.mesa)} hover:opacity-95 border-b border-gray-200 ${
                    catador.rol === "Presidente"
                      ? "bg-blue-50/50 ring-1 ring-inset ring-blue-200"
                      : ""
                  }`}
                >
                  <td
                    className={`px-2 py-1.5 text-xs border-r border-gray-200 ${catador.rol === "Presidente" ? "font-black text-blue-900" : ""}`}
                  >
                    <input
                      type="text"
                      value={catador.codigocatador || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          catador.id,
                          "codigocatador",
                          e.target.value,
                        )
                      }
                      onBlur={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "codigocatador",
                          e.target.value,
                        )
                      }
                      className="w-full bg-transparent border-0 p-0 focus:ring-0 text-inherit"
                      maxLength={7}
                      disabled={saving}
                    />
                  </td>
                  <td
                    className={`px-2 py-1.5 text-xs border-r border-gray-200 ${catador.rol === "Presidente" ? "font-black text-blue-900" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {catador.rol === "Presidente" && (
                        <span
                          className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-[10px] shrink-0 shadow-sm"
                          title="Presidente"
                        >
                          P
                        </span>
                      )}
                      <input
                        type="text"
                        value={catador.nombre}
                        onChange={(e) =>
                          handleFieldChange(
                            catador.id,
                            "nombre",
                            e.target.value,
                          )
                        }
                        onBlur={(e) =>
                          handleFieldUpdate(
                            catador.id,
                            "nombre",
                            e.target.value,
                          )
                        }
                        className="w-full bg-transparent border-0 p-0 focus:ring-0 font-inherit"
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="email"
                      value={catador.email || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          catador.id,
                          "email",
                          e.target.value || null,
                        )
                      }
                      onBlur={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "email",
                          e.target.value || null,
                        )
                      }
                      className="w-full min-w-[150px] p-1 border rounded text-xs"
                      placeholder="-"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getCountryFlag(catador.pais)}
                      </span>
                      <input
                        type="text"
                        value={catador.pais || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            catador.id,
                            "pais",
                            e.target.value || null,
                          )
                        }
                        onBlur={(e) =>
                          handleFieldUpdate(
                            catador.id,
                            "pais",
                            e.target.value || null,
                          )
                        }
                        className="w-24 p-1 border rounded text-xs"
                        placeholder="-"
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <div className="flex gap-1 h-full items-center">
                      <button
                        onClick={() =>
                          handleFieldUpdate(catador.id, "rol", "Presidente")
                        }
                        className={`flex-1 py-1 px-1 rounded border transition-all text-[10px] font-bold ${
                          catador.rol === "Presidente"
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                        disabled={saving}
                      >
                        {catador.rol === "Presidente" ? "Presidente" : "P"}
                      </button>
                      <button
                        onClick={() =>
                          handleFieldUpdate(catador.id, "rol", "Catador")
                        }
                        className={`flex-1 py-1 px-1 rounded border transition-all text-[10px] font-bold ${
                          catador.rol === "Catador"
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-blue-50/50 border-blue-100 text-blue-400 hover:border-blue-200"
                        }`}
                        disabled={saving}
                      >
                        {catador.rol === "Catador" ? "Catador" : "C"}
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.mesa ?? ""}
                      onChange={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "mesa",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-20 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {mesasDisponibles.map((m) => {
                        const mesaInfo = getMesasInfo().todasLasMesas.find(
                          (info) => info.numero === m,
                        );
                        const isFull = mesaInfo?.completa;
                        const isCurrentMesa = catador.mesa === m;

                        if (isFull && !isCurrentMesa) return null;

                        return (
                          <option key={m} value={String(m)}>
                            M {m}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.puesto ?? ""}
                      onChange={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "puesto",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-20 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {/* Mostrar el puesto actual aunque esté "ocupado" */}
                      {catador.puesto !== null &&
                        !getPuestosDisponibles(
                          catador.mesa,
                          catador.id,
                        ).includes(catador.puesto) && (
                          <option value={String(catador.puesto)}>
                            P {catador.puesto}
                          </option>
                        )}
                      {/* Mostrar solo puestos disponibles */}
                      {getPuestosDisponibles(catador.mesa, catador.id).map(
                        (p) => (
                          <option key={p} value={String(p)}>
                            P {p}
                          </option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.tablet || ""}
                      onChange={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "tablet",
                          e.target.value || null,
                        )
                      }
                      className="w-16 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {/* Mostrar la tablet actual aunque esté "ocupada" */}
                      {catador.tablet &&
                        !getTabletsDisponibles(catador.id).includes(
                          catador.tablet,
                        ) && (
                          <option value={catador.tablet}>
                            {catador.tablet}
                          </option>
                        )}
                      {/* Mostrar solo tablets disponibles */}
                      {getTabletsDisponibles(catador.id).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={catador.activo !== false}
                      onChange={(e) =>
                        handleFieldUpdate(
                          catador.id,
                          "activo",
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(catador)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(catador.id, catador.nombre)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {catadores.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay catadores registrados
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponente para el código de barras individual
function BarcodeItem({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: "monospace",
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 4,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 10,
        });
      } catch (e) {
        console.error("Barcode error:", e);
      }
    }
  }, [value]);

  if (!value)
    return <div className="text-red-500 text-xs italic">Sin código</div>;

  return <svg ref={barcodeRef}></svg>;
}
