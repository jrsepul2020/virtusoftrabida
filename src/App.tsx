import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import AdminDashboard from './components/AdminDashboard';
import CatadorDashboard from './components/CatadorDashboard';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import UnifiedInscriptionForm from './components/UnifiedInscriptionForm';
import HeroLanding from './components/HeroLanding';
import PWAInstallBanner from './components/PWAInstallBanner';
import UpdateNotification, { VersionBadge } from './components/UpdateNotification';
import Reglamento from './components/Reglamento';
import Normativa from './components/Normativa';
import ResultadosPublicos from './components/ResultadosPublicos';
import DiplomasPublicos from './components/DiplomasPublicos';

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
          <AdminDashboard onLogout={handleAdminLogout} />
        </div>
      )}

      {/* Panel de catador */}
      {view === 'catador' && adminLoggedIn && (
        <CatadorDashboard onLogout={handleAdminLogout} />
      )}

      {/* Formulario de inscripción unificado */}
      {view === 'inscripcion' && (
        <UnifiedInscriptionForm 
          isAdmin={false}
          onSuccess={() => setView('home')}
        />
      )}

      {/* Reglamento */}
      {view === 'reglamento' && (
        <Reglamento />
      )}

      {/* Normativa */}
      {view === 'normativa' && (
        <Normativa />
      )}

      {/* Resultados Públicos */}
      {view === 'resultados' && (
        <ResultadosPublicos />
      )}

      {/* Diplomas Públicos */}
      {view === 'diplomas' && (
        <DiplomasPublicos />
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