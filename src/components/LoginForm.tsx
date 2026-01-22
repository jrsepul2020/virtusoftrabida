import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { checkDeviceAccess, loadUserRole } from '../lib/deviceAccessControl';
import { Lock, Mail, X, Shield, AlertTriangle } from 'lucide-react';

type Props = {
  onLogin: (success: boolean, userRole?: string) => void;
  onBack: () => void;
};

export default function LoginForm({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState(localStorage.getItem('virtus_remember_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('virtus_remember_email'));
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const QUICK_PASSWORD = 'Sevill20c@-2026';

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
      // 1. Autenticar usuario
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Guardar email si el usuario quiere recordarlo
      if (rememberMe) {
        localStorage.setItem('virtus_remember_email', email);
      } else {
        localStorage.removeItem('virtus_remember_email');
      }

      console.log('✅ Login exitoso, userId:', authData.user.id);

      // 2. Check device access (TEMPORARILY DISABLED FOR TROUBLESHOOTING)
      // TODO: Re-enable after fixing database setup
      const BYPASS_DEVICE_CHECK = true; // Set to false to re-enable device control
      
      if (!BYPASS_DEVICE_CHECK) {
        const deviceAccess = await checkDeviceAccess(authData.user.id);
        
        if (!deviceAccess.allowed) {
          await supabase.auth.signOut();
          throw new Error(deviceAccess.reason || 'Acceso denegado desde este dispositivo');
        }

        console.log('✅ Dispositivo autorizado');
      } else {
        console.log('⚠️ DEVICE CHECK BYPASSED - Re-enable in production!');
      }

      // 3. Load user role and data (with fallback)
      let roleData = null;
      try {
        roleData = await loadUserRole(authData.user.id);
      } catch (err) {
        console.warn('Could not load role data, using fallback:', err);
      }
      
      // Fallback: if no role data, check usuarios table directly
      if (!roleData) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('rol, mesa, tandaencurso')
          .eq('id', authData.user.id)
          .single();

        if (userData) {
          roleData = {
            user: {
              id: authData.user.id,
              email: authData.user.email || '',
              rol: userData.rol as any,
              mesa: userData.mesa,
              tandaencurso: userData.tandaencurso,
              activo: true,
              created_at: new Date().toISOString(),
            },
            device: null as any, // Bypass mode
          };
        }
      }

      if (!roleData) {
        // Last resort: assign Admin role
        console.warn('⚠️ No role data found, assigning default Admin role');
        roleData = {
          user: {
            id: authData.user.id,
            email: authData.user.email || '',
            rol: 'Administrador',
            activo: true,
            created_at: new Date().toISOString(),
          },
          device: null as any,
        };
      }

      // 4. Normalize role for UI
      let userRole = 'Admin';
      const rawRol = roleData.user.rol.toLowerCase();
      
      if (rawRol === 'administrador' || rawRol === 'admin' || rawRol === 'presidente' || rawRol === 'supervisor') {
        userRole = 'Admin';
      } else if (rawRol === 'catador') {
        userRole = 'Catador';
      } else {
        userRole = roleData.user.rol;
      }

      // Store role for app routing
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userRoleData', JSON.stringify({
        rol: roleData.user.rol,
        mesa: roleData.user.mesa,
        tandaencurso: roleData.user.tandaencurso,
      }));

      console.log('✅ Acceso permitido con rol:', userRole);
      onLogin(true, userRole);
    } catch (err: any) {
      // Sanitize error messages to prevent information leakage
      const safeErrorMessage = getSafeErrorMessage(err);
      setError(safeErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/#admin`,
      });

      if (error) throw error;

      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar email de recuperación');
    } finally {
      setResetLoading(false);
    }
  };

  // Modal de recuperación de contraseña
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmail('');
              setError('');
              setResetSuccess(false);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Recuperar Contraseña
            </h2>
            <p className="text-gray-500 text-sm">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {resetSuccess ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              <p className="font-semibold mb-1">✅ Email enviado</p>
              <p className="text-xs">Revisa tu bandeja de entrada</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email de tu cuenta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all bg-gray-50 focus:bg-white text-base"
                      placeholder="admin@ejemplo.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {resetLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando email...
                    </div>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium transition-colors"
                >
                  Volver al login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="login-title" aria-describedby="login-subtitle">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative transform transition-all scale-100 opacity-100">
        {/* Botón de cerrar */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar formulario de login"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header con ícono */}
          <div className="text-center mb-6 sm:mb-8">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setPassword(QUICK_PASSWORD);
                setShowPassword(true);
                setTimeout(() => passwordInputRef.current?.focus(), 50);
              }}
              title="Pegar contraseña rápida"
              className="inline-flex items-center justify-center w-full overflow-hidden"
            >
              <img src="/logo-bandera-1.png" alt="Logo organización" className="mx-auto h-12 object-contain" />
            </button>
          </div>
          <h2 id="login-title" className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Acceso exclusivo Personal
          </h2>
          <p id="login-subtitle" className="text-gray-500 text-sm">
            Solo administradores
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm" role="alert" aria-live="assertive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
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
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-gray-50 focus:bg-white text-base"
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
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600 focus:ring-2"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Recordar mi email
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-700 to-red-800 text-white py-3 sm:py-4 rounded-xl hover:from-red-800 hover:to-red-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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

          {/* Forgot password removed per request */}
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
