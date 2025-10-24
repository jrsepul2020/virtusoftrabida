import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { X } from 'lucide-react';

interface SampleEditModalProps {
  sample: Sample | null;
  onClose: () => void;
  onSave: () => void;
}

export default function SampleEditModal({ sample, onClose, onSave }: SampleEditModalProps) {
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sample) {
      setEditingSample({ ...sample });
    }
  }, [sample]);

  if (!sample || !editingSample) return null;

  const handleSaveSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('muestras')
        .update({
          nombre: editingSample.nombre,
          categoria: editingSample.categoria,
          empresa: editingSample.empresa,
          origen: editingSample.origen,
          igp: editingSample.igp,
          pais: editingSample.pais,
          azucar: editingSample.azucar,
          grado: editingSample.grado,
          existencias: editingSample.existencias,
          año: editingSample.año,
          tipouva: editingSample.tipouva,
          tipoaceituna: editingSample.tipoaceituna,
          destilado: editingSample.destilado,
          fecha: editingSample.fecha,
          manual: editingSample.manual,
          categoriaoiv: editingSample.categoriaoiv,
          categoriadecata: editingSample.categoriadecata,
        })
        .eq('id', editingSample.id);

      if (error) throw error;

      alert('Muestra actualizada correctamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating sample:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 flex justify-between items-start border-b border-gray-200">
          {/* Código a la izquierda */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Código
            </label>
            <div className="text-2xl font-bold text-gray-800">
              #{editingSample.codigo}
            </div>
          </div>

          {/* Código Texto a la derecha */}
          <div className="flex items-start gap-3 flex-1 max-w-md ml-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Código Texto
              </label>
              <input
                type="text"
                value={editingSample.codigotexto || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
              />
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-3"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSaveSample} className="p-6">
            <div className="space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2">Información Básica</h3>
                
                {/* Nombre en línea completa */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Muestra *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSample.nombre}
                    onChange={(e) => setEditingSample({ ...editingSample, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ingrese el nombre de la muestra"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={editingSample.categoria || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar categoría</option>
                      <option value="VINO BLANCO">VINO BLANCO</option>
                      <option value="VINO TINTO">VINO TINTO</option>
                      <option value="VINO ROSADO">VINO ROSADO</option>
                      <option value="VINO SIN ALCOHOL">VINO SIN ALCOHOL</option>
                      <option value="GENEROSO SECO">GENEROSO SECO</option>
                      <option value="GENEROSO DULCE">GENEROSO DULCE</option>
                      <option value="AROMATIZADO">AROMATIZADO</option>
                      <option value="ESPIRITUOSO ORIGEN VÍNICO">ESPIRITUOSO ORIGEN VÍNICO</option>
                      <option value="ESPIRITUOSO NO VÍNICO">ESPIRITUOSO NO VÍNICO</option>
                      <option value="ACEITE OLIVA VIRGEN EXTRA">ACEITE OLIVA VIRGEN EXTRA</option>
                      <option value="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO">ACEITE OLIVA VIRGEN EXTRA ORGÁNICO</option>
                      <option value="ESPUMOSO">ESPUMOSO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={editingSample.empresa || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, empresa: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={editingSample.pais || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, pais: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origen
                    </label>
                    <input
                      type="text"
                      value={editingSample.origen || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, origen: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles del Producto */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2">Detalles del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Azúcar (g/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSample.azucar !== null && editingSample.azucar !== undefined ? editingSample.azucar : ''}
                      onChange={(e) => setEditingSample({ ...editingSample, azucar: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grado (% vol.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSample.grado !== null && editingSample.grado !== undefined ? editingSample.grado : ''}
                      onChange={(e) => setEditingSample({ ...editingSample, grado: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Añada
                    </label>
                    <input
                      type="number"
                      value={editingSample.año || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, año: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Uva
                    </label>
                    <input
                      type="text"
                      value={editingSample.tipouva || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, tipouva: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Aceituna
                    </label>
                    <input
                      type="text"
                      value={editingSample.tipoaceituna || ''}
                      onChange={(e) => setEditingSample({ ...editingSample, tipoaceituna: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
