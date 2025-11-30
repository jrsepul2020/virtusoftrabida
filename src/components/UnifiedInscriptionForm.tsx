import { useState } from 'react';
import { EmpresaScreen } from './EmpresaScreen';
import { MuestrasScreen } from './MuestrasScreen';
import { ConfirmacionScreen } from './ConfirmacionScreen';
import { InscripcionExitosa } from './InscripcionExitosa';
import { CompanyData, SampleData, PaymentMethod } from './types';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';
import Modal from './Modal';

type FormStep = 'empresa' | 'muestras' | 'confirmacion' | 'exitosa';

interface UnifiedInscriptionFormProps {
  isAdmin?: boolean; // Si es true, muestra opciones de admin
  onSuccess?: () => void; // Callback opcional cuando se completa
}

export default function UnifiedInscriptionForm({ 
  isAdmin = false, 
  onSuccess 
}: UnifiedInscriptionFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('empresa');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pedidoNumero, setPedidoNumero] = useState<number | null>(null); // Guardar número de pedido
  
  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'success' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  // Función para mostrar modal
  const showModal = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };
  
  // Estado para marcar si es inscripción manual (solo para admin)
  const [isManualInscription, setIsManualInscription] = useState(isAdmin);

  // Estados para el formulario por pasos
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
    foto_botella: '',
  }]);

  const [payment, setPayment] = useState<PaymentMethod>('transferencia');

  // Función para generar código único para muestras manuales (rango 1-999)
  const generateUniqueCode = async (): Promise<number> => {
    try {
      // Obtener códigos existentes en el rango manual (1-999)
      const { data: existingCodes, error } = await supabase
        .from('muestras')
        .select('codigo')
        .gte('codigo', 1)
        .lte('codigo', 999)
        .not('codigo', 'is', null);
      
      if (error) {
        console.error('Error al obtener códigos existentes:', error);
        throw error;
      }
      
      const usedCodes = new Set(existingCodes?.map(item => item.codigo) || []);
      console.log('Códigos manuales ya usados (1-999):', Array.from(usedCodes).sort((a, b) => a - b));
      
      // Buscar primer código disponible del 1 al 999
      for (let code = 1; code <= 999; code++) {
        if (!usedCodes.has(code)) {
          console.log(`Código disponible encontrado: ${code}`);
          return code;
        }
      }
      
      throw new Error('No hay códigos disponibles en el rango 1-999 para muestras manuales');
    } catch (error) {
      console.error('Error en generateUniqueCode:', error);
      throw error;
    }
  };

  // Funciones de cálculo de precio
  const calculatePrice = (numMuestras: number | string) => {
    // Convertir a número si es string, usar 1 como mínimo
    const num = typeof numMuestras === 'string' ? (numMuestras === '' ? 1 : parseInt(numMuestras) || 1) : numMuestras;
    // Por cada 4 muestras pagadas, la 5ª es gratis
    // Ejemplos: 1-4 muestras → 0 gratis | 5-9 muestras → 1 gratis | 10-14 muestras → 2 gratis
    const gratis = Math.floor(num / 5);
    const pagadas = num - gratis;
    const total = pagadas * 150;
    return { pagadas, gratis, total };
  };

  // Handlers del formulario
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: name === 'num_muestras' ? (value === '' ? '' : parseInt(value) || 1) : value
    }));

    // Ajustar array de muestras según el número
    if (name === 'num_muestras') {
      const numMuestras = value === '' ? 1 : parseInt(value) || 1;
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
            foto_botella: '',
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

  const handleSampleImageChange = (index: number, imageUrl: string) => {
    setSamples(prev => prev.map((sample, i) => 
      i === index ? { ...sample, foto_botella: imageUrl } : sample
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

  // Función para resetear el formulario
  const handleReset = () => {
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
      foto_botella: '',
    }]);
    setPayment('transferencia');
    if (isAdmin) {
      setIsManualInscription(true);
    }
    
    // Llamar callback de éxito cuando el usuario cierra la pantalla de éxito
    if (onSuccess) {
      onSuccess();
    }
  };

  // Envío final del formulario
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    console.log('🚀 Iniciando proceso de inscripción...');

    try {
      // Mapear los datos del formulario a los nombres de columnas de la BD
      // El número de pedido se generará automáticamente en Supabase mediante trigger
      const empresaData = {
        nif: company.nif,
        name: company.nombre_empresa,  // nombre_empresa -> name
        contact_person: company.persona_contacto,  // persona_contacto -> contact_person
        phone: company.telefono,  // telefono -> phone
        movil: company.movil,
        email: company.email,
        address: company.direccion,  // direccion -> address
        poblacion: company.poblacion,
        codigo_postal: company.codigo_postal,
        ciudad: company.ciudad,
        pais: company.pais,
        conocimiento: company.medio_conocio,  // medio_conocio -> conocimiento
        pagina_web: company.pagina_web,
        observaciones: company.observaciones,
        // pedido se asigna automáticamente por el trigger en Supabase
        totalinscripciones: company.num_muestras,  // Número de muestras como total de inscripciones
        status: 'pending',  // Estado por defecto
        created_at: new Date().toISOString(),
      };

      console.log('📝 Datos que se van a insertar en empresas:', empresaData);

      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert([empresaData])
        .select()
        .single();

      if (empresaError) {
        console.error('❌ Error al insertar empresa:', empresaError);
        throw empresaError;
      }
      
      console.log('✅ Empresa insertada correctamente:', empresa);

      // Preparar muestras para insertar
      const samplesWithEmpresaId = [];
      
      for (const sample of samples) {
        // Determinar si es manual
        const esManual = isAdmin && isManualInscription;
        
        // Generar código único solo para muestras manuales (rango 1-999)
        // Las muestras automáticas (manual=false) obtendrán su código del trigger de Supabase (rango 1000-9999)
        let codigoMuestra = null;
        if (esManual) {
          codigoMuestra = await generateUniqueCode();
        }
        
        const sampleData: any = {
          nombre: sample.nombre_muestra,  // nombre_muestra -> nombre
          categoria: sample.categoria,
          origen: sample.origen,
          igp: sample.igp,
          pais: sample.pais,
          azucar: sample.azucar ? parseFloat(sample.azucar.replace(',', '.')) : null,  // Normalizar coma a punto antes de convertir
          grado: sample.grado_alcoholico ? parseFloat(sample.grado_alcoholico.replace(',', '.')) : null,  // grado_alcoholico -> grado (también normalizar)
          existencias: sample.existencias ? parseInt(sample.existencias) : 0,
          anio: sample.anio ? parseInt(sample.anio) : null,  // anio campo en DB
          tipouva: sample.tipo_uva,  // tipo_uva -> tipouva
          tipoaceituna: sample.tipo_aceituna,  // tipo_aceituna -> tipoaceituna
          destilado: sample.destilado,
          empresa_id: empresa.id,  // Relación con tabla empresas
          manual: esManual,
        };
        
        // Solo incluir codigo si es manual (si no es manual, Supabase lo generará automáticamente)
        if (esManual && codigoMuestra !== null) {
          sampleData.codigo = codigoMuestra;
        }
        
        samplesWithEmpresaId.push(sampleData);
      }

      const { error: samplesError } = await supabase
        .from('muestras')
        .insert(samplesWithEmpresaId);

      if (samplesError) throw samplesError;

      // Enviar email de confirmación (siempre, tanto para admin como para usuarios)
      console.log('Enviando email de confirmación...');
      
      // Detectar si estamos en desarrollo local o en producción
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      try {
        if (isDevelopment) {
          console.warn('⚠️ MODO DESARROLLO: Los emails NO se envían en local.');
          console.warn('⚠️ Para probar el envío de emails, despliega en Vercel.');
          console.log('📧 Datos que se enviarían:', {
            empresa: company,
            muestras: samples,
            precio: calculatePrice(company.num_muestras),
            metodoPago: payment,
            pedido: empresa.pedido,
            isAdmin: isAdmin,
            isManual: isManualInscription,
          });
        } else {
          // Solo en producción (Vercel)
          const emailData = {
            empresa: company,
            muestras: samples,
            precio: calculatePrice(company.num_muestras),
            metodoPago: payment,
            pedido: empresa.pedido,
            isAdmin: isAdmin,
            isManual: isManualInscription,
          };
          
          console.log('Datos del email:', emailData);
          
          const response = await fetch('/api/send-inscription-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
          });

          console.log('Respuesta del servidor de email:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error enviando email de confirmación:', errorText);
          } else {
            const result = await response.json();
            console.log('Email enviado correctamente:', result);
          }
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // No lanzar error, solo registrar en consola
      }

      // Cambiar a la pantalla de éxito
      console.log('✅ Inscripción completada, cambiando a pantalla de éxito...');
      console.log('Número de pedido:', empresa.pedido);
      
      // IMPORTANTE: Cambiar el step ANTES de setSuccess para evitar que se muestre
      // el mensaje de éxito en ConfirmacionScreen
      setCurrentStep('exitosa');
      setPedidoNumero(empresa.pedido); // Guardar el número de pedido
      setSuccess(true);
      console.log('✅ Estado actualizado a exitosa');
      
      // Si es admin y manual, mostrar los códigos generados
      if (isAdmin && isManualInscription) {
        console.log('Códigos de muestra asignados:', samplesWithEmpresaId.map(s => s.codigo));
      }
      
      // NO llamar onSuccess aquí para evitar que el componente padre cambie la vista
      // antes de mostrar la pantalla de éxito. El callback se llamará cuando el usuario
      // cierre la pantalla de éxito (en handleReset)

    } catch (err: any) {
      console.error('Error completo en inscripción:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Error details:', err.details);
      
      // Manejar errores específicos con modal
      if (err.code === '23505') {
        // Error de violación de restricción única (duplicate key)
        if (err.message?.includes('muestras_codigo_key') || 
                   err.message?.includes('samples_codigo_key') ||
                   err.details?.includes('codigo')) {
          showModal('error', 'Código de muestra duplicado', 
            `Ya existe una muestra con el código asignado. Esto puede ocurrir si:\n\n` +
            `• El código ya está en uso\n` +
            `• Hay un conflicto en la asignación automática\n\n` +
            `Por favor, inténtalo de nuevo.`);
        } else {
          showModal('error', 'Datos duplicados', 
            `Ya existe un registro con estos datos en el sistema.\n\n` +
            `Detalles: ${err.details || err.message}\n\n` +
            `Por favor, verifica la información e inténtalo de nuevo.`);
        }
      } else if (err.message?.includes('duplicate key value violates unique constraint')) {
        // Fallback para errores de duplicado sin código específico
        showModal('error', 'Datos duplicados', 
          `Ya existe un registro con estos datos. Por favor, verifica la información.`);
      } else {
        showModal('error', 'Error de inscripción', err.message || 'Error al procesar la inscripción. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si está en la pantalla de éxito, mostrarla
  if (currentStep === 'exitosa') {
    return (
      <InscripcionExitosa 
        onClose={handleReset} 
        pedido={pedidoNumero}
        company={company}
        samples={samples}
        precio={calculatePrice(company.num_muestras)}
        metodoPago={payment}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-2">
        {/* Header con indicador de inscripción manual (solo para admin) */}
        {isAdmin && (
          <div className={`border rounded-xl p-4 mb-4 ${isManualInscription ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
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
                Muestra Manual
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
      )}

      {/* Indicador de progreso */}
      <div className="mb-2">
        <div className="flex items-center justify-center space-x-6">
          <div className={`flex items-center ${currentStep === 'empresa' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'empresa' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="ml-1 text-xs font-medium">Empresa</span>
          </div>
          <div className={`flex items-center ${currentStep === 'muestras' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'muestras' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="ml-1 text-xs font-medium">Muestras</span>
          </div>
          <div className={`flex items-center ${currentStep === 'confirmacion' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'confirmacion' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-1 text-xs font-medium">Confirmación</span>
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
          isManualInscription={isManualInscription}
        />
      )}

      {currentStep === 'muestras' && (
        <MuestrasScreen
          samples={samples}
          onChange={handleSampleChange}
          onImageChange={handleSampleImageChange}
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
          onPayPalSuccess={handleSubmit}
          isManualInscription={isManualInscription}
        />
      )}

      {/* Modal para errores y mensajes */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onConfirm={() => {
          setModalOpen(false);
          if (modalType === 'success') {
            // Si es éxito, resetear el formulario después de cerrar
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
                foto_botella: '',
              }]);
              setPayment('transferencia');
              if (isAdmin) {
                setIsManualInscription(true);
              }
            }, 1000);
          }
        }}
      />
      </div>
    </div>
  );
}