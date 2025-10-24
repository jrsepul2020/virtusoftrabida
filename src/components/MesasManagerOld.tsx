import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Trash2, Plus } from 'lucide-react';

type Mesa = {
  id: number;
  mesa: number;
  "puesto 1": boolean;
  "puesto 2": boolean;
  "puesto 3": boolean;
  "puesto 4": boolean;
  "puesto 5": boolean;
  completa: boolean;
  created_at: string;
};

export default function MesasManager() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [filteredMesas, setFilteredMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('Iniciando...');

  useEffect(() => {
    fetchMesas();
  }, []);

  useEffect(() => {
    filterMesas();
  }, [searchTerm, mesas]);

  const fetchMesas = async () => {
    setLoading(true);
    setDebugInfo('Conectando a Supabase...');
    
    try {
      const { data, error, count } = await supabase
        .from('mesas')
        .select('*', { count: 'exact' })
        .order('mesa', { ascending: true });

      setDebugInfo(`Consulta ejecutada. Error: ${error ? error.message : 'ninguno'}, Count: ${count}, Data length: ${data?.length || 0}`);
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        setDebugInfo(`❌ Error: ${error.message}`);
        return;
      }

      console.log('✅ Datos recibidos:', data);
      setMesas(data || []);
      setDebugInfo(`✅ ${data?.length || 0} mesas cargadas`);
      
    } catch (error) {
      console.error('❌ Error general:', error);
      setDebugInfo(`❌ Error general: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const filterMesas = () => {
    if (!searchTerm) {
      setFilteredMesas(mesas);
      return;
    }

    const filtered = mesas.filter(mesa =>
      mesa.mesa?.toString().includes(searchTerm.toLowerCase())
    );
    setFilteredMesas(filtered);
  };

  const getPuestosOcupados = (mesa: Mesa): number => {
    return [
      mesa["puesto 1"],
      mesa["puesto 2"], 
      mesa["puesto 3"],
      mesa["puesto 4"],
      mesa["puesto 5"]
    ].filter(puesto => puesto).length;
  };

  const togglePuesto = async (mesaId: number, puestoNum: number) => {
    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    const puestoKey = `puesto ${puestoNum}` as keyof Mesa;
    const newValue = !mesa[puestoKey];

    try {
      const { error } = await supabase
        .from('mesas')
        .update({ [puestoKey]: newValue })
        .eq('id', mesaId);

      if (error) throw error;
      await fetchMesas();
    } catch (error) {
      console.error('Error updating puesto:', error);
      alert('Error al actualizar el puesto');
    }
  };

  const addNewMesa = async () => {
    const nextMesaNum = Math.max(...mesas.map(m => m.mesa), 0) + 1;
    
    try {
      const { error } = await supabase
        .from('mesas')
        .insert({
          mesa: nextMesaNum,
          "puesto 1": false,
          "puesto 2": false,
          "puesto 3": false,
          "puesto 4": false,
          "puesto 5": false,
          completa: false
        });

      if (error) throw error;
      await fetchMesas();
    } catch (error) {
      console.error('Error adding mesa:', error);
      alert('Error al agregar mesa');
    }
  };

  const handleDeleteMesa = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mesa?')) return;

    try {
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMesas();
    } catch (error) {
      console.error('Error deleting mesa:', error);
      alert('Error al eliminar la mesa');
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
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
          <p className="text-gray-600 text-sm mt-1">Administra las mesas y sus puestos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMesas}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Refrescar'}
          </button>
          <button
            onClick={addNewMesa}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Mesa
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar mesa por número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Debug info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Información de Debug</h3>
        <p className="text-sm text-blue-700 mb-2">Estado: {debugInfo}</p>
        <p className="text-sm text-blue-700 mb-2">Loading: {loading ? 'Sí' : 'No'}</p>
        <p className="text-sm text-blue-700 mb-2">Mesas en estado: {mesas.length}</p>
        <p className="text-sm text-blue-700">Mesas filtradas: {filteredMesas.length}</p>
      </div>

      {/* Mesa Management Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mesa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puestos Ocupados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gestión de Puestos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMesas.map((mesa) => {
                const puestosOcupados = getPuestosOcupados(mesa);
                return (
                  <tr key={mesa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-medium text-gray-900">Mesa {mesa.mesa}</div>
                      <div className="text-xs text-gray-500">ID: {mesa.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {puestosOcupados}/5 ocupados
                      </div>
                      <div className="text-xs text-gray-500">
                        {5 - puestosOcupados} libres
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mesa.completa 
                          ? 'bg-red-100 text-red-800' 
                          : puestosOcupados === 0 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mesa.completa ? 'Completa' : puestosOcupados === 0 ? 'Libre' : `${puestosOcupados}/5 Ocupados`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(puestoNum => {
                          const puestoKey = `puesto ${puestoNum}` as keyof Mesa;
                          const ocupado = mesa[puestoKey] as boolean;
                          return (
                            <button
                              key={puestoNum}
                              onClick={() => togglePuesto(mesa.id, puestoNum)}
                              className={`w-8 h-8 rounded-full text-xs font-bold border-2 transition-colors ${
                                ocupado
                                  ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                                  : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                              }`}
                              title={`Puesto ${puestoNum}: ${ocupado ? 'Ocupado - Click para liberar' : 'Libre - Click para ocupar'}`}
                            >
                              {puestoNum}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Click para cambiar estado
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMesa(mesa.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredMesas.length === 0 && !loading && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas</h3>
          <p className="text-gray-500 mb-4">Comienza agregando una nueva mesa.</p>
          <button
            onClick={addNewMesa}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Mesa
          </button>
        </div>
      )}
    </div>
  );
}