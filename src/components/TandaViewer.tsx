import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { X } from 'lucide-react';

interface TandaViewerProps {
  onClose: () => void;
}

export default function TandaViewer({ onClose }: TandaViewerProps) {
  const [selectedTanda, setSelectedTanda] = useState<number | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);

  const tandaOptions = Array.from({ length: 26 }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedTanda) {
      fetchSamplesByTanda(selectedTanda);
    }
  }, [selectedTanda]);

  const fetchSamplesByTanda = async (tanda: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muestras')
        .select('*')
        .eq('tanda', tanda)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSamples(data || []);
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Visor de Tandas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Selecciona una Tanda
            </h3>
            <div className="flex flex-wrap gap-2">
              {tandaOptions.map((tanda) => (
                <button
                  key={tanda}
                  onClick={() => setSelectedTanda(tanda)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 ${
                    selectedTanda === tanda
                      ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                  }`}
                >
                  Tanda {tanda}
                </button>
              ))}
            </div>
          </div>

          {selectedTanda && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Muestras de la Tanda {selectedTanda}
                </h3>
                <span className="text-sm text-gray-600">
                  {samples.length} muestra{samples.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-600">
                  Cargando...
                </div>
              ) : samples.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay muestras asignadas a esta tanda
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Empresa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          País
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Origen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {samples.map((sample, index) => (
                        <tr
                          key={sample.id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {sample.codigo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {sample.nombre}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {sample.categoria || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {sample.empresa || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {sample.pais || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {sample.origen || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
