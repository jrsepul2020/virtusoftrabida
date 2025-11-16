import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, User, MapPin, Tablet, Star } from 'lucide-react';

type Props = {
  catador: any;
  onLogout: () => void;
};

export default function CatasDashboard({ catador, onLogout }: Props) {
  const [muestras, setMuestras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMuestras();
  }, []);

  const handleLogout = () => {
    // Remover catador de sesiones activas
    const sessionData = localStorage.getItem('catadores_activos');
    if (sessionData) {
      let catadoresActivos = JSON.parse(sessionData);
      catadoresActivos = catadoresActivos.filter((c: any) => c.id !== catador.id);
      localStorage.setItem('catadores_activos', JSON.stringify(catadoresActivos));
    }
    
    onLogout();
  };

  const fetchMuestras = async () => {
    setLoading(true);
    try {
      // Obtener muestras para la cata
      const { data, error } = await supabase
        .from('muestras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando muestras:', error);
        return;
      }

      setMuestras(data || []);
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Catas
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del catador */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tu información de cata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Catador</p>
                <p className="font-semibold text-gray-900">{catador.nombre}</p>
                <p className="text-xs text-gray-500">{catador.rol}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <MapPin className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ubicación</p>
                <p className="font-semibold text-gray-900">Mesa {catador.mesa}</p>
                <p className="text-xs text-gray-500">Puesto {catador.puesto}</p>
              </div>
            </div>

            {catador.ntablet && (
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Tablet className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Tablet</p>
                  <p className="font-semibold text-gray-900">{catador.ntablet}</p>
                  <p className="text-xs text-gray-500">Dispositivo asignado</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="font-semibold text-gray-900">{catador.estado || 'Activo'}</p>
                <p className="text-xs text-gray-500">Sesión iniciada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Área de catas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Muestras para Catar</h2>
            <p className="text-sm text-gray-600 mt-1">
              Aquí aparecerán las muestras asignadas para tu evaluación
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando muestras...</span>
              </div>
            ) : muestras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {muestras.map((muestra) => (
                  <div key={muestra.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">
                        Código: {muestra.codigo || `M-${muestra.id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        muestra.tanda 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {muestra.tanda ? `Tanda ${muestra.tanda}` : 'Sin tanda'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Empresa:</strong> {muestra.empresa || 'No especificada'}</p>
                      <p><strong>Descripción:</strong> {muestra.descripcion || 'Sin descripción'}</p>
                      {muestra.observaciones && (
                        <p><strong>Observaciones:</strong> {muestra.observaciones}</p>
                      )}
                    </div>

                    <button className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                      Iniciar Cata
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay muestras disponibles</h3>
                <p className="text-gray-600">
                  Las muestras para catar aparecerán aquí cuando estén disponibles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}