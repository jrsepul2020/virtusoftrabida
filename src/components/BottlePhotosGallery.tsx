import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { ArrowLeft, Search, Image as ImageIcon, ExternalLink, X, Trash2, AlertTriangle } from 'lucide-react';

// Extender Sample con foto_botella
type SampleWithPhoto = Sample & {
  foto_botella?: string | null;
};

interface BottlePhotosGalleryProps {
  onBack: () => void;
}

export default function BottlePhotosGallery({ onBack }: BottlePhotosGalleryProps) {
  const [samples, setSamples] = useState<SampleWithPhoto[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<SampleWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; sample: SampleWithPhoto } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SampleWithPhoto | null>(null);

  useEffect(() => {
    fetchSamplesWithPhotos();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples]);

  const fetchSamplesWithPhotos = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select(`
          *,
          empresas:empresa_id (
            name,
            pedido
          )
        `)
        .not('foto_botella', 'is', null)
        .neq('foto_botella', '')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching samples with photos:', error);
        throw error;
      }

      const samplesWithEmpresa = samplesData?.map(sample => ({
        ...sample,
        empresa_nombre: sample.empresas?.name || sample.empresa || 'Sin empresa',
        empresa_pedido: sample.empresas?.pedido || null
      })) || [];

      setSamples(samplesWithEmpresa);
    } catch (error) {
      console.error('Error:', error);
      alert('Error cargando las fotos de botellas');
    } finally {
      setLoading(false);
    }
  };

  const filterSamples = () => {
    if (!searchTerm) {
      setFilteredSamples(samples);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = samples.filter(
      (sample) =>
        sample.nombre.toLowerCase().includes(term) ||
        sample.codigo.toString().includes(term) ||
        sample.empresa?.toLowerCase().includes(term) ||
        sample.categoria?.toLowerCase().includes(term)
    );
    setFilteredSamples(filtered);
  };

  const getCategoryColor = (categoria: string | null) => {
    if (!categoria) return 'bg-gray-100 text-gray-700';

    const cat = categoria.toLowerCase();
    if (cat.includes('blanco')) return 'bg-yellow-100 text-yellow-800';
    if (cat.includes('tinto')) return 'bg-red-100 text-red-800';
    if (cat.includes('rosado')) return 'bg-pink-100 text-pink-800';
    if (cat.includes('espumoso') || cat.includes('cava')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('aceite')) return 'bg-green-100 text-green-800';

    return 'bg-primary-100 text-primary-800';
  };

  // Función para eliminar foto del bucket y actualizar la muestra
  const handleDeletePhoto = async (sample: SampleWithPhoto) => {
    if (!sample.foto_botella) return;
    
    setDeleting(sample.id);
    try {
      // Extraer el nombre del archivo de la URL
      const url = sample.foto_botella;
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Eliminar del bucket de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('bottle-images')
        .remove([fileName]);

      if (storageError) {
        console.error('Error eliminando del storage:', storageError);
        // Continuar aunque falle el storage (puede que el archivo no exista)
      }

      // Actualizar la muestra para quitar la referencia a la foto
      const { error: updateError } = await supabase
        .from('muestras')
        .update({ foto_botella: null })
        .eq('id', sample.id);

      if (updateError) throw updateError;

      // Actualizar el estado local
      setSamples(prev => prev.filter(s => s.id !== sample.id));
      setConfirmDelete(null);
      setSelectedImage(null);
      
    } catch (error) {
      console.error('Error eliminando foto:', error);
      alert('Error al eliminar la foto');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando fotos de botellas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Galería de Fotos de Botellas</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredSamples.length} de {samples.length} muestras con foto
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredSamples.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">
            {searchTerm ? 'No se encontraron muestras con ese criterio' : 'No hay muestras con fotos de botellas'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredSamples.map((sample) => (
            <div
              key={sample.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group relative"
            >
              {/* Image - más pequeña */}
              <div 
                className="relative aspect-[3/4] bg-gray-100 cursor-pointer"
                onClick={() => setSelectedImage({ url: sample.foto_botella!, sample })}
              >
                <img
                  src={sample.foto_botella!}
                  alt={sample.nombre}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
                {sample.manual && (
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                    M
                  </div>
                )}
                {/* Botón eliminar - visible en hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(sample);
                  }}
                  className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Info compacta */}
              <div className="p-2">
                <div className="text-[10px] font-mono text-gray-500 mb-0.5">
                  #{sample.codigotexto || sample.codigo}
                </div>
                <h3 className="font-medium text-gray-900 text-xs line-clamp-1" title={sample.nombre}>
                  {sample.nombre}
                </h3>
                <p className="text-[10px] text-gray-500 line-clamp-1" title={sample.empresa_nombre || sample.empresa}>
                  {sample.empresa_nombre || sample.empresa || 'Sin empresa'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl w-full">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="bg-gray-100 flex items-center justify-center p-8">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.sample.nombre}
                    className="max-h-[50vh] w-auto object-contain rounded-lg"
                    loading="lazy"
                    decoding="async"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Details */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedImage.sample.nombre}
                    </h2>
                    <p className="text-lg text-gray-600">
                      {selectedImage.sample.empresa_nombre || selectedImage.sample.empresa || 'Sin empresa'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Código</label>
                      <p className="text-gray-900 font-mono">
                        #{selectedImage.sample.codigotexto || selectedImage.sample.codigo}
                      </p>
                    </div>

                    {selectedImage.sample.categoria && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Categoría</label>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedImage.sample.categoria)}`}>
                          {selectedImage.sample.categoria}
                        </span>
                      </div>
                    )}

                    {selectedImage.sample.pais && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">País</label>
                        <p className="text-gray-900">{selectedImage.sample.pais}</p>
                      </div>
                    )}

                    {selectedImage.sample.origen && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Origen</label>
                        <p className="text-gray-900">{selectedImage.sample.origen}</p>
                      </div>
                    )}

                    {selectedImage.sample.anio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Año</label>
                        <p className="text-gray-900">{selectedImage.sample.anio}</p>
                      </div>
                    )}

                    {selectedImage.sample.grado && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Grado Alcohólico</label>
                        <p className="text-gray-900">{selectedImage.sample.grado}°</p>
                      </div>
                    )}

                    {selectedImage.sample.azucar && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Azúcar</label>
                        <p className="text-gray-900">{selectedImage.sample.azucar} g/L</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <a
                      href={selectedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir imagen en nueva pestaña
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(selectedImage.sample);
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar foto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setConfirmDelete(null)}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              ¿Estás seguro de que quieres eliminar la foto de esta muestra?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Muestra:</strong> {confirmDelete.nombre}<br />
              <strong>Código:</strong> #{confirmDelete.codigotexto || confirmDelete.codigo}
            </p>
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-4">
              Esta acción eliminará la imagen del servidor y no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting !== null}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePhoto(confirmDelete)}
                disabled={deleting !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting === confirmDelete.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
