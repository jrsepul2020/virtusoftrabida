import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Smartphone,
  Plus,
  CheckCircle,
  Copy,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import DetailSidebar, { DetailGroup, DetailItem } from "./DetailSidebar";
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
  const [selectedDevice, setSelectedDevice] = useState<AuthorizedDevice | null>(
    null,
  );

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

      const { error } = await supabase
        .from("authorized_devices")
        .insert([newDevice]);

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

  const closeSidebar = () => {
    setSelectedDevice(null);
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
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <RefreshCw className="w-10 h-10 animate-spin mb-4 text-primary-600" />
            <p className="font-medium">Cargando dispositivos...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <Smartphone className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-bold">No hay tablets autorizadas</p>
            <p className="text-sm italic">
              Usa el botón superior para añadir una
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Nombre / Identificador
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Device Token
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Fecha registro
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className="group hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {device.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {device.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group/token">
                        <code className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg font-mono">
                          {device.device_token.substring(0, 18)}...
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(device.device_token);
                          }}
                          className="opacity-0 group-hover/token:opacity-100 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {device.enabled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-green-100 text-green-700 border border-green-200 uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Habilitada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(device.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {!device.enabled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              authorizeDevice(device.id);
                            }}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-lg shadow-green-100"
                          >
                            Autorizar
                          </button>
                        )}
                        <span className="p-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-5 h-5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Sidebar */}
      <DetailSidebar
        isOpen={!!selectedDevice}
        onClose={closeSidebar}
        title={
          selectedDevice ? `Dispositivo: ${selectedDevice.name}` : "Detalles"
        }
      >
        {selectedDevice && (
          <>
            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-3xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-xl shadow-primary-50 mb-4 border-2 border-white">
                <Smartphone className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {selectedDevice.name}
              </h3>
              <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">
                {selectedDevice.id}
              </p>
            </div>

            <DetailGroup
              title="Estado de Autorización"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              <DetailItem
                label="Estado Actual"
                value={
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border ${
                      selectedDevice.enabled
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}
                  >
                    {selectedDevice.enabled
                      ? "Dispositivo Habilitado"
                      : "Pendiente de Autorización"}
                  </span>
                }
                fullWidth
              />
              <DetailItem
                label="Fecha de Registro"
                value={new Date(selectedDevice.created_at).toLocaleString()}
              />
            </DetailGroup>

            <DetailGroup
              title="Seguridad y Credenciales"
              icon={<Copy className="w-4 h-4" />}
            >
              <DetailItem
                label="Token de Acceso (Completo)"
                fullWidth
                value={
                  <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 mt-2 relative overflow-hidden group/token-full">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
                    <code className="text-primary-400 font-mono font-bold text-sm break-all leading-relaxed">
                      {selectedDevice.device_token}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(selectedDevice.device_token)
                      }
                      className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg"
                      title="Copiar token completo"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                }
              />
            </DetailGroup>

            {!selectedDevice.enabled && (
              <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-amber-900 uppercase tracking-wider text-sm">
                    Acción Requerida
                  </h4>
                </div>
                <p className="text-amber-800 text-sm mb-6 leading-relaxed">
                  Este dispositivo aún no ha sido autorizado. Hasta que se
                  autorice, no podrá realizar logins por tablet.
                </p>
                <button
                  onClick={() => authorizeDevice(selectedDevice.id)}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Autorizar Dispositivo Ahora
                </button>
              </div>
            )}
          </>
        )}
      </DetailSidebar>

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
