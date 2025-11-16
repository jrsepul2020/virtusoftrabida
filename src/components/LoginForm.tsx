import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, X, Shield } from 'lucide-react';

type Props = {
  onLogin: (success: boolean) => void;
  onBack: () => void;
};

export default function LoginForm({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safe error message function to prevent information leakage
  const getSafeErrorMessage = (error: any): string => {
    const message = error?.message || '';

    if (message.includes('Invalid login credentials') ||
        message.includes('invalid_credentials') ||
        message.includes('Wrong password')) {
      return 'Email o contraseña incorrectos';
    }

    if (message.includes('Email not confirmed') ||
        message.includes('email_not_confirmed')) {
      return 'Por favor confirma tu email antes de iniciar sesión';
    }

    if (message.includes('Too many requests') ||
        message.includes('rate_limit')) {
      return 'Demasiados intentos. Inténtalo más tarde';
    }

    if (message.includes('User not found') ||
        message.includes('user_not_found')) {
      return 'Usuario no encontrado';
    }

    // Generic error for any other case
    return 'Error al iniciar sesión. Verifica tus credenciales e intenta de nuevo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLogin(true);
    } catch (err: any) {
      // Sanitize error messages to prevent information leakage
      const safeErrorMessage = getSafeErrorMessage(err);
      setError(safeErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative transform transition-all scale-100 opacity-100">
        {/* Botón de cerrar */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header con ícono */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-500 text-sm">
            Acceso exclusivo para administradores
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email de Administrador
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="admin@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña Segura
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 sm:py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verificando acceso...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-5 h-5" />
                Acceder al Panel
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Acceso seguro y cifrado • Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
