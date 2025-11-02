import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Save, X, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';

interface Catador {
  id: string;
  codigocatador: string | null;
  nombre: string;
  pais: string | null;
  rol: string | null;
  mesa: number | null;
  puesto: number | null;
  tablet: string | null;
  created_at: string;
}

type SortField = 'codigocatador' | 'nombre' | 'pais' | 'rol' | 'mesa' | 'puesto' | 'tablet';

export default function CatadoresManager() {
  const [catadores, setCatadores] = useState<Catador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [mesasDisponibles, setMesasDisponibles] = useState<number[]>([]);
  const [tabletsDisponibles, setTabletsDisponibles] = useState<string[]>([]);

  const ROLES = [
    'Administrador',
    'Presidente',
    'Catador'
  ];
  const PUESTOS = Array.from({ length: 5 }, (_, i) => i + 1);
  
  const [formData, setFormData] = useState({
    codigocatador: '',
    nombre: '',
    pais: '',
    rol: '',
    mesa: '',
    puesto: '',
    tablet: ''
  });

  useEffect(() => {
    fetchCatadores();
    fetchMesasYTablets();
  }, []);

  const fetchMesasYTablets = async () => {
    try {
      // Mesas configurables desde tabla de configuración
      const { data: configMesas, error: configErr } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'numero_mesas')
        .single();
      
      let numMesas = 5; // Default
      if (!configErr && configMesas?.valor) {
        numMesas = parseInt(configMesas.valor);
      }
      setMesasDisponibles(Array.from({ length: numMesas }, (_, i) => i + 1));

      // Tablets 1-25
      setTabletsDisponibles(Array.from({ length: 25 }, (_, i) => String(i + 1)));
    } catch (e) {
      setMesasDisponibles(Array.from({ length: 5 }, (_, i) => i + 1));
      setTabletsDisponibles(Array.from({ length: 25 }, (_, i) => String(i + 1)));
    }
  };

  const fetchCatadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCatadores(data || []);
    } catch (error) {
      console.error('Error al cargar catadores:', error);
      alert('Error al cargar catadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedCatadores = () => {
    return [...catadores].sort((a, b) => {
  const aVal = a[sortField];
  const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleFieldChange = (id: string, field: keyof Catador, value: any) => {
    // Actualizar localmente sin guardar aún
    setCatadores(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const handleFieldUpdate = async (id: string, field: keyof Catador, value: any) => {
    console.log('Actualizando campo:', { id, field, value });
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('usuarios')
        .update({ [field]: value })
        .eq('id', id);

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Actualización exitosa en BD');
      
      // Actualizar el estado local después de guardar exitosamente
      setCatadores(prev => prev.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      ));
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el campo');
      // Recargar para revertir el cambio
      await fetchCatadores();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);

      const dataToSave: any = {
        codigocatador: formData.codigocatador?.trim() || null,
        nombre: formData.nombre.trim(),
        pais: formData.pais?.trim() || null,
        rol: formData.rol || null,
        mesa: formData.mesa ? parseInt(formData.mesa) : null,
        puesto: formData.puesto ? parseInt(formData.puesto) : null,
        tablet: formData.tablet || null
      };

      // Si es una inserción nueva, generar un UUID explícito
      if (!editingId) {
        dataToSave.id = crypto.randomUUID();
      }

      console.log('Guardando catador:', dataToSave);

      if (editingId) {
        const { error } = await supabase
          .from('usuarios')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) {
          console.error('Error en update:', error);
          throw error;
        }
        console.log('Catador actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('usuarios')
          .insert([dataToSave]);

        if (error) {
          console.error('Error en insert:', error);
          throw error;
        }
        console.log('Catador creado exitosamente');
      }

      await fetchCatadores();
      resetForm();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(`Error al guardar el catador: ${(error as any)?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (catador: Catador) => {
    setEditingId(catador.id);
    setFormData({
      codigocatador: (catador as any).codigocatador || '',
      nombre: catador.nombre,
      pais: catador.pais || '',
      rol: catador.rol || '',
      mesa: catador.mesa?.toString() || '',
      puesto: catador.puesto?.toString() || '',
      tablet: catador.tablet || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al catador "${nombre}"?`)) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar:', error);
        throw error;
      }

      await fetchCatadores();
      console.log('Catador eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(`Error al eliminar el catador: ${(error as any)?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigocatador: '',
      nombre: '',
      pais: '',
      rol: '',
      mesa: '',
      puesto: '',
      tablet: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleVaciarCampo = async (campo: 'rol' | 'mesa' | 'puesto' | 'tablet') => {
    const mensajes = {
      rol: 'roles',
      mesa: 'mesas',
      puesto: 'puestos',
      tablet: 'tablets'
    };

    if (!confirm(`¿Estás seguro de que quieres vaciar todos los ${mensajes[campo]}?`)) {
      return;
    }

    try {
      setSaving(true);
      
      // Actualizar todos los registros poniendo el campo a null
      const { error } = await supabase
        .from('usuarios')
        .update({ [campo]: null })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Actualizar todos los registros

      if (error) {
        console.error(`Error al vaciar ${campo}:`, error);
        throw error;
      }

      await fetchCatadores();
      console.log(`${campo} vaciados exitosamente`);
    } catch (error) {
      console.error(`Error al vaciar ${campo}:`, error);
      alert(`Error al vaciar ${mensajes[campo]}: ${(error as any)?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600"
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  const getMesaBg = (mesa: number | null) => {
    if (!mesa || mesa <= 0) return 'bg-white';
    const colors = [
      'bg-rose-100',
      'bg-orange-100',
      'bg-amber-100',
      'bg-lime-100',
      'bg-emerald-100',
      'bg-teal-100',
      'bg-sky-100',
      'bg-indigo-100',
      'bg-fuchsia-100',
      'bg-pink-100'
    ];
    return colors[(mesa - 1) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando catadores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Gestión de Catadores</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Catador
        </button>
      </div>

      {/* Botones para vaciar campos */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleVaciarCampo('rol')}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Roles
        </button>
        <button
          onClick={() => handleVaciarCampo('mesa')}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Mesas
        </button>
        <button
          onClick={() => handleVaciarCampo('puesto')}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Puestos
        </button>
        <button
          onClick={() => handleVaciarCampo('tablet')}
          disabled={saving}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Vaciar Tablets
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Catador' : 'Nuevo Catador'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input
                type="text"
                value={formData.codigocatador}
                onChange={(e) => setFormData({ ...formData, codigocatador: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Código"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">País</label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="País"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tablet</label>
              <select
                value={formData.tablet}
                onChange={(e) => setFormData({ ...formData, tablet: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {tabletsDisponibles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mesa</label>
              <select
                value={formData.mesa}
                onChange={(e) => setFormData({ ...formData, mesa: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {mesasDisponibles.map((m) => (
                  <option key={m} value={String(m)}>Mesa {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Puesto</label>
              <select
                value={formData.puesto}
                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={String(p)}>Puesto {p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{catadores.length}</div>
          <div className="text-sm text-gray-600">Total Catadores</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {catadores.filter(c => c.rol).length}
          </div>
          <div className="text-sm text-gray-600">Con Rol Asignado</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {catadores.filter(c => c.mesa !== null).length}
          </div>
          <div className="text-sm text-gray-600">Asignados a Mesa</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="codigocatador" label="Código" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="nombre" label="Nombre" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="pais" label="País" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="rol" label="Rol" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="mesa" label="Mesa" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="puesto" label="Puesto" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">
                  <SortButton field="tablet" label="Tablet" />
                </th>
                <th className="px-2 py-2 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {getSortedCatadores().map((catador) => (
                <tr key={catador.id} className={`${getMesaBg(catador.mesa)} hover:opacity-95`}>
                  <td className="px-2 py-1 text-sm">
                    <input
                      type="text"
                      value={(catador as any).codigocatador || ''}
                      onChange={(e) => handleFieldChange(catador.id, 'codigocatador', e.target.value || null)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'codigocatador', e.target.value || null)}
                      className="w-16 p-1 border rounded text-sm"
                      placeholder="-"
                      maxLength={7}
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <input
                      type="text"
                      value={catador.nombre}
                      onChange={(e) => handleFieldChange(catador.id, 'nombre', e.target.value)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'nombre', e.target.value)}
                      className="w-full p-1 border rounded text-sm font-medium"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <input
                      type="text"
                      value={catador.pais || ''}
                      onChange={(e) => handleFieldChange(catador.id, 'pais', e.target.value || null)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'pais', e.target.value || null)}
                      className="w-24 p-1 border rounded text-sm"
                      placeholder="-"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <select
                      value={catador.rol || ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'rol', e.target.value || null)}
                      className="w-36 p-1 border rounded bg-white text-sm"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <select
                      value={catador.mesa ?? ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'mesa', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-24 p-1 border rounded bg-white text-center text-sm"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {mesasDisponibles.map((m) => (
                        <option key={m} value={String(m)}>Mesa {m}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <select
                      value={catador.puesto ?? ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'puesto', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-24 p-1 border rounded bg-white text-center text-sm"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {PUESTOS.map((p) => (
                        <option key={p} value={String(p)}>Puesto {p}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <select
                      value={catador.tablet || ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'tablet', e.target.value || null)}
                      className="w-28 p-1 border rounded bg-white text-sm"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {tabletsDisponibles.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(catador)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(catador.id, catador.nombre)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                        disabled={saving}
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

        {catadores.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay catadores registrados
          </div>
        )}
      </div>
    </div>
  );
}
