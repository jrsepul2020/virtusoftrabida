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
  email: string | null;
  telefono: string | null;
  especialidad: string | null;
  estado: string | null;
  activo: boolean | null;
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
    email: '',
    password: '',
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

      if (error) {
        console.error('Error al cargar catadores:', error);
        throw error;
      }
      
      console.log(`Catadores: ${data?.length || 0} cargados`);
      setCatadores(data || []);
    } catch (error) {
      console.error('Error crítico en catadores:', error);
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

  // Función para obtener la bandera del país como emoji
  const getCountryFlag = (countryName: string | null): string => {
    if (!countryName) return '';
    
    const countryFlags: { [key: string]: string } = {
      'españa': '🇪🇸',
      'spain': '🇪🇸',
      'francia': '🇫🇷',
      'france': '🇫🇷',
      'italia': '🇮🇹',
      'italy': '🇮🇹',
      'portugal': '🇵🇹',
      'alemania': '🇩🇪',
      'germany': '🇩🇪',
      'reino unido': '🇬🇧',
      'uk': '🇬🇧',
      'usa': '🇺🇸',
      'estados unidos': '🇺🇸',
      'argentina': '🇦🇷',
      'chile': '🇨🇱',
      'méxico': '🇲🇽',
      'mexico': '🇲🇽',
      'brasil': '🇧🇷',
      'brazil': '🇧🇷',
      'japón': '🇯🇵',
      'japan': '🇯🇵',
      'china': '🇨🇳',
      'australia': '🇦🇺',
      'canadá': '🇨🇦',
      'canada': '🇨🇦',
    };
    
    return countryFlags[countryName.toLowerCase()] || '🌍';
  };

  // Obtener puestos disponibles para una mesa específica
  const getPuestosDisponibles = (mesaId: number | null, catadorId: string) => {
    if (!mesaId) return PUESTOS;
    
    // Obtener puestos ocupados en esa mesa (excluyendo el catador actual)
    const puestosOcupados = catadores
      .filter(c => c.id !== catadorId && c.mesa === mesaId && c.puesto !== null)
      .map(c => c.puesto);
    
    // Filtrar los puestos que no están ocupados
    return PUESTOS.filter(p => !puestosOcupados.includes(p));
  };

  // Obtener tablets disponibles (no asignadas)
  const getTabletsDisponibles = (catadorId: string) => {
    // Obtener tablets ocupadas (excluyendo el catador actual)
    const tabletsOcupadas = catadores
      .filter(c => c.id !== catadorId && c.tablet)
      .map(c => c.tablet);
    
    // Filtrar las tablets que no están ocupadas
    return tabletsDisponibles.filter(t => !tabletsOcupadas.includes(t));
  };

  // Obtener información de mesas
  const getMesasInfo = () => {
    const mesas = mesasDisponibles.map(mesaNum => {
      const catadoresEnMesa = catadores.filter(c => c.mesa === mesaNum);
      const puestosOcupados = catadoresEnMesa.filter(c => c.puesto !== null).length;
      const totalPuestos = 5; // Máximo de puestos por mesa
      const completa = puestosOcupados === totalPuestos;
      
      return {
        numero: mesaNum,
        catadores: catadoresEnMesa,
        puestosOcupados,
        totalPuestos,
        completa
      };
    });

    const mesasCompletas = mesas.filter(m => m.completa);
    const mesasPendientes = mesas.filter(m => !m.completa && m.puestosOcupados > 0);
    const mesasVacias = mesas.filter(m => m.puestosOcupados === 0);

    return { mesasCompletas, mesasPendientes, mesasVacias, todasLasMesas: mesas };
  };

  const handleFieldChange = (id: string, field: keyof Catador, value: any) => {
    // Actualizar localmente sin guardar aún
    setCatadores(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const handleFieldUpdate = async (id: string, field: keyof Catador, value: any) => {
    console.log('Actualizando campo:', { id, field, value });
    
    // Validar puesto duplicado en la misma mesa
    if (field === 'puesto' || field === 'mesa') {
      const catador = catadores.find(c => c.id === id);
      const mesaActual = field === 'mesa' ? value : catador?.mesa;
      const puestoActual = field === 'puesto' ? value : catador?.puesto;
      
      if (mesaActual !== null && puestoActual !== null) {
        const duplicado = catadores.find(c => 
          c.id !== id && 
          c.mesa === mesaActual && 
          c.puesto === puestoActual
        );
        
        if (duplicado) {
          alert(`El puesto ${puestoActual} de la mesa ${mesaActual} ya está ocupado por ${duplicado.nombre}`);
          await fetchCatadores(); // Recargar para revertir
          return;
        }
      }
    }

    // Validar tablet duplicada
    if (field === 'tablet' && value) {
      const duplicado = catadores.find(c => 
        c.id !== id && 
        c.tablet === value
      );
      
      if (duplicado) {
        alert(`La tablet ${value} ya está asignada a ${duplicado.nombre}`);
        await fetchCatadores(); // Recargar para revertir
        return;
      }
    }

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

    // Validar email y password para nuevos usuarios
    if (!editingId) {
      if (!formData.email?.trim() || !formData.email.includes('@')) {
        alert('El email es obligatorio y debe ser válido');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        alert('La contraseña es obligatoria y debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      setSaving(true);

      let userId = editingId;

      // Si es un nuevo catador, crear usuario en Supabase Auth primero
      if (!editingId) {
        console.log('Creando usuario en Supabase Auth...');
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              nombre: formData.nombre.trim(),
              rol: formData.rol || 'Catador'
            },
            emailRedirectTo: undefined // No enviar email de confirmación
          }
        });

        if (authError) {
          console.error('Error en Auth signUp:', authError);
          throw new Error(`Error al crear usuario en Auth: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario en Auth');
        }

        userId = authData.user.id;
        console.log('Usuario creado en Auth con ID:', userId);

        // Confirmar el email automáticamente (solo admin puede hacer esto)
        // Nota: Esto requiere que el admin tenga permisos service_role en producción
        // Por ahora, el usuario podrá hacer login directamente sin confirmar email
      }

      const dataToSave: any = {
        codigocatador: formData.codigocatador?.trim() || null,
        nombre: formData.nombre.trim(),
        email: formData.email?.trim() || null,
        pais: formData.pais?.trim() || null,
        rol: formData.rol || 'Catador',
        mesa: formData.mesa ? parseInt(formData.mesa) : null,
        puesto: formData.puesto ? parseInt(formData.puesto) : null,
        tablet: formData.tablet || null
      };

      console.log('Guardando en tabla usuarios:', dataToSave);

      if (editingId) {
        // Actualizar usuario existente
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
        // Insertar nuevo usuario con el ID de Auth
        dataToSave.id = userId;
        const { error } = await supabase
          .from('usuarios')
          .insert([dataToSave]);

        if (error) {
          console.error('Error en insert:', error);
          throw error;
        }
        console.log('Catador creado exitosamente en tabla usuarios');
      }

      await fetchCatadores();
      resetForm();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(`Error al guardar el catador: ${error?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (catador: Catador) => {
    setEditingId(catador.id);
    setFormData({
      codigocatador: (catador as any).codigocatador || '',
      nombre: catador.nombre,
      email: catador.email || '',
      password: '', // No mostrar password en edición
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
      email: '',
      password: '',
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
              <label className="block text-sm font-medium mb-1">
                Email {!editingId && '*'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="email@ejemplo.com"
                disabled={!!editingId}
                title={editingId ? 'No se puede cambiar el email de un usuario existente' : ''}
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            )}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{catadores.length}</div>
          <div className="text-sm text-gray-600">Total Catadores</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {getMesasInfo().mesasCompletas.length}
          </div>
          <div className="text-sm text-gray-600">Mesas Completas</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {getMesasInfo().mesasPendientes.length}
          </div>
          <div className="text-sm text-gray-600">Mesas Pendientes</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {catadores.filter(c => c.mesa !== null).length}
          </div>
          <div className="text-sm text-gray-600">Asignados a Mesa</div>
        </div>
      </div>

      {/* Sección de Mesas Completas */}
      {getMesasInfo().mesasCompletas.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              {getMesasInfo().mesasCompletas.length}
            </span>
            Mesas Completas (5/5 puestos)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {getMesasInfo().mesasCompletas.map((mesa) => (
              <div key={mesa.numero} className="bg-white rounded-lg border-2 border-green-400 overflow-hidden">
                <div className="bg-green-600 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>MESA {mesa.numero}</span>
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">
                    Completa
                  </span>
                </div>
                <div className="p-2">
                  {/* Encabezados */}
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-600 border-b-2 border-gray-300 pb-1 mb-1">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">Nombre</div>
                    <div className="col-span-4">Rol</div>
                    <div className="col-span-2 text-center">Tab</div>
                  </div>
                  {/* Datos */}
                  {mesa.catadores
                    .sort((a, b) => (a.puesto || 0) - (b.puesto || 0))
                    .map((cat) => (
                      <div key={cat.id} className="grid grid-cols-12 gap-1 text-xs py-1 border-b border-gray-100 last:border-0 items-center">
                        <div className="col-span-1 flex justify-center">
                          <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                            {cat.puesto}
                          </span>
                        </div>
                        <div className="col-span-5 font-medium text-gray-900 truncate" title={cat.nombre}>
                          {cat.nombre}
                        </div>
                        <div className="col-span-4 text-gray-600 text-xs truncate" title={cat.rol || '-'}>
                          {cat.rol || '-'}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                            {cat.tablet || '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Mesas Pendientes */}
      {getMesasInfo().mesasPendientes.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
          <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
              {getMesasInfo().mesasPendientes.length}
            </span>
            Mesas Pendientes de Completar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {getMesasInfo().mesasPendientes.map((mesa) => (
              <div key={mesa.numero} className="bg-white rounded-lg border-2 border-orange-400 overflow-hidden">
                <div className="bg-orange-600 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>MESA {mesa.numero}</span>
                  <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full">
                    {mesa.puestosOcupados}/{mesa.totalPuestos}
                  </span>
                </div>
                <div className="p-2">
                  {/* Encabezados */}
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-600 border-b-2 border-gray-300 pb-1 mb-1">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">Nombre</div>
                    <div className="col-span-4">Rol</div>
                    <div className="col-span-2 text-center">Tab</div>
                  </div>
                  {/* Datos */}
                  {[1, 2, 3, 4, 5].map((puestoNum) => {
                    const cat = mesa.catadores.find(c => c.puesto === puestoNum);
                    return (
                      <div key={puestoNum} className={`grid grid-cols-12 gap-1 text-xs py-1 border-b border-gray-100 last:border-0 items-center ${!cat ? 'opacity-50' : ''}`}>
                        <div className="col-span-1 flex justify-center">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                            cat ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {puestoNum}
                          </span>
                        </div>
                        {cat ? (
                          <>
                            <div className="col-span-5 font-medium text-gray-900 truncate" title={cat.nombre}>
                              {cat.nombre}
                            </div>
                            <div className="col-span-4 text-gray-600 text-xs truncate" title={cat.rol || '-'}>
                              {cat.rol || '-'}
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                                {cat.tablet || '-'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-11 italic text-gray-400 text-xs">
                            Puesto vacío
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla completa de todos los catadores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300">
          <h3 className="text-lg font-bold text-gray-800">Todos los Catadores - Gestión Completa</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="codigocatador" label="Código" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="nombre" label="Nombre" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  Email
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="pais" label="País" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="rol" label="Rol" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="mesa" label="Mesa" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="puesto" label="Puesto" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  <SortButton field="tablet" label="Tablet" />
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold border-r border-gray-200">
                  Activo
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getSortedCatadores().map((catador) => (
                <tr key={catador.id} className={`${getMesaBg(catador.mesa)} hover:opacity-95 border-b border-gray-200`}>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="text"
                      value={(catador as any).codigocatador || ''}
                      onChange={(e) => handleFieldChange(catador.id, 'codigocatador', e.target.value || null)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'codigocatador', e.target.value || null)}
                      className="w-16 p-1 border rounded text-xs"
                      placeholder="-"
                      maxLength={7}
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="text"
                      value={catador.nombre}
                      onChange={(e) => handleFieldChange(catador.id, 'nombre', e.target.value)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'nombre', e.target.value)}
                      className="w-full min-w-[120px] p-1 border rounded text-xs font-medium"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="email"
                      value={catador.email || ''}
                      onChange={(e) => handleFieldChange(catador.id, 'email', e.target.value || null)}
                      onBlur={(e) => handleFieldUpdate(catador.id, 'email', e.target.value || null)}
                      className="w-full min-w-[150px] p-1 border rounded text-xs"
                      placeholder="-"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(catador.pais)}</span>
                      <input
                        type="text"
                        value={catador.pais || ''}
                        onChange={(e) => handleFieldChange(catador.id, 'pais', e.target.value || null)}
                        onBlur={(e) => handleFieldUpdate(catador.id, 'pais', e.target.value || null)}
                        className="w-24 p-1 border rounded text-xs"
                        placeholder="-"
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.rol || ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'rol', e.target.value || null)}
                      className="w-28 p-1 border rounded bg-white text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.mesa ?? ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'mesa', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-20 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {mesasDisponibles.map((m) => (
                        <option key={m} value={String(m)}>M {m}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.puesto ?? ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'puesto', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-20 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {/* Mostrar el puesto actual aunque esté "ocupado" */}
                      {catador.puesto !== null && !getPuestosDisponibles(catador.mesa, catador.id).includes(catador.puesto) && (
                        <option value={String(catador.puesto)}>P {catador.puesto}</option>
                      )}
                      {/* Mostrar solo puestos disponibles */}
                      {getPuestosDisponibles(catador.mesa, catador.id).map((p) => (
                        <option key={p} value={String(p)}>P {p}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <select
                      value={catador.tablet || ''}
                      onChange={(e) => handleFieldUpdate(catador.id, 'tablet', e.target.value || null)}
                      className="w-16 p-1 border rounded bg-white text-center text-xs"
                      disabled={saving}
                    >
                      <option value="">-</option>
                      {/* Mostrar la tablet actual aunque esté "ocupada" */}
                      {catador.tablet && !getTabletsDisponibles(catador.id).includes(catador.tablet) && (
                        <option value={catador.tablet}>{catador.tablet}</option>
                      )}
                      {/* Mostrar solo tablets disponibles */}
                      {getTabletsDisponibles(catador.id).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={catador.activo !== false}
                      onChange={(e) => handleFieldUpdate(catador.id, 'activo', e.target.checked)}
                      className="w-4 h-4"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(catador)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(catador.id, catador.nombre)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
