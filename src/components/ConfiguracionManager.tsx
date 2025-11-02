import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, Plus, Edit2, Trash2, X } from 'lucide-react';

interface StatusConfig {
  id: string;
  label: string;
  value: string;
  bg_color: string;
  text_color: string;
  is_default: boolean;
}

export default function ConfiguracionManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numeroMesas, setNumeroMesas] = useState('5');
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [newStatus, setNewStatus] = useState<Partial<StatusConfig> | null>(null);

  // Estados por defecto
  const defaultStatuses: StatusConfig[] = [
    {
      id: 'pending',
      label: 'Pendiente',
      value: 'pending',
      bg_color: 'bg-yellow-100',
      text_color: 'text-yellow-800',
      is_default: true
    },
    {
      id: 'approved',
      label: 'Aprobada',
      value: 'approved',
      bg_color: 'bg-green-100',
      text_color: 'text-green-800',
      is_default: true
    },
    {
      id: 'rejected',
      label: 'Rechazada',
      value: 'rejected',
      bg_color: 'bg-red-100',
      text_color: 'text-red-800',
      is_default: true
    }
  ];

  useEffect(() => {
    fetchConfiguracion();
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const { data: customStatuses } = await supabase
        .from('status_configs')
        .select('*')
        .order('is_default', { ascending: false });

      if (customStatuses && customStatuses.length > 0) {
        setStatuses(customStatuses);
      } else {
        setStatuses(defaultStatuses);
      }
    } catch (error) {
      console.log('Tabla status_configs no existe aún, usando valores por defecto');
      setStatuses(defaultStatuses);
    }
  };

  const fetchConfiguracion = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'numero_mesas')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await crearConfiguracionInicial();
        } else {
          throw error;
        }
      } else if (data) {
        setNumeroMesas(data.valor || '5');
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearConfiguracionInicial = async () => {
    try {
      const { error } = await supabase
        .from('configuracion')
        .insert([{
          clave: 'numero_mesas',
          valor: '5',
          descripcion: 'Número total de mesas disponibles'
        }]);

      if (error) throw error;
      setNumeroMesas('5');
    } catch (error) {
      console.error('Error al crear configuración inicial:', error);
    }
  };

  const handleGuardar = async () => {
    const num = parseInt(numeroMesas);
    if (isNaN(num) || num < 1 || num < 50) {
      alert('El número de mesas debe estar entre 1 y 50');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('configuracion')
        .upsert({
          clave: 'numero_mesas',
          valor: numeroMesas,
          descripcion: 'Número total de mesas disponibles'
        }, {
          onConflict: 'clave'
        });

      if (error) throw error;
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async (status: StatusConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('status_configs')
        .upsert({
          id: status.id,
          label: status.label,
          value: status.value,
          bg_color: status.bg_color,
          text_color: status.text_color,
          is_default: status.is_default
        });

      if (error) throw error;
      await loadStatuses();
      setEditingStatus(null);
    } catch (error) {
      console.error('Error saving status:', error);
      alert('Error al guardar el estado');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus || !newStatus.label || !newStatus.value) return;

    setSaving(true);
    try {
      const statusData = {
        id: newStatus.value,
        label: newStatus.label,
        value: newStatus.value,
        bg_color: newStatus.bg_color || 'bg-gray-100',
        text_color: newStatus.text_color || 'text-gray-800',
        is_default: false
      };

      const { error } = await supabase
        .from('status_configs')
        .insert([statusData]);

      if (error) throw error;
      await loadStatuses();
      setNewStatus(null);
    } catch (error) {
      console.error('Error creating status:', error);
      alert('Error al crear el estado');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatus = async (status: StatusConfig) => {
    if (status.is_default) {
      alert('No se pueden eliminar los estados por defecto');
      return;
    }

    if (!confirm(`¿Eliminar el estado "${status.label}"?`)) return;

    try {
      const { error } = await supabase
        .from('status_configs')
        .delete()
        .eq('id', status.id);

      if (error) throw error;
      await loadStatuses();
    } catch (error) {
      console.error('Error deleting status:', error);
      alert('Error al eliminar el estado');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
      </div>

      {/* Parámetros de Cata */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Parámetros de Cata</h3>
        
        <div className="space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">
              Número de Mesas
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={numeroMesas}
                onChange={(e) => setNumeroMesas(e.target.value)}
                className="w-32 p-2 border rounded-lg"
                min="1"
                max="50"
                disabled={saving}
              />
              <span className="text-sm text-gray-600">
                (Mínimo: 1, Máximo: 50)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Define el número total de mesas disponibles para las catas
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Información de Parámetros Fijos</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Roles:</strong> Administrador, Presidente, Catador</p>
              <p>• <strong>Puestos por mesa:</strong> 1 a 5</p>
              <p>• <strong>Tablets disponibles:</strong> 1 a 25</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>

      {/* Estados de Empresa */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Estados de Empresa</h3>
        
        <div className="space-y-4">
          {/* Lista de estados */}
          <div className="space-y-2">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingStatus?.id === status.id ? (
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editingStatus.label}
                      onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
                      className="px-2 py-1 border rounded"
                      placeholder="Etiqueta"
                    />
                    <input
                      type="text"
                      value={editingStatus.bg_color}
                      onChange={(e) => setEditingStatus({ ...editingStatus, bg_color: e.target.value })}
                      className="px-2 py-1 border rounded"
                      placeholder="bg-color"
                    />
                    <input
                      type="text"
                      value={editingStatus.text_color}
                      onChange={(e) => setEditingStatus({ ...editingStatus, text_color: e.target.value })}
                      className="px-2 py-1 border rounded"
                      placeholder="text-color"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg_color} ${status.text_color}`}>
                      {status.label}
                    </span>
                    {status.is_default && (
                      <span className="text-xs text-gray-500">(Por defecto)</span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {editingStatus?.id === status.id ? (
                    <>
                      <button
                        onClick={() => handleSaveStatus(editingStatus)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Guardar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingStatus(null)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingStatus(status)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!status.is_default && (
                        <button
                          onClick={() => handleDeleteStatus(status)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Formulario nuevo estado */}
          {newStatus && (
            <div className="p-4 border-2 border-dashed rounded-lg">
              <h4 className="font-medium mb-3">Nuevo Estado</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={newStatus.label || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Etiqueta (ej: En Revisión)"
                />
                <input
                  type="text"
                  value={newStatus.value || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, value: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Valor (ej: in_review)"
                />
                <input
                  type="text"
                  value={newStatus.bg_color || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, bg_color: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Color fondo (ej: bg-blue-100)"
                />
                <input
                  type="text"
                  value={newStatus.text_color || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, text_color: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Color texto (ej: text-blue-800)"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateStatus}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Crear Estado
                </button>
                <button
                  onClick={() => setNewStatus(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!newStatus && (
            <button
              onClick={() => setNewStatus({ label: '', value: '', bg_color: '', text_color: '' })}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
            >
              <Plus className="w-4 h-4" />
              Añadir Nuevo Estado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
