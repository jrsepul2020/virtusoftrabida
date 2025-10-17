import React, { useState, Dispatch, SetStateAction } from "react";
import { supabase } from '../lib/supabase';
import { View } from '../types';

export default function Header({ setView }: { setView: Dispatch<SetStateAction<View>> }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { name: "Inscripción", onClick: () => setView('subscribe') },
    { name: "Normativa", onClick: () => window.location.href = "/normativa" },
    { name: "Reglamento", onClick: () => window.location.href = "/reglamento" },
    { name: "Ediciones Anteriores", onClick: () => window.location.href = "/ediciones-anteriores" },
    { name: "Contacto", onClick: () => window.location.href = "/contacto" },
  ];

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminUser,
        password: adminPass,
      });
      if (!error) {
        setShowAdminLogin(false);
        setView('admin');
      } else {
        setLoginError("Usuario o contraseña incorrectos.");
      }
    } catch {
      setLoginError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-primary-50 shadow-md z-40 relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
          <img src="/logo-bandera-1.png" alt="Logo" className="h-10 w-10 rounded-full object-contain border border-primary-200" />
        </a>
        <nav className="hidden md:flex flex-1 justify-center items-center space-x-8">
          {menuItems.map(item => (
            <button
              key={item.name}
              onClick={item.onClick}
              className="text-primary-800 font-semibold hover:text-primary-600 transition-colors bg-transparent border-none"
            >
              {item.name}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setShowAdminLogin(true)}
          className="bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-primary-800 transition-colors"
          aria-label="Acceso administradores"
        >
          Administración
        </button>
      </div>
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-primary-700 hover:text-primary-900 text-xl"
              onClick={() => setShowAdminLogin(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-primary-800 mb-6 text-center">Acceso Administradores</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-primary-700 font-medium mb-1">Usuario</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-primary-200"
                  value={adminUser}
                  onChange={e => setAdminUser(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-primary-700 font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border border-primary-200"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {loginError && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-700 text-white font-semibold py-2 rounded-lg shadow hover:bg-primary-800 transition"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}