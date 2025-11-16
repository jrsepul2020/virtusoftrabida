import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, Printer, CheckSquare, Square, ChevronDown, ArrowUpDown } from 'lucide-react';

export default function PrintSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [sortField, setSortField] = useState<'codigo' | 'nombre' | 'categoria'>('codigo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples, selectedCategories, sortField, sortDirection]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSort = (field: 'codigo' | 'nombre' | 'categoria') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select('*')
        .order('created_at', { ascending: false });

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

  const filterSamples = () => {
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
          sample.empresa?.toLowerCase().includes(term) ||
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSamples(filtered);
  };

  const toggleSample = (id: string) => {
    const newSelected = new Set(selectedSamples);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSamples(newSelected);
  };

  const toggleAll = () => {
    if (selectedSamples.size === filteredSamples.length) {
      setSelectedSamples(new Set());
    } else {
      setSelectedSamples(new Set(filteredSamples.map(s => s.id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSamplesList = samples.filter(s => selectedSamples.has(s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando muestras...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Imprimir Listado</h2>
          <button
            onClick={handlePrint}
            disabled={selectedSamples.size === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Imprimir ({selectedSamples.size})</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                Categorías {selectedCategories.length > 0 && `(${selectedCategories.length})`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 mt-2 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 uppercase">Filtrar por categoría</span>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  {availableCategories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSort('codigo')}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                sortField === 'codigo'
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Código
              {sortField === 'codigo' && (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => handleSort('nombre')}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                sortField === 'nombre'
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Nombre
              {sortField === 'nombre' && (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => handleSort('categoria')}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                sortField === 'categoria'
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Categoría
              {sortField === 'categoria' && (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            {selectedSamples.size === filteredSamples.length ? (
              <>
                <CheckSquare className="w-5 h-5" />
                Deseleccionar todas
              </>
            ) : (
              <>
                <Square className="w-5 h-5" />
                Seleccionar todas
              </>
            )}
          </button>
          <span className="text-sm text-gray-600">
            {selectedSamples.size} de {filteredSamples.length} muestras seleccionadas
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedSamples.size === filteredSamples.length && filteredSamples.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSamples.map((sample) => (
                <tr
                  key={sample.id}
                  onClick={() => toggleSample(sample.id)}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedSamples.has(sample.id) ? 'bg-primary-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSamples.has(sample.id)}
                      onChange={() => toggleSample(sample.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    {sample.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {sample.nombre}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {sample.categoria || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sample.empresa || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print View */}
      <div className="print-only">
        <div className="print-header">
          <img src="/logo-bandera-1.png" alt="VIRTUS Awards" className="print-logo" />
          <h1>Listado de Muestras</h1>
          <p className="print-date">Fecha: {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p className="print-total">Total de muestras: {selectedSamples.size}</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Empresa</th>
              <th>País</th>
              <th>Año</th>
            </tr>
          </thead>
          <tbody>
            {selectedSamplesList.map((sample, index) => (
              <tr key={sample.id} className={index % 2 === 0 ? 'even-row' : ''}>
                <td className="code-col">{sample.codigo}</td>
                <td className="name-col">{sample.nombre}</td>
                <td>{sample.categoria || '-'}</td>
                <td>{sample.empresa || '-'}</td>
                <td>{sample.pais || '-'}</td>
                <td>{sample.anio || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-footer">
          <p>Documento generado el {new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          body {
            margin: 0;
            padding: 20px;
          }

          /* Hide navigation and admin panel */
          nav, header, .admin-nav, [class*="navigation"], [class*="header"] {
            display: none !important;
          }

          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #9F8B5C;
            padding-bottom: 20px;
          }

          .print-logo {
            max-width: 300px;
            height: auto;
            margin: 0 auto 20px auto;
            display: block;
          }

          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1F2937;
            margin: 0 0 10px 0;
          }

          .print-date {
            font-size: 14px;
            color: #6B7280;
            margin: 5px 0;
          }

          .print-total {
            font-size: 16px;
            font-weight: 600;
            color: #9F8B5C;
            margin: 10px 0 0 0;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
          }

          .print-table thead {
            background-color: #9F8B5C;
            color: white;
          }

          .print-table th {
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }

          .print-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #E5E7EB;
            color: #374151;
          }

          .print-table .code-col {
            font-weight: 700;
            color: #1F2937;
          }

          .print-table .name-col {
            font-weight: 600;
            color: #1F2937;
          }

          .print-table .even-row {
            background-color: #F9FAFB;
          }

          .print-footer {
            text-align: center;
            font-size: 10px;
            color: #9CA3AF;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #9F8B5C;
          }

          @page {
            margin: 1cm;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
