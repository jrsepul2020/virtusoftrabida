import { useState } from 'react';
import { Building2, FlaskConical, BarChart3, Layers, List, Printer, PlusCircle, Users, Menu, X, Grid3X3, Mail, Settings } from 'lucide-react';
import CompaniesManager from './CompaniesManager';
import SamplesManager from './SamplesManager';
import UnifiedInscriptionForm from './UnifiedInscriptionForm';
import SimpleSamplesList from './SimpleSamplesList';
import PrintSamples from './PrintSamples';
import TandasManager from './TandasManager';
import StatisticsManager from './StatisticsManager';
import MesasManager from './MesasManager';
import EmailTest from './EmailTest';
import SettingsManager from './SettingsManager';

type Tab = 'statistics' | 'companies' | 'samples' | 'simpleList' | 'tandas' | 'mesas' | 'print' | 'form' | 'emailTest' | 'settings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuItems = [
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'samples', label: 'Muestras', icon: FlaskConical },
    { id: 'simpleList', label: 'Listado Muestras', icon: List },
    { id: 'tandas', label: 'Tandas', icon: Layers },
    { id: 'mesas', label: 'Mesas', icon: Grid3X3 },
    { id: 'print', label: 'Imprimir Listado', icon: Printer },
    { id: 'form', label: 'Nueva Inscripción', icon: PlusCircle },
    { id: 'emailTest', label: 'Probar Emails', icon: Mail },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-[#3C542E]">
          {/* Logo/Header */}
          <div className="flex items-center h-16 px-6 bg-[#2D3F20] shadow-sm">
            <h2 className="text-lg font-semibold text-white">VIRTUS ADMIN</h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
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
          
          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Administrador</p>
                <p className="text-xs text-white/60 truncate">Sistema VIRTUS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-[#3C542E] shadow-xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-6 bg-[#2D3F20]">
              <h2 className="text-lg font-semibold text-white">VIRTUS ADMIN</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
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
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                {menuItems.find(item => item.id === activeTab)?.label}
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona y supervisa el sistema VIRTUS</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'statistics' && <StatisticsManager />}
            {activeTab === 'companies' && <CompaniesManager />}
            {activeTab === 'samples' && <SamplesManager />}
            {activeTab === 'simpleList' && <SimpleSamplesList />}
            {activeTab === 'tandas' && <TandasManager />}
            {activeTab === 'mesas' && <MesasManager />}
            {activeTab === 'print' && <PrintSamples />}
            {activeTab === 'form' && <UnifiedInscriptionForm isAdmin={true} />}
            {activeTab === 'emailTest' && <EmailTest />}
            {activeTab === 'settings' && <SettingsManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
