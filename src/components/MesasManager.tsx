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
  const [currentCatadorId, setCurrentCatadorId] = useState<string | null>(null);
  const [currentTablet, setCurrentTablet] = useState<number | null>(null);

  useEffect(() => {
    // Detectar si hay sesión de catador activa (modo tablet)
    const catadorId = sessionStorage.getItem('catador_id');
    const tabletNumber = sessionStorage.getItem('tablet_number');
    
    if (catadorId) {
      setCurrentCatadorId(catadorId);
      console.log('👤 Catador logueado detectado:', catadorId);
    }
    
    if (tabletNumber) {
      setCurrentTablet(Number(tabletNumber));
      console.log('📱 Tablet actual:', tabletNumber);
    }

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

      if (error) {
        console.error('Error al cargar mesas:', error);
        throw error;
      }
      
      console.log(`Mesas: ${data?.length || 0} usuarios cargados`);
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error crítico en mesas:', error);
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
      'bg-rose-100 border-rose-400',
      'bg-orange-100 border-orange-400',
      'bg-amber-100 border-amber-400',
      'bg-lime-100 border-lime-400',
      'bg-emerald-100 border-emerald-400',
    ];
    return colors[(mesaNum - 1) % colors.length];
  };

  const getMesaHeaderBg = (mesaNum: number) => {
    const colors = [
      'bg-gradient-to-r from-rose-500 to-rose-600',
      'bg-gradient-to-r from-orange-500 to-orange-600',
      'bg-gradient-to-r from-amber-500 to-amber-600',
      'bg-gradient-to-r from-lime-500 to-lime-600',
      'bg-gradient-to-r from-emerald-500 to-emerald-600',
    ];
    return colors[(mesaNum - 1) % colors.length];
  };

  const getRolColor = (rol: string | null) => {
    if (!rol) return 'bg-gray-100 text-gray-700';
    if (rol === 'Administrador') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (rol === 'Presidente') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-green-100 text-green-800 border-green-300';
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((mesaNum) => {
          const usuariosEnMesa = getUsuariosPorMesa(mesaNum);
          const ocupados = usuariosEnMesa.filter(u => u.puesto !== null).length;

          return (
            <div
              key={mesaNum}
              className={`border-3 rounded-xl overflow-hidden shadow-xl ${getMesaBg(mesaNum)}`}
            >
              {/* Header de Mesa */}
              <div className={`${getMesaHeaderBg(mesaNum)} text-white px-4 py-3`}>
                <div className="font-bold text-xl text-center">MESA {mesaNum}</div>
                <div className="text-sm text-center opacity-95 font-medium">
                  {ocupados}/5 catadores
                </div>
              </div>

              {/* Puestos como tarjetas */}
              <div className="p-3 space-y-2">
                {/* Encabezados de columnas */}
                <div className="flex items-center justify-between gap-2 px-3 pb-1 border-b-2 border-gray-400">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 text-xs font-bold text-gray-600">#</span>
                    <span className="w-2"></span>
                    <span className="text-xs font-bold text-gray-600 flex-1">Nombre</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600">Rol</span>
                    <span className="text-xs font-bold text-gray-600 w-12 text-center">Tablet</span>
                  </div>
                </div>

                {[1, 2, 3, 4, 5].map((puestoNum) => {
                  const usuario = usuariosEnMesa.find(u => u.puesto === puestoNum);
                  const logueado = usuario ? isUsuarioLogueado(usuario.user_id) : false;
                  const esCatadorActual = usuario && (
                    usuario.id === currentCatadorId || 
                    (currentTablet && Number(usuario.tablet) === currentTablet)
                  );
                  
                  return (
                    <div
                      key={puestoNum}
                      className={`rounded-lg border-2 px-3 py-2 transition-all ${
                        esCatadorActual
                          ? 'bg-green-50 border-green-400 shadow-md ring-2 ring-green-200'
                          : usuario 
                            ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                            : 'bg-gray-50 border-gray-200 border-dashed opacity-60'
                      }`}
                    >
                      {usuario ? (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                              esCatadorActual
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-white'
                            }`}>
                              {puestoNum}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                logueado ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              }`}
                              title={logueado ? 'Conectado' : 'Desconectado'}
                            />
                            <span className={`font-bold truncate flex-1 ${
                              esCatadorActual ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {usuario.nombre}
                              {esCatadorActual && <span className="ml-1 text-green-600">👤</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getRolColor(usuario.rol)}`}>
                              {usuario.rol === 'Administrador' ? 'Admin' : usuario.rol === 'Presidente' ? 'Presidente' : 'Catador'}
                            </span>
                            {usuario.tablet && (
                              <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                                esCatadorActual
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {usuario.tablet}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">
                            {puestoNum}
                          </span>
                          <span className="text-xs text-gray-400 italic">
                            Puesto vacío
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer con estadísticas */}
              <div className="px-3 pb-3">
                <div className="text-xs text-gray-700 bg-white rounded-lg px-3 py-2 border-2 border-gray-300 font-medium text-center">
                  {ocupados > 0 ? (
                    <><strong>{ocupados}</strong> catador{ocupados !== 1 ? 'es' : ''} asignado{ocupados !== 1 ? 's' : ''}</>
                  ) : (
                    <>Mesa vacía</>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de roles y estados */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 shadow-md">
        <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">Leyenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estados de conexión */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Estados:</p>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                <strong>Conectado</strong> - Usuario activo en el sistema
              </span>
              <span className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <strong>Desconectado</strong> - Usuario no conectado
              </span>
            </div>
          </div>

          {/* Roles */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Roles:</p>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-300 font-semibold">
                  Admin
                </span>
                <span>Administrador del sistema</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
                  Presidente
                </span>
                <span>Presidente de mesa</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 border border-green-300 font-semibold">
                  Catador
                </span>
                <span>Catador regular</span>
              </span>
            </div>
          </div>
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
