import { useState } from 'react';
import { Building2, FlaskConical, LogOut, PlusCircle, List, Printer, Layers, BarChart3 } from 'lucide-react';
import CompaniesManager from './CompaniesManager';
import SamplesManager from './SamplesManager';
import SubscriptionForm from './SubscriptionForm';
import SimpleSamplesList from './SimpleSamplesList';
import PrintSamples from './PrintSamples';
import TandasManager from './TandasManager';
import StatisticsManager from './StatisticsManager';

type Props = {
  onLogout: () => void;
};

type Tab = 'statistics' | 'companies' | 'samples' | 'simpleList' | 'tandas' | 'print' | 'form';

export default function AdminDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('statistics');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'statistics'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'companies'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Empresas
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'samples'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              Muestras
            </button>
            <button
              onClick={() => setActiveTab('simpleList')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'simpleList'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-5 h-5" />
              Listado Muestras
            </button>
            <button
              onClick={() => setActiveTab('tandas')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tandas'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Layers className="w-5 h-5" />
              Tandas
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'print'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Printer className="w-5 h-5" />
              Imprimir Listado
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'form'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Inscripción
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'statistics' && <StatisticsManager />}
          {activeTab === 'companies' && <CompaniesManager />}
          {activeTab === 'samples' && <SamplesManager />}
          {activeTab === 'simpleList' && <SimpleSamplesList />}
          {activeTab === 'tandas' && <TandasManager />}
          {activeTab === 'print' && <PrintSamples />}
          {activeTab === 'form' && <SubscriptionForm />}
        </div>
      </div>
    </div>
  );
}
