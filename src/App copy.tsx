import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import SubscriptionForm from './components/SubscriptionForm';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginForm from './components/LoginForm';
import UserLoginForm from './components/UserLoginForm';
import { ClipboardList, UserCircle, Shield } from 'lucide-react';

type View = 'public' | 'userLogin' | 'adminLogin' | 'user' | 'admin';

function App() {
  const [view, setView] = useState<View>('public');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) {
          await checkUserType();
        } else {
          setView('public');
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkUserType();
    } else {
      setView('public');
    }
    setLoading(false);
  };

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setView('public');
        return;
      }

      const { data: company } = await supabase
        .from('empresas')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (company) {
        setView('user');
      } else {
        setView('admin');
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      setView('public');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('public');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (view === 'adminLogin') {
    return <LoginForm onLogin={() => setView('admin')} onBack={() => setView('public')} />;
  }

  if (view === 'userLogin') {
    return <UserLoginForm onLogin={() => setView('user')} onBack={() => setView('public')} />;
  }

  if (view === 'admin') {
    return <AdminDashboard />;
  }

  if (view === 'user') {
    return <UserDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={() => setView('userLogin')}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <UserCircle className="w-5 h-5" />
            Acceso Empresas
          </button>
          <button
            onClick={() => setView('adminLogin')}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
          >
            <Shield className="w-5 h-5" />
            Acceso Administrador
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ClipboardList className="w-12 h-12 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-600">INTERNATIONAL VIRTUS LA RABIDA 2026</h2>
            </div>
          </div>
        </div>

        <SubscriptionForm />
      </div>
    </div>
  );
}

export default App;
