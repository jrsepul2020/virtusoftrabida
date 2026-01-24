import { useState, useEffect } from "react";
import { Smartphone, Save, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface ConfigurarTabletProps {
  onDone: () => void;
}

const ACCESS_CODE = "82690";

export default function ConfigurarTablet({ onDone }: ConfigurarTabletProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [token, setToken] = useState("");
  const [tabletNumber, setTabletNumber] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  const getDeviceToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; device_token=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  // Inicializar o generar token automáticamente al autorizar
  useEffect(() => {
    if (isAuthorized) {
      const existingToken = getDeviceToken();
      if (existingToken) {
        setToken(existingToken);
      } else {
        const newToken = crypto.randomUUID();
        setToken(newToken);
        // Guardar cookie inmediatamente para asegurar persistencia
        document.cookie = `device_token=${newToken}; path=/; SameSite=Strict; Secure`;
      }
    }
  }, [isAuthorized]);

  const checkAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === ACCESS_CODE) {
      setIsAuthorized(true);
    } else {
      toast.error("Código incorrecto");
    }
  };

  const guardarToken = async () => {
    if (!token) {
      toast.error("Error: No hay token de dispositivo");
      return;
    }

    try {
      setIsSaving(true);

      // 1. Calcular mesa y nombre
      const num = parseInt(tabletNumber);
      const mesa = Math.ceil(num / 5);

      // 2. Sincronizar con la base de datos (Upsert)
      const { error: dbError } = await supabase
        .from("authorized_devices")
        .upsert(
          {
            device_token: token,
            name: `Mesa ${mesa} - Tablet ${num}`,
            enabled: false,
          },
          { onConflict: "device_token" },
        );

      if (dbError) throw dbError;

      // 3. Asegurar que la cookie está guardada (por si se generó nueva)
      document.cookie = `device_token=${token}; path=/; SameSite=Strict; Secure`;

      toast.success(
        "Tablet configurada correctamente. Pendiente de autorización.",
      );

      // 4. Redirigir tras 1 segundo
      setTimeout(() => {
        onDone();
      }, 1000);
    } catch (error: any) {
      console.error("Error configurando tablet:", error);
      toast.error(`Error: ${error.message || "No se pudo sincronizar"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
        {!isAuthorized ? (
          <form onSubmit={checkAccessCode} className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                <Smartphone className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Acceso Restringido
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Introduce el código de acceso para configurar esta tablet
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código de acceso
              </label>
              <input
                type="password"
                required
                autoFocus
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all text-center text-xl tracking-widest font-bold"
                placeholder="****"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg"
            >
              Verificar código
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onDone}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Volver al login
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Configurar Tablet
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Selecciona la posición de esta tablet
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Tablet
                  </label>
                  <select
                    value={tabletNumber}
                    onChange={(e) => setTabletNumber(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold"
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Tablet {n} (Mesa {Math.ceil(n / 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Al guardar, se registrará el dispositivo como{" "}
                  <strong>
                    Mesa {Math.ceil(parseInt(tabletNumber) / 5)} - Tablet{" "}
                    {tabletNumber}
                  </strong>
                  . Deberá ser autorizado por un administrador en el panel.
                </p>
              </div>

              <button
                onClick={guardarToken}
                disabled={isSaving}
                className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={onDone}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Cancelar y volver al login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
