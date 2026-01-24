import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Smartphone,
  Plus,
  CheckCircle,
  XCircle,
  Copy,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface AuthorizedDevice {
  id: string;
  name: string;
  device_token: string;
  enabled: boolean;
  created_at: string;
}

export default function AuthorizedDevicesManager() {
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("authorized_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      console.error("Error fetching authorized devices:", error);
      toast.error("Error al cargar dispositivos autorizados");
    } finally {
      setLoading(false);
    }
  };

  const authorizeNewTablet = async () => {
    try {
      const generatedToken = crypto.randomUUID();
      const newDevice = {
        device_token: generatedToken,
        name: "Tablet sin nombre",
        enabled: true,
      };

      const { data, error } = await supabase
        .from("authorized_devices")
        .insert([newDevice])
        .select()
        .single();

      if (error) throw error;

      setNewToken(generatedToken);
      fetchDevices();
      toast.success("Nueva tablet autorizada");
    } catch (error: any) {
      console.error("Error authorizing tablet:", error);
      toast.error("Error al autorizar la tablet");
    }
  };

  const authorizeDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("authorized_devices")
        .update({ enabled: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Tablet autorizada");
      fetchDevices();
    } catch (error: any) {
      console.error("Error authorizing device:", error);
      toast.error("Error al autorizar");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copiado al portapapeles");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-primary-600" />
            Dispositivos Autorizados
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los tokens de acceso para tablets fijas
          </p>
        </div>
        <button
          onClick={authorizeNewTablet}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Autorizar nueva tablet
        </button>
      </div>

      {/* New Token Alert */}
      {newToken && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900">
                Tablet Autorizada con éxito
              </h3>
              <p className="text-blue-700 mt-1 text-sm">
                Copia este token y configúralo en la nueva tablet. No se volverá
                a mostrar por seguridad.
              </p>
              <div className="mt-4 flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200">
                <code className="flex-1 font-mono text-lg font-bold text-blue-800 break-all">
                  {newToken}
                </code>
                <button
                  onClick={() => copyToClipboard(newToken)}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition"
                  title="Copiar token"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewToken(null)}
              className="text-blue-400 hover:text-blue-600 transition"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary-600" />
            <p>Cargando dispositivos...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <Smartphone className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">No hay tablets autorizadas</p>
            <p className="text-sm">Usa el botón superior para añadir una</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1A2514] text-white">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">
                    Nombre / Identificador
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">
                    Device Token
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">
                    Fecha registro
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {device.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group">
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {device.device_token.substring(0, 18)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(device.device_token)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-600 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {device.enabled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            HABILITADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            <XCircle className="w-3.5 h-3.5" />
                            PENDIENTE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(device.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!device.enabled && (
                        <button
                          onClick={() => authorizeDevice(device.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition shadow-sm"
                        >
                          Autorizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Footer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Seguridad:</strong> El acceso por tablet permite entrar al
          sistema sin contraseña individual. Revoca el acceso de cualquier token
          extraviado deshabilitándolo en la base de datos (administración
          avanzada).
        </div>
      </div>
    </div>
  );
}
