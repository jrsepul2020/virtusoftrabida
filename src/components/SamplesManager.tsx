import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, MapPin, Calendar, Droplet, Wine, Grape, Trash2, X, Hand, Printer, FileSpreadsheet, Database } from 'lucide-react';
import SampleEditModal from './SampleEditModal';
import * as XLSX from 'xlsx';

interface SamplesManagerProps {
  onNavigateToPrint?: () => void;
}

export default function SamplesManager({ onNavigateToPrint }: SamplesManagerProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples]);

  const fetchSamples = async () => {
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
        .order('codigo', { ascending: true });

      if (error) throw error;
      
      // Mapear los datos para incluir el nombre de la empresa y pedido
      const samplesWithEmpresa = samplesData?.map(sample => ({
        ...sample,
        empresa_nombre: sample.empresas?.name || sample.empresa || 'Sin empresa',
        empresa_pedido: sample.empresas?.pedido || null
      })) || [];
      
      setSamples(samplesWithEmpresa);
    } catch (error) {
      console.error('Error fetching samples:', error);
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
        sample.categoria?.toLowerCase().includes(term) ||
        sample.pais?.toLowerCase().includes(term)
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

  const handleDeleteSample = async (sample: Sample) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la muestra "${sample.nombre}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('muestras')
        .delete()
        .eq('id', sample.id);

      if (error) throw error;
      await fetchSamples();
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Error al eliminar la muestra');
    }
  };

  const handleGetCategoriaOIV = async () => {
    if (!confirm('¿Deseas actualizar la Categoría OIV de todas las muestras?\n\nEsto procesará cada muestra con los valores de azúcar, grado y categoría.')) {
      return;
    }

    try {
      setLoading(true);
      let processed = 0;
      let errors = 0;
      
      // Procesar cada muestra
      for (const sample of samples) {
        try {
          // Llamar a la función RPC con los parámetros de cada muestra
          const { data, error } = await supabase.rpc('rpc_get_categoriaoiv_muestra', {
            p_azucar: sample.azucar || 0,
            p_grado: sample.grado || 0,
            p_categoria: sample.categoria || ''
          });
          
          if (error) {
            console.error(`Error en muestra ${sample.codigo}:`, error);
            errors++;
            continue;
          }
          
          // Si la función devuelve un resultado, actualizar la muestra
          if (data) {
            const { error: updateError } = await supabase
              .from('muestras')
              .update({ categoriaoiv: data })
              .eq('id', sample.id);
            
            if (updateError) {
              console.error(`Error al actualizar muestra ${sample.codigo}:`, updateError);
              errors++;
            } else {
              processed++;
              console.log(`Muestra ${sample.codigo}: ${data}`);
            }
          }
        } catch (err) {
          console.error(`Error procesando muestra ${sample.codigo}:`, err);
          errors++;
        }
      }
      
      // Mostrar resultado
      alert(`✅ Proceso completado:\n\n✓ Procesadas: ${processed}\n✗ Errores: ${errors}\n\nRevisa la consola para más detalles.`);
      
      // Refrescar las muestras
      await fetchSamples();
    } catch (error) {
      console.error('Error general:', error);
      alert('❌ Error al ejecutar la función RPC');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    const excelData = filteredSamples.map(sample => ({
      'Código': sample.codigo,
      'Nombre': sample.nombre,
      'Empresa': sample.empresa_nombre || sample.empresa || '',
      'Pedido': sample.empresa_pedido || '',
      'Categoría': sample.categoria || '',
      'País': sample.pais || '',
      'Año': sample.anio || '',
      'Azúcar (g/L)': sample.azucar || '',
      'Grado Alcohólico': sample.grado || '',
      'Existencias': sample.existencias || 0,
      'Manual': sample.manual ? 'Sí' : 'No'
    }));

    // Crear el libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Muestras');

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 10 }, // Código
      { wch: 30 }, // Nombre
      { wch: 30 }, // Empresa
      { wch: 10 }, // Pedido
      { wch: 20 }, // Categoría
      { wch: 15 }, // País
      { wch: 8 },  // Año
      { wch: 12 }, // Azúcar
      { wch: 15 }, // Grado
      { wch: 12 }, // Existencias
      { wch: 8 }   // Manual
    ];
    worksheet['!cols'] = columnWidths;

    // Generar el archivo
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(workbook, `muestras_${fecha}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando muestras...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-lg"
              />
            </div>
            {onNavigateToPrint && (
              <button
                onClick={onNavigateToPrint}
                className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Imprimir Listado</span>
              </button>
            )}
            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Exportar Excel</span>
            </button>
            <button
              onClick={handleGetCategoriaOIV}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              disabled={loading}
              title="Calcular categoría OIV para todas las muestras basado en azúcar, grado y categoría"
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base hidden sm:inline">Actualizar OIV</span>
              <span className="text-sm sm:text-base sm:hidden">OIV</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando {filteredSamples.length} de {samples.length} muestras
        </div>
      </div>

      <div className="space-y-4">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            onClick={() => setEditingSample(sample)}
            className={`rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
              sample.manual ? 'bg-red-50 border-2 border-red-200' : 'bg-white'
            }`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                    sample.manual ? 'bg-red-600' : 'bg-primary-600'
                  }`}>
                    <Wine className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                    {sample.manual && (
                      <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white">
                        <Hand className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {sample.manual && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                          <Hand className="w-3 h-3" />
                          <span className="hidden sm:inline">MANUAL</span>
                          <span className="sm:hidden">M</span>
                        </span>
                      )}
                      <span className={`text-sm sm:text-base lg:text-lg font-bold ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>#{sample.codigotexto || sample.codigo}</span>
                      <h3 className={`text-sm sm:text-lg lg:text-xl font-bold truncate ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>{sample.nombre}</h3>
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(sample.categoria || null)}`}>
                        {sample.categoria || 'Sin categoría'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm mb-3">

                      {sample.pais && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{sample.pais}</span>
                        </div>
                      )}

                      {sample.anio && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{sample.anio}</span>
                        </div>
                      )}

                      {sample.existencias !== undefined && sample.existencias !== null && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>{sample.existencias} unidades</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      {sample.origen && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Origen:</span> {sample.origen}</span>
                        </div>
                      )}

                      {sample.igp && (
                        <div>
                          <span className="font-medium">IGP:</span> {sample.igp}
                        </div>
                      )}

                      {sample.azucar && (
                        <div className="flex items-center gap-2">
                          <Droplet className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Azúcar:</span> {sample.azucar} g/L</span>
                        </div>
                      )}

                      {sample.grado && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span><span className="font-medium">Grado:</span> {sample.grado}°</span>
                        </div>
                      )}

                      {sample.tipouva && (
                        <div className="flex items-center gap-2">
                          <Grape className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Uva:</span> {sample.tipouva}</span>
                        </div>
                      )}

                      {sample.tipoaceituna && (
                        <div>
                          <span className="font-medium">Aceituna:</span> {sample.tipoaceituna}
                        </div>
                      )}

                      {sample.destilado && (
                        <div>
                          <span className="font-medium">Destilado:</span> {sample.destilado}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-4 lg:ml-4">
                  <div className="flex flex-col items-end gap-1">
                    {(sample.empresa_nombre || sample.empresa) && (
                      <span className="text-lg font-medium text-gray-700">
                        {sample.empresa_nombre || sample.empresa}
                      </span>
                    )}
                    {sample.empresa_pedido && (
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-black text-white rounded-lg text-sm font-bold shadow-md">
                        PEDIDO: {sample.empresa_pedido}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSample(sample);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No se encontraron muestras</p>
        </div>
      )}

      <SampleEditModal
        sample={editingSample}
        onClose={() => setEditingSample(null)}
        onSave={fetchSamples}
      />

      {/* Modal de detalles */}
      {viewingSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-800">Detalles de la Muestra</h3>
              <button
                onClick={() => setViewingSample(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Código</label>
                  <p className="text-gray-900 font-mono text-lg">#{viewingSample.codigo}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-gray-900 font-medium">{viewingSample.nombre}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Empresa</label>
                  <p className="text-gray-900">{viewingSample.empresa || 'No especificada'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Categoría</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(viewingSample.categoria || null)}`}>
                    {viewingSample.categoria || 'Sin categoría'}
                  </span>
                </div>

                {viewingSample.manual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tipo de Registro</label>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold border border-red-300">
                      <Hand className="w-4 h-4" />
                      MANUAL
                    </span>
                  </div>
                )}

                {viewingSample.existencias !== undefined && viewingSample.existencias !== null && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Existencias</label>
                    <p className="text-gray-900">{viewingSample.existencias} unidades</p>
                  </div>
                )}
              </div>

              {/* Información técnica */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Técnica</h4>
                
                {viewingSample.pais && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">País</label>
                    <p className="text-gray-900">{viewingSample.pais}</p>
                  </div>
                )}

                {viewingSample.origen && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Origen</label>
                    <p className="text-gray-900">{viewingSample.origen}</p>
                  </div>
                )}

                {viewingSample.anio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Año</label>
                    <p className="text-gray-900">{viewingSample.anio}</p>
                  </div>
                )}

                {viewingSample.igp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">IGP</label>
                    <p className="text-gray-900">{viewingSample.igp}</p>
                  </div>
                )}

                {viewingSample.grado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Grado Alcohólico</label>
                    <p className="text-gray-900">{viewingSample.grado}°</p>
                  </div>
                )}

                {viewingSample.azucar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Azúcar</label>
                    <p className="text-gray-900">{viewingSample.azucar} g/L</p>
                  </div>
                )}

                {viewingSample.tipouva && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tipo de Uva</label>
                    <p className="text-gray-900">{viewingSample.tipouva}</p>
                  </div>
                )}

                {viewingSample.tipoaceituna && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tipo de Aceituna</label>
                    <p className="text-gray-900">{viewingSample.tipoaceituna}</p>
                  </div>
                )}

                {viewingSample.destilado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Destilado</label>
                    <p className="text-gray-900">{viewingSample.destilado}</p>
                  </div>
                )}

                {viewingSample.tanda && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tanda</label>
                    <p className="text-gray-900">Tanda {viewingSample.tanda}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <button
                onClick={() => setViewingSample(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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