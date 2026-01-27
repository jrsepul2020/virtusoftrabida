// Configuración de persistencia de sesión para Supabase
// Este archivo debe ser importado en la inicialización de Supabase

export const SUPABASE_SESSION_CONFIG = {
  // Persistir sesión en localStorage
  persistSession: true,

  // Detectar cambios de sesión en otras pestañas
  detectSessionInUrl: true,

  // Auto-refresh de tokens antes de expiración
  autoRefreshToken: true,

  // Configuración de storage para sesión
  storage: {
    getItem: (key: string) => {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    },
  },
};

// Notas para configuración manual en Supabase Dashboard:
// 1. Ir a Authentication → Settings
// 2. Aumentar "JWT expiry limit" de 3600s (1h) a 86400s (24h) o más
// 3. Asegurar que "Refresh token rotation" esté habilitado
// 4. Aumentar "Refresh token reuse interval" si es necesario
