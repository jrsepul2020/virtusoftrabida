import { useState } from 'react';
import { Building2, BarChart3, Layers, List, PlusCircle, Users, Menu, X, Grid3X3, Mail, LogOut, FolderTree, LucideIcon, FileText, Smartphone, Settings, Monitor } from 'lucide-react';
import CompaniesManager from './CompaniesManager';
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
import ManageSamples from './ManageSamples';
import Chequeo from './Chequeo';
import PantallasManager from './PantallasManager';

type Tab = 'statistics' | 'companies' | 'listadoEmpresas' | 'simpleList' | 'gestionMuestras' | 'chequeo' | 'crearTandas' | 'gestionTandas' | 'mesas' | 'catadores' | 'dispositivos' | 'paypal' | 'print' | 'form' | 'emailTest' | 'configuracion' | 'pantallas';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon | null;
  isSeparator?: boolean;
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const handleNavigateToSamplesByCategory = (category: string) => {
    setCategoryFilter(category);
    setActiveTab('simpleList');
  };

  const handleTabChange = (tab: Tab) => {
    // Si cambiamos de pestaña manualmente, limpiamos el filtro
    if (tab !== 'simpleList') {
      setCategoryFilter(undefined);
    }
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  const menuItems: MenuItem[] = [
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'listadoEmpresas', label: 'Listado Empresas', icon: FileText },
    { id: 'simpleList', label: 'Listado Muestras', icon: List },
    { id: 'gestionMuestras', label: 'Gestión Muestras', icon: List },
    { id: 'chequeo', label: 'Chequeo', icon: List },
    { id: 'separator2', label: '', icon: null, isSeparator: true },
    { id: 'crearTandas', label: 'Crear Tandas', icon: Layers },
    { id: 'gestionTandas', label: 'Gestión Tandas', icon: FolderTree },
    { id: 'separator3', label: '', icon: null, isSeparator: true },
    { id: 'catadores', label: 'Catadores', icon: Users },
    { id: 'mesas', label: 'Mesas', icon: Grid3X3 },
    { id: 'dispositivos', label: 'Dispositivos', icon: Smartphone },
    { id: 'separator4', label: '', icon: null, isSeparator: true },
    { id: 'form', label: 'Nueva Inscripción', icon: PlusCircle },
    { id: 'emailTest', label: 'Probar Emails', icon: Mail },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'pantallas', label: 'Pantallas', icon: Monitor },
  ];

  return (
    <div className="flex flex-1 bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-[#2B3D22] min-h-screen lg:h-screen lg:sticky lg:top-0"> 
          {/* Logo/Header */}
          <div className="flex items-center h-16 px-6 justify-between bg-[#1E2A16] shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">V</div>
              <h2 className="text-lg font-semibold text-white truncate">VIRTUS ADMIN 2.0</h2>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              // Renderizar separador
              if (item.isSeparator) {
                return (
                  <div key={item.id} className="py-2">
                    <div className="border-t border-white/20"></div>
                  </div>
                );
              }

              const Icon = item.icon!;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as Tab)}
                  title={item.label}
                  className={`w-full group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg border-l-4 border-white/50'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">José Ramón Sepúlveda</p>
                  <p className="text-xs text-white/60 truncate">jrsepu2000@gmail.com</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-[#3C542E] shadow-xl flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-6 bg-[#2D3F20]">
              <h2 className="text-lg font-semibold text-white">VIRTUS ADMIN 2.0</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                // Renderizar separador
                if (item.isSeparator) {
                  return (
                    <div key={item.id} className="py-2">
                      <div className="border-t border-white/20"></div>
                    </div>
                  );
                }

                const Icon = item.icon!;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as Tab)}
                    className={`w-full group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-lg border-l-4 border-white/50'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-white/10">
              <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">J</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">José Ramón Sepúlveda</p>
                    <p className="text-xs text-white/60 truncate">jrsepu2000@gmail.com</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
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
            {activeTab === 'companies' && <CompaniesManager />}
            {activeTab === 'listadoEmpresas' && <ListadoEmpresas />}
            {activeTab === 'simpleList' && <SimpleSamplesList onNavigateToPrint={() => setActiveTab('print')} initialCategoryFilter={categoryFilter} />}
            {activeTab === 'gestionMuestras' && <ManageSamples />}
            {activeTab === 'chequeo' && <Chequeo />}
            {activeTab === 'crearTandas' && <TandasManager />}
            {activeTab === 'gestionTandas' && <GestionTandas />}
            {activeTab === 'mesas' && <MesasManager />}
            {activeTab === 'catadores' && <CatadoresManager />}
            {activeTab === 'dispositivos' && <DispositivosManager />}
            {activeTab === 'print' && <PrintSamples />}
            {activeTab === 'form' && <UnifiedInscriptionForm isAdmin={true} />}
            {activeTab === 'emailTest' && <EmailTest />}
            {activeTab === 'configuracion' && <SettingsManager />}
            {activeTab === 'pantallas' && <PantallasManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
