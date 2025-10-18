import { useState } from 'react';
import { Building2, FlaskConical, LogOut, PlusCircle, List, Printer, Layers, BarChart3, Users, Menu, X } from 'lucide-react';
import CompaniesManager from './CompaniesManager';
import SamplesManager from './SamplesManager';
import SubscriptionForm from './SubscriptionForm';
import SimpleSamplesList from './SimpleSamplesList';
import PrintSamples from './PrintSamples';
import TandasManager from './TandasManager';
import StatisticsManager from './StatisticsManager';
import CatadoresManager from './CatadoresManager';
import MesasManager from './MesasManager';

type Props = {
  onLogout: () => void;
};

type Tab = 'statistics' | 'companies' | 'samples' | 'simpleList' | 'tandas' | 'catadores' | 'print' | 'form';

export default function AdminDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuItems = [
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'samples', label: 'Muestras', icon: FlaskConical },
    { id: 'simpleList', label: 'Listado Muestras', icon: List },
    { id: 'tandas', label: 'Tandas', icon: Layers },
    { id: 'catadores', label: 'Catadores y Mesas', icon: Users },
    { id: 'print', label: 'Imprimir Listado', icon: Printer },
    { id: 'form', label: 'Nueva Inscripción', icon: PlusCircle },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <button
            onClick={onLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Cerrar Sesión</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-medium text-gray-700">
              {menuItems.find(item => item.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden lg:flex border-b border-gray-200 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as Tab)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-colors ${
                      activeTab === item.id
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'statistics' && <StatisticsManager />}
          {activeTab === 'companies' && <CompaniesManager />}
          {activeTab === 'samples' && <SamplesManager />}
          {activeTab === 'simpleList' && <SimpleSamplesList />}
          {activeTab === 'tandas' && <TandasManager />}
          {activeTab === 'catadores' && (
            <div className="space-y-6">
              <CatadoresManager />
              <MesasManager />
            </div>
          )}
          {activeTab === 'print' && <PrintSamples />}
          {activeTab === 'form' && <SubscriptionForm />}
        </div>
      </div>
    </div>
  );
}
