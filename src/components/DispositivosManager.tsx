import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Smartphone, Trash2, RefreshCw, CheckCircle, XCircle, Eye, Wifi, WifiOff, Clock } from 'lucide-react';

interface Dispositivo {
  id: string;
  device_fingerprint: string;
  tablet_number: number;
  device_info: any;
  nombre_asignado: string;
  first_registered_at: string;
  last_seen_at: string;
  activo: boolean;
}

export default function DispositivosManager() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Dispositivo | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadDispositivos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*')
        .order('tablet_number');

      if (error) {
        console.error('Error al cargar dispositivos:', error);
        if (error.code === '42P01') {
          alert('La tabla "dispositivos" no existe. Por favor, ejecuta la migración en Supabase.');
        }
        throw error;
      }
      
      setDispositivos(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error crítico en dispositivos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar solo una vez al montar el componente
  useEffect(() => {
    loadDispositivos();
  }, [loadDispositivos]);

  const handleToggleActivo = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('dispositivos')
        .update({ activo: !currentState })
        .eq('id', id);

      if (error) throw error;
      await loadDispositivos();
    } catch (error) {
      console.error('Error actualizando dispositivo:', error);
      alert('Error al actualizar el dispositivo');
    }
  };

  const handleDelete = async (id: string, tabletNumber: number) => {
    if (!confirm(`¿Eliminar definitivamente la Tablet ${tabletNumber}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('dispositivos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadDispositivos();
    } catch (error) {
      console.error('Error eliminando dispositivo:', error);
      alert('Error al eliminar el dispositivo');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 2) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  // Estado de conexión basado en last_seen_at
  const getConnectionStatus = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = (now.getTime() - date.getTime()) / 60000;
    
    if (diffMins < 2) return 'online';      // Visto en los últimos 2 minutos
    if (diffMins < 10) return 'recent';      // Visto en los últimos 10 minutos
    if (diffMins < 60) return 'idle';        // Visto en la última hora
    return 'offline';                         // Más de 1 hora sin conexión
  };

  const getConnectionLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Conectado';
      case 'recent': return 'Reciente';
      case 'idle': return 'Inactivo';
      case 'offline': return 'Desconectado';
      default: return 'Desconocido';
    }
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'recent': return 'bg-yellow-500';
      case 'idle': return 'bg-orange-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Estadísticas
  const stats = {
    total: dispositivos.length,
    habilitados: dispositivos.filter(d => d.activo).length,
    deshabilitados: dispositivos.filter(d => !d.activo).length,
    online: dispositivos.filter(d => getConnectionStatus(d.last_seen_at) === 'online').length,
    offline: dispositivos.filter(d => getConnectionStatus(d.last_seen_at) === 'offline').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispositivos Registrados</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las tablets registradas en el sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de última actualización */}
          {lastRefresh && (
            <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Última comprobación: {lastRefresh.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}

          <button
            onClick={loadDispositivos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Comprobar Estado
          </button>
        </div>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conectados</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Desconectados</p>
              <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Habilitados</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.habilitados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deshabilitados</p>
              <p className="text-2xl font-bold text-red-500">{stats.deshabilitados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-amber-800">Leyenda:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">Conectado (último 2 min)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">Reciente (2-10 min)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Inactivo (10-60 min)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-700">Desconectado (+1 hora)</span>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tablet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Conexión
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dispositivos.map((dispositivo) => {
                const connectionStatus = getConnectionStatus(dispositivo.last_seen_at);
                const connectionLabel = getConnectionLabel(connectionStatus);
                const connectionColor = getConnectionColor(connectionStatus);
                
                return (
                <tr key={dispositivo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${
                        dispositivo.activo ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Smartphone className={`w-4 h-4 ${
                          dispositivo.activo ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        {/* Indicador de conexión */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${connectionColor} ${connectionStatus === 'online' ? 'animate-pulse' : ''}`}></div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {dispositivo.tablet_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {dispositivo.nombre_asignado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {/* Estado de habilitación */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        dispositivo.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dispositivo.activo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {dispositivo.activo ? 'Habilitado' : 'Deshabilitado'}
                      </span>
                      {/* Estado de conexión */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        connectionStatus === 'online' ? 'bg-green-100 text-green-800' :
                        connectionStatus === 'recent' ? 'bg-yellow-100 text-yellow-800' :
                        connectionStatus === 'idle' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${connectionColor} ${connectionStatus === 'online' ? 'animate-pulse' : ''}`}></div>
                        {connectionLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-medium ${
                        connectionStatus === 'online' ? 'text-green-600' :
                        connectionStatus === 'offline' ? 'text-red-600' :
                        'text-gray-900'
                      }`}>
                        {getTimeSince(dispositivo.last_seen_at)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatDate(dispositivo.last_seen_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(dispositivo.first_registered_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDevice(dispositivo)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(dispositivo.id, dispositivo.activo)}
                        className={`p-1 rounded transition-colors ${
                          dispositivo.activo
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={dispositivo.activo ? 'Deshabilitar' : 'Habilitar'}
                      >
                        {dispositivo.activo ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(dispositivo.id, dispositivo.tablet_number)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>

          {dispositivos.length === 0 && (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay dispositivos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalles de Tablet {selectedDevice.tablet_number}
                </h3>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-gray-900 mt-1">{selectedDevice.nombre_asignado}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <p className="text-gray-900 mt-1">
                    {selectedDevice.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Huella Digital</label>
                  <p className="text-gray-900 mt-1 font-mono text-xs break-all">
                    {selectedDevice.device_fingerprint}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Información del Dispositivo</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedDevice.device_info, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Primer Registro</label>
                    <p className="text-gray-900 mt-1 text-sm">
                      {formatDate(selectedDevice.first_registered_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Última Conexión</label>
                    <p className="text-gray-900 mt-1 text-sm">
                      {formatDate(selectedDevice.last_seen_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
