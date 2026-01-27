/**
 * Sistema de Gestión de Sesiones Activas de Tablets
 *
 * Este módulo proporciona funciones para gestionar sesiones activas
 * en tiempo real, incluyendo registro, heartbeat, y limpieza.
 */

import { supabase } from "./supabase";

export interface ActiveTabletSession {
  id: string;
  tablet_id: number;
  mesa: number;
  puesto: number;
  usuario_id: string;
  usuario_nombre: string;
  usuario_rol: string;
  es_presidente: boolean;
  logged_in_at: string;
  last_heartbeat: string;
  device_info?: Record<string, any>;
}

/**
 * Registra una nueva sesión activa de tablet
 */
export async function registerTabletSession(
  tabletId: number,
  mesa: number,
  puesto: number,
  usuarioId: string,
  usuarioNombre: string,
  usuarioRol: string,
  esPresidente: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Primero, eliminar cualquier sesión existente para esta tablet
    await supabase
      .from("active_tablet_sessions")
      .delete()
      .eq("tablet_id", tabletId);

    // Registrar nueva sesión
    const { error } = await supabase.from("active_tablet_sessions").insert({
      tablet_id: tabletId,
      mesa: mesa,
      puesto: puesto,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      usuario_rol: usuarioRol,
      es_presidente: esPresidente,
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    });

    if (error) {
      console.error("❌ Error registrando sesión:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Sesión registrada para Tablet ${tabletId}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error en registerTabletSession:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Elimina la sesión activa de una tablet
 */
export async function unregisterTabletSession(
  tabletId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("active_tablet_sessions")
      .delete()
      .eq("tablet_id", tabletId);

    if (error) {
      console.error("❌ Error eliminando sesión:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Sesión eliminada para Tablet ${tabletId}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error en unregisterTabletSession:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Actualiza el heartbeat de una sesión activa
 */
export async function updateSessionHeartbeat(
  tabletId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("active_tablet_sessions")
      .update({ last_heartbeat: new Date().toISOString() })
      .eq("tablet_id", tabletId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene todas las sesiones activas
 */
export async function getActiveSessions(): Promise<ActiveTabletSession[]> {
  try {
    const { data, error } = await supabase
      .from("active_tablet_sessions")
      .select("*")
      .order("tablet_id", { ascending: true });

    if (error) {
      console.error("❌ Error obteniendo sesiones activas:", error);
      return [];
    }

    return (data || []) as ActiveTabletSession[];
  } catch (err) {
    console.error("❌ Error en getActiveSessions:", err);
    return [];
  }
}

/**
 * Verifica si una tablet específica está actualmente logueada
 */
export async function isTabletLoggedIn(tabletId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("active_tablet_sessions")
      .select("id")
      .eq("tablet_id", tabletId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error verificando tablet:", error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("❌ Error en isTabletLoggedIn:", err);
    return false;
  }
}

/**
 * Expulsa a un usuario de una tablet (solo SuperAdmin)
 */
export async function forceLogoutTablet(
  tabletId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("active_tablet_sessions")
      .delete()
      .eq("tablet_id", tabletId);

    if (error) {
      console.error("❌ Error expulsando tablet:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Tablet ${tabletId} expulsada exitosamente`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error en forceLogoutTablet:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Suscribirse a cambios en sesiones activas (Realtime)
 */
export function subscribeToSessionChanges(
  callback: (payload: any) => void,
): () => void {
  const channel = supabase
    .channel("active_sessions_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "active_tablet_sessions",
      },
      callback,
    )
    .subscribe();

  // Retornar función de limpieza
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Iniciar heartbeat periódico para mantener sesión activa
 */
export function startSessionHeartbeat(tabletId: number): () => void {
  // Actualizar heartbeat cada 60 segundos
  const intervalId = setInterval(() => {
    updateSessionHeartbeat(tabletId);
  }, 60000);

  // Retornar función para detener heartbeat
  return () => {
    clearInterval(intervalId);
  };
}
