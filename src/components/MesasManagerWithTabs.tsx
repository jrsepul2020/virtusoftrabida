import { useState } from 'react';
import { Eye, Grid3X3 } from 'lucide-react';
import MesasVisualizacion from './MesasVisualizacion';
import AsignacionesMesas from './AsignacionesMesas';

export default function MesasManager() {
  const [activeTab, setActiveTab] = useState<'visualization' | 'assignments'>('visualization');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('visualization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'visualization'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visualización de Mesas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Gestión de Asignaciones
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'visualization' && <MesasVisualizacion />}
      {activeTab === 'assignments' && <AsignacionesMesas />}
    </div>
  );
}