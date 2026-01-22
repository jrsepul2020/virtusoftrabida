import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Device, Usuario } from '../lib/supabase';
import { 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  AlertTriangle,
  Monitor,
  User,
  Calendar
} from 'lucide-react';

type DeviceWithUser = Device & {
  usuario?: Usuario;
};

export default function DispositivosManager() {
  const [devices, setDevices] = useState<DeviceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if table exists first
      const { error: testError } = await supabase
        .from('dispositivos')
        .select('id', { count: 'exact', head: true })
        .limit(0);

      if (testError) {
        console.error('❌ Tabla dispositivos no accesible:', testError);
        
        if (testError.code === '42P01' || testError.message?.includes('relation')) {
          setError('⚠️ La tabla "dispositivos" no existe. Ejecuta APLICAR_MIGRACIONES.sql en Supabase.');
        } else if (testError.code === '42501' || testError.message?.includes('policy')) {
          setError('⚠️ Sin permisos RLS. Verifica que las policies estén creadas.');
        } else {
          setError(`Error de base de datos: ${testError.message}`);
        }
        setDevices([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('dispositivos')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Supabase error completo:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
          full: fetchError
        });
        // Check if table exists
        if (fetchError.message?.includes('relation') || fetchError.code === '42P01') {
          setError('⚠️ La tabla "dispositivos" no existe. Aplica las migraciones de la base de datos.');
        } else if (fetchError.message?.includes('policy')) {
          setError('⚠️ Sin permisos RLS. Verifica las políticas de seguridad en Supabase.');
        } else {
          setError(`Error: ${fetchError.message} (código: ${fetchError.code || 'N/A'})`);
        }
        setLoading(false);
        return;
      }

      // Fetch user data separately for each device
      const devicesWithUsers: DeviceWithUser[] = await Promise.all(
        (data || []).map(async (device) => {
          if (!device.user_id) return device;
          
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('id, email, nombre, rol')
            .eq('user_id', device.user_id)
            .maybeSingle();
          
          return { ...device, usuario: usuario || undefined };
        })
      );

      setDevices(devicesWithUsers);
    } catch (err: any) {
      console.error('Error loading devices:', err);
      setError('Error al cargar dispositivos: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceStatus = async (deviceId: string, currentStatus: boolean) => {
    try {
      setActionLoading(deviceId);
      
      const { error: updateError } = await supabase
        .from('dispositivos')
        .update({ activo: !currentStatus })
        .eq('id', deviceId);

      if (updateError) throw updateError;

      await loadDevices();
    } catch (err: any) {
      console.error('Error toggling device status:', err);
      alert('Error al cambiar estado: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('¿Estás seguro de eliminar este dispositivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setActionLoading(deviceId);
      
      const { error: deleteError } = await supabase
        .from('dispositivos')
        .delete()
        .eq('id', deviceId);

      if (deleteError) throw deleteError;

      await loadDevices();
    } catch (err: any) {
      console.error('Error deleting device:', err);
      alert('Error al eliminar dispositivo: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (deviceInfo: any) => {
    const ua = deviceInfo?.userAgent?.toLowerCase() || '';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getStatusBadge = (activo: boolean) => {
    if (activo) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        Inactivo
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Cargando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Gestión de Dispositivos
        </h2>
        <p className="text-gray-600">
          Control de acceso basado en dispositivos. Aprueba o revoca el acceso de dispositivos registrados.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No hay dispositivos registrados</p>
          <p className="text-gray-500 text-sm">
            Los dispositivos se registrarán automáticamente cuando los usuarios inicien sesión
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-gray-600 mt-1">
                    {getDeviceIcon(device.device_info)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {device.nombre_asignado || 'Dispositivo sin nombre'}
                      </h3>
                      {getStatusBadge(device.activo)}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {device.usuario && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {device.usuario.nombre || device.usuario.email}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                            {device.usuario.rol}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Último acceso: {formatDate(device.last_seen_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Registrado: {formatDate(device.first_registered_at)}</span>
                      </div>
                    </div>

                    {device.device_info && (
                      <details className="mt-3">
                        <summary className="text-sm text-primary-600 cursor-pointer hover:text-primary-700">
                          Ver información técnica
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 space-y-1">
                          {device.device_info.userAgent && (
                            <div><strong>User Agent:</strong> {device.device_info.userAgent}</div>
                          )}
                          {device.device_info.platform && (
                            <div><strong>Plataforma:</strong> {device.device_info.platform}</div>
                          )}
                          {device.device_info.screenWidth && (
                            <div>
                              <strong>Pantalla:</strong> {device.device_info.screenWidth}x{device.device_info.screenHeight} 
                              ({device.device_info.screenDepth}-bit)
                            </div>
                          )}
                          {device.device_info.timezone && (
                            <div><strong>Zona horaria:</strong> {device.device_info.timezone}</div>
                          )}
                          <div><strong>Fingerprint:</strong> {device.device_fingerprint.slice(0, 16)}...</div>
                        </div>
                      </details>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDeviceStatus(device.id, device.activo)}
                    disabled={actionLoading === device.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      device.activo
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {actionLoading === device.id ? (
                      <span className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Procesando...
                      </span>
                    ) : device.activo ? (
                      'Desactivar'
                    ) : (
                      'Activar'
                    )}
                  </button>

                  <button
                    onClick={() => deleteDevice(device.id)}
                    disabled={actionLoading === device.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar dispositivo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
