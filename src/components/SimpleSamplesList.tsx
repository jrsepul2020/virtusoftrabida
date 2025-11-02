import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Trash2, X, ChevronDown, Hand, Printer, FileSpreadsheet } from 'lucide-react';
import SampleEditModal from './SampleEditModal';
import * as XLSX from 'xlsx';

type SortField = 'codigo' | 'nombre' | 'categoria' | 'pais' | 'azucar' | 'grado';
type SortDirection = 'asc' | 'desc';

interface SimpleSamplesListProps {
  onNavigateToPrint?: () => void;
}

export default function SimpleSamplesList({ onNavigateToPrint }: SimpleSamplesListProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterAndSortSamples();
  }, [searchTerm, samples, sortField, sortDirection, selectedCategories]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;

      setSamples(samplesData || []);

      const uniqueCategories = Array.from(
        new Set(samplesData?.map(s => s.categoria).filter(Boolean) as string[])
      ).sort();
      setAvailableCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSamples = () => {
    let filtered = [...samples];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (sample) => sample.categoria && selectedCategories.includes(sample.categoria)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sample) =>
          sample.nombre.toLowerCase().includes(term) ||
          sample.codigo.toString().includes(term) ||
          sample.categoria?.toLowerCase().includes(term) ||
          sample.pais?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'codigo':
          aValue = a.codigo;
          bValue = b.codigo;
          break;
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria?.toLowerCase() || '';
          bValue = b.categoria?.toLowerCase() || '';
          break;
        case 'pais':
          aValue = a.pais?.toLowerCase() || '';
          bValue = b.pais?.toLowerCase() || '';
          break;
        case 'azucar':
          aValue = a.azucar ?? -1;
          bValue = b.azucar ?? -1;
          break;
        case 'grado':
          aValue = a.grado ?? -1;
          bValue = b.grado ?? -1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSamples(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4" /> :
      <ArrowDown className="w-4 h-4" />;
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
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

  const handleExportToExcel = () => {
    // Preparar los datos para Excel (usar filteredSamples para exportar solo lo que se ve)
    const excelData = filteredSamples.map(sample => ({
      'Código': sample.codigo,
      'Código Texto': sample.codigotexto || '',
      'Nombre': sample.nombre,
      'Categoría': sample.categoria || '',
      'Empresa': sample.empresa || '',
      'País': sample.pais || '',
      'Origen': sample.origen || '',
      'Azúcar (g/l)': sample.azucar || '',
      'Grado Alcohólico': sample.grado || '',
      'Año': sample.anio || '',
      'Tipo Uva': sample.tipouva || '',
      'Tipo Aceituna': sample.tipoaceituna || '',
      'Tanda': sample.tanda || '',
      'Pagada': sample.pagada ? 'Sí' : 'No',
      'Manual': sample.manual ? 'Sí' : 'No',
      'Fecha Creación': sample.created_at ? new Date(sample.created_at).toLocaleDateString('es-ES') : ''
    }));

    // Crear el libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Muestras');

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 8 },  // Código
      { wch: 12 }, // Código Texto
      { wch: 30 }, // Nombre
      { wch: 20 }, // Categoría
      { wch: 30 }, // Empresa
      { wch: 15 }, // País
      { wch: 15 }, // Origen
      { wch: 12 }, // Azúcar
      { wch: 15 }, // Grado
      { wch: 8 },  // Año
      { wch: 20 }, // Tipo Uva
      { wch: 20 }, // Tipo Aceituna
      { wch: 8 },  // Tanda
      { wch: 8 },  // Pagada
      { wch: 8 },  // Manual
      { wch: 15 }  // Fecha
    ];
    worksheet['!cols'] = columnWidths;

    // Generar el archivo
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const categoriaTexto = selectedCategories.length > 0 ? `_${selectedCategories.join('_')}` : '';
    XLSX.writeFile(workbook, `muestras${categoriaTexto}_${fecha}.xlsx`);
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
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-3">
          <div className="relative sm:w-auto">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                <span className="hidden sm:inline">Filtrar por </span>Categoría
                {selectedCategories.length > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full mt-2 left-0 right-0 sm:right-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10 sm:min-w-[300px] max-h-[400px] overflow-y-auto">
                <div className="p-2">
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="select-none">{category}</span>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No hay categorías disponibles</div>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="bg-primary-50 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">
            <div className="text-xs sm:text-sm text-primary-600 font-medium">
              <span className="hidden sm:inline">Total: </span>{samples.length}
            </div>
          </div>

          {onNavigateToPrint && (
            <button
              onClick={onNavigateToPrint}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Imprimir</span>
              <span className="sm:hidden text-sm">Print</span>
            </button>
          )}

          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Excel</span>
            <span className="sm:hidden text-sm">XLS</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabla para pantallas grandes */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('codigo')}
                >
                  <div className="flex items-center gap-1">
                    Código
                    {getSortIcon('codigo')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    {getSortIcon('nombre')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoría
                    {getSortIcon('categoria')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('pais')}
                >
                  <div className="flex items-center gap-1">
                    País
                    {getSortIcon('pais')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('azucar')}
                >
                  <div className="flex items-center gap-1">
                    Azúcar
                    {getSortIcon('azucar')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('grado')}
                >
                  <div className="flex items-center gap-1">
                    Grado
                    {getSortIcon('grado')}
                  </div>
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSamples.map((sample, index) => (
                <tr
                  key={sample.id}
                  onClick={() => setEditingSample(sample)}
                  className={`cursor-pointer ${
                    sample.manual
                      ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {sample.manual && <Hand className="w-3 h-3 text-red-600" />}
                      <span className={`text-sm font-bold ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>{sample.codigotexto || sample.codigo}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={`text-sm font-medium flex items-center gap-1 ${
                      sample.manual ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {sample.manual && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold border border-red-300">
                          MANUAL
                        </span>
                      )}
                      {sample.nombre}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>{sample.categoria || '-'}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>{sample.pais || '-'}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                      {sample.azucar !== null && sample.azucar !== undefined ? `${sample.azucar}` : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                      {sample.grado !== null && sample.grado !== undefined ? `${sample.grado}` : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSample(sample);
                      }}
                      className="text-red-600 hover:text-red-700"
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

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden">
          {filteredSamples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => setEditingSample(sample)}
              className={`border-b border-gray-200 p-4 cursor-pointer ${
                sample.manual ? 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {sample.manual && <Hand className="w-4 h-4 text-red-600" />}
                  <span className={`text-lg font-bold ${
                    sample.manual ? 'text-red-700' : 'text-gray-900'
                  }`}>#{sample.codigotexto || sample.codigo}</span>
                  {sample.manual && (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                      MANUAL
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSample(sample);
                  }}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className={`font-medium text-sm mb-2 ${
                sample.manual ? 'text-red-700' : 'text-gray-900'
              }`}>{sample.nombre}</h3>
              
              <div className="space-y-1 text-xs text-gray-600">
                {sample.categoria && (
                  <div className="flex justify-between">
                    <span>Categoría:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.categoria}
                    </span>
                  </div>
                )}
                {sample.pais && (
                  <div className="flex justify-between">
                    <span>País:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.pais}
                    </span>
                  </div>
                )}
                {(sample.azucar !== null && sample.azucar !== undefined) && (
                  <div className="flex justify-between">
                    <span>Azúcar:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.azucar}
                    </span>
                  </div>
                )}
                {(sample.grado !== null && sample.grado !== undefined) && (
                  <div className="flex justify-between">
                    <span>Grado:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.grado}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron muestras
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Mostrando {filteredSamples.length} de {samples.length} muestras
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
                  <p className="text-gray-900 font-mono text-lg">#{viewingSample.codigotexto || viewingSample.codigo}</p>
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
                  <p className="text-gray-900">{viewingSample.categoria || 'Sin categoría'}</p>
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

                {viewingSample.azucar !== null && viewingSample.azucar !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Azúcar</label>
                    <p className="text-gray-900">{viewingSample.azucar} g/L</p>
                  </div>
                )}

                {viewingSample.grado !== null && viewingSample.grado !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Grado Alcohólico</label>
                    <p className="text-gray-900">{viewingSample.grado}°</p>
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
