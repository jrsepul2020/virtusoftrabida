import { useState } from 'react';
import { EmpresaScreen } from './EmpresaScreen';
import { MuestrasScreen } from './MuestrasScreen';
import { ConfirmacionScreen } from './ConfirmacionScreen';
import { CompanyData, SampleData, PaymentMethod } from './types';
import { supabase } from '../lib/supabase';
import { User, CheckCircle } from 'lucide-react';

type AdminFormStep = 'empresa' | 'muestras' | 'confirmacion';

export default function AdminInscriptionForm() {
  const [currentStep, setCurrentStep] = useState<AdminFormStep>('empresa');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para marcar si es inscripción manual
  const [isManualInscription, setIsManualInscription] = useState(true);

  // Estados para el formulario por pasos (igual que en App.tsx)
  const [company, setCompany] = useState<CompanyData>({
    nif: '',
    nombre_empresa: '',
    persona_contacto: '',
    telefono: '',
    movil: '',
    email: '',
    direccion: '',
    poblacion: '',
    codigo_postal: '',
    ciudad: '',
    pais: '',
    medio_conocio: '',
    pagina_web: '',
    observaciones: '',
    num_muestras: 1,
  });

  const [samples, setSamples] = useState<SampleData[]>([{
    nombre_muestra: '',
    categoria: '',
    origen: '',
    igp: '',
    pais: '',
    azucar: '',
    grado_alcoholico: '',
    existencias: '',
    anio: '',
    tipo_uva: '',
    tipo_aceituna: '',
    destilado: '',
  }]);

  const [payment, setPayment] = useState<PaymentMethod>('transferencia');

  // Funciones de cálculo de precio (igual que en App.tsx)
  const calculatePrice = (numMuestras: number) => {
    const gratis = Math.min(numMuestras, 2);
    const pagadas = Math.max(numMuestras - 2, 0);
    const total = pagadas * 20;
    return { pagadas, gratis, total };
  };

  // Handlers del formulario
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: name === 'num_muestras' ? parseInt(value) || 1 : value
    }));

    // Ajustar array de muestras según el número
    if (name === 'num_muestras') {
      const numMuestras = parseInt(value) || 1;
      setSamples(prev => {
        const newSamples = [...prev];
        while (newSamples.length < numMuestras) {
          newSamples.push({
            nombre_muestra: '',
            categoria: '',
            origen: '',
            igp: '',
            pais: '',
            azucar: '',
            grado_alcoholico: '',
            existencias: '',
            anio: '',
            tipo_uva: '',
            tipo_aceituna: '',
            destilado: '',
          });
        }
        return newSamples.slice(0, numMuestras);
      });
    }
  };

  const handleSampleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSamples(prev => prev.map((sample, i) => 
      i === index ? { ...sample, [name]: value } : sample
    ));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayment(e.target.value as PaymentMethod);
  };

  // Navegación entre pasos
  const handleCompanyNext = () => {
    setCurrentStep('muestras');
  };

  const handleMuestrasNext = () => {
    setCurrentStep('confirmacion');
  };

  const handleMuestrasPrev = () => {
    setCurrentStep('empresa');
  };

  const handleConfirmacionPrev = () => {
    setCurrentStep('muestras');
  };

  // Envío final del formulario
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Insertar empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .insert([{
          ...company,
          manual: isManualInscription, // Campo adicional para marcar inscripción manual
        }])
        .select()
        .single();

      if (empresaError) throw empresaError;

      // Insertar muestras
      const samplesWithEmpresaId = samples.map(sample => ({
        ...sample,
        empresa_id: empresaData.id,
        manual: isManualInscription, // También marcar las muestras como manuales
      }));

      const { error: samplesError } = await supabase
        .from('muestras')
        .insert(samplesWithEmpresaId);

      if (samplesError) throw samplesError;

      setSuccess(true);
      
      // Limpiar formulario después de un tiempo
      setTimeout(() => {
        setSuccess(false);
        setCurrentStep('empresa');
        setCompany({
          nif: '',
          nombre_empresa: '',
          persona_contacto: '',
          telefono: '',
          movil: '',
          email: '',
          direccion: '',
          poblacion: '',
          codigo_postal: '',
          ciudad: '',
          pais: '',
          medio_conocio: '',
          pagina_web: '',
          observaciones: '',
          num_muestras: 1,
        });
        setSamples([{
          nombre_muestra: '',
          categoria: '',
          origen: '',
          igp: '',
          pais: '',
          azucar: '',
          grado_alcoholico: '',
          existencias: '',
          anio: '',
          tipo_uva: '',
          tipo_aceituna: '',
          destilado: '',
        }]);
        setPayment('transferencia');
        setIsManualInscription(true);
      }, 3000);

    } catch (err: any) {
      console.error('Error en inscripción:', err);
      setError(err.message || 'Error al procesar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header con indicador de inscripción manual */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Inscripción Manual de Administrador</h3>
              <p className="text-sm text-blue-600">
                Esta inscripción será marcada como "manual" en la base de datos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="manual-inscription"
              checked={isManualInscription}
              onChange={(e) => setIsManualInscription(e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="manual-inscription" className="text-sm font-medium text-blue-700">
              Marcar como manual
            </label>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          <div className={`flex items-center ${currentStep === 'empresa' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'empresa' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Empresa</span>
          </div>
          <div className={`flex items-center ${currentStep === 'muestras' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'muestras' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Muestras</span>
          </div>
          <div className={`flex items-center ${currentStep === 'confirmacion' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'confirmacion' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Confirmación</span>
          </div>
        </div>
      </div>

      {/* Contenido de los pasos */}
      {currentStep === 'empresa' && (
        <EmpresaScreen
          company={company}
          onChange={handleCompanyChange}
          onNext={handleCompanyNext}
          precio={calculatePrice(company.num_muestras)}
        />
      )}

      {currentStep === 'muestras' && (
        <MuestrasScreen
          samples={samples}
          onChange={handleSampleChange}
          onNext={handleMuestrasNext}
          onPrev={handleMuestrasPrev}
        />
      )}

      {currentStep === 'confirmacion' && (
        <ConfirmacionScreen
          company={company}
          samples={samples}
          payment={payment}
          onPaymentChange={handlePaymentChange}
          precio={calculatePrice(company.num_muestras)}
          onPrev={handleConfirmacionPrev}
          onSubmit={handleSubmit}
          success={success}
          loading={loading}
          error={error}
        />
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ¡Inscripción Manual Completada!
            </h3>
            <p className="text-gray-600 mb-4">
              La empresa y sus muestras han sido registradas correctamente como inscripción manual.
            </p>
            <p className="text-sm text-blue-600">
              Regresando al formulario en unos segundos...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}