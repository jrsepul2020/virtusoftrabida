import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import SubscriptionForm from './components/SubscriptionForm';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginForm from './components/LoginForm';
import UserLoginForm from './components/UserLoginForm';
import MainLayout from './components/MainLayout';
import Header from './components/Header';
import CataForm, { CataResults } from './components/CataForm';

type View = 'home' | 'userLogin' | 'adminLogin' | 'user' | 'admin' | 'subscribe' | 'cata';

const VALID_VIEWS: View[] = ['home', 'userLogin', 'adminLogin', 'user', 'admin', 'subscribe', 'cata'];

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);

  const checkUserType = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setView('home');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  const handleCataNext = async (results: CataResults, total: number) => {
    try {
      await supabase.from('catas').insert([{ data: results, total }]);
      alert('Cata guardada exitosamente.');
    } catch (err) {
      console.error('Error saving cata:', err);
      alert('Error al guardar la cata. Por favor, inténtelo de nuevo.');
    } finally {
      setView('home');
    }
  };

  const handleViewChange = (view: string) => {
    if (VALID_VIEWS.includes(view as View)) {
      setView(view as View);
    } else {
      console.warn(`Invalid view: ${view}, defaulting to home`);
      setView('home');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-xl text-gray-600">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header setView={handleViewChange} />

      {view === 'adminLogin' && (
        <LoginForm onLogin={() => setView('admin')} onBack={() => setView('home')} />
      )}

      {view === 'userLogin' && (
        <UserLoginForm onLogin={() => setView('user')} onBack={() => setView('home')} />
      )}

      {view === 'admin' && <AdminDashboard onLogout={handleLogout} />}

      {view === 'user' && <UserDashboard onLogout={handleLogout} />}

      {view === 'subscribe' && <SubscriptionForm />}

      {view === 'cata' && <CataForm onNext={handleCataNext} />}

      {view === 'home' && (
        <div
          className="min-h-screen flex flex-col items-center justify-between text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #8A754C 100%)',
          }}
        >
          <main className="flex flex-col items-center text-center mt-36 px-6">
            <img
              src="/logo-bandera-1.png"
              alt="Logo International Virtus"
              className="h-20 mb-4 drop-shadow-lg"
            />
            <h1 className="text-4xl md:text-6xl font-bold tracking-wide mb-2 text-[#4B3A2A] drop-shadow-lg opacity-0 animate-fade-in animate-delay-500">
              International Virtus
            </h1>
            <h2 className="text-2xl md:text-4xl font-medium tracking-widest text-[#4B3A2A]/90 mb-8 opacity-0 animate-fade-in animate-delay-700">
              LA RÁBIDA 2026
            </h2>
            <button
              onClick={() => setView('subscribe')}
              className="bg-[#8A754C] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:bg-[#7A6945] transition transform scale-90 opacity-0 animate-pop-in animate-delay-900"
            >
              Inscribirse
            </button>
          </main>
        </div>
      )}
    </MainLayout>
  );
}

export default App;