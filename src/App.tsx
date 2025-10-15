import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import SubscriptionForm from './components/SubscriptionForm';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginForm from './components/LoginForm';
import UserLoginForm from './components/UserLoginForm';

type View = 'home' | 'userLogin' | 'adminLogin' | 'user' | 'admin' | 'subscribe';

function App() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkUserType();
    } else {
      setView('home');
    }
    setLoading(false);
  };

  const checkUserType = async () => {
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (view === 'adminLogin') {
    return <LoginForm onLogin={() => setView('admin')} onBack={() => setView('home')} />;
  }

  if (view === 'userLogin') {
    return <UserLoginForm onLogin={() => setView('user')} onBack={() => setView('home')} />;
  }

  if (view === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'user') {
    return <UserDashboard onLogout={handleLogout} />;
  }

  if (view === 'subscribe') {
    return <SubscriptionForm />;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #8A754C 100%)',
      }}
    >
      {/* Header transparente */}
      <header className="w-full flex justify-between items-center px-10 py-6 bg-transparent z-10 absolute top-0 left-0">
        <div className="flex items-center gap-3 animate-slide-in-left">
          <img
            src="/logo-bandera-1.png"
            alt="Logo International Virtus"
            className="h-14 w-auto drop-shadow-md"
          />
        </div>

        <nav className="flex gap-6 text-[#4B3A2A] font-semibold text-lg">
          <button onClick={() => setView('home')} className="hover:opacity-80 transition">Empresas</button>
          <button onClick={() => setView('subscribe')} className="hover:opacity-80 transition">Registrarse</button>
          <button className="hover:opacity-80 transition">Normativas</button>
          <button className="hover:opacity-80 transition">Contacto</button>
          <button
            onClick={() => setView('user')}
            className="bg-[#8A754C] text-white px-4 py-2 rounded-md hover:bg-[#7A6945] transition"
          >
            Acceso Inscritos
          </button>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="flex flex-col items-center text-center mt-36 px-6">
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

      {/* Footer con accesos */}
      <footer className="w-full text-center py-6 text-[#4B3A2A]/90 z-10 flex flex-col md:flex-row justify-center items-center gap-4 bg-white/30 backdrop-blur-md">
        <button
          onClick={() => setView('adminLogin')}
          className="bg-[#8A754C] text-white px-4 py-2 rounded-md hover:bg-[#7A6945] transition"
        >
          Acceso Administración
        </button>
        <button
          onClick={() => setView('userLogin')}
          className="bg-[#8A754C] text-white px-4 py-2 rounded-md hover:bg-[#7A6945] transition"
        >
          Acceso Inscritos
        </button>
      </footer>
    </div>
  );
}

export default App;
