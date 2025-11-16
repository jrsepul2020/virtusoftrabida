import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Smartphone, Trash2, RefreshCw, CheckCircle, XCircle, Eye } from 'lucide-react';

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

  useEffect(() => {
    loadDispositivos();
  }, []);

  const loadDispositivos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*')
        .order('tablet_number');

      if (error) {
        console.error('Error al cargar dispositivos:', error);
        // Si la tabla no existe, mostrar mensaje amigable
        if (error.code === '42P01') {
          alert('La tabla "dispositivos" no existe. Por favor, ejecuta la migración en Supabase.');
        } else {
          alert('Error al cargar dispositivos: ' + error.message);
        }
        throw error;
      }
      
      console.log(`Dispositivos: ${data?.length || 0} cargados`);
      setDispositivos(data || []);
    } catch (error) {
      console.error('Error crítico en dispositivos:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 2) return `${diffMins}m (Online)`;
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const isRecentlyActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = (now.getTime() - date.getTime()) / 60000;
    return diffMins < 2; // Activo si se vio en los últimos 2 minutos
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispositivos Registrados</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las tablets registradas en el sistema
          </p>
        </div>
        <button
          onClick={loadDispositivos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{dispositivos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => d.activo).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => !d.activo).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Conectados</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => isRecentlyActive(d.last_seen_at)).length}
              </p>
            </div>
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
              {dispositivos.map((dispositivo) => (
                <tr key={dispositivo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        dispositivo.activo ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Smartphone className={`w-4 h-4 ${
                          dispositivo.activo ? 'text-blue-600' : 'text-gray-400'
                        }`} />
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
                    <div className="flex items-center gap-2">
                      {isRecentlyActive(dispositivo.last_seen_at) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        dispositivo.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dispositivo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">
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
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={dispositivo.activo ? 'Desactivar' : 'Activar'}
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
              ))}
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
