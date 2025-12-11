import { useState, useEffect, useRef } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Printer, X, CheckCircle } from 'lucide-react';
import SampleEditModal from './SampleEditModal';

export default function GestionTandas() {
  const [selectedTanda, setSelectedTanda] = useState<number | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

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
      alert('Error al cargar las muestras de la tanda');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handleConfirmPrint = () => {
    setShowPrintModal(false);
    window.print();
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  if (loading && !samples.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando muestras...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Tandas</h2>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Seleccionar Tanda</h3>
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-13 gap-2">
          {tandaOptions.map((tanda) => (
            <button
              key={tanda}
              onClick={() => setSelectedTanda(tanda)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTanda === tanda
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tanda}
            </button>
          ))}
        </div>
      </div>

      {selectedTanda && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Tanda {selectedTanda} - {samples.length} muestras
            </h3>
            {samples.length > 0 && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Imprimir Tanda
              </button>
            )}
          </div>

          {samples.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay muestras asignadas a esta tanda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Orden</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Categoría OIV</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Azúcares gr/L</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Grados % vol.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Añada</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {samples.map((sample, index) => (
                    <tr
                      key={sample.id}
                      onClick={() => setEditingSample(sample)}
                      className={`cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white hover:bg-gray-100' : 'bg-gray-50 hover:bg-gray-150'
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {sample.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {sample.categoria || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {sample.azucar !== null && sample.azucar !== undefined ? sample.azucar : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {sample.grado !== null && sample.grado !== undefined ? sample.grado : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {sample.anio || '-'}
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

      <SampleEditModal
        sample={editingSample}
        onClose={() => setEditingSample(null)}
        onSave={() => selectedTanda && fetchSamplesByTanda(selectedTanda)}
      />

      {/* Modal de impresión */}
      {showPrintModal && selectedTanda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col print:max-w-full print:rounded-none print:max-h-full">
            <div className="p-4 flex justify-between items-center border-b border-gray-200 print:hidden">
              <h3 className="text-lg font-bold text-gray-800">Vista Previa de Impresión - Tanda {selectedTanda}</h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto print:overflow-visible">
              <div ref={printContentRef} className="p-8 print:p-0">
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    @page { margin: 1cm; }
                    body { margin: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    body * { visibility: hidden; }
                    #print-content, #print-content * { visibility: visible; }
                    #print-content { 
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                    }
                  }
                `}} />
                
                <div id="print-content">
                  <div className="text-center mb-4">
                    <div className="text-xs text-gray-800 mb-4 uppercase tracking-wide font-semibold">
                      Concurso Internacional Vinos, Espirituosos y Aceite de Oliva Virgen Extra - LA RABIDA 2026
                    </div>
                    <div className="flex justify-center mb-4">
                      <img src="/logo-bandera-1.png" alt="Logo" className="w-48 h-auto" loading="lazy" decoding="async" />
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold text-black text-center tracking-wider my-8">TANDA Nº: {selectedTanda}</h1>

                  <table className="w-full border-collapse mt-5">
                    <thead>
                      <tr className="border-b-2 border-gray-800">
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Orden</th>
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Código</th>
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Categoría OIV</th>
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Azúcares gr/L</th>
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Grados % vol.</th>
                        <th className="px-2 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Añada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.map((sample, index) => (
                        <tr key={sample.id} className="border-b border-gray-200">
                          <td className="px-2 py-2 text-xs">{index + 1}</td>
                          <td className="px-2 py-2 text-xs">{sample.codigo}</td>
                          <td className="px-2 py-2 text-xs">{sample.categoria || ''}</td>
                          <td className="px-2 py-2 text-xs">{sample.azucar || ''}</td>
                          <td className="px-2 py-2 text-xs">{sample.grado || ''}</td>
                          <td className="px-2 py-2 text-xs">{sample.anio || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center mt-10 pt-5 border-t border-gray-300">
                    <div className="flex items-center">
                      <img src="/logo-bandera-1.png" alt="Logo" className="w-40 h-auto" loading="lazy" decoding="async" />
                    </div>
                    <div className="text-xs text-gray-800">
                      {new Date().toLocaleDateString('es-ES')}<br/>
                      {new Date().toLocaleTimeString('es-ES')}
                    </div>
                  </div>

                  <div className="text-center mt-3 text-xs text-gray-500">
                    Concurso Internacional Vinos, Espirituosos y Aceite de Oliva Virgen Extra - LA RABIDA 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="p-4 border-t border-gray-200 flex gap-3 justify-end print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrint}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Confirmar Impresión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Impresión Realizada!</h3>
              <p className="text-gray-600 mb-6">
                La tanda {selectedTanda} se ha enviado a imprimir correctamente.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
