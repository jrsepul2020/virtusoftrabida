import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Users } from 'lucide-react';

type Usuario = {
  id: string;
  codigocatador: string | null;
  nombre: string;
  pais: string | null;
  rol: string | null;
  mesa: number | null;
  puesto: number | null;
  tablet: string | null;
  user_id: string | null;
};

export default function MesasManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosLogueados, setUsuariosLogueados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
    subscribeToPresence();
    
    return () => {
      // Cleanup: remover suscripción al salir
      supabase.removeAllChannels();
    };
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .not('mesa', 'is', null)
        .order('mesa', { ascending: true })
        .order('puesto', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPresence = async () => {
    // Crear canal de presencia para tracking en tiempo real
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set<string>();
        
        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              onlineUserIds.add(presence.user_id);
            }
          });
        });
        
        setUsuariosLogueados(onlineUserIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Trackear presencia del usuario actual si está logueado
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await channel.track({
              user_id: session.user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });
  };

  const isUsuarioLogueado = (userId: string | null): boolean => {
    if (!userId) return false;
    return usuariosLogueados.has(userId);
  };

  const getMesaBg = (mesaNum: number) => {
    const colors = [
      'bg-rose-50 border-rose-300',
      'bg-orange-50 border-orange-300',
      'bg-amber-50 border-amber-300',
      'bg-lime-50 border-lime-300',
      'bg-emerald-50 border-emerald-300',
    ];
    return colors[(mesaNum - 1) % colors.length];
  };

  const getMesaHeaderBg = (mesaNum: number) => {
    const colors = [
      'bg-rose-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-lime-500',
      'bg-emerald-500',
    ];
    return colors[(mesaNum - 1) % colors.length];
  };

  const getUsuariosPorMesa = (mesaNum: number) => {
    return usuarios.filter(u => u.mesa === mesaNum);
  };

  const getTotalAsignados = () => {
    return usuarios.filter(u => u.puesto !== null).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando mesas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Distribución por Mesas</h2>
            <p className="text-sm text-gray-600">
              {getTotalAsignados()} catadores asignados en {[1,2,3,4,5].filter(m => getUsuariosPorMesa(m).length > 0).length} mesas activas
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchUsuarios();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Grid de 5 Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((mesaNum) => {
          const usuariosEnMesa = getUsuariosPorMesa(mesaNum);
          const ocupados = usuariosEnMesa.filter(u => u.puesto !== null).length;

          return (
            <div
              key={mesaNum}
              className={`border-2 rounded-lg overflow-hidden shadow-lg ${getMesaBg(mesaNum)}`}
            >
              {/* Header de Mesa */}
              <div className={`${getMesaHeaderBg(mesaNum)} text-white px-3 py-2`}>
                <div className="font-bold text-lg text-center">MESA {mesaNum}</div>
                <div className="text-xs text-center opacity-90">
                  {ocupados}/5 puestos
                </div>
              </div>

              {/* Mini Tabla */}
              <div className="p-2">
                <table className="w-full text-xs">
                  <thead className="border-b border-gray-300">
                    <tr className="text-gray-700">
                      <th className="px-1 py-1 text-center font-semibold">Puesto</th>
                      <th className="px-1 py-1 text-left font-semibold">Nombre</th>
                      <th className="px-1 py-1 text-left font-semibold">Rol</th>
                      <th className="px-1 py-1 text-center font-semibold">Tablet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((puestoNum) => {
                      const usuario = usuariosEnMesa.find(u => u.puesto === puestoNum);
                      const logueado = usuario ? isUsuarioLogueado(usuario.user_id) : false;
                      
                      return (
                        <tr
                          key={puestoNum}
                          className={usuario ? 'bg-white' : 'bg-gray-50 opacity-50'}
                        >
                          <td className="px-1 py-1.5 font-bold text-gray-700 text-center">{puestoNum}</td>
                          <td className="px-1 py-1.5 font-medium text-gray-800 truncate max-w-[120px]">
                            {usuario ? (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    logueado ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  title={logueado ? 'Logueado' : 'Desconectado'}
                                />
                                <span className="truncate">{usuario.nombre}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-1 py-1.5 text-gray-600 truncate">
                            {usuario?.rol ? (
                              <span className="text-xs">
                                {usuario.rol === 'Administrador' ? 'Admin' : usuario.rol === 'Presidente' ? 'Pres' : 'Cat'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-1 py-1.5 text-gray-600 text-center">
                            {usuario?.tablet || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer con estadísticas */}
              {ocupados > 0 && (
                <div className="px-2 pb-2">
                  <div className="text-xs text-gray-600 bg-white rounded px-2 py-1 border border-gray-200">
                    <strong>{ocupados}</strong> asignado{ocupados !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda de roles y estados */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs text-gray-600 flex gap-4 justify-center flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <strong>Logueado</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <strong>Desconectado</strong>
          </span>
          <span>|</span>
          <span><strong>Admin:</strong> Administrador</span>
          <span><strong>Pres:</strong> Presidente</span>
          <span><strong>Cat:</strong> Catador</span>
        </div>
      </div>

      {/* Mensaje si no hay asignaciones */}
      {usuarios.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay catadores asignados</h3>
          <p className="text-gray-500">
            Ve a Gestión de Catadores para asignar mesas y puestos.
          </p>
        </div>
      )}
    </div>
  );
}
