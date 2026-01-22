import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, Trash2, X, Hand, Printer, FileSpreadsheet, Database, Camera, FileText } from 'lucide-react';
import SampleEditModal from './SampleEditModal';
import BottlePhotosGallery from './BottlePhotosGallery';
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
  const [showPhotosGallery, setShowPhotosGallery] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples]);

  const fetchSamples = async () => {
    setLoading(true);
    console.log('🔍 SamplesManager: Iniciando fetchSamples...');
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
        .order('created_at', { ascending: false });

      console.log('📊 SamplesManager - Supabase response:', { 
        dataCount: samplesData?.length, 
        error: error,
        firstSample: samplesData?.[0] 
      });

      if (error) {
        console.error('❌ SamplesManager - Supabase fetch error:', error);
        alert('Error cargando muestras: ' + error.message + '\nCódigo: ' + error.code);
        throw error;
      }

      if (!samplesData || samplesData.length === 0) {
        console.warn('⚠️ SamplesManager - No hay muestras en la base de datos');
        setSamples([]);
        setLoading(false);
        return;
      }
      
      // Mapear los datos para incluir el nombre de la empresa y pedido
      const samplesWithEmpresa = samplesData?.map(sample => ({
        ...sample,
        empresa_nombre: sample.empresas?.name || sample.empresa || 'Sin empresa',
        empresa_pedido: sample.empresas?.pedido || null
      })) || [];
      
      console.log('✅ SamplesManager - Muestras procesadas:', samplesWithEmpresa.length);
      setSamples(samplesWithEmpresa);
    } catch (error) {
      console.error('💥 SamplesManager - Error fetching samples:', error);
      alert('Error inesperado cargando muestras. Ver consola para detalles.');
    } finally {
      setLoading(false);
      console.log('🏁 SamplesManager - fetchSamples completado');
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

  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const handleCellEdit = (sampleId: string, field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [`${sampleId}-${field}`]: value
    }));
  };

  const handleCellSave = async (sampleId: string, field: string) => {
    const value = editValues[`${sampleId}-${field}`];
    if (value === undefined) return;

    try {
      const { error } = await supabase
        .from('muestras')
        .update({ [field]: value })
        .eq('id', sampleId);

      if (error) throw error;

      // Actualizar el estado local
      setSamples(prev => prev.map(sample =>
        sample.id === sampleId ? { ...sample, [field]: value } : sample
      ));

      setEditingCell(null);
      delete editValues[`${sampleId}-${field}`];
    } catch (error) {
      console.error('Error updating sample:', error);
      alert('Error al actualizar la muestra');
    }
  };

  const handleCellCancel = (sampleId: string, field: string) => {
    delete editValues[`${sampleId}-${field}`];
    setEditingCell(null);
  };

  const getCellValue = (sampleId: string, field: string, originalValue: any) => {
    const key = `${sampleId}-${field}`;
    return editValues[key] !== undefined ? editValues[key] : originalValue;
  };

  const renderEditableCell = (sample: Sample, field: string, displayValue: string, inputType: 'text' | 'select' = 'text', options?: string[]) => {
    const isEditing = editingCell?.id === sample.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {inputType === 'select' && options ? (
            <select
              value={getCellValue(sample.id, field, sample[field as keyof Sample]) || ''}
              onChange={(e) => handleCellEdit(sample.id, field, e.target.value)}
              className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              value={getCellValue(sample.id, field, sample[field as keyof Sample]) || ''}
              onChange={(e) => handleCellEdit(sample.id, field, e.target.value)}
              className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          )}
          <button
            onClick={() => handleCellSave(sample.id, field)}
            className="px-1 py-1 text-green-600 hover:text-green-800 text-xs"
            title="Guardar"
          >
            ✓
          </button>
          <button
            onClick={() => handleCellCancel(sample.id, field)}
            className="px-1 py-1 text-red-600 hover:text-red-800 text-xs"
            title="Cancelar"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[24px] flex items-center"
        onClick={() => setEditingCell({ id: sample.id, field })}
        title="Click para editar"
      >
        <span className="text-xs truncate">{displayValue || '-'}</span>
      </div>
    );
  };

  // Restaurar función de exportación a Excel
  const handleExportToExcel = () => {
    const excelData = filteredSamples.map(sample => ({
      'Código Texto': sample.codigotexto || sample.codigo,
      'Nombre': sample.nombre,
      'Empresa': sample.empresa_nombre || sample.empresa || '',
      'Categoría': sample.categoria || '',
      'F. Inscripción': sample.created_at ? new Date(sample.created_at).toLocaleDateString('es-ES') : '',
      'Cat. Cata': sample.categoriadecata || '',
      'Código Barras': sample.codigo?.toString() || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Muestras');
    worksheet['!cols'] = [
      { wch: 12 }, // Código Texto
      { wch: 30 }, // Nombre
      { wch: 30 }, // Empresa
      { wch: 20 }, // Categoría
      { wch: 18 }, // F. Inscripción
      { wch: 18 }, // Cat. Cata
      { wch: 18 }  // Código Barras
    ];
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(workbook, `muestras_${fecha}.xlsx`);
  };

  if (showPhotosGallery) {
    return <BottlePhotosGallery onBack={() => setShowPhotosGallery(false)} />;
  }

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
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              title="Imprimir como PDF"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Exportar Excel</span>
            </button>
            <button
              onClick={() => setShowPhotosGallery(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap"
              title="Ver galería de fotos de botellas"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base hidden sm:inline">Fotos Botellas</span>
              <span className="text-sm sm:text-base sm:hidden">Fotos</span>
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
          Mostrando {filteredSamples.length} de {(samples as Sample[]).length} muestras
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1C2716] border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-24">
                  Código Texto
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[200px]">
                  Nombre
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[150px]">
                  Empresa
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                  Categoría
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                  F. Inscripción
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                  Cat. Cata
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-24">
                  Código Barras
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider w-16">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredSamples.map((sample, index) => (
                <tr
                  key={sample.id}
                  className={`border-b border-gray-200 ${
                    sample.manual
                      ? 'bg-red-50 hover:bg-red-100'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <td className="px-3 py-2">
                    {renderEditableCell(sample, 'codigotexto', sample.codigotexto || sample.codigo?.toString() || '-')}
                  </td>
                  <td className="px-3 py-2">
                    {renderEditableCell(sample, 'nombre', sample.nombre)}
                  </td>
                  <td className="px-3 py-2">
                    {renderEditableCell(sample, 'empresa', sample.empresa_nombre || sample.empresa || '-')}
                  </td>
                  <td className="px-3 py-2">
                    {renderEditableCell(
                      sample,
                      'categoria',
                      sample.categoria || '-',
                      'select',
                      ['Vino Blanco', 'Vino Tinto', 'Vino Rosado', 'Espumoso', 'Cava', 'Aceite de Oliva', 'Otros']
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="px-2 py-1 text-xs text-gray-900">
                      {sample.created_at ? new Date(sample.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {renderEditableCell(
                      sample,
                      'categoriadecata',
                      sample.categoriadecata || '-',
                      'select',
                      ['vinos_tranquilos', 'generosos_espirituosos', 'aoves_cata']
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {renderEditableCell(sample, 'codigo', sample.codigo?.toString() || '-')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSample(sample);
                      }}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron muestras
          </div>
        )}
      </div>

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