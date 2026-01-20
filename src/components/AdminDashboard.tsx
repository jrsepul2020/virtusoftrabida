import { useState, useEffect } from 'react';
import { Building2, BarChart3, Layers, List, Users, Menu, X, Grid3X3, Mail, LogOut, FolderTree, LucideIcon, FileText, Smartphone, Settings, Camera, Trophy, CreditCard, Tag, Send, Barcode, ClipboardList, Download, Upload, Package, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { supabase } from '../lib/supabase';
import CompaniesManager from './CompaniesManager';
import InscripcionesManager from './InscripcionesManager';
import UnifiedInscriptionForm from './UnifiedInscriptionForm';
import SimpleSamplesList from './SimpleSamplesList';
import PrintSamples from './PrintSamples';
import TandasManager from './TandasManager';
import StatisticsManager from './StatisticsManager';
import MesasManager from './MesasManager';
import EmailTest from './EmailTest';
import CatadoresManager from './CatadoresManager';
import GestionTandas from './GestionTandas';
import ListadoEmpresas from './ListadoEmpresas';
import DispositivosManager from './DispositivosManager';
import SettingsManager from './SettingsManager';
import MailrelayManager from './MailrelayManager';
import ManageSamples from './ManageSamples';
import Chequeo from './Chequeo';
import PantallasManager from './PantallasManager';
import BottlePhotosGallery from './BottlePhotosGallery';
import ResultadosCatas from './ResultadosCatas';
import PuntuacionesManager from './PuntuacionesManager';
import PayPalDashboard from './PayPalDashboard';
import CategoriasManager from './CategoriasManager';
import BackupManager from './BackupManager';
import ComunicacionesManager from './ComunicacionesManager';
import EtiquetadoMuestras from './EtiquetadoMuestras';
import UsuariosManager from './UsuariosManager';
import UltimasInscripciones from './UltimasInscripciones';
import GestorTemplates from './GestorTemplates';

type Tab = 'statistics' | 'inscripciones' | 'companies' | 'listadoEmpresas' | 'simpleList' | 'gestionMuestras' | 'categorias' | 'chequeo' | 'crearTandas' | 'gestionTandas' | 'mesas' | 'puntuaciones' | 'catadores' | 'dispositivos' | 'paypal' | 'print' | 'form' | 'emailTest' | 'configuracion' | 'usuarios' | 'pantallas' | 'fotosBotellas' | 'resultados' | 'backup' | 'comunicaciones' | 'mailrelay' | 'etiquetado' | 'templates';

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
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [pantallasKey, setPantallasKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ nombre: string; email: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dashboard', 'inscriptions', 'tastings', 'admin']));

  // Obtener datos del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar en tabla usuarios
          const { data: userData } = await supabase
            .from('usuarios')
            .select('nombre, email')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setCurrentUser({ nombre: userData.nombre, email: userData.email });
          } else {
            // Fallback al email de auth
            setCurrentUser({ 
              nombre: session.user.email?.split('@')[0] || 'Usuario', 
              email: session.user.email || '' 
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleNavigateToSamplesByCategory = (category: string) => {
    setCategoryFilter(category);
    setActiveTab('simpleList');
  };

  const handleTabChange = (tab: Tab) => {
    // Si cambiamos de pestaña manualmente, limpiamos el filtro
    if (tab !== 'simpleList') {
      setCategoryFilter(undefined);
    }
    // Si pulsamos en pantallas, forzar recarga
    if (tab === 'pantallas') {
      setPantallasKey(prev => prev + 1);
    }
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
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
      id: 'dashboard',
      title: 'PANEL PRINCIPAL',
      items: [
        { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
        { id: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
      ]
    },
    {
      id: 'inscriptions',
      title: 'GESTIÓN DE INSCRIPCIONES',
      items: [
        { id: 'companies', label: 'Empresas', icon: Building2 },
        { id: 'listadoEmpresas', label: 'Listado Empresas', icon: FileText },
        { id: 'simpleList', label: 'Listado Muestras', icon: List },
        { id: 'gestionMuestras', label: 'Gestión Muestras', icon: List },
        { id: 'etiquetado', label: 'Etiquetado Muestras', icon: Barcode },
        { id: 'categorias', label: 'Categorías', icon: Tag },
        { id: 'fotosBotellas', label: 'Fotos Botellas', icon: Camera },
        { id: 'chequeo', label: 'Chequeo', icon: List },
      ]
    },
    {
      id: 'tastings',
      title: 'CATAS Y EVALUACIONES',
      items: [
        { id: 'crearTandas', label: 'Crear Tandas', icon: Layers },
        { id: 'gestionTandas', label: 'Gestión Tandas', icon: FolderTree },
        { id: 'resultados', label: 'Resultados Catas', icon: Trophy },
        { id: 'puntuaciones', label: 'Puntuaciones', icon: BarChart3 },
        { id: 'catadores', label: 'Catadores', icon: Users },
        { id: 'mesas', label: 'Mesas', icon: Grid3X3 },
        { id: 'dispositivos', label: 'Dispositivos', icon: Smartphone },
      ]
    },
    {
      id: 'admin',
      title: 'ADMINISTRACIÓN',
      items: [
        { id: 'comunicaciones', label: 'Comunicaciones', icon: Send },
        { id: 'mailrelay', label: 'Mailrelay', icon: Mail },
        { id: 'paypal', label: 'PAYPAL', icon: CreditCard, highlight: true },
        { id: 'emailTest', label: 'Probar Emails', icon: Mail },
        { id: 'templates', label: 'Templates', icon: Package },
        { id: 'usuarios', label: 'Usuarios', icon: Users },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex flex-1 bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col bg-[#2B3D22] min-h-screen lg:h-screen lg:sticky lg:top-0 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}> 
          {/* Logo/Header */}
          <div className="flex items-center h-16 px-4 justify-between bg-[#1E2A16] shadow-sm flex-shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">V</div>
                <h2 className="text-base font-semibold text-white truncate">VIRTUS ADMIN</h2>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-auto"
              title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {menuSections.map((section) => (
              <div key={section.id} className="mb-2">
                {/* Section Header */}
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-white/50 hover:text-white/70 transition-colors uppercase tracking-wider"
                  >
                    <span>{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                
                {/* Section Items */}
                {(sidebarCollapsed || expandedSections.has(section.id)) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const isHighlight = item.highlight;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id as Tab)}
                          title={item.label}
                          className={`w-full group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isHighlight
                              ? isActive
                                ? 'bg-red-700 text-white shadow-lg'
                                : 'bg-red-600 text-white hover:bg-red-700'
                              : isActive
                                ? 'bg-[#66462e] text-white shadow-lg'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isHighlight ? 'text-white' : isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                          {!sidebarCollapsed && (
                            <>
                              <span className="truncate flex-1 text-left">{item.label}</span>
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
                {!sidebarCollapsed && section.id !== 'admin' && (
                  <div className="mt-2 pt-2">
                    <div className="border-t border-white/10"></div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          {/* Footer */}
          <div className={`p-2 border-t border-white/10 flex-shrink-0 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#66462e] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{currentUser?.nombre || 'Cargando...'}</p>
                      <p className="text-[10px] text-white/60 truncate">{currentUser?.email || ''}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <AdminPWAInstall />
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-[#66462e] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="w-full flex justify-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed inset-y-0 left-0 w-72 bg-[#2B3D22] shadow-xl flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-4 bg-[#1E2A16]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                  <span className="text-white">V</span>
                </div>
                <h2 className="text-base font-semibold text-white">VIRTUS ADMIN</h2>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {menuSections.map((section) => (
                <div key={section.id} className="mb-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-white/50 hover:text-white/70 transition-colors uppercase tracking-wider"
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
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isHighlight = item.highlight;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as Tab)}
                            className={`w-full group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isHighlight
                                ? isActive
                                  ? 'bg-red-700 text-white shadow-lg'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                                : isActive
                                  ? 'bg-[#66462e] text-white shadow-lg'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isHighlight ? 'text-white' : isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                            <span className="truncate flex-1 text-left">{item.label}</span>
                            {isActive && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Separator line between sections */}
                  {section.id !== 'admin' && (
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
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Floating mobile menu button */}
        {!showMobileMenu && (
          <button
            onClick={() => setShowMobileMenu(true)}
            className="fixed top-3 left-3 z-40 p-2 rounded-lg bg-[#1E2A16] text-white shadow-md lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className={activeTab === 'listadoEmpresas' ? 'p-2' : 'p-4'}>
            {activeTab === 'statistics' && <StatisticsManager onNavigateToSamples={handleNavigateToSamplesByCategory} />}
            {activeTab === 'inscripciones' && <InscripcionesManager onNewInscripcion={() => setActiveTab('form')} />}
            {activeTab === 'companies' && <CompaniesManager />}
            {activeTab === 'listadoEmpresas' && <ListadoEmpresas />}
            {activeTab === 'simpleList' && <SimpleSamplesList onNavigateToPrint={() => setActiveTab('print')} initialCategoryFilter={categoryFilter} />}
            {activeTab === 'gestionMuestras' && <ManageSamples />}
            {activeTab === 'etiquetado' && <EtiquetadoMuestras />}
            {activeTab === 'categorias' && <CategoriasManager />}
            {activeTab === 'fotosBotellas' && <BottlePhotosGallery onBack={() => setActiveTab('gestionMuestras')} />}
            {activeTab === 'chequeo' && <Chequeo />}
            {activeTab === 'crearTandas' && <TandasManager />}
            {activeTab === 'gestionTandas' && <GestionTandas />}
            {activeTab === 'resultados' && <ResultadosCatas />}
            {activeTab === 'puntuaciones' && <PuntuacionesManager />}
            {activeTab === 'mesas' && <MesasManager />}
            {activeTab === 'catadores' && <CatadoresManager />}
            {activeTab === 'dispositivos' && <DispositivosManager />}
            {activeTab === 'comunicaciones' && <ComunicacionesManager />}
            {activeTab === 'mailrelay' && <MailrelayManager />}
            {activeTab === 'paypal' && <PayPalDashboard />}
            {activeTab === 'print' && <PrintSamples />}
            {activeTab === 'form' && <UnifiedInscriptionForm isAdmin={true} />}
            {activeTab === 'emailTest' && <EmailTest />}
            {activeTab === 'configuracion' && <SettingsManager onNavigate={(tab) => setActiveTab(tab as Tab)} />}
            {activeTab === 'usuarios' && <UsuariosManager />}
            {activeTab === 'backup' && <BackupManager />}
            {activeTab === 'pantallas' && <PantallasManager key={pantallasKey} />}
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
      onClick={() => installApp().catch(err => console.error('Install failed', err))}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      title="Instalar app"
    >
      <Download className="w-4 h-4" />
      <span>Instalar App</span>
    </button>
  );
}
