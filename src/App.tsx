import { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import HeroLanding from './components/HeroLanding';
import UpdateNotification, { VersionBadge } from './components/UpdateNotification';

// Lazy loading de componentes pesados
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CatadorDashboard = lazy(() => import('./components/CatadorDashboard'));
const UnifiedInscriptionForm = lazy(() => import('./components/UnifiedInscriptionForm'));
const Reglamento = lazy(() => import('./components/Reglamento'));
const ResultadosPublicos = lazy(() => import('./components/ResultadosPublicos'));
const DiplomasPublicos = lazy(() => import('./components/DiplomasPublicos'));

// Componente de carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-gray-500 text-sm">Cargando módulo...</p>
    </div>
  </div>
);

type View = 'home' | 'adminLogin' | 'admin' | 'catador' | 'inscripcion' | 'reglamento' | 'resultados' | 'diplomas';

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const clearAuthState = () => {
      setAdminLoggedIn(false);
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('userRole');
    };

    const run = async () => {
      // Detectar acceso directo vía hash #admin (muestra login tradicional)
      const hash = window.location.hash;
      if (hash === '#admin') {
        if (isMounted) {
          setView('adminLogin');
          setLoading(false);
        }
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      // Sistema antiguo de unlock para compatibilidad (dev)
      const unlocked = localStorage.getItem('admin_unlocked');
      if (unlocked === '1') {
        setView('adminLogin');
      }

      // Verificar sesión REAL de Supabase
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error verificando sesión:', error);
          clearAuthState();
          return;
        }

        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();

          if (userError || !userData) {
            console.warn('Usuario sin rol asignado');
            await supabase.auth.signOut();
            clearAuthState();
          } else {
            setAdminLoggedIn(true);
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', userData.rol);

            if (userData.rol === 'Catador') {
              setView('catador');
            } else {
              setView('admin');
            }
          }
        } else {
          clearAuthState();
        }
      } catch (err) {
        console.error('Error en verificación de sesión:', err);
        clearAuthState();
      } finally {
        if (isMounted) setLoading(false);
      }

      // Escuchar cambios en la autenticación
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          clearAuthState();
          setView('home');
        }
      });

      authUnsubscribe = () => subscription.unsubscribe();
    };

    run();

    return () => {
      isMounted = false;
      authUnsubscribe?.();
    };
  }, []);

  // Ocultar temporalmente vistas de resultados y diplomas (solo accesibles públicamente)
  useEffect(() => {
    if (view === 'resultados' || view === 'diplomas') {
      setView('home');
    }
  }, [view]);

  const handleAdminLogin = (success: boolean, role?: string) => {
    console.log('🔐 handleAdminLogin llamado:', { success, role });
    
    if (success) {
      // Normalizar rol
      const normalizedRole = role?.toLowerCase() === 'catador' ? 'Catador' : 'Admin';
      console.log('✅ Login exitoso, rol normalizado:', normalizedRole);
      
      setAdminLoggedIn(true);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('userRole', normalizedRole);
      
      // Redirigir según rol
      if (normalizedRole === 'Catador') {
        console.log('➡️ Redirigiendo a catador');
        setView('catador');
      } else {
        console.log('➡️ Redirigiendo a admin');
        setView('admin');
      }
    } else {
      console.log('❌ Login fallido');
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setAdminLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userRole');
    setView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      view={view}
      setView={setView}
      adminLoggedIn={adminLoggedIn}
      onAdminLogout={handleAdminLogout}
    >
      {/* Vista principal/home */}
      {view === 'home' && (
        <HeroLanding onInscribirse={() => setView('inscripcion')} />
      )}

      {/* Login de administrador */}
      {view === 'adminLogin' && (
        <LoginForm 
          onLogin={handleAdminLogin} 
          onBack={() => setView('home')}
        />
      )}

      {/* Panel de administrador */}
      {view === 'admin' && adminLoggedIn && (
        <div className="flex flex-1 min-h-0">
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboard onLogout={handleAdminLogout} />
          </Suspense>
        </div>
      )}

      {/* Panel de catador */}
      {view === 'catador' && adminLoggedIn && (
        <Suspense fallback={<LoadingFallback />}>
          <CatadorDashboard onLogout={handleAdminLogout} />
        </Suspense>
      )}

      {/* Formulario de inscripción unificado */}
      {view === 'inscripcion' && (
        <Suspense fallback={<LoadingFallback />}>
          <UnifiedInscriptionForm 
            isAdmin={false}
            onSuccess={() => setView('home')}
          />
        </Suspense>
      )}

      {/* Reglamento */}
      {view === 'reglamento' && (
        <Suspense fallback={<LoadingFallback />}>
          <Reglamento />
        </Suspense>
      )}

      {/* Normativa: removed */}

      {/* Resultados Públicos */}
      {view === 'resultados' && (
        <Suspense fallback={<LoadingFallback />}>
          <ResultadosPublicos />
        </Suspense>
      )}

      {/* Diplomas Públicos */}
      {view === 'diplomas' && (
        <Suspense fallback={<LoadingFallback />}>
          <DiplomasPublicos />
        </Suspense>
      )}

      {/* test page removed */}

      {/* PWA install prompt handled inside admin only */}
      
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* Version Badge */}
      <VersionBadge currentView={view} />

      {/* Toast Notifications with aria-live wrapper */}
      <div role="status" aria-live="polite">
        <Toaster position="top-right" />
      </div>
    </MainLayout>
  );
}

export default App;