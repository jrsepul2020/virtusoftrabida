import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Building2, Calendar, CheckCircle, Clock, Euro } from 'lucide-react';

interface Inscripcion {
  id: string;
  nombre_empresa: string;
  created_at: string;
  status: string;
  totalinscripciones: number;
  pais?: string;
}

interface UltimasInscripcionesProps {
  limit?: number;
  showNotifications?: boolean;
}

export default function UltimasInscripciones({ limit = 10, showNotifications = true }: UltimasInscripcionesProps) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevasCount, setNuevasCount] = useState(0);

  useEffect(() => {
    loadInscripciones();
    
    // Suscripción en tiempo real
    const channel = supabase
      .channel('inscripciones-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'empresas'
        },
        (payload) => {
          console.log('Nueva inscripción detectada:', payload);
          setNuevasCount(prev => prev + 1);
          loadInscripciones(); // Recargar lista
          
          if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Nueva inscripción recibida', {
              body: `${payload.new.nombre_empresa} acaba de inscribirse`,
              icon: '/icon-192x192.png'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, showNotifications]);

  const loadInscripciones = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre_empresa, created_at, status, totalinscripciones, pais')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setInscripciones(data || []);
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pagado': return <CheckCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pagado': return 'Pagado';
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Últimas Inscripciones</h3>
            <p className="text-sm text-gray-500">Tiempo real</p>
          </div>
        </div>
        
        {showNotifications && Notification.permission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Activar notificaciones
          </button>
        )}

        {nuevasCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              {nuevasCount} nueva{nuevasCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100">
        {inscripciones.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay inscripciones recientes</p>
          </div>
        ) : (
          inscripciones.map((inscripcion) => (
            <div
              key={inscripcion.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h4 className="font-medium text-gray-900 truncate">
                      {inscripcion.nombre_empresa}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(inscripcion.created_at)}</span>
                    </div>
                    
                    {inscripcion.pais && (
                      <span className="flex items-center gap-1">
                        🌍 {inscripcion.pais}
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Euro className="w-3.5 h-3.5" />
                      {inscripcion.totalinscripciones} muestra{inscripcion.totalinscripciones !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(inscripcion.status)}`}>
                  {getStatusIcon(inscripcion.status)}
                  {getStatusLabel(inscripcion.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {inscripciones.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total: <span className="font-semibold text-gray-900">{inscripciones.length}</span> inscripciones
            </span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Ver todas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
