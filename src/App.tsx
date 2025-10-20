import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import SubscriptionForm from './components/SubscriptionForm';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import CataForm from './components/CataForm';
import { EmpresaScreen } from './components/EmpresaScreen';
import { MuestrasScreen } from './components/MuestrasScreen';
import { ConfirmacionScreen } from './components/ConfirmacionScreen';
import PaymentSelection from './components/PaymentSelection';
import Modal from './components/Modal';
import HeroLanding from './components/HeroLanding';
import PWAInstallBanner from './components/PWAInstallBanner';
import { CompanyData, SampleData, PaymentMethod } from './components/types';

type View = 'home' | 'adminLogin' | 'admin' | 'subscribe' | 'cata' | 'empresa' | 'muestras' | 'confirmacion' | 'pago' | 'reglamento' | 'normativa';

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  
  // Estados para autenticación
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);

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

  const [samples, setSamples] = useState<SampleData[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Estados para validación y modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

  // Funciones auxiliares para el formulario por pasos
  const calculatePrice = (numSamples: number) => {
    // Cada 5 muestras, 1 gratis
    const gratis = Math.floor(numSamples / 5);
    const pagadas = numSamples - gratis;
    const total = pagadas * 150;
    
    return { pagadas, gratis, total };
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: name === 'num_muestras' ? parseInt(value) || 1 : value
    }));
  };

  const handleCompanyNext = () => {
    // Limpiar errores anteriores
    setValidationErrors({});
    
    // Validar campos obligatorios
    const errors: {[key: string]: boolean} = {};
    
    if (!company.nombre_empresa.trim()) {
      errors.nombre_empresa = true;
    }
    
    if (!company.email.trim()) {
      errors.email = true;
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setModalTitle('Campos Obligatorios');
      const missingFields = [];
      if (errors.nombre_empresa) missingFields.push('Nombre de la Empresa');
      if (errors.email) missingFields.push('Email');
      setModalMessage(`Por favor, completa los siguientes campos antes de continuar: ${missingFields.join(', ')}.`);
      setShowModal(true);
      return;
    }
    
    // Inicializar muestras según el número especificado
    const initialSamples: SampleData[] = Array.from({ length: company.num_muestras }, () => ({
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
      destilado: ''
    }));
    setSamples(initialSamples);
    setView('muestras');
  };

  const handleSampleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSamples(prev => prev.map((sample, i) => 
      i === index ? { ...sample, [name]: value } : sample
    ));
  };

  const handleSamplesNext = () => {
    // Limpiar errores anteriores
    setValidationErrors({});
    
    // Validar que todas las muestras tengan nombre
    const muestrasVacias = samples.filter(sample => !sample.nombre_muestra.trim());
    if (muestrasVacias.length > 0) {
      // Marcar campos vacíos
      const errors: {[key: string]: boolean} = {};
      samples.forEach((sample, index) => {
        if (!sample.nombre_muestra.trim()) {
          errors[`muestra_${index}`] = true;
        }
      });
      setValidationErrors(errors);
      
      setModalTitle('Campos Obligatorios');
      setModalMessage(`Por favor, completa el nombre de todas las muestras antes de continuar. ${muestrasVacias.length} muestra${muestrasVacias.length > 1 ? 's' : ''} sin nombre.`);
      setShowModal(true);
      return;
    }
    
    setView('confirmacion');
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value as PaymentMethod);
  };

  const handleSubmitInscription = async () => {
    setSubmissionLoading(true);
    setSubmissionError('');
    
    try {
      // 1. Guardar empresa en Supabase
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .insert([{
          nif: company.nif,
          name: company.nombre_empresa,
          contact_person: company.persona_contacto,
          phone: company.telefono,
          movil: company.movil,
          email: company.email,
          address: company.direccion,
          poblacion: company.poblacion,
          codigo_postal: company.codigo_postal,
          ciudad: company.ciudad,
          pais: company.pais,
          conocimiento: company.medio_conocio,
          pagina_web: company.pagina_web,
          observaciones: company.observaciones,
          totalinscripciones: company.num_muestras
        }])
        .select()
        .single();

      if (empresaError) {
        console.error('Error guardando empresa:', empresaError);
        console.error('Detalles del error:', JSON.stringify(empresaError, null, 2));
        console.error('Datos enviados:', JSON.stringify({
          nif: company.nif,
          name: company.nombre_empresa,
          contact_person: company.persona_contacto,
          phone: company.telefono,
          movil: company.movil,
          email: company.email,
          address: company.direccion,
          poblacion: company.poblacion,
          codigo_postal: company.codigo_postal,
          ciudad: company.ciudad,
          pais: company.pais,
          conocimiento: company.medio_conocio,
          pagina_web: company.pagina_web,
          observaciones: company.observaciones,
          totalinscripciones: company.num_muestras
        }, null, 2));
        throw new Error(`Error al guardar los datos de la empresa: ${empresaError.message || 'Error desconocido'}`);
      }

      console.log('Empresa guardada:', empresaData);

      // 2. Guardar muestras en Supabase
      if (samples.length > 0) {
        const muestrasData = samples.map((sample) => ({
          empresa: company.nombre_empresa,
          nombre: sample.nombre_muestra,
          categoria: sample.categoria,
          origen: sample.origen,
          igp: sample.igp,
          pais: sample.pais,
          azucar: sample.azucar ? parseFloat(sample.azucar) : null,
          grado: sample.grado_alcoholico ? parseFloat(sample.grado_alcoholico) : null,
          existencias: sample.existencias ? parseInt(sample.existencias) : 0,
          año: sample.anio ? parseInt(sample.anio) : null,
          tipouva: sample.tipo_uva,
          tipoaceituna: sample.tipo_aceituna,
          destilado: sample.destilado,
          ididempresa: empresaData.id,
          estado_pago: 'pendiente'
        }));

        const { error: muestrasError } = await supabase
          .from('muestras')
          .insert(muestrasData);

        if (muestrasError) {
          console.error('Error guardando muestras:', muestrasError);
          throw new Error('Error al guardar los datos de las muestras');
        }

        console.log('Muestras guardadas:', muestrasData.length);
      }

      // 3. Enviar emails
      try {
        const emailData = {
          empresa: company,
          muestras: samples,
          precio: calculatePrice(company.num_muestras),
          metodoPago: paymentMethod
        };

        const response = await fetch('/api/send-inscription-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          console.error('Error enviando emails:', await response.text());
          // No lanzamos error aquí porque los datos ya se guardaron
          console.warn('Los datos se guardaron correctamente pero hubo un problema enviando los emails de confirmación');
        } else {
          console.log('Emails enviados correctamente');
        }
      } catch (emailError) {
        console.error('Error en el envío de emails:', emailError);
        // No lanzamos error aquí porque los datos ya se guardaron
      }

      setSubmissionSuccess(true);
      
      // Resetear formulario
      setCompany({
        nif: '', nombre_empresa: '', persona_contacto: '', telefono: '', movil: '',
        email: '', direccion: '', poblacion: '', codigo_postal: '', ciudad: '',
        pais: '', medio_conocio: '', pagina_web: '', observaciones: '', num_muestras: 1,
      });
      setSamples([]);
      setPaymentMethod('transferencia');
      setValidationErrors({});
      
      // Mostrar modal de éxito
      setModalTitle('¡Inscripción Completada!');
      setModalMessage('Tu inscripción ha sido guardada correctamente. Recibirás un email de confirmación en breve.');
      setShowModal(true);
      
    } catch (error) {
      console.error('Error completo:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Error al enviar la inscripción. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const checkUserType = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setView('home');
        return;
      }

      // Solo permitir acceso de administrador
      setView('admin');
    } catch (error) {
      console.error('Error checking user type:', error);
      setView('home');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkUserType();
    } else {
      setView('home');
    }
    setLoading(false);
  }, [checkUserType]);

  useEffect(() => {
    checkAuth();

    // Verificar estado de admin en localStorage
    const adminSession = localStorage.getItem('adminLoggedIn');
    if (adminSession === 'true') {
      setAdminLoggedIn(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      (async () => {
        if (session) {
          await checkUserType();
        } else {
          setView('home');
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkAuth, checkUserType]);

  // Función de logout global
  const handleLogout = async () => {
    if (adminLoggedIn) {
      localStorage.removeItem('adminLoggedIn');
      setAdminLoggedIn(false);
    }
    await supabase.auth.signOut();
    setView('home');
  };

  if (loading) {
    return (
      <MainLayout 
        setView={setView}
        adminLoggedIn={adminLoggedIn}
        onLogout={handleLogout}
      >
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-xl text-gray-600">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      setView={setView}
      adminLoggedIn={adminLoggedIn}
      onLogout={handleLogout}
      currentView={view}
    >
      {view === 'adminLogin' && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <LoginForm onLogin={() => {
              setAdminLoggedIn(true);
              setView('admin');
            }} onBack={() => setView('home')} />
          </div>
        </div>
      )}

      {view === 'admin' && <AdminDashboard />}

      {view === 'reglamento' && (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Reglamento</h1>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">Aquí se mostrará el reglamento de la cata.</p>
            </div>
          </div>
        </div>
      )}

      {view === 'normativa' && (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Normativa</h1>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">Aquí se mostrará la normativa de la cata.</p>
            </div>
          </div>
        </div>
      )}

      {view === 'subscribe' && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Formulario de Inscripción</h2>
            <SubscriptionForm />
          </div>
        </div>
      )}

      {view === 'cata' && <CataForm />}

      {/* Formulario por pasos */}
      {view === 'empresa' && (
        <EmpresaScreen
          company={company}
          onChange={handleCompanyChange}
          onNext={handleCompanyNext}
          precio={calculatePrice(company.num_muestras)}
          validationErrors={validationErrors}
        />
      )}

      {view === 'muestras' && (
        <MuestrasScreen
          samples={samples}
          onChange={handleSampleChange}
          onPrev={() => setView('empresa')}
          onNext={handleSamplesNext}
          validationErrors={validationErrors}
        />
      )}

      {view === 'confirmacion' && (
        <ConfirmacionScreen
          company={company}
          samples={samples}
          payment={paymentMethod}
          onPaymentChange={handlePaymentChange}
          precio={calculatePrice(company.num_muestras)}
          onPrev={() => setView('muestras')}
          onSubmit={handleSubmitInscription}
          success={submissionSuccess}
          loading={submissionLoading}
          error={submissionError}
        />
      )}

      {view === 'pago' && (
        <PaymentSelection
          totalSamples={company.num_muestras}
          companyName={company.nombre_empresa}
          companyEmail={company.email}
          onBack={() => setView('confirmacion')}
        />
      )}

      {/* Modal de validación */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
      >
        <p className="text-gray-700">{modalMessage}</p>
      </Modal>

      {view === 'home' && (
        <HeroLanding onInscribirse={() => setView('empresa')} />
      )}
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </MainLayout>
  );
}

export default App;