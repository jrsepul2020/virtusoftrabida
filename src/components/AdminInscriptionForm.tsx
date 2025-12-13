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
  
  // Función para generar código único para muestras manuales
  const generateUniqueCode = async (): Promise<number> => {
    // Obtener códigos existentes
    const { data: existingCodes } = await supabase
      .from('muestras')
      .select('codigo_muestra')
      .not('codigo_muestra', 'is', null);
    
    const usedCodes = new Set(existingCodes?.map(item => item.codigo_muestra) || []);
    
    // Buscar primer código disponible del 1 al 999
    for (let code = 1; code <= 999; code++) {
      if (!usedCodes.has(code)) {
        return code;
      }
    }
    
    throw new Error('No hay códigos disponibles (1-999)');
  };

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

  // Funciones de cálculo de precio (igual que en PaymentSelection)
  const calculatePrice = (numMuestras: number) => {
    // Por cada 4 muestras pagadas, la 5ª es gratis
    // Ejemplos: 1-4 muestras → 0 gratis | 5-9 muestras → 1 gratis | 10-14 muestras → 2 gratis
    const gratis = Math.floor(numMuestras / 5);
    const pagadas = numMuestras - gratis;
    const total = pagadas * 150;
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
          nif: company.nif,
          name: company.nombre_empresa,
          contact_person: company.persona_contacto,
          phone: company.telefono,
          movil: company.movil,
          email: company.email,
          address: company.direccion, // Mapear direccion a address
          poblacion: company.poblacion,
          codigo_postal: company.codigo_postal,
          ciudad: company.ciudad,
          pais: company.pais,
          conocimiento: company.medio_conocio,
          pagina_web: company.pagina_web,
          observaciones: company.observaciones,
          totalinscripciones: company.num_muestras,
          manual: isManualInscription, // Campo adicional para marcar inscripción manual
        }])
        .select()
        .single();

      if (empresaError) throw empresaError;

      // Preparar muestras con códigos únicos si es manual
      const samplesWithEmpresaId = [];
      
      for (const sample of samples) {
        let codigoMuestra = null;
        
        // Si es inscripción manual, generar código único
        if (isManualInscription) {
          codigoMuestra = await generateUniqueCode();
        }
        
        samplesWithEmpresaId.push({
          ...sample,
          empresa_id: empresaData.id,
          manual: isManualInscription,
          codigo_muestra: codigoMuestra, // Código único para muestras manuales
        });
      }

      const { error: samplesError } = await supabase
        .from('muestras')
        .insert(samplesWithEmpresaId);

      if (samplesError) throw samplesError;

      setSuccess(true);
      
      // Si es manual, mostrar los códigos generados
      if (isManualInscription) {
        console.log('Códigos de muestra asignados:', samplesWithEmpresaId.map(s => s.codigo_muestra));
      }
      
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
      <div className={`border rounded-xl p-4 mb-6 ${isManualInscription ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isManualInscription ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              <User className={`w-5 h-5 ${isManualInscription ? 'text-orange-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isManualInscription ? 'text-orange-800' : 'text-blue-800'}`}>
                {isManualInscription ? '🏷️ Inscripción Manual' : '💻 Inscripción Automática'}
              </h3>
              <p className={`text-sm ${isManualInscription ? 'text-orange-600' : 'text-blue-600'}`}>
                {isManualInscription 
                  ? 'Se generarán códigos únicos (1-999) para cada muestra'
                  : 'Inscripción estándar sin códigos especiales'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
            <input
              type="checkbox"
              id="manual-inscription"
              checked={isManualInscription}
              onChange={(e) => setIsManualInscription(e.target.checked)}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="manual-inscription" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
              Muestra Manual 1 al 999
            </label>
          </div>
        </div>
        
        {isManualInscription && (
          <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-orange-600 text-xs font-bold">!</span>
              </div>
              <div className="text-sm text-orange-700">
                <p className="font-medium">Características de la inscripción manual:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Se asignará un código único del 1 al 999 a cada muestra</li>
                  <li>• La inscripción se marcará como "manual" en la base de datos</li>
                  <li>• Ideal para inscripciones presenciales o telefónicas</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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
          precio={calculatePrice(Number(company.num_muestras || 0))}
        />
      )}

      {currentStep === 'muestras' && (
        <MuestrasScreen
          samples={samples}
          onChange={handleSampleChange}
          onNext={handleMuestrasNext}
          onPrev={handleMuestrasPrev}
          onImageChange={() => {}}
        />
      )}

      {currentStep === 'confirmacion' && (
        <ConfirmacionScreen
          company={company}
          samples={samples}
          payment={payment}
          onPaymentChange={handlePaymentChange}
          precio={calculatePrice(Number(company.num_muestras || 0))}
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