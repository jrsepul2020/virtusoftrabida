import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

type Mesa = {
  id: string;
  mesa: number;
  'puesto 1': boolean;
  'puesto 2': boolean;
  'puesto 3': boolean;
  'puesto 4': boolean;
  'puesto 5': boolean;
  completa: boolean;
  created_at: string;
};

type CatadorActivo = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  mesa: number;
  puesto: number;
  ntablet?: string;
  loginTime: string;
};

export default function MesasManager() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [catadoresActivos, setCatadoresActivos] = useState<CatadorActivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMesas();
    fetchCatadoresActivos();
    
    // Actualizar catadores activos cada 30 segundos
    const interval = setInterval(fetchCatadoresActivos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMesas = async () => {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('mesa', { ascending: true });

      if (error) {
        console.error('Error fetching mesas:', error);
        return;
      }

      setMesas(data || []);
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatadoresActivos = async () => {
    try {
      // Por ahora simulamos catadores activos basados en localStorage
      // En una implementación real, esto vendría de una tabla de sesiones
      const sessionData = localStorage.getItem('catadores_activos');
      let activos: CatadorActivo[] = [];
      
      if (sessionData) {
        activos = JSON.parse(sessionData);
        // Filtrar sesiones que han expirado (más de 4 horas)
        const ahora = new Date().getTime();
        activos = activos.filter(catador => {
          const loginTime = new Date(catador.loginTime).getTime();
          const cuatroHoras = 4 * 60 * 60 * 1000;
          return (ahora - loginTime) < cuatroHoras;
        });
        
        // Actualizar localStorage con sesiones válidas
        localStorage.setItem('catadores_activos', JSON.stringify(activos));
      }
      
      setCatadoresActivos(activos);
    } catch (error) {
      console.error('Error fetching catadores activos:', error);
    }
  };

  const addNewMesa = async () => {
    const ultimaMesa = mesas.length > 0 ? Math.max(...mesas.map(m => m.mesa)) : 0;
    const nuevoNumeroMesa = ultimaMesa + 1;

    try {
      const { data, error } = await supabase
        .from('mesas')
        .insert([
          {
            mesa: nuevoNumeroMesa,
            'puesto 1': false,
            'puesto 2': false,
            'puesto 3': false,
            'puesto 4': false,
            'puesto 5': false,
            completa: false
          }
        ])
        .select();

      if (error) {
        console.error('Error creating mesa:', error);
        return;
      }

      if (data) {
        setMesas([...mesas, ...data]);
      }
    } catch (error) {
      console.error('Error general:', error);
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Mesas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Estado en tiempo real de catadores activos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchCatadoresActivos();
              fetchMesas();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={addNewMesa}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Mesa
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800">Total Mesas</h3>
          <p className="text-2xl font-bold text-blue-600">{mesas.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800">Catadores Activos</h3>
          <p className="text-2xl font-bold text-green-600">{catadoresActivos.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800">Puestos Ocupados</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {catadoresActivos.length} / {mesas.length * 5}
          </p>
        </div>
      </div>

      {/* Visualización de mesas con catadores */}
      {mesas.length > 0 && (
        <div className="space-y-6">
          {mesas.map((mesa) => {
            const catadoresEnMesa = catadoresActivos.filter(c => c.mesa === mesa.mesa);
            return (
              <div key={mesa.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Mesa {mesa.mesa}</h3>
                      <p className="text-sm text-gray-600">
                        {catadoresEnMesa.length}/5 puestos ocupados
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar esta mesa?')) {
                          supabase.from('mesas').delete().eq('id', mesa.id).then(() => {
                            setMesas(mesas.filter(m => m.id !== mesa.id));
                          });
                        }
                      }}
                      className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                      title="Eliminar mesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visualización de puestos */}
                <div className="p-6">
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(puestoNum => {
                      const catadorEnPuesto = catadoresEnMesa.find(c => c.puesto === puestoNum);
                      const puestoKey = `puesto ${puestoNum}` as keyof Mesa;
                      const puestoHabilitado = mesa[puestoKey] as boolean;
                      
                      return (
                        <div
                          key={puestoNum}
                          className={`border rounded-lg p-4 text-center transition-all ${
                            catadorEnPuesto
                              ? 'border-green-500 bg-green-50'
                              : puestoHabilitado
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className={`text-lg font-bold mb-2 ${
                            catadorEnPuesto
                              ? 'text-green-700'
                              : puestoHabilitado
                              ? 'text-yellow-700'
                              : 'text-gray-500'
                          }`}>
                            Puesto {puestoNum}
                          </div>
                          
                          {catadorEnPuesto ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-green-800 text-sm">
                                {catadorEnPuesto.nombre}
                              </div>
                              <div className="text-xs text-green-600">
                                {catadorEnPuesto.rol}
                              </div>
                              {catadorEnPuesto.ntablet && (
                                <div className="text-xs text-green-600">
                                  📱 {catadorEnPuesto.ntablet}
                                </div>
                              )}
                              <div className="text-xs text-green-500">
                                🟢 Activo
                              </div>
                            </div>
                          ) : puestoHabilitado ? (
                            <div className="text-sm text-yellow-600">
                              Disponible
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              No habilitado
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mesas.length === 0 && !loading && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas</h3>
          <p className="text-gray-500 mb-4">Comienza agregando una nueva mesa.</p>
          <button
            onClick={addNewMesa}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Mesa
          </button>
        </div>
      )}
    </div>
  );
}
