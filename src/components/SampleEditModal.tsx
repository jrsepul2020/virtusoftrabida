import { useState, useEffect, useRef } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { X, Camera, Upload, Loader2, Trash2 } from 'lucide-react';
import { showError } from '../lib/toast';
import { useEscapeKey } from '../hooks/useKeyboardShortcuts';

interface SampleEditModalProps {
  sample: Sample | null;
  onClose: () => void;
  onSave: () => void;
}

export default function SampleEditModal({ sample, onClose, onSave }: SampleEditModalProps) {
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atajos de teclado
  useEscapeKey(onClose, !!sample);

  useEffect(() => {
    if (sample) {
      setEditingSample({ ...sample });
      setImagePreview((sample as any).foto_botella || null);
    }
  }, [sample]);

  if (!sample || !editingSample) return null;

  // Función para subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    try {
      setUploading(true);

      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Supabase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bottle-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('bottle-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setEditingSample({ ...editingSample, foto_botella: publicUrl } as any);
      setImagePreview(publicUrl);

    } catch (error) {
      console.error('Error al subir imagen:', error);
      showError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setEditingSample({ ...editingSample, foto_botella: null } as any);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
          anio: editingSample.anio,
          tipouva: editingSample.tipouva,
          tipoaceituna: editingSample.tipoaceituna,
          destilado: editingSample.destilado,
          fecha: editingSample.fecha,
          manual: editingSample.manual,
          categoriaoiv: editingSample.categoriaoiv,
          categoriadecata: editingSample.categoriadecata,
          foto_botella: (editingSample as any).foto_botella || null,
        })
        .eq('id', editingSample.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating sample:', error);
      showError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        {/* Header compacto con código, código texto y nombre */}
        <div className="px-6 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs font-medium text-gray-500">Código</span>
              <div className="text-xl font-bold text-gray-800">#{editingSample.codigo}</div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">Código:</span>
              <div className="text-xl font-bold text-primary-600">{editingSample.codigotexto || '-'}</div>
            </div>
            <div className="border-l border-gray-300 pl-6">
              <span className="text-xs font-medium text-gray-500">Nombre</span>
              <div className="text-xl font-bold text-gray-800 max-w-md truncate" title={editingSample.nombre}>{editingSample.nombre}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido sin scroll */}
        <form onSubmit={handleSaveSample} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            {/* Grid optimizado - 3 columnas para maximizar espacio */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {/* Nombre - ocupa 3 columnas */}
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre de la Muestra *
                </label>
                <input
                  type="text"
                  required
                  value={editingSample.nombre}
                  onChange={(e) => setEditingSample({ ...editingSample, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre"
                />
              </div>

              {/* Fila 1: Categoría, Empresa, País */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={editingSample.categoria || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, categoria: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar</option>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                <input
                  type="text"
                  value={editingSample.empresa || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, empresa: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={editingSample.pais || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, pais: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Fila 2: Origen, IGP, Categoría OIV */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origen</label>
                <input
                  type="text"
                  value={editingSample.origen || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, origen: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">IGP</label>
                <input
                  type="text"
                  value={editingSample.igp || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, igp: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría OIV</label>
                <input
                  type="text"
                  value={editingSample.categoriaoiv || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, categoriaoiv: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="ej: II-A-12"
                />
              </div>

              {/* Fila 3: Azúcar, Grado, Añada */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Azúcar (g/L)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSample.azucar !== null && editingSample.azucar !== undefined ? editingSample.azucar : ''}
                  onChange={(e) => setEditingSample({ ...editingSample, azucar: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grado (% vol.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSample.grado !== null && editingSample.grado !== undefined ? editingSample.grado : ''}
                  onChange={(e) => setEditingSample({ ...editingSample, grado: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Añada (Año)</label>
                <input
                  type="number"
                  value={editingSample.anio || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, anio: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="2024"
                />
              </div>

              {/* Fila 4: Tipo Uva, Tipo Aceituna, Destilado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Uva</label>
                <input
                  type="text"
                  value={editingSample.tipouva || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, tipouva: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Aceituna</label>
                <input
                  type="text"
                  value={editingSample.tipoaceituna || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, tipoaceituna: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destilado</label>
                <input
                  type="text"
                  value={editingSample.destilado || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, destilado: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Fila 5: Existencias, Categoría de Cata */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Existencias</label>
                <input
                  type="number"
                  value={editingSample.existencias || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, existencias: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría de Cata</label>
                <select
                  value={editingSample.categoriadecata || ''}
                  onChange={(e) => setEditingSample({ ...editingSample, categoriadecata: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="vinos_tranquilos">Vinos Tranquilos</option>
                  <option value="generosos_espirituosos">Generosos y Espirituosos</option>
                  <option value="espumosos_cata">Espumosos</option>
                  <option value="aoves_cata">AOVEs</option>
                </select>
              </div>

              {/* Foto de Botella - ocupa 3 columnas */}
              <div className="col-span-3 mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  <Camera className="inline w-4 h-4 mr-1" />
                  Foto de la Botella
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview de imagen */}
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Vista previa" 
                          className="w-32 h-40 object-contain border border-gray-200 rounded-lg bg-gray-50"
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-xs">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de upload */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="foto-botella-input"
                    />
                    <label
                      htmlFor="foto-botella-input"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        uploading 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Subir imagen
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-500">
                      Formatos: JPG, PNG, WEBP (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
