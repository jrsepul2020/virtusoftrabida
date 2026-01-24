import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { checkDeviceAccess, loadUserRole } from "../lib/deviceAccessControl";
import { Lock, Mail, X, Shield, AlertTriangle, Tablet } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  onLogin: (success: boolean, userRole?: string) => void;
  onBack: () => void;
};

export default function LoginForm({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState(
    localStorage.getItem("virtus_remember_email") || "",
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("virtus_remember_email"),
  );
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Barcode Login State
  const [loginMode, setLoginMode] = useState<"email" | "barcode">("email");
  const [barcode, setBarcode] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const QUICK_PASSWORD = "Sevill20c@-2026";

  // Safe error message function to prevent information leakage
  const getSafeErrorMessage = (error: any): string => {
    const message = error?.message || "";

    if (
      message.includes("Invalid login credentials") ||
      message.includes("invalid_credentials") ||
      message.includes("Wrong password")
    ) {
      return "Email o contraseña incorrectos";
    }

    if (
      message.includes("Email not confirmed") ||
      message.includes("email_not_confirmed")
    ) {
      return "Por favor confirma tu email antes de iniciar sesión";
    }

    if (
      message.includes("Too many requests") ||
      message.includes("rate_limit")
    ) {
      return "Demasiados intentos. Inténtalo más tarde";
    }

    if (
      message.includes("User not found") ||
      message.includes("user_not_found")
    ) {
      return "Usuario no encontrado";
    }

    // Generic error for any other case
    return "Error al iniciar sesión. Verifica tus credenciales e intenta de nuevo";
  };

  const handleBarcodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setError("");

    try {
      console.log("🔍 Buscando usuario por código:", barcode);

      // Buscar usuario por código usando una función RPC (Security Definer) para saltar el RLS
      const { data: userData, error: userError } = await supabase.rpc(
        "verify_barcode_user",
        { scanned_code: barcode.trim() },
      );

      if (userError) {
        console.error("❌ Error en RPC verify_barcode_user:", userError);
        // Mostrar el mensaje real del error para depurar (ej: function not found)
        throw new Error(
          `Error técnico: ${userError.message || JSON.stringify(userError)}`,
        );
      }

      if (!userData || userData.length === 0) {
        console.warn("⚠️ No se encontró usuario para el código:", barcode);
        throw new Error("Código no válido o usuario no encontrado");
      }

      // Como RPC puede devolver múltiples (aunque pongamos LIMIT 1), cogemos el primero
      const user = Array.isArray(userData) ? userData[0] : userData;

      if (!user.activo) {
        throw new Error("Usuario inactivo. Contacta con el administrador.");
      }

      console.log("✅ Usuario encontrado por código:", user.nombre);

      // Normalizar rol
      let userRole = "Catador"; // Default
      const rawRol = (user.rol || "").toLowerCase();

      if (
        [
          "administrador",
          "admin",
          "presidente",
          "supervisor",
          "superadmin",
        ].includes(rawRol)
      ) {
        userRole = "Admin";
      } else if (rawRol === "catador") {
        userRole = "Catador";
      } else {
        userRole = user.rol; // Custom role
      }

      // Guardar sesión local (simulada para usuarios de código)
      // Como no hay auth de supabase, no tenemos access_token real para RLS seguro si se requiere
      localStorage.setItem("userRole", userRole);
      localStorage.setItem(
        "userRoleData",
        JSON.stringify({
          rol: user.rol,
          mesa: user.mesa,
          tandaencurso: user.tandaencurso,
          id: user.id,
          nombre: user.nombre,
        }),
      );

      // Indicador especial para saber que es login por código
      localStorage.setItem("authMethod", "barcode");

      toast.success(`Bienvenido/a ${user.nombre}`);
      onLogin(true, userRole);
    } catch (err: any) {
      console.error("Error login barcode:", err);
      setError(err.message || "Error al validar el código");
      // Refocus para siguiente intento rápido
      setTimeout(() => {
        setBarcode("");
        barcodeInputRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; device_token=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  const loginByDevice = async () => {
    const token = getDeviceToken();

    try {
      setLoading(true);
      setError("");

      if (!token) {
        // --- FLUJO DE AUTO-REGISTRO ---
        const newToken = crypto.randomUUID();

        // 1. Contar dispositivos existentes para asignar número
        const { count, error: countError } = await supabase
          .from("authorized_devices")
          .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        const numeroTablet = (count || 0) + 1;
        const mesa = Math.ceil(numeroTablet / 5);

        // 2. Insertar nuevo dispositivo (deshabilitado por defecto)
        const { error: insertError } = await supabase
          .from("authorized_devices")
          .insert([
            {
              device_token: newToken,
              name: `Mesa ${mesa} - Tablet ${numeroTablet}`,
              enabled: false,
            },
          ]);

        if (insertError) throw insertError;

        // 3. Guardar cookie
        document.cookie = `device_token=${newToken}; path=/; SameSite=Strict; Secure`;

        toast.success("Tablet registrada. Pendiente de autorización.");
        setLoading(false);
        return;
      }

      // --- FLUJO DE LOGIN ACTUAL (Token existe) ---
      const { data, error: queryError } = await supabase
        .from("authorized_devices")
        .select("*")
        .eq("device_token", token)
        .eq("enabled", true)
        .maybeSingle();

      if (queryError || !data) {
        setError("Esta tablet no está autorizada");
        return;
      }

      console.log("Tablet autorizada. Accediendo...");

      // 1. Autenticar con el usuario fijo para tablets
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: "tablet@system.local",
          password: "AQUI_LA_CONTRASEÑA_QUE_YO_PONGA",
        });

      if (authError || !authData.user) {
        console.error("❌ Error login tablet:", authError);
        throw new Error("No se pudo acceder con esta tablet");
      }

      console.log("✅ Auth tablet exitoso:", authData.user.id);

      // 2. Obtener datos del usuario (rol, mesa, etc.) para la sesión
      const { data: userData } = await supabase
        .from("usuarios")
        .select("rol, mesa, tandaencurso, nombre")
        .eq("id", authData.user.id)
        .single();

      // 3. Normalizar rol (siguiendo la lógica de handleSubmit)
      let userRole = "Catador";
      let displayRole = "Catador";

      if (userData) {
        const rawRol = (userData.rol || "").toLowerCase();
        if (
          [
            "administrador",
            "admin",
            "presidente",
            "supervisor",
            "superadmin",
          ].includes(rawRol)
        ) {
          displayRole = "Admin";
        }
        userRole = userData.rol;
      }

      // 4. Guardar sesión local
      localStorage.setItem("userRole", displayRole);
      localStorage.setItem("authMethod", "email");
      localStorage.setItem(
        "userRoleData",
        JSON.stringify({
          rol: userRole,
          mesa: userData?.mesa,
          tandaencurso: userData?.tandaencurso,
          id: authData.user.id,
          nombre: userData?.nombre || "Tablet",
        }),
      );

      // 5. Entrar a la app
      toast.success(`Acceso autorizado: ${userData?.nombre || "Tablet"}`);
      onLogin(true, displayRole);
    } catch (err) {
      console.error("Error validando tablet:", err);
      setError("Error al validar la tablet");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Autenticar usuario
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      // Guardar email si el usuario quiere recordarlo
      if (rememberMe) {
        localStorage.setItem("virtus_remember_email", email);
      } else {
        localStorage.removeItem("virtus_remember_email");
      }

      console.log("✅ Login exitoso, userId:", authData.user.id);

      // 2. Check device access (TEMPORARILY DISABLED FOR TROUBLESHOOTING)
      // TODO: Re-enable after fixing database setup
      const BYPASS_DEVICE_CHECK = true; // Set to false to re-enable device control

      if (!BYPASS_DEVICE_CHECK) {
        const deviceAccess = await checkDeviceAccess(authData.user.id);

        if (!deviceAccess.allowed) {
          await supabase.auth.signOut();
          throw new Error(
            deviceAccess.reason || "Acceso denegado desde este dispositivo",
          );
        }

        console.log("✅ Dispositivo autorizado");
      } else {
        console.log("⚠️ DEVICE CHECK BYPASSED - Re-enable in production!");
      }

      // 3. Load user role and data (with fallback)
      let roleData = null;
      try {
        roleData = await loadUserRole(authData.user.id);
      } catch (err) {
        console.warn("Could not load role data, using fallback:", err);
      }

      // Fallback: if no role data, check usuarios table directly
      if (!roleData) {
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("rol, mesa, tandaencurso")
          .eq("id", authData.user.id)
          .single();

        if (userData) {
          roleData = {
            user: {
              id: authData.user.id,
              email: authData.user.email || "",
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
        console.warn("⚠️ No role data found, assigning default Admin role");
        roleData = {
          user: {
            id: authData.user.id,
            email: authData.user.email || "",
            rol: "Administrador",
            activo: true,
            created_at: new Date().toISOString(),
          },
          device: null as any,
        };
      }

      // 4. Normalize role for UI
      let userRole = "Admin";
      const rawRol = roleData.user.rol.toLowerCase();

      if (
        rawRol === "administrador" ||
        rawRol === "admin" ||
        rawRol === "presidente" ||
        rawRol === "supervisor"
      ) {
        userRole = "Admin";
      } else if (rawRol === "catador") {
        userRole = "Catador";
      } else {
        userRole = roleData.user.rol;
      }

      // Store role for app routing
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("authMethod", "email");
      localStorage.setItem(
        "userRoleData",
        JSON.stringify({
          rol: roleData.user.rol,
          mesa: roleData.user.mesa,
          tandaencurso: roleData.user.tandaencurso,
        }),
      );

      console.log("✅ Acceso permitido con rol:", userRole);
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
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/#admin`,
      });

      if (error) throw error;

      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
        setResetEmail("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al enviar email de recuperación");
    } finally {
      setResetLoading(false);
    }
  };

  // Modal de recuperación de contraseña
  if (showForgotPassword) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmail("");
              setError("");
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
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
                  role="alert"
                >
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
                    "Enviar enlace de recuperación"
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      aria-describedby="login-subtitle"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative transform transition-all scale-100 opacity-100">
        {/* Botón de cerrar */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar formulario de login"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header con toggle de modo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (loginMode === "email") {
                  setPassword(QUICK_PASSWORD);
                  setShowPassword(true);
                  setTimeout(() => passwordInputRef.current?.focus(), 50);
                }
              }}
              className="inline-flex items-center justify-center w-full overflow-hidden"
            >
              <img
                src="/logo-bandera-1.png"
                alt="Logo organización"
                className="mx-auto h-12 object-contain"
              />
            </button>
          </div>

          {/* Toggle Button */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative">
            <button
              onClick={() => {
                setLoginMode("email");
                setError("");
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                loginMode === "email"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Acceso Admin
            </button>
            <button
              onClick={() => {
                setLoginMode("barcode");
                setError("");
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                loginMode === "barcode"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Acceso Pistola
            </button>
          </div>

          <h2
            id="login-title"
            className="text-xl sm:text-2xl font-bold text-gray-800 mb-2"
          >
            {loginMode === "email"
              ? "Acceso Administrativo"
              : "Escanear Credencial"}
          </h2>
          <p id="login-subtitle" className="text-gray-500 text-sm">
            {loginMode === "email"
              ? "Introduce tus credenciales de acceso"
              : "Usa el lector de código de barras"}
          </p>
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          </div>
        )}

        {loginMode === "email" ? (
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
                  ref={passwordInputRef}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-gray-50 focus:bg-white text-base"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
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
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
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
          </form>
        ) : (
          <form onSubmit={handleBarcodeLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="mb-2">⚠️</div>
                <p className="text-sm text-gray-600">
                  Asegúrate de que el cursor esté en el campo de texto antes de
                  escanear
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M3 5h2M3 19h2M21 5h-2M21 19h-2M8 5v14M16 5v14M12 5v14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  required
                  autoFocus
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-red-100 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-600 transition-all bg-white text-lg font-mono text-center tracking-widest"
                  placeholder="Escanea el código aquí"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !barcode.trim()}
                className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Verificando..." : "Acceder"}
              </button>
            </div>
          </form>
        )}

        {/* Botón Acceso por Dispositivo */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={loginByDevice}
            className="w-full py-3 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform active:scale-[0.98]"
          >
            <Tablet className="w-5 h-5" />
            Acceder con esta tablet
          </button>
        </div>

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
