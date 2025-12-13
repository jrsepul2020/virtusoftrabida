import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, X, Shield, AlertTriangle } from 'lucide-react';
import { generateDeviceFingerprint, getDeviceInfo } from '../lib/deviceFingerprint';

type Props = {
  onLogin: (success: boolean, userRole?: string) => void;
  onBack: () => void;
};

export default function LoginForm({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

      console.log('✅ Login exitoso, userId:', authData.user.id);

      // 2. Generar/obtener ID del dispositivo
      const deviceId = await generateDeviceFingerprint();
      const deviceInfo = getDeviceInfo();
      console.log('📱 Device ID:', deviceId);

      // 3. Obtener rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', authData.user.id)
        .single();

      console.log('📋 Datos usuario:', userData, 'Error:', userError);

      // Si hay error o no hay datos, denegar acceso
      if (userError || !userData?.rol) {
        await supabase.auth.signOut();
        throw new Error('Usuario sin rol asignado. Contacta al administrador.');
      }

      // 4. Verificar dispositivos autorizados en el sistema
      const { count: totalDispositivos } = await supabase
        .from('dispositivos')
        .select('*', { count: 'exact', head: true });

      console.log('📊 Total dispositivos en sistema:', totalDispositivos);

      // 5. Verificar si el dispositivo actual está autorizado
      const { data: dispositivoData, error: dispositivoError } = await supabase
        .from('dispositivos')
        .select('id, autorizado, nombre')
        .eq('device_id', deviceId)
        .maybeSingle();

      console.log('🖥️ Dispositivo encontrado:', dispositivoData);

      if (dispositivoError) {
        console.error('Error consultando dispositivos:', dispositivoError);
      }

      // Determinar si es admin (Administrador, Presidente, Supervisor)
      const isAdmin = ['Administrador', 'Presidente', 'Supervisor', 'Admin'].includes(userData.rol);
      const isPrimerDispositivo = (totalDispositivos === null || totalDispositivos === 0);

      // Si el dispositivo no existe, registrarlo
      if (!dispositivoData) {
        console.log('📝 Registrando nuevo dispositivo...');
        
        // Auto-autorizar si: (1) es el primer dispositivo del sistema, O (2) es admin
        const autoAutorizar = isPrimerDispositivo || isAdmin;
        
        const { error: insertError } = await supabase
          .from('dispositivos')
          .insert({
            device_id: deviceId,
            usuario_id: authData.user.id,
            nombre: `${deviceInfo.browser} en ${deviceInfo.os}`,
            user_agent: deviceInfo.userAgent,
            ultima_conexion: new Date().toISOString(),
            autorizado: autoAutorizar,
          });

        if (insertError) {
          console.error('Error registrando dispositivo:', insertError);
        }

        if (!autoAutorizar) {
          // Solo catadores necesitan aprobación
          await supabase.auth.signOut();
          throw new Error('Dispositivo no autorizado. El administrador debe aprobar este dispositivo. Contacta con el administrador.');
        }

        console.log('✅ Dispositivo auto-autorizado (primer dispositivo o admin)');
      } else if (!dispositivoData.autorizado) {
        // Dispositivo existe pero no está autorizado
        
        // Si es admin, auto-autorizar ahora
        if (isAdmin) {
          await supabase
            .from('dispositivos')
            .update({ autorizado: true, ultima_conexion: new Date().toISOString() })
            .eq('id', dispositivoData.id);
          
          console.log('✅ Dispositivo admin auto-autorizado');
        } else {
          // Catador con dispositivo no autorizado
          await supabase.auth.signOut();
          throw new Error(`Dispositivo "${dispositivoData.nombre}" pendiente de autorización. Contacta al administrador.`);
        }
      }

      // 6. Dispositivo autorizado - actualizar última conexión
      if (dispositivoData?.id) {
        await supabase
          .from('dispositivos')
          .update({ ultima_conexion: new Date().toISOString() })
          .eq('id', dispositivoData.id);
      }

      console.log('✅ Dispositivo autorizado');

      // 7. Normalizar rol y permitir acceso
      let userRole = 'Admin';
      
      // Normalizar rol
      const rawRol = userData.rol.toLowerCase();
      if (rawRol === 'administrador' || rawRol === 'admin' || rawRol === 'presidente' || rawRol === 'supervisor') {
        userRole = 'Admin';
      } else if (rawRol === 'catador') {
        userRole = 'Catador';
      } else {
        userRole = userData.rol;
      }
      console.log('✅ Rol obtenido de DB:', userData.rol, '-> normalizado:', userRole);
      
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 id="login-title" className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Panel de Administración
          </h2>
          <p id="login-subtitle" className="text-gray-500 text-sm">
            Acceso exclusivo para administradores
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="••••••••••••"
              />
            </div>
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

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
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
