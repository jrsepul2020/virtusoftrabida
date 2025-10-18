import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, ChevronDown, Eye } from 'lucide-react';
import TandaViewer from './TandaViewer';

export default function TandasManager() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showTandaViewer, setShowTandaViewer] = useState(false);

  const tandaOptions = Array.from({ length: 26 }, (_, i) => i + 1);
  const tandaOptionsRow1 = tandaOptions.slice(0, 13);
  const tandaOptionsRow2 = tandaOptions.slice(13, 26);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples, selectedCategories]);

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
          sample.categoria?.toLowerCase().includes(term)
      );
    }

    setFilteredSamples(filtered);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const updateTanda = async (sampleId: string, newTanda: number | null) => {
    setUpdatingId(sampleId);
    try {
      const { error } = await supabase
        .from('muestras')
        .update({ tanda: newTanda })
        .eq('id', sampleId);

      if (error) throw error;

      setSamples((prev) =>
        prev.map((sample) =>
          sample.id === sampleId ? { ...sample, tanda: newTanda || undefined } : sample
        )
      );
    } catch (error) {
      console.error('Error updating tanda:', error);
      alert('Error al actualizar la tanda');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTandaColor = (tanda: number | undefined) => {
    if (!tanda) return 'bg-gray-100 text-gray-400';

    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-purple-100 text-purple-700',
    ];

    return colors[(tanda - 1) % colors.length];
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Tandas</h2>
          <button
            onClick={() => setShowTandaViewer(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Ver Tandas</span>
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

        <div className="mb-4">
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
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Mostrando {filteredSamples.length} de {samples.length} muestras
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabla para pantallas grandes */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  Muestra
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">
                  Tanda
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSamples.map((sample, index) => (
                <tr
                  key={sample.id}
                  className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-base font-bold text-gray-900">{sample.codigo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-base font-semibold text-gray-900">{sample.nombre}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{sample.categoria || '-'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex gap-1 justify-center">
                        {tandaOptionsRow1.map((tanda) => (
                          <button
                            key={tanda}
                            onClick={() => updateTanda(sample.id, sample.tanda === tanda ? null : tanda)}
                            disabled={updatingId === sample.id}
                            className={`w-8 h-8 rounded-full font-bold text-xs transition-all border-2 ${
                              sample.tanda === tanda
                                ? 'bg-gray-800 text-white border-gray-800 scale-110 shadow-lg'
                                : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                            } ${
                              updatingId === sample.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title={`Tanda ${tanda}`}
                          >
                            {tanda}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 justify-center">
                        {tandaOptionsRow2.map((tanda) => (
                          <button
                            key={tanda}
                            onClick={() => updateTanda(sample.id, sample.tanda === tanda ? null : tanda)}
                            disabled={updatingId === sample.id}
                            className={`w-8 h-8 rounded-full font-bold text-xs transition-all border-2 ${
                              sample.tanda === tanda
                                ? 'bg-gray-800 text-white border-gray-800 scale-110 shadow-lg'
                                : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                            } ${
                              updatingId === sample.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title={`Tanda ${tanda}`}
                          >
                            {tanda}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móvil y tablet */}
        <div className="lg:hidden">
          {filteredSamples.map((sample, index) => (
            <div
              key={sample.id}
              className={`border-b border-gray-200 p-4 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">#{sample.codigo}</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">{sample.nombre}</div>
                  <div className="text-xs text-gray-600 mt-1">{sample.categoria || '-'}</div>
                </div>
                {sample.tanda && (
                  <div className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm font-bold">
                    Tanda {sample.tanda}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-2">Seleccionar Tanda:</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {tandaOptions.map((tanda) => (
                    <button
                      key={tanda}
                      onClick={() => updateTanda(sample.id, sample.tanda === tanda ? null : tanda)}
                      disabled={updatingId === sample.id}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition-all border-2 ${
                        sample.tanda === tanda
                          ? 'bg-gray-800 text-white border-gray-800 scale-110 shadow-lg'
                          : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                      } ${
                        updatingId === sample.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      title={`Tanda ${tanda}`}
                    >
                      {tanda}
                    </button>
                  ))}
                </div>
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

      {showTandaViewer && (
        <TandaViewer onClose={() => setShowTandaViewer(false)} />
      )}
    </div>
  );
}
