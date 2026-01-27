import { useState, useEffect } from "react";
import {
  Mail,
  BarChart3,
  List,
  Users,
  Menu,
  X,
  Grid3X3,
  LogOut,
  FolderTree,
  LucideIcon,
  FileText,
  Settings,
  Camera,
  Trophy,
  CreditCard,
  Send,
  ClipboardList,
  Download,
  Package,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  Smartphone,
  Monitor,
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { supabase } from "../lib/supabase";
import InscripcionesManager from "./InscripcionesManager";
import UnifiedInscriptionForm from "./UnifiedInscriptionForm";
import GestionMuestras from "./GestionMuestras";
import PrintSamples from "./PrintSamples";
import TandasManager from "./TandasManager";
import StatisticsManager from "./StatisticsManager";
import MesasManager from "./MesasManager";
import CatadoresManager from "./CatadoresManager";
import GestionTandas from "./GestionTandas";
import DispositivosManager from "./DispositivosManager";
import SettingsManager from "./SettingsManager";
import MailrelayManager from "./MailrelayManager";
import PantallasManager from "./PantallasManager";
import BottlePhotosGallery from "./BottlePhotosGallery";
import ResultadosCatas from "./ResultadosCatas";
import PuntuacionesManager from "./PuntuacionesManager";
import PayPalDashboard from "./PayPalDashboard";
import AdminResumen from "./AdminResumen";
import BackupManager from "./BackupManager";
import ComunicacionesManager from "./ComunicacionesManager";
import UsuariosManager from "./UsuariosManager";
import GestorTemplates from "./GestorTemplates";
import UserProfile from "./UserProfile";
import AuthorizedDevicesManager from "./AuthorizedDevicesManager";
import EmailTest from "./EmailTest";
import CompanyProfile from "./CompanyProfile";
import Chequeo from "./Chequeo";
import TabletSessionsManager from "./TabletSessionsManager";
// Removed: Estadisticas2 and CompaniesManager2 screens (no longer used)

type Tab =
  | "resumen"
  | "statistics"
  | "inscripciones"
  | "muestras"
  | "tandas"
  | "mesas"
  | "puntuaciones"
  | "catadores"
  | "dispositivos"
  | "paypal"
  | "print"
  | "form"
  | "emailTest"
  | "configuracion"
  | "usuarios"
  | "pantallas"
  | "fotosBotellas"
  | "resultados"
  | "backup"
  | "comunicaciones"
  | "mailrelay"
  | "templates"
  | "authorizedDevices"
  | "profile"
  | "companyProfile"
  | "chequeo"
  | "tabletSessions";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [pantallasKey, setPantallasKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<{
    nombre: string;
    email: string;
    tablet?: string | null;
    mesa?: number | null;
    puesto?: number | null;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["dashboard", "inscriptions", "tastings", "admin"]),
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedInscripcionId, setSelectedInscripcionId] = useState<
    string | null
  >(null);

  const breadcrumbLabels: Record<Tab, string> = {
    resumen: "Resumen",
    statistics: "Panel",

    inscripciones: "Inscripciones",
    muestras: "Muestras",
    tandas: "Tandas",
    mesas: "Mesas",
    puntuaciones: "Puntuaciones",
    catadores: "Catadores",
    dispositivos: "Dispositivos",
    paypal: "PayPal",
    print: "Impresión",
    form: "Nueva inscripción",
    emailTest: "Emails",
    configuracion: "Configuración",
    usuarios: "Usuarios",
    pantallas: "Pantallas",
    fotosBotellas: "Fotos botellas",
    resultados: "Resultados",
    backup: "Backups",
    comunicaciones: "Comunicaciones",
    mailrelay: "Mailrelay",
    templates: "Templates",
    authorizedDevices: "Dispositivos autorizados",
    profile: "Perfil",
    companyProfile: "Ficha de Empresa",
    chequeo: "Chequeo de muestras",
    tabletSessions: "Sesiones de Tablets",
  };

  // Map tab -> source filename for quick reference in breadcrumb
  const tabToFile: Record<Tab, string | undefined> = {
    resumen: "AdminResumen.tsx",
    statistics: "StatisticsManager.tsx",
    inscripciones: "InscripcionesManager.tsx",
    muestras: "GestionMuestras.tsx",
    tandas: "TandasManager.tsx",
    mesas: "MesasManager.tsx",
    puntuaciones: "PuntuacionesManager.tsx",
    catadores: "CatadoresManager.tsx",
    dispositivos: "DispositivosManager.tsx",
    paypal: "PayPalDashboard.tsx",
    print: "PrintSamples.tsx",
    form: "UnifiedInscriptionForm.tsx",
    emailTest: "EmailTest.tsx",
    configuracion: "SettingsManager.tsx",
    usuarios: "UsuariosManager.tsx",
    pantallas: "PantallasManager.tsx",
    fotosBotellas: "BottlePhotosGallery.tsx",
    resultados: "ResultadosCatas.tsx",
    backup: "BackupManager.tsx",
    comunicaciones: "ComunicacionesManager.tsx",
    mailrelay: "MailrelayManager.tsx",
    templates: "GestorTemplates.tsx",
    authorizedDevices: "AuthorizedDevicesManager.tsx",
    profile: "UserProfile.tsx",
    companyProfile: "CompanyProfile.tsx",
    chequeo: "Chequeo.tsx",
    tabletSessions: "TabletSessionsManager.tsx",
  };

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Obtener datos del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar en tabla usuarios
          const { data: userData } = await supabase
            .from("usuarios")
            .select("nombre, email, tablet, mesa, puesto")
            .eq("id", session.user.id)
            .single();

          if (userData) {
            setCurrentUser({
              nombre: userData.nombre,
              email: userData.email,
              tablet: userData.tablet,
              mesa: userData.mesa,
              puesto: userData.puesto,
            });
          } else {
            // Fallback al email de auth
            setCurrentUser({
              nombre: session.user.email?.split("@")[0] || "Usuario",
              email: session.user.email || "",
            });
          }
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleNavigateToSamplesByCategory = (category: string) => {
    setCategoryFilter(category);
    setActiveTab("muestras");
  };

  const handleTabChange = (tab: Tab) => {
    // Si cambiamos de pestaña manualmente, limpiamos el filtro
    if (tab !== "muestras") {
      setCategoryFilter(undefined);
    }
    // Si pulsamos en pantallas, forzar recarga
    if (tab === "pantallas") {
      setPantallasKey((prev) => prev + 1);
    }
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const menuSections: MenuSection[] = [
    {
      id: "dashboard",
      title: "PANEL PRINCIPAL",
      items: [
        { id: "resumen", label: "Resumen", icon: Grid3X3 },
        { id: "statistics", label: "Estadísticas", icon: BarChart3 },
        { id: "inscripciones", label: "Inscripciones", icon: ClipboardList },
      ],
    },
    {
      id: "inscriptions",
      title: "GESTIÓN DE INSCRIPCIONES",
      items: [
        { id: "muestras", label: "Muestras", icon: List },
        { id: "fotosBotellas", label: "Fotos Botellas", icon: Camera },
      ],
    },
    {
      id: "tastings",
      title: "CATAS Y EVALUACIONES",
      items: [
        { id: "tandas", label: "Tandas", icon: FolderTree },
        { id: "resultados", label: "Resultados Catas", icon: Trophy },
        { id: "puntuaciones", label: "Puntuaciones", icon: BarChart3 },
        { id: "catadores", label: "Catadores", icon: Users },
        { id: "mesas", label: "Mesas", icon: Grid3X3 },
      ],
    },
    {
      id: "communications",
      title: "COMUNICACIONES",
      items: [
        { id: "comunicaciones", label: "Mensajería", icon: Send },
        { id: "mailrelay", label: "Mailrelay", icon: Mail },
        { id: "emailTest", label: "Probar Emails", icon: Mail },
        { id: "templates", label: "Plantillas", icon: Package },
      ],
    },
    {
      id: "admin",
      title: "ADMINISTRACIÓN",
      items: [
        { id: "usuarios", label: "Usuarios", icon: Users },
        { id: "paypal", label: "PayPal", icon: CreditCard },
        { id: "backup", label: "Backups", icon: FileText },
      ],
    },
    {
      id: "settings",
      title: "CONFIGURACIÓN",
      items: [
        { id: "configuracion", label: "Ajustes Sistema", icon: Settings },
        { id: "dispositivos", label: "Detecciones", icon: Smartphone },
        {
          id: "authorizedDevices",
          label: "Dispositivos Autorizados",
          icon: Smartphone,
        },
        {
          id: "tabletSessions",
          label: "Sesiones de Tablets",
          icon: Monitor,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-1 bg-[#E6EBEE] h-full">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 h-full">
        <div
          className={`flex flex-col bg-[#00273A] h-full lg:sticky lg:top-0 transition-all duration-300 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Logo/Header with Toggle */}
          <div className="flex items-center h-16 px-4 justify-between bg-[#00273A] shadow-sm flex-shrink-0">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 text-white">
                <img
                  src="/logo-blanco-virtus.png"
                  alt="Virtus"
                  className="h-10 w-auto"
                />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors ml-auto"
              title={
                isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"
              }
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {menuSections.map((section) => (
              <div key={section.id} className="mb-2">
                {/* Section Header - Hidden when collapsed */}
                {!isSidebarCollapsed && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    <span>{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-3 h-3 text-white/80" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/60" />
                    )}
                  </button>
                )}

                {/* Section Items */}
                {(isSidebarCollapsed || expandedSections.has(section.id)) && (
                  <div className="space-y-0">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id as Tab)}
                          title={item.label}
                          className={`w-full group flex items-center gap-2 ${
                            isSidebarCollapsed ? "justify-center px-2" : "px-3"
                          } py-2 text-[11px] font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-red-800 text-white shadow-lg"
                              : "text-white/80 hover:bg-red-700 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                          />
                          {!isSidebarCollapsed && (
                            <>
                              <span className="truncate flex-1 text-left text-[13px]">
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Separator line between sections (only when expanded) */}
                {section.id !== "admin" && (
                  <div className="mt-1 pt-1">
                    <div className="border-t border-white/10"></div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer - PWA Install only */}
          <div className={`p-3 border-t border-white/10 flex-shrink-0`}>
            <div className="space-y-1">
              <AdminPWAInstall />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-72 bg-[#00273A] shadow-xl flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-4 bg-[#00273A]">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-blanco-virtus.png"
                  alt="Virtus"
                  className="h-10 w-auto"
                />
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-2 space-y-0 overflow-y-auto">
              {menuSections.map((section) => (
                <div key={section.id} className="mb-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white/50 hover:text-white/70 transition-colors uppercase tracking-wider"
                  >
                    <span>{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {/* Section Items */}
                  {expandedSections.has(section.id) && (
                    <div className="space-y-0">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isHighlight = item.highlight;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as Tab)}
                            className={`w-full group flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg transition-all duration-200 ${
                              isHighlight
                                ? isActive
                                  ? "bg-red-700 text-white shadow-lg"
                                  : "bg-red-600 text-white hover:bg-red-700"
                                : isActive
                                  ? "bg-[#b91c1c] text-white shadow-lg"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <Icon
                              className={`w-3 h-3 flex-shrink-0 ${isHighlight ? "text-white" : isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                            />
                            <span className="truncate flex-1 text-left text-[13px]">
                              {item.label}
                            </span>
                            {isActive && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Separator line between sections */}
                  {section.id !== "admin" && (
                    <div className="mt-2 pt-2">
                      <div className="border-t border-white/10"></div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Floating mobile menu button */}
        {!showMobileMenu && (
          <div className="fixed top-3 left-3 z-40 lg:hidden">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg bg-[#00273A] text-white shadow-md"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#00273A] text-white border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange("statistics")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                  activeTab === "statistics"
                    ? "bg-white/20 text-white border-white/40"
                    : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                Estadísticas
              </button>
              <button
                onClick={() => handleTabChange("inscripciones")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                  activeTab === "inscripciones"
                    ? "bg-white/20 text-white border-white/40"
                    : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                Inscripciones
              </button>
              <button
                onClick={() => handleTabChange("muestras")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                  activeTab === "muestras"
                    ? "bg-white/20 text-white border-white/40"
                    : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                Listado de Muestras
              </button>
              <button
                onClick={() => handleTabChange("chequeo")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                  activeTab === "chequeo"
                    ? "bg-white/20 text-white border-white/40"
                    : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                Chequeo
              </button>
            </div>

            {/* User Stats Display (Centered) */}
            <div className="flex-1 flex justify-center items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-white uppercase tracking-tight">
                  {currentUser?.nombre}
                </span>
                <span className="text-[10px] text-white/60 font-medium">
                  {currentUser?.email}
                </span>
              </div>

              <div className="h-8 w-px bg-white/10 mx-2"></div>

              <div className="flex gap-4">
                {currentUser?.tablet && (
                  <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-[14px] font-black text-white">
                      T{currentUser.tablet}
                    </span>
                    <span className="text-[8px] text-white/50 font-bold uppercase">
                      Tablet
                    </span>
                  </div>
                )}
                {currentUser?.mesa && (
                  <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-[14px] font-black text-white">
                      M{currentUser.mesa}
                    </span>
                    <span className="text-[8px] text-white/50 font-bold uppercase">
                      Mesa
                    </span>
                  </div>
                )}
                {currentUser?.puesto && (
                  <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-[14px] font-black text-white">
                      P{currentUser.puesto}
                    </span>
                    <span className="text-[8px] text-white/50 font-bold uppercase">
                      Puesto
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("configuracion")}
                className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Abrir configuración"
                title="Configuración global"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs font-bold hidden xl:inline">
                  Cerrar sesión
                </span>
              </button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/20"
                >
                  <div className="w-8 h-8 bg-[#b91c1c] rounded-full flex items-center justify-center text-white font-bold border-2 border-[#00273A]">
                    {currentUser?.nombre?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                  />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 py-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {currentUser?.nombre || "Usuario"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUser?.email || ""}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs text-green-600 font-medium">
                            Activo
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setActiveTab("profile");
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Detalles del perfil
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("profile"); // Navigate to profile, logic in component handles tab
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          Configuración de la cuenta
                        </button>
                      </div>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={onLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2 sm:p-3 md:p-4">
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
              <span>Inicio</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-medium">
                {breadcrumbLabels[activeTab]}
              </span>
              {tabToFile[activeTab] && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-xs text-gray-400">
                    {tabToFile[activeTab]}
                  </span>
                </>
              )}
            </div>
            {activeTab === "resumen" && (
              <AdminResumen
                onVerDetalle={() => setActiveTab("inscripciones")}
              />
            )}
            {activeTab === "statistics" && (
              <StatisticsManager
                onNavigateToSamples={handleNavigateToSamplesByCategory}
              />
            )}
            {/* Estadisticas2 removed */}
            {activeTab === "inscripciones" && (
              <InscripcionesManager
                onNewInscripcion={() => setActiveTab("form")}
                onViewProfile={(id) => {
                  setSelectedInscripcionId(id);
                  setActiveTab("companyProfile");
                }}
              />
            )}
            {activeTab === "companyProfile" && selectedInscripcionId && (
              <CompanyProfile
                id={selectedInscripcionId}
                onBack={() => setActiveTab("inscripciones")}
              />
            )}
            {activeTab === "muestras" && (
              <GestionMuestras initialCategoryFilter={categoryFilter} />
            )}
            {activeTab === "fotosBotellas" && (
              <BottlePhotosGallery onBack={() => setActiveTab("muestras")} />
            )}
            {activeTab === "tandas" && <TandasTabsInline />}
            {activeTab === "resultados" && <ResultadosCatas />}
            {activeTab === "puntuaciones" && <PuntuacionesManager />}
            {activeTab === "mesas" && <MesasManager />}
            {activeTab === "catadores" && <CatadoresManager />}
            {activeTab === "dispositivos" && <DispositivosManager />}
            {activeTab === "comunicaciones" && <ComunicacionesManager />}
            {activeTab === "mailrelay" && <MailrelayManager />}
            {activeTab === "paypal" && <PayPalDashboard />}
            {activeTab === "templates" && <GestorTemplates />}
            {activeTab === "print" && <PrintSamples />}
            {activeTab === "form" && <UnifiedInscriptionForm isAdmin={true} />}
            {activeTab === "emailTest" && <EmailTest />}
            {activeTab === "configuracion" && (
              <SettingsManager onNavigate={(tab) => setActiveTab(tab as Tab)} />
            )}
            {activeTab === "usuarios" && <UsuariosManager />}
            {activeTab === "backup" && <BackupManager />}
            {activeTab === "profile" && (
              <UserProfile onBack={() => setActiveTab("statistics")} />
            )}
            {activeTab === "authorizedDevices" && <AuthorizedDevicesManager />}
            {activeTab === "chequeo" && <Chequeo />}
            {activeTab === "tabletSessions" && <TabletSessionsManager />}
            {activeTab === "pantallas" && (
              <PantallasManager key={pantallasKey} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPWAInstall() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  if (!isInstallable || isInstalled) return null;

  return (
    <button
      onClick={() =>
        installApp().catch((err) => console.error("Install failed", err))
      }
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      title="Instalar app"
    >
      <Download className="w-4 h-4" />
      <span>Instalar App</span>
    </button>
  );
}

// Inline TandasTabs to avoid separate module resolution issues
function TandasTabsInline() {
  const [tab, setTab] = useState<"crear" | "gestion">("crear");

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-gray-50 p-1">
          <button
            onClick={() => setTab("crear")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === "crear" ? "bg-[#b91c1c] text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Crear tandas
          </button>
          <button
            onClick={() => setTab("gestion")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === "gestion" ? "bg-[#b91c1c] text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Gestión de tandas
          </button>
        </div>
      </div>

      <div>
        {tab === "crear" && <TandasManager />}
        {tab === "gestion" && <GestionTandas />}
      </div>
    </div>
  );
}
