import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  registerTabletSession,
  getActiveSessions,
  subscribeToSessionChanges,
  type ActiveTabletSession,
} from "../lib/sessionManager";

type Props = {
  onLogin: (success: boolean, userRole?: string) => void;
};

export default function TabletLoginView({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedTablet, setSelectedTablet] = useState<number | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveTabletSession[]>(
    [],
  );
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Cargar sesiones activas al montar
  useEffect(() => {
    const loadActiveSessions = async () => {
      const sessions = await getActiveSessions();
      setActiveSessions(sessions);
      setLoadingSessions(false);
    };

    loadActiveSessions();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = subscribeToSessionChanges((payload) => {
      console.log("🔄 Cambio en sesiones activas:", payload);
      // Recargar sesiones cuando hay cambios
      loadActiveSessions();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Verificar si una tablet está ocupada
  const isTabletOccupied = (tabletId: number): boolean => {
    return activeSessions.some((session) => session.tablet_id === tabletId);
  };

  const handleTabletLogin = async (tabletNumber: number) => {
    // Verificar si la tablet ya está ocupada
    if (isTabletOccupied(tabletNumber)) {
      toast.error(`Tablet ${tabletNumber} ya está en uso`);
      return;
    }

    setLoading(true);
    setSelectedTablet(tabletNumber);

    try {
      console.log(`🔍 Intentando login con Tablet ${tabletNumber}`);

      // 1. Calcular mesa y puesto automáticamente
      const mesa = Math.floor((tabletNumber - 1) / 5) + 1;
      const puesto = ((tabletNumber - 1) % 5) + 1;
      const es_presidente = puesto === 1;

      console.log(
        `📊 Calculado: Mesa ${mesa}, Puesto ${puesto}, Presidente: ${es_presidente}`,
      );

      // 2. Buscar usuario activo con esa mesa y puesto en la tabla usuarios
      const { data: usuarios, error: queryError } = await supabase
        .from("usuarios")
        .select("id, nombre, rol, mesa, puesto, tablet, tandaencurso")
        .eq("mesa", mesa)
        .eq("puesto", puesto)
        .eq("activo", true)
        .limit(1);

      if (queryError) {
        console.error("❌ Error consultando usuarios:", queryError);
        throw new Error("Error al consultar la base de datos");
      }

      if (!usuarios || usuarios.length === 0) {
        throw new Error(
          `No se encontró usuario activo para Mesa ${mesa}, Puesto ${puesto}`,
        );
      }

      const usuario = usuarios[0];
      console.log(`✅ Usuario encontrado: ${usuario.nombre} (${usuario.rol})`);

      // 3. Registrar sesión activa en Supabase
      const sessionResult = await registerTabletSession(
        tabletNumber,
        mesa,
        puesto,
        usuario.id,
        usuario.nombre,
        usuario.rol,
        es_presidente,
      );

      if (!sessionResult.success) {
        console.warn(
          "⚠️ No se pudo registrar sesión activa:",
          sessionResult.error,
        );
        // Continuar de todos modos - no es crítico
      }

      // 4. Guardar en localStorage
      const sessionData = {
        tablet_id: tabletNumber,
        mesa: mesa,
        puesto: puesto,
        usuario_id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        es_presidente: es_presidente,
        tandaencurso: usuario.tandaencurso,
      };

      // Guardar datos de sesión
      localStorage.setItem("tablet_session", JSON.stringify(sessionData));
      localStorage.setItem("tablet_id", tabletNumber.toString());
      localStorage.setItem("userRole", usuario.rol);
      localStorage.setItem("authMethod", "tablet");
      localStorage.setItem(
        "userRoleData",
        JSON.stringify({
          rol: usuario.rol,
          mesa: mesa,
          puesto: puesto,
          tandaencurso: usuario.tandaencurso,
          id: usuario.id,
          nombre: usuario.nombre,
          es_presidente: es_presidente,
        }),
      );

      console.log("💾 Sesión guardada en localStorage:", sessionData);

      // 5. Normalizar rol para la UI
      let displayRole = "Catador";
      const rawRol = (usuario.rol || "").toLowerCase();
      if (
        [
          "administrador",
          "admin",
          "presidente",
          "supervisor",
          "superadmin",
        ].includes(rawRol)
      ) {
        displayRole = "Admin";
      }

      // 6. Notificar éxito y redirigir
      toast.success(
        `Bienvenido/a ${usuario.nombre} - Mesa ${mesa}, Puesto ${puesto}${es_presidente ? " (Presidente)" : ""}`,
      );
      onLogin(true, displayRole);
    } catch (err: any) {
      console.error("❌ Error login tablet:", err);
      toast.error(err.message || "Error al acceder con esta tablet");
    } finally {
      setLoading(false);
      setSelectedTablet(null);
    }
  };

  // Generar array de 25 tablets
  const tablets = Array.from({ length: 25 }, (_, i) => i + 1);

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <span className="ml-3 text-gray-600">Cargando tablets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de 25 tablets (5x5) */}
      <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto">
        {tablets.map((tabletNum) => {
          const occupied = isTabletOccupied(tabletNum);

          return (
            <button
              key={tabletNum}
              onClick={() => handleTabletLogin(tabletNum)}
              disabled={loading || occupied}
              className={`
                relative aspect-square rounded-xl border-2 transition-all duration-200
                flex flex-col items-center justify-center p-3
                ${
                  selectedTablet === tabletNum
                    ? "bg-red-100 border-red-500 scale-95"
                    : occupied
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                      : "bg-white border-gray-200 hover:border-red-400 hover:shadow-md hover:scale-105 cursor-pointer"
                }
                ${loading && selectedTablet !== tabletNum ? "opacity-50 cursor-not-allowed" : ""}
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {selectedTablet === tabletNum && loading ? (
                <>
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  <span className="text-sm font-semibold text-red-600 mt-1">
                    {tabletNum}
                  </span>
                </>
              ) : occupied ? (
                <>
                  <X
                    className="w-10 h-10 text-red-500 absolute"
                    strokeWidth={3}
                  />
                  <span className="text-xl font-bold text-gray-400">
                    {tabletNum}
                  </span>
                </>
              ) : (
                <span
                  className={`text-xl font-bold ${selectedTablet === tabletNum ? "text-red-700" : "text-gray-800"}`}
                >
                  {tabletNum}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
