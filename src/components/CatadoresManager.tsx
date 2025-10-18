import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

type Catador = {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  activo?: boolean;
  created_at: string;
};

export default function CatadoresManager() {
  const [catadores, setCatadores] = useState<Catador[]>([]);
  const [filteredCatadores, setFilteredCatadores] = useState<Catador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCatador, setEditingCatador] = useState<Catador | null>(null);
  const [newCatador, setNewCatador] = useState<Partial<Catador>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCatadores();
  }, []);

  useEffect(() => {
    filterCatadores();
  }, [searchTerm, catadores]);

  const fetchCatadores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('catadores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCatadores(data || []);
    } catch (error) {
      console.error('Error fetching catadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCatadores = () => {
    if (!searchTerm) {
      setFilteredCatadores(catadores);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = catadores.filter(
      (catador) =>
        catador.nombre.toLowerCase().includes(term) ||
        catador.email?.toLowerCase().includes(term) ||
        catador.especialidad?.toLowerCase().includes(term)
    );
    setFilteredCatadores(filtered);
  };

  const handleSave = async (catador: Catador) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('catadores')
        .update({
          nombre: catador.nombre,
          email: catador.email,
          telefono: catador.telefono,
          especialidad: catador.especialidad,
          activo: catador.activo
        })
        .eq('id', catador.id);

      if (error) throw error;
      setEditingCatador(null);
      await fetchCatadores();
    } catch (error) {
      console.error('Error updating catador:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newCatador.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('catadores')
        .insert([{
          nombre: newCatador.nombre,
          email: newCatador.email,
          telefono: newCatador.telefono,
          especialidad: newCatador.especialidad,
          activo: newCatador.activo ?? true
        }]);

      if (error) throw error;
      setNewCatador({});
      setShowAddForm(false);
      await fetchCatadores();
    } catch (error) {
      console.error('Error adding catador:', error);
      alert('Error al añadir el catador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el catador "${nombre}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('catadores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCatadores();
    } catch (error) {
      console.error('Error deleting catador:', error);
      alert('Error al eliminar el catador');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando catadores...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Catadores</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Catador
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredCatadores.length} de {catadores.length} catadores
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
                  Catador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidad
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
              {filteredCatadores.map((catador) => (
                <tr key={catador.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{catador.nombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{catador.email}</div>
                    <div className="text-sm text-gray-500">{catador.telefono}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {catador.especialidad || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      catador.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {catador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEditingCatador({...catador})}
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(catador.id, catador.nombre)}
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
          {filteredCatadores.map((catador) => (
            <div key={catador.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{catador.nombre}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      catador.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {catador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCatador({...catador})}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(catador.id, catador.nombre)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                {catador.email && (
                  <div className="text-gray-600">
                    <span className="font-medium">Email:</span> {catador.email}
                  </div>
                )}
                {catador.telefono && (
                  <div className="text-gray-600">
                    <span className="font-medium">Teléfono:</span> {catador.telefono}
                  </div>
                )}
                {catador.especialidad && (
                  <div className="text-gray-600">
                    <span className="font-medium">Especialidad:</span> {catador.especialidad}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCatadores.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron catadores
          </div>
        )}
      </div>

      {/* Modal para añadir catador */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Añadir Nuevo Catador</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newCatador.nombre || ''}
                  onChange={(e) => setNewCatador({...newCatador, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCatador.email || ''}
                  onChange={(e) => setNewCatador({...newCatador, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newCatador.telefono || ''}
                  onChange={(e) => setNewCatador({...newCatador, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={newCatador.especialidad || ''}
                  onChange={(e) => setNewCatador({...newCatador, especialidad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCatador.activo ?? true}
                    onChange={(e) => setNewCatador({...newCatador, activo: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCatador({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newCatador.nombre}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar catador */}
      {editingCatador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Catador</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editingCatador.nombre}
                  onChange={(e) => setEditingCatador({...editingCatador, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingCatador.email || ''}
                  onChange={(e) => setEditingCatador({...editingCatador, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editingCatador.telefono || ''}
                  onChange={(e) => setEditingCatador({...editingCatador, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={editingCatador.especialidad || ''}
                  onChange={(e) => setEditingCatador({...editingCatador, especialidad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCatador.activo ?? true}
                    onChange={(e) => setEditingCatador({...editingCatador, activo: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingCatador(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(editingCatador)}
                disabled={saving || !editingCatador.nombre}
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