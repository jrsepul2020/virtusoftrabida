import { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import HeroLanding from './components/HeroLanding';
import PWAInstallBanner from './components/PWAInstallBanner';
import UpdateNotification, { VersionBadge } from './components/UpdateNotification';

// Lazy loading de componentes pesados
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CatadorDashboard = lazy(() => import('./components/CatadorDashboard'));
const UnifiedInscriptionForm = lazy(() => import('./components/UnifiedInscriptionForm'));
const Reglamento = lazy(() => import('./components/Reglamento'));
const Normativa = lazy(() => import('./components/Normativa'));
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

type View = 'home' | 'adminLogin' | 'admin' | 'catador' | 'inscripcion' | 'reglamento' | 'normativa' | 'resultados' | 'diplomas';

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado de admin en localStorage
    const adminSession = localStorage.getItem('adminLoggedIn');
    const savedRole = localStorage.getItem('userRole');
    if (adminSession === 'true') {
      setAdminLoggedIn(true);
      setUserRole(savedRole);
      
      // Restaurar vista según rol
      if (savedRole === 'Catador') {
        setView('catador');
      } else {
        setView('admin');
      }
    }
    setLoading(false);
  }, []);

  const handleAdminLogin = (success: boolean, role?: string) => {
    if (success) {
      setAdminLoggedIn(true);
      setUserRole(role || 'admin');
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('userRole', role || 'admin');
      
      // Redirigir según rol
      if (role === 'Catador') {
        setView('catador');
      } else {
        setView('admin');
      }
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setAdminLoggedIn(false);
    setUserRole(null);
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

      {/* Normativa */}
      {view === 'normativa' && (
        <Suspense fallback={<LoadingFallback />}>
          <Normativa />
        </Suspense>
      )}

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

      {/* PWA Install Banner */}
      <PWAInstallBanner />
      
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* Version Badge */}
      <VersionBadge currentView={view} />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </MainLayout>
  );
}

export default App;