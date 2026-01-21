import { useState, useEffect } from "react";
import { User, Activity, Settings, Bell, Save, X, Camera } from "lucide-react";
import { supabase } from "../lib/supabase";

interface UserProfileProps {
  onBack?: () => void;
}

type ProfileTab = "perfil" | "actividad" | "configuracion" | "notificaciones";

interface UserData {
  id: string;
  nombre: string;
  email: string;
  rol?: string;
  telefono?: string;
  avatar_url?: string;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("perfil");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) throw error;

      setUserData(data);
      setEditedData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSave = async () => {
    if (!editedData || !userData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: editedData.nombre,
          telefono: editedData.telefono,
        })
        .eq("id", userData.id);

      if (error) throw error;

      setUserData(editedData);
      setIsEditing(false);
      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Error al actualizar el perfil" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="p-4 leading-normal">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold">
                {userData.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.nombre}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(userData.nombre)
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData.nombre}
              </h1>
              <p className="text-gray-600">{userData.email}</p>
              {userData.rol && (
                <p className="text-sm text-gray-500 mt-1">{userData.rol}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab("perfil")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "perfil"
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </div>
              </button>

              <button
                onClick={() => setActiveTab("actividad")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "actividad"
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad
                </div>
              </button>

              <button
                onClick={() => setActiveTab("configuracion")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "configuracion"
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </div>
              </button>

              <button
                onClick={() => setActiveTab("notificaciones")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "notificaciones"
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificaciones
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Perfil Tab */}
            {activeTab === "perfil" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Información Personal
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={editedData?.nombre || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData!,
                            nombre: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={editedData?.email || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        El email no se puede modificar
                      </p>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editedData?.telefono || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData!,
                            telefono: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="Ej: +34 123 456 789"
                      />
                    </div>

                    {/* Rol */}
                    {userData.rol && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rol
                        </label>
                        <input
                          type="text"
                          value={userData.rol}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actividad Tab */}
            {activeTab === "actividad" && (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Actividad Reciente
                </h3>
                <p className="text-gray-500">
                  Aquí se mostrará tu historial de actividad
                </p>
              </div>
            )}

            {/* Configuración Tab */}
            {activeTab === "configuracion" && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Configuración de Cuenta
                </h3>
                <p className="text-gray-500">
                  Aquí podrás configurar las preferencias de tu cuenta
                </p>
              </div>
            )}

            {/* Notificaciones Tab */}
            {activeTab === "notificaciones" && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preferencias de Notificaciones
                </h3>
                <p className="text-gray-500">
                  Configura cómo y cuándo quieres recibir notificaciones
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
