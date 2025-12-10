import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useConfiguracion } from '../lib/queryCache';
import { Settings, Plus, Edit2, Save, Trash2, Activity, Database, Monitor, Wrench } from 'lucide-react';
import DiagnosticoSupabase from './DiagnosticoSupabase';

interface StatusConfig {
  id: string;
  label: string;
  value: string;
  bg_color: string;
  text_color: string;
  is_default: boolean;
}

interface SettingsManagerProps {
  onNavigate?: (tab: string) => void;
}

export default function SettingsManager({ onNavigate }: SettingsManagerProps) {
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [newStatus, setNewStatus] = useState<Partial<StatusConfig> | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'estados' | 'diagnostico' | 'herramientas' | 'email'>('estados');

  // Configuración general (clave/valor)
  const { data: configData } = useConfiguracion();
  const [adminEmail, setAdminEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

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
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      // Intentar cargar desde base de datos
      const { data: customStatuses } = await supabase
        .from('status_configs')
        .select('*')
        .order('is_default', { ascending: false });

      if (customStatuses && customStatuses.length > 0) {
        setStatuses(customStatuses);
      } else {
        // Si no hay configuración personalizada, usar estados por defecto
        setStatuses(defaultStatuses);
      }
    } catch (error) {
      console.log('Tabla status_configs no existe aún, usando valores por defecto');
      setStatuses(defaultStatuses);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (status: StatusConfig) => {
    setSaving(true);
    try {
      // Asegurarse de que la tabla existe
      await ensureStatusTable();

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
      await ensureStatusTable();

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

    if (!confirm(`¿Estás seguro de eliminar el estado "${status.label}"?`)) return;

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

  const ensureStatusTable = async () => {
    try {
      // Crear tabla si no existe
      const { error } = await supabase.rpc('create_status_configs_table');
      if (error && !error.message.includes('already exists')) {
        console.log('Creando tabla status_configs...');
      }
    } catch (error) {
      // La tabla probablemente ya existe o la función RPC no está disponible
      console.log('Tabla status_configs existe o será creada automáticamente');
    }
  };

  const getStatusBadge = (status: StatusConfig) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg_color} ${status.text_color}`}>
      {status.label}
    </span>
  );

  const colorOptions = [
    { bg: 'bg-gray-100', text: 'text-gray-800', name: 'Gris' },
    { bg: 'bg-blue-100', text: 'text-blue-800', name: 'Azul' },
    { bg: 'bg-green-100', text: 'text-green-800', name: 'Verde' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', name: 'Amarillo' },
    { bg: 'bg-red-100', text: 'text-red-800', name: 'Rojo' },
    { bg: 'bg-purple-100', text: 'text-purple-800', name: 'Morado' },
    { bg: 'bg-pink-100', text: 'text-pink-800', name: 'Rosa' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', name: 'Índigo' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header con Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-3 px-6 py-4">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Configuración del Sistema</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('estados')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'estados'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Estados de Empresa
            </button>
            <button
              onClick={() => setActiveTab('diagnostico')}
              className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'diagnostico'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              Diagnóstico
            </button>
            <button
              onClick={() => setActiveTab('herramientas')}
              className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'herramientas'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Herramientas
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'email'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email de envío
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {activeTab === 'estados' && (
            <div className="space-y-8">
              {/* Gestión de Estados */}
              <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Estados de Empresa</h3>
              <button
                onClick={() => setNewStatus({ label: '', value: '', bg_color: 'bg-gray-100', text_color: 'text-gray-800' })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Estado
              </button>
            </div>

            <div className="space-y-3">
              {statuses.map((status) => (
                <div key={status.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusBadge(status)}
                    <div>
                      <div className="font-medium text-gray-900">{status.label}</div>
                      <div className="text-sm text-gray-500">Valor: {status.value}</div>
                    </div>
                    {status.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Por defecto</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingStatus(status)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!status.is_default && (
                      <button
                        onClick={() => handleDeleteStatus(status)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
            </div>
          )}

          {activeTab === 'diagnostico' && (
            <DiagnosticoSupabase />
          )}

          {activeTab === 'herramientas' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">🔧 Herramientas del Sistema</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Acceda a herramientas avanzadas de administración y mantenimiento del sistema.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate?.('backup')}
                  className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all hover:shadow-md"
                >
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-lg">Respaldos</p>
                    <p className="text-sm text-gray-500">Exportar e importar datos del sistema</p>
                  </div>
                </button>
                
                <button
                  onClick={() => onNavigate?.('pantallas')}
                  className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all hover:shadow-md"
                >
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <Monitor className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-lg">Pantallas</p>
                    <p className="text-sm text-gray-500">Explorador de componentes del sistema</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Email de envío</h3>
                <p className="text-sm text-gray-500 mb-4">Dirección de email usada como administrador para recibir inscripciones y notificaciones. Clave: <code>email_envio</code></p>
                <div className="max-w-lg">
                  <label className="block text-sm text-gray-700 mb-2">Email administrador</label>
                  <input
                    type="email"
                    value={adminEmail || (configData?.email_envio ?? '')}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="inscripciones@internationalvirtus.com"
                    className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={async () => {
                        setSavingEmail(true);
                        try {
                          const emailToSave = adminEmail || configData?.email_envio || '';
                          const { error } = await supabase
                            .from('configuracion')
                            .upsert({ clave: 'email_envio', valor: emailToSave });
                          if (error) throw error;
                          alert('Email guardado correctamente');
                        } catch (err) {
                          console.error('Error guardando email de envío', err);
                          alert('Error guardando email');
                        } finally {
                          setSavingEmail(false);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {savingEmail ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setAdminEmail(configData?.email_envio ?? '')}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Restaurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear nuevo estado */}
      {newStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Estado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Estado</label>
                <input
                  type="text"
                  value={newStatus.label || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: En Revisión"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (ID)</label>
                <input
                  type="text"
                  value={newStatus.value || ''}
                  onChange={(e) => setNewStatus({ ...newStatus, value: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: en_revision"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewStatus({ ...newStatus, bg_color: color.bg, text_color: color.text })}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        newStatus.bg_color === color.bg ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <span className={`px-2 py-1 rounded text-xs ${color.bg} ${color.text}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-sm text-gray-600">Vista previa:</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${newStatus.bg_color} ${newStatus.text_color}`}>
                    {newStatus.label || 'Nuevo Estado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateStatus}
                disabled={saving || !newStatus.label || !newStatus.value}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creando...' : 'Crear Estado'}
              </button>
              <button
                onClick={() => setNewStatus(null)}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar estado */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Estado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Estado</label>
                <input
                  type="text"
                  value={editingStatus.label}
                  onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editingStatus.is_default}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (ID)</label>
                <input
                  type="text"
                  value={editingStatus.value}
                  onChange={(e) => setEditingStatus({ ...editingStatus, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editingStatus.is_default}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setEditingStatus({ ...editingStatus, bg_color: color.bg, text_color: color.text })}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        editingStatus.bg_color === color.bg ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <span className={`px-2 py-1 rounded text-xs ${color.bg} ${color.text}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-sm text-gray-600">Vista previa:</span>
                <div className="mt-1">
                  {getStatusBadge(editingStatus)}
                </div>
              </div>

              {editingStatus.is_default && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    ℹ️ Los estados por defecto solo permiten cambiar el color, no el nombre o valor.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSaveStatus(editingStatus)}
                disabled={saving}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingStatus(null)}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}