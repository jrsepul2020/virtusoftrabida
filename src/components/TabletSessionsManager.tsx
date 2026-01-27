import { useState, useEffect } from "react";
import { Monitor, X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  getActiveSessions,
  forceLogoutTablet,
  subscribeToSessionChanges,
  type ActiveTabletSession,
} from "../lib/sessionManager";
import toast from "react-hot-toast";

export default function TabletSessionsManager() {
  const [sessions, setSessions] = useState<ActiveTabletSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Cargar sesiones
  const loadSessions = async () => {
    const activeSessions = await getActiveSessions();
    setSessions(activeSessions);
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = subscribeToSessionChanges(() => {
      loadSessions();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Verificar si una tablet está logueada
  const isTabletLoggedIn = (tabletId: number): boolean => {
    return sessions.some((s) => s.tablet_id === tabletId);
  };

  // Obtener sesión de una tablet
  const getTabletSession = (
    tabletId: number,
  ): ActiveTabletSession | undefined => {
    return sessions.find((s) => s.tablet_id === tabletId);
  };

  // Expulsar usuario de una tablet
  const handleForceLogout = async (tabletId: number) => {
    const session = getTabletSession(tabletId);
    if (!session) return;

    const confirmed = window.confirm(
      `¿Estás seguro de expulsar a ${session.usuario_nombre} de la Tablet ${tabletId}?`,
    );

    if (!confirmed) return;

    setActionLoading(tabletId);

    try {
      const result = await forceLogoutTablet(tabletId);

      if (result.success) {
        toast.success(`Tablet ${tabletId} desconectada exitosamente`);
        await loadSessions();
      } else {
        toast.error(result.error || "Error al expulsar tablet");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al expulsar tablet");
    } finally {
      setActionLoading(null);
    }
  };

  // Generar array de 25 tablets
  const tablets = Array.from({ length: 25 }, (_, i) => i + 1);

  // Calcular estadísticas
  const stats = {
    total: 25,
    active: sessions.length,
    inactive: 25 - sessions.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando sesiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Monitor className="w-7 h-7 text-blue-600" />
            Gestión de Sesiones de Tablets
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Monitoreo y control de tablets activas en el sistema
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tablets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <Monitor className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Activas</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {stats.active}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.inactive}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla de Tablets */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Tablet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Mesa / Puesto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tablets.map((tabletId) => {
                const session = getTabletSession(tabletId);
                const isActive = isTabletLoggedIn(tabletId);

                return (
                  <tr
                    key={tabletId}
                    className={`${
                      isActive
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Monitor
                          className={`w-5 h-5 ${isActive ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span className="text-sm font-bold text-gray-900">
                          Tablet {tabletId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-700">
                              Activa
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-500">
                              Inactiva
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {session ? (
                        <span className="text-sm text-gray-900 font-medium">
                          {session.usuario_nombre}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {session ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.es_presidente
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {session.es_presidente
                            ? "Presidente"
                            : session.usuario_rol}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {session ? (
                        <span className="text-sm text-gray-700">
                          Mesa {session.mesa} / Puesto {session.puesto}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {session ? (
                        <span className="text-xs text-gray-500">
                          {new Date(session.last_heartbeat).toLocaleTimeString(
                            "es-ES",
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isActive ? (
                        <button
                          onClick={() => handleForceLogout(tabletId)}
                          disabled={actionLoading === tabletId}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === tabletId ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span>Expulsando...</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              <span>Expulsar</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advertencia */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Advertencia para SuperAdmin
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Expulsar un usuario cerrará su sesión inmediatamente. Use esta
              función solo cuando sea necesario (ej: tablet bloqueada, usuario
              duplicado, etc).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
