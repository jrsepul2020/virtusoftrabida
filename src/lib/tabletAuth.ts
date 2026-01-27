/**
 * Sistema de Auto-Login para Tablets
 *
 * Este módulo proporciona funciones para gestionar el login automático
 * basado en datos almacenados en localStorage (sin Supabase Auth).
 */

export interface TabletSession {
  tablet_id: number;
  mesa: number;
  puesto: number;
  usuario_id: string;
  nombre: string;
  rol: string;
  es_presidente: boolean;
  tandaencurso?: number;
}

/**
 * Verifica si existe una sesión de tablet guardada en localStorage
 */
export function hasTabletSession(): boolean {
  const sessionData = localStorage.getItem("tablet_session");
  const tabletId = localStorage.getItem("tablet_id");
  const authMethod = localStorage.getItem("authMethod");

  return !!(sessionData && tabletId && authMethod === "tablet");
}

/**
 * Obtiene los datos de la sesión de tablet desde localStorage
 */
export function getTabletSession(): TabletSession | null {
  try {
    const sessionData = localStorage.getItem("tablet_session");
    if (!sessionData) return null;

    return JSON.parse(sessionData) as TabletSession;
  } catch (error) {
    console.error("Error al leer sesión de tablet:", error);
    return null;
  }
}

/**
 * Limpia la sesión de tablet del localStorage
 */
export function clearTabletSession(): void {
  localStorage.removeItem("tablet_session");
  localStorage.removeItem("tablet_id");
  localStorage.removeItem("userRole");
  localStorage.removeItem("authMethod");
  localStorage.removeItem("userRoleData");
  console.log("🧹 Sesión de tablet limpiada");
}

/**
 * Intenta hacer auto-login con los datos guardados en localStorage
 *
 * @returns true si el auto-login fue exitoso, false si no hay sesión guardada
 */
export function tryAutoLogin(): boolean {
  if (!hasTabletSession()) {
    console.log("ℹ️ No hay sesión de tablet guardada");
    return false;
  }

  const session = getTabletSession();
  if (!session) {
    console.warn("⚠️ Sesión corrupta, limpiando...");
    clearTabletSession();
    return false;
  }

  console.log(
    `✅ Auto-login exitoso: ${session.nombre} (Tablet ${session.tablet_id})`,
  );
  console.log(
    `📊 Mesa ${session.mesa}, Puesto ${session.puesto}${session.es_presidente ? " (Presidente)" : ""}`,
  );

  return true;
}

/**
 * Calcula mesa y puesto a partir del número de tablet
 *
 * @param tabletNumber Número de tablet (1-25)
 * @returns Objeto con mesa, puesto y si es presidente
 */
export function calculateMesaPuesto(tabletNumber: number): {
  mesa: number;
  puesto: number;
  es_presidente: boolean;
} {
  const mesa = Math.floor((tabletNumber - 1) / 5) + 1;
  const puesto = ((tabletNumber - 1) % 5) + 1;
  const es_presidente = puesto === 1;

  return { mesa, puesto, es_presidente };
}

/**
 * Obtiene el rol normalizado para la UI
 *
 * @param rol Rol del usuario desde la base de datos
 * @returns "Admin" o "Catador"
 */
export function normalizeRole(rol: string): "Admin" | "Catador" {
  const rawRol = (rol || "").toLowerCase();

  if (
    [
      "administrador",
      "admin",
      "presidente",
      "supervisor",
      "superadmin",
    ].includes(rawRol)
  ) {
    return "Admin";
  }

  return "Catador";
}
