import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Edit2, Trash2, Plus, X, Eye, Crown, Star } from 'lucide-react';

type Catador = {
  id: string;
  nombre: string;
  rol?: string;
  mesa?: number;
  puesto?: number;
  ntablet?: string;
  estado?: 'activo' | 'inactivo' | 'presente' | 'ausente';
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
  const [viewingCatador, setViewingCatador] = useState<Catador | null>(null);
  const [newCatador, setNewCatador] = useState<Partial<Catador>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Función para obtener colores de mesa
  const getMesaColors = (mesa: number) => {
    const colors = {
      1: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-300', text: 'text-purple-800', button: 'bg-gradient-to-r from-purple-500 to-pink-500' },
      2: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-300', text: 'text-blue-800', button: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
      3: { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-300', text: 'text-emerald-800', button: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
      4: { bg: 'from-orange-500/20 to-red-500/20', border: 'border-orange-300', text: 'text-orange-800', button: 'bg-gradient-to-r from-orange-500 to-red-500' },
      5: { bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-300', text: 'text-indigo-800', button: 'bg-gradient-to-r from-indigo-500 to-purple-500' }
    };
    return colors[mesa as keyof typeof colors] || { bg: '', border: 'border-gray-300', text: 'text-gray-800', button: 'bg-gray-500' };
  };

  // Función para estilos de presidente
  const getPresidenteStyles = () => ({
    bg: 'from-yellow-400/30 to-amber-400/30',
    border: 'border-yellow-400',
    text: 'text-yellow-900',
    icon: 'text-yellow-600'
  });

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

  const handleFieldUpdate = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('catadores')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      // Actualizar el estado local
      setCatadores(prev => prev.map(catador => 
        catador.id === id ? { ...catador, [field]: value } : catador
      ));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert(`Error al actualizar ${field}`);
    }
  };

  const handleSave = async (catador: Catador) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('catadores')
        .update({
          nombre: catador.nombre,
          rol: catador.rol,
          mesa: catador.mesa,
          puesto: catador.puesto,
          ntablet: catador.ntablet,
          estado: catador.estado,
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
          rol: newCatador.rol,
          mesa: newCatador.mesa,
          puesto: newCatador.puesto,
          ntablet: newCatador.ntablet,
          estado: newCatador.estado || 'activo',
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
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Catador
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Mesa
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Puesto
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Tablet
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCatadores.map((catador) => {
                const isPresidente = catador.rol === 'presidente';
                const mesaColors = catador.mesa ? getMesaColors(catador.mesa) : null;
                const presidenteStyles = isPresidente ? getPresidenteStyles() : null;
                
                return (
                  <tr 
                    key={catador.id} 
                    className={`
                      group transition-all duration-500 cursor-pointer transform hover:scale-[1.01]
                      ${isPresidente 
                        ? `bg-gradient-to-r ${presidenteStyles?.bg} border-l-4 ${presidenteStyles?.border} shadow-lg` 
                        : mesaColors 
                          ? `bg-gradient-to-r ${mesaColors.bg} border-l-4 ${mesaColors.border}` 
                          : 'hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setViewingCatador(catador)}
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {isPresidente && (
                          <div className="flex items-center gap-1">
                            <Crown className={`w-5 h-5 ${presidenteStyles?.icon} animate-pulse`} />
                            <Star className={`w-4 h-4 ${presidenteStyles?.icon} animate-bounce`} />
                          </div>
                        )}
                        <div>
                          <div className={`text-sm font-bold ${isPresidente ? presidenteStyles?.text : 'text-gray-900'}`}>
                            {catador.nombre}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            {catador.email && <div>{catador.email}</div>}
                            {catador.telefono && <div>{catador.telefono}</div>}
                            {catador.especialidad && <div className="italic">{catador.especialidad}</div>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <select
                        value={catador.rol || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'rol', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`
                          w-full text-sm rounded-lg px-3 py-2 font-medium transition-all duration-300
                          ${isPresidente 
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-md' 
                            : 'border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500'
                          }
                        `}
                      >
                        <option value="">Seleccionar</option>
                        <option value="catador">🎯 Catador</option>
                        <option value="presidente">👑 Presidente</option>
                      </select>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(num => {
                          const isSelected = catador.mesa === num;
                          const colors = getMesaColors(num);
                          return (
                            <button
                              key={num}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldUpdate(catador.id, 'mesa', isSelected ? undefined : num);
                              }}
                              className={`
                                w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-110
                                ${isSelected 
                                  ? `${colors.button} text-white shadow-lg` 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }
                              `}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(num => {
                          const isSelected = catador.puesto === num;
                          const mesaColors = catador.mesa ? getMesaColors(catador.mesa) : null;
                          return (
                            <button
                              key={num}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldUpdate(catador.id, 'puesto', isSelected ? undefined : num);
                              }}
                              className={`
                                w-8 h-8 rounded text-xs font-bold transition-all duration-300 transform hover:scale-110
                                ${isSelected && mesaColors
                                  ? `${mesaColors.button} text-white shadow-lg` 
                                  : isSelected 
                                    ? 'bg-blue-500 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }
                              `}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <select
                        value={catador.ntablet || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'ntablet', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`
                          w-full text-sm rounded-lg px-3 py-2 transition-all duration-300
                          ${mesaColors 
                            ? `bg-white border-2 ${mesaColors.border} ${mesaColors.text} shadow-sm` 
                            : 'border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500'
                          }
                        `}
                      >
                        <option value="">📱 Tablet</option>
                        {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                          <option key={num} value={num.toString()}>📱 {num}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setViewingCatador(catador)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition-all duration-300 transform hover:scale-110"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCatador({...catador})}
                          className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-100 transition-all duration-300 transform hover:scale-110"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(catador.id, catador.nombre)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-all duration-300 transform hover:scale-110"
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
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden">
          {filteredCatadores.map((catador) => (
            <div 
              key={catador.id} 
              className="border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setViewingCatador(catador)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">{catador.nombre}</h3>
                  
                  {/* Selectores en móvil */}
                  <div className="grid grid-cols-2 gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Rol</label>
                      <select
                        value={catador.rol || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'rol', e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="catador">Catador</option>
                        <option value="presidente">Presidente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mesa</label>
                      <select
                        value={catador.mesa || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'mesa', parseInt(e.target.value) || undefined)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Mesa</option>
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Puesto</label>
                      <select
                        value={catador.puesto || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'puesto', parseInt(e.target.value) || undefined)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Puesto</option>
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tablet</label>
                      <select
                        value={catador.ntablet || ''}
                        onChange={(e) => handleFieldUpdate(catador.id, 'ntablet', e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Tablet</option>
                        {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                          <option key={num} value={num.toString()}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setViewingCatador(catador)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCatador({...catador})}
                    className="text-green-600 hover:text-green-700 p-1"
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
              
              <div className="text-xs text-gray-500">
                {catador.email && <div>{catador.email}</div>}
                {catador.telefono && <div>{catador.telefono}</div>}
                {catador.especialidad && <div>{catador.especialidad}</div>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    Rol
                  </label>
                  <select
                    value={newCatador.rol || ''}
                    onChange={(e) => setNewCatador({...newCatador, rol: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="catador">Catador</option>
                    <option value="presidente">Presidente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesa
                  </label>
                  <select
                    value={newCatador.mesa || ''}
                    onChange={(e) => setNewCatador({...newCatador, mesa: parseInt(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar mesa</option>
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto
                  </label>
                  <select
                    value={newCatador.puesto || ''}
                    onChange={(e) => setNewCatador({...newCatador, puesto: parseInt(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar puesto</option>
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº Tablet
                  </label>
                  <select
                    value={newCatador.ntablet || ''}
                    onChange={(e) => setNewCatador({...newCatador, ntablet: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar tablet</option>
                    {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Modal de detalles */}
      {viewingCatador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-800">Detalles del Catador</h3>
              <button
                onClick={() => setViewingCatador(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información personal */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Personal</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-gray-900 font-medium">{viewingCatador.nombre}</p>
                </div>
                
                {viewingCatador.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{viewingCatador.email}</p>
                  </div>
                )}
                
                {viewingCatador.telefono && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{viewingCatador.telefono}</p>
                  </div>
                )}
                
                {viewingCatador.especialidad && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Especialidad</label>
                    <p className="text-gray-900">{viewingCatador.especialidad}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado General</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    viewingCatador.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingCatador.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Información de asignación */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Asignación</h4>
                
                {viewingCatador.rol && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Rol</label>
                    <p className="text-gray-900 font-medium">{viewingCatador.rol}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mesa</label>
                    <p className="text-gray-900">{viewingCatador.mesa ? `Mesa ${viewingCatador.mesa}` : 'No asignada'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Puesto</label>
                    <p className="text-gray-900">{viewingCatador.puesto || 'No asignado'}</p>
                  </div>
                </div>
                
                {viewingCatador.ntablet && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tablet Asignada</label>
                    <p className="text-gray-900 font-mono">{viewingCatador.ntablet}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado de Asistencia</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    viewingCatador.estado === 'presente'
                      ? 'bg-green-100 text-green-800' 
                      : viewingCatador.estado === 'ausente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : viewingCatador.estado === 'activo'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingCatador.estado || 'Sin estado'}
                  </span>
                </div>
                
                {viewingCatador.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Fecha de Registro</label>
                    <p className="text-gray-900">{new Date(viewingCatador.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setViewingCatador(null);
                  setEditingCatador({...viewingCatador});
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar Catador
              </button>
              <button
                onClick={() => setViewingCatador(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}