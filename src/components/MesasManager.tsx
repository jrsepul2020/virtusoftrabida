import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Grid3X3, Edit2, Trash2, Plus } from 'lucide-react';

type Mesa = {
  id: string;
  numero: number;
  nombre?: string;
  capacidad?: number;
  ubicacion?: string;
  activa?: boolean;
  created_at: string;
};

export default function MesasManager() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [filteredMesas, setFilteredMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [newMesa, setNewMesa] = useState<Partial<Mesa>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMesas();
  }, []);

  useEffect(() => {
    filterMesas();
  }, [searchTerm, mesas]);

  const fetchMesas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;
      setMesas(data || []);
    } catch (error) {
      console.error('Error fetching mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMesas = () => {
    if (!searchTerm) {
      setFilteredMesas(mesas);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = mesas.filter(
      (mesa) =>
        mesa.numero.toString().includes(term) ||
        mesa.nombre?.toLowerCase().includes(term) ||
        mesa.ubicacion?.toLowerCase().includes(term)
    );
    setFilteredMesas(filtered);
  };

  const handleSave = async (mesa: Mesa) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mesas')
        .update({
          numero: mesa.numero,
          nombre: mesa.nombre,
          capacidad: mesa.capacidad,
          ubicacion: mesa.ubicacion,
          activa: mesa.activa
        })
        .eq('id', mesa.id);

      if (error) throw error;
      setEditingMesa(null);
      await fetchMesas();
    } catch (error) {
      console.error('Error updating mesa:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newMesa.numero) {
      alert('El número de mesa es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('mesas')
        .insert([{
          numero: newMesa.numero,
          nombre: newMesa.nombre,
          capacidad: newMesa.capacidad,
          ubicacion: newMesa.ubicacion,
          activa: newMesa.activa ?? true
        }]);

      if (error) throw error;
      setNewMesa({});
      setShowAddForm(false);
      await fetchMesas();
    } catch (error) {
      console.error('Error adding mesa:', error);
      alert('Error al añadir la mesa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, numero: number) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la mesa ${numero}?`)) {
      return;
    }

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
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Mesa
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar por número, nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredMesas.length} de {mesas.length} mesas
        </div>
      </div>

      {/* Lista responsive */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabla para pantallas grandes */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mesa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMesas.map((mesa) => (
                <tr key={mesa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Grid3X3 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">Mesa {mesa.numero}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {mesa.nombre || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {mesa.capacidad || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {mesa.ubicacion || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mesa.activa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mesa.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEditingMesa({...mesa})}
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mesa.id, mesa.numero)}
                        className="text-red-600 hover:text-red-700"
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
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden">
          {filteredMesas.map((mesa) => (
            <div key={mesa.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <Grid3X3 className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mesa {mesa.numero}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      mesa.activa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mesa.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMesa({...mesa})}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mesa.id, mesa.numero)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                {mesa.nombre && (
                  <div className="text-gray-600">
                    <span className="font-medium">Nombre:</span> {mesa.nombre}
                  </div>
                )}
                {mesa.capacidad && (
                  <div className="text-gray-600">
                    <span className="font-medium">Capacidad:</span> {mesa.capacidad} personas
                  </div>
                )}
                {mesa.ubicacion && (
                  <div className="text-gray-600">
                    <span className="font-medium">Ubicación:</span> {mesa.ubicacion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMesas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron mesas
          </div>
        )}
      </div>

      {/* Modal para añadir mesa */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Añadir Nueva Mesa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa *
                </label>
                <input
                  type="number"
                  value={newMesa.numero || ''}
                  onChange={(e) => setNewMesa({...newMesa, numero: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newMesa.nombre || ''}
                  onChange={(e) => setNewMesa({...newMesa, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Mesa VIP, Mesa Jurado..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="number"
                  value={newMesa.capacidad || ''}
                  onChange={(e) => setNewMesa({...newMesa, capacidad: parseInt(e.target.value) || undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={newMesa.ubicacion || ''}
                  onChange={(e) => setNewMesa({...newMesa, ubicacion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Sala A, Planta Baja..."
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMesa.activa ?? true}
                    onChange={(e) => setNewMesa({...newMesa, activa: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activa</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMesa({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newMesa.numero}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar mesa */}
      {editingMesa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Mesa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa *
                </label>
                <input
                  type="number"
                  value={editingMesa.numero}
                  onChange={(e) => setEditingMesa({...editingMesa, numero: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingMesa.nombre || ''}
                  onChange={(e) => setEditingMesa({...editingMesa, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="number"
                  value={editingMesa.capacidad || ''}
                  onChange={(e) => setEditingMesa({...editingMesa, capacidad: parseInt(e.target.value) || undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={editingMesa.ubicacion || ''}
                  onChange={(e) => setEditingMesa({...editingMesa, ubicacion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingMesa.activa ?? true}
                    onChange={(e) => setEditingMesa({...editingMesa, activa: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activa</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingMesa(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(editingMesa)}
                disabled={saving || !editingMesa.numero}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}