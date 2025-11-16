import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, ArrowLeft } from 'lucide-react';

type Props = {
  onLogin: () => void;
  onBack: () => void;
};

export default function UserLoginForm({ onLogin, onBack }: Props) {
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

    if (message.includes('No se encontró una empresa asociada')) {
      return 'No se encontró una empresa asociada a esta cuenta';
    }

    // Generic error for any other case
    return 'Error al iniciar sesión. Verifica tus credenciales e intenta de nuevo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const { data: company } = await supabase
          .from('empresas')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!company) {
          await supabase.auth.signOut();
          throw new Error('No se encontró una empresa asociada a esta cuenta');
        }

        onLogin();
      }
    } catch (err: any) {
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <Building2 className="w-10 h-10 text-primary-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Acceso Empresas</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
              placeholder="correo@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 sm:py-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base sm:text-lg"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Las credenciales se envían por email al registrarse
        </p>
      </div>
    </div>
  );
}
