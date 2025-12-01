import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, Plus, Edit2, Trash2, X, Award } from 'lucide-react';

interface StatusConfig {
  id: string;
  label: string;
  value: string;
  bg_color: string;
  text_color: string;
  is_default: boolean;
}

interface MedalConfig {
  id: number;
  medalla: string;
  puntuacion_minima: number;
  puntuacion_maxima: number;
  color_hex: string;
  orden: number;
  activo: boolean;
}

export default function ConfiguracionManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numeroMesas, setNumeroMesas] = useState('5');
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [newStatus, setNewStatus] = useState<Partial<StatusConfig> | null>(null);
  
  // Medal configuration states
  const [medals, setMedals] = useState<MedalConfig[]>([]);
  const [editingMedal, setEditingMedal] = useState<MedalConfig | null>(null);
  const [newMedal, setNewMedal] = useState<Partial<MedalConfig> | null>(null);

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
    loadMedals();
  }, []);

  const loadMedals = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_medallas')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setMedals(data || []);
    } catch (error) {
      console.error('Error loading medals:', error);
    }
  };

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

  // Medal CRUD operations
  const handleSaveMedal = async () => {
    if (!editingMedal) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracion_medallas')
        .update({
          medalla: editingMedal.medalla,
          puntuacion_minima: editingMedal.puntuacion_minima,
          puntuacion_maxima: editingMedal.puntuacion_maxima,
          color_hex: editingMedal.color_hex,
          orden: editingMedal.orden,
          activo: editingMedal.activo
        })
        .eq('id', editingMedal.id);

      if (error) throw error;
      await loadMedals();
      setEditingMedal(null);
    } catch (error) {
      console.error('Error updating medal:', error);
      alert('Error al actualizar la medalla');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMedal = async () => {
    if (!newMedal || !newMedal.medalla || newMedal.puntuacion_minima === undefined || newMedal.puntuacion_maxima === undefined) {
      alert('Complete todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const medalData = {
        medalla: newMedal.medalla,
        puntuacion_minima: newMedal.puntuacion_minima,
        puntuacion_maxima: newMedal.puntuacion_maxima,
        color_hex: newMedal.color_hex || '#808080',
        orden: newMedal.orden || medals.length + 1,
        activo: true
      };

      const { error } = await supabase
        .from('configuracion_medallas')
        .insert([medalData]);

      if (error) throw error;
      await loadMedals();
      setNewMedal(null);
    } catch (error) {
      console.error('Error creating medal:', error);
      alert('Error al crear la medalla');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedal = async (medal: MedalConfig) => {
    if (!confirm(`¿Eliminar la medalla "${medal.medalla}"?`)) return;

    try {
      const { error } = await supabase
        .from('configuracion_medallas')
        .delete()
        .eq('id', medal.id);

      if (error) throw error;
      await loadMedals();
    } catch (error) {
      console.error('Error deleting medal:', error);
      alert('Error al eliminar la medalla');
    }
  };

  const handleToggleMedalActive = async (medal: MedalConfig) => {
    try {
      const { error } = await supabase
        .from('configuracion_medallas')
        .update({ activo: !medal.activo })
        .eq('id', medal.id);

      if (error) throw error;
      await loadMedals();
    } catch (error) {
      console.error('Error toggling medal:', error);
      alert('Error al actualizar el estado de la medalla');
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

      {/* Medal Configuration Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Medallas</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Configure los criterios de puntuación para otorgar medallas a las muestras catadas.
            Las medallas se asignan automáticamente según el promedio de las 5 puntuaciones.
          </p>

          {/* Medals List */}
          <div className="space-y-3">
            {medals.map((medal) => (
              <div key={medal.id} className="border rounded-lg p-4">
                {editingMedal?.id === medal.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Medalla</label>
                        <input
                          type="text"
                          value={editingMedal.medalla}
                          onChange={(e) => setEditingMedal({ ...editingMedal, medalla: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color Hex</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingMedal.color_hex}
                            onChange={(e) => setEditingMedal({ ...editingMedal, color_hex: e.target.value })}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingMedal.color_hex}
                            onChange={(e) => setEditingMedal({ ...editingMedal, color_hex: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg font-mono"
                            placeholder="#FFD700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Mínima</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editingMedal.puntuacion_minima}
                          onChange={(e) => setEditingMedal({ ...editingMedal, puntuacion_minima: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Máxima</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editingMedal.puntuacion_maxima}
                          onChange={(e) => setEditingMedal({ ...editingMedal, puntuacion_maxima: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                        <input
                          type="number"
                          min="1"
                          value={editingMedal.orden}
                          onChange={(e) => setEditingMedal({ ...editingMedal, orden: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveMedal}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingMedal(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: medal.color_hex }}
                      >
                        {medal.orden}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{medal.medalla}</h3>
                          {!medal.activo && (
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Inactiva</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {medal.puntuacion_minima} - {medal.puntuacion_maxima} puntos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMedalActive(medal)}
                        className={`px-3 py-1 rounded text-sm ${
                          medal.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {medal.activo ? 'Activa' : 'Inactiva'}
                      </button>
                      <button
                        onClick={() => setEditingMedal(medal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedal(medal)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New Medal Form */}
          {newMedal && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3 text-blue-900">Nueva Medalla</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Medalla *</label>
                  <input
                    type="text"
                    value={newMedal.medalla || ''}
                    onChange={(e) => setNewMedal({ ...newMedal, medalla: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej: Oro, Plata, Bronce"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Hex</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newMedal.color_hex || '#808080'}
                      onChange={(e) => setNewMedal({ ...newMedal, color_hex: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newMedal.color_hex || ''}
                      onChange={(e) => setNewMedal({ ...newMedal, color_hex: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg font-mono"
                      placeholder="#FFD700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Mínima *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newMedal.puntuacion_minima || ''}
                    onChange={(e) => setNewMedal({ ...newMedal, puntuacion_minima: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="90.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación Máxima *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newMedal.puntuacion_maxima || ''}
                    onChange={(e) => setNewMedal({ ...newMedal, puntuacion_maxima: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedal.orden || medals.length + 1}
                    onChange={(e) => setNewMedal({ ...newMedal, orden: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateMedal}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Crear Medalla
                </button>
                <button
                  onClick={() => setNewMedal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!newMedal && (
            <button
              onClick={() => setNewMedal({ medalla: '', puntuacion_minima: 0, puntuacion_maxima: 100, color_hex: '#808080', orden: medals.length + 1 })}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
            >
              <Plus className="w-4 h-4" />
              Añadir Nueva Medalla
            </button>
          )}
        </div>
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
