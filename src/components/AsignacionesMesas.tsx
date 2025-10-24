import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, UserCheck, Trash2, Users, MapPin } from 'lucide-react';

type Mesa = {
  id: string;
  numero: number;
  nombre?: string;
  capacidad?: number;
  ubicacion?: string;
  activa?: boolean;
};

type Catador = {
  id: string;
  nombre: string;
  email?: string;
  especialidad?: string;
  activo?: boolean;
};

type Asignacion = {
  id: string;
  catador_id: string;
  mesa_id: string;
  puesto: number;
  fecha_asignacion: string;
  activa: boolean;
  catador?: Catador;
  mesa?: Mesa;
};

export default function AsignacionesMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [catadores, setCatadores] = useState<Catador[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para nueva asignación
  const [selectedMesa, setSelectedMesa] = useState('');
  const [selectedCatador, setSelectedCatador] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener mesas
      const { data: mesasData, error: mesasError } = await supabase
        .from('mesas')
        .select('*')
        .eq('activa', true)
        .order('numero', { ascending: true });

      if (mesasError) throw mesasError;

      // Obtener catadores
      const { data: catadoresData, error: catadoresError } = await supabase
        .from('catadores')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (catadoresError) throw catadoresError;

      // Obtener asignaciones
      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones_mesas')
        .select(`
          *,
          catador:catadores(*),
          mesa:mesas(*)
        `)
        .eq('activa', true)
        .order('mesa_id, puesto', { ascending: true });

      if (asignacionesError) throw asignacionesError;

      setMesas(mesasData || []);
      setCatadores(catadoresData || []);
      setAsignaciones(asignacionesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPuestosDisponibles = (mesaId: string) => {
    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa) return [];
    
    const puestosOcupados = asignaciones
      .filter(a => a.mesa_id === mesaId && a.activa)
      .map(a => a.puesto);
    
    const todosPuestos = Array.from({ length: mesa.capacidad || 8 }, (_, i) => i + 1);
    return todosPuestos.filter(puesto => !puestosOcupados.includes(puesto));
  };

  const getCatadoresDisponibles = () => {
    const catadoresAsignados = asignaciones
      .filter(a => a.activa)
      .map(a => a.catador_id);
    
    return catadores.filter(c => !catadoresAsignados.includes(c.id));
  };

  const handleAddAsignacion = async () => {
    if (!selectedMesa || !selectedCatador || !selectedPuesto) {
      alert('Por favor, selecciona mesa, catador y puesto');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('asignaciones_mesas')
        .insert({
          mesa_id: selectedMesa,
          catador_id: selectedCatador,
          puesto: parseInt(selectedPuesto),
          activa: true
        });

      if (error) throw error;

      // Resetear formulario
      setSelectedMesa('');
      setSelectedCatador('');
      setSelectedPuesto('');
      setShowAddForm(false);
      
      // Recargar datos
      await fetchData();
    } catch (error) {
      console.error('Error adding asignación:', error);
      alert('Error al crear la asignación');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAsignacion = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignación?')) return;

    try {
      const { error } = await supabase
        .from('asignaciones_mesas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error removing asignación:', error);
      alert('Error al eliminar la asignación');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Asignaciones</h2>
            <p className="text-gray-600 text-sm mt-1">Asigna catadores a mesas y puestos específicos</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Asignación
          </button>
        </div>

        {/* Formulario de nueva asignación */}
        {showAddForm && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Nueva Asignación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesa</label>
                <select
                  value={selectedMesa}
                  onChange={(e) => {
                    setSelectedMesa(e.target.value);
                    setSelectedPuesto(''); // Reset puesto when mesa changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleccionar mesa</option>
                  {mesas.map(mesa => (
                    <option key={mesa.id} value={mesa.id}>
                      Mesa {mesa.numero} - {mesa.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puesto</label>
                <select
                  value={selectedPuesto}
                  onChange={(e) => setSelectedPuesto(e.target.value)}
                  disabled={!selectedMesa}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Seleccionar puesto</option>
                  {selectedMesa && getPuestosDisponibles(selectedMesa).map(puesto => (
                    <option key={puesto} value={puesto}>
                      Puesto {puesto}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catador</label>
                <select
                  value={selectedCatador}
                  onChange={(e) => setSelectedCatador(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleccionar catador</option>
                  {getCatadoresDisponibles().map(catador => (
                    <option key={catador.id} value={catador.id}>
                      {catador.nombre} {catador.especialidad && `(${catador.especialidad})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddAsignacion}
                disabled={saving || !selectedMesa || !selectedCatador || !selectedPuesto}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Guardando...' : 'Asignar'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de asignaciones */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Asignaciones Actuales</h3>
        
        {asignaciones.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asignaciones</h3>
            <p className="text-gray-500">Crea la primera asignación para comenzar a organizar las mesas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vista desktop - tabla */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asignaciones.map((asignacion) => (
                      <tr key={asignacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              Mesa {asignacion.mesa?.numero}
                            </div>
                            {asignacion.mesa?.nombre && (
                              <div className="text-sm text-gray-500 ml-2">
                                ({asignacion.mesa.nombre})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Puesto {asignacion.puesto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {asignacion.catador?.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {asignacion.catador?.especialidad || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {asignacion.mesa?.ubicacion || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveAsignacion(asignacion.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista mobile - cards */}
            <div className="lg:hidden space-y-4">
              {asignaciones.map((asignacion) => (
                <div key={asignacion.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Mesa {asignacion.mesa?.numero} - Puesto {asignacion.puesto}
                      </h4>
                      {asignacion.mesa?.nombre && (
                        <p className="text-sm text-gray-600">{asignacion.mesa.nombre}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveAsignacion(asignacion.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{asignacion.catador?.nombre}</span>
                      {asignacion.catador?.especialidad && (
                        <span className="text-gray-500">• {asignacion.catador.especialidad}</span>
                      )}
                    </div>
                    
                    {asignacion.mesa?.ubicacion && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {asignacion.mesa.ubicacion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}