import { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import UnifiedInscriptionForm from './components/UnifiedInscriptionForm';
import HeroLanding from './components/HeroLanding';
import PWAInstallBanner from './components/PWAInstallBanner';

type View = 'home' | 'adminLogin' | 'admin' | 'inscripcion';

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Verificar estado de admin en localStorage
    const adminSession = localStorage.getItem('adminLoggedIn');
    if (adminSession === 'true') {
      setAdminLoggedIn(true);
      setView('admin');
    }
    setLoading(false);
  }, []);

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setAdminLoggedIn(true);
      localStorage.setItem('adminLoggedIn', 'true');
      setView('admin');
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
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
        <LoginForm onLogin={handleAdminLogin} />
      )}

      {/* Panel de administrador */}
      {view === 'admin' && adminLoggedIn && (
        <AdminDashboard />
      )}

      {/* Formulario de inscripción unificado */}
      {view === 'inscripcion' && (
        <UnifiedInscriptionForm 
          isAdmin={false}
          onSuccess={() => setView('home')}
        />
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </MainLayout>
  );
}

export default App;