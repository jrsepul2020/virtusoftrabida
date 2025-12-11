import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2, ZoomIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  bucketName?: string;
}

export default function ImageUploader({ 
  onImageUploaded, 
  currentImageUrl,
  label = "Foto de la Botella",
  bucketName = "bottle-images"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar 5MB');
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes');
      }

      // Usar el nombre original del archivo con timestamp para evitar duplicados
      const timestamp = Date.now();
      const originalName = file.name;
      const fileName = `${timestamp}_${originalName}`;
      const filePath = `${fileName}`;

      console.log('📤 Subiendo imagen:', filePath, '(original:', originalName, ')');

      // Subir a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error al subir:', uploadError);
        throw uploadError;
      }

      console.log('✅ Imagen subida:', data);

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 URL pública:', publicUrl);

      setPreview(publicUrl);
      onImageUploaded(publicUrl);
      
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Subir archivo
      await uploadImage(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageUploaded('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Preview de la imagen */}
      {preview && (
        <div className="relative inline-block group">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onClick={() => setShowModal(true)}
          />
          {/* Overlay con icono de zoom */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-500 mt-1">Haz clic para ampliar</p>
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {showModal && preview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              <span className="text-sm">Cerrar</span>
              <X className="w-6 h-6" />
            </button>
            <img 
              src={preview} 
              alt="Imagen ampliada" 
              className="w-full h-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              loading="lazy"
              decoding="async"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Botones de carga */}
      {!preview && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Botón cámara (móvil) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Tomar Foto
              </>
            )}
          </button>

          {/* Botón subir archivo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            Seleccionar Archivo
          </button>

          {/* Input oculto para cámara */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Input oculto para archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <ImageIcon className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Indicación */}
      {!preview && !uploading && (
        <p className="text-xs text-gray-500">
          Formatos: JPG, PNG, WebP. Máximo 5MB.
        </p>
      )}
    </div>
  );
}
