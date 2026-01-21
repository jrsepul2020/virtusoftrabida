import { useState } from 'react';
import TandasManager from './TandasManager';
import GestionTandas from './GestionTandas';

export default function TandasTabs() {
  const [tab, setTab] = useState<'crear' | 'gestion'>('crear');

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-gray-50 p-1">
          <button
            onClick={() => setTab('crear')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'crear' ? 'bg-[#b91c1c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Crear tandas
          </button>
          <button
            onClick={() => setTab('gestion')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'gestion' ? 'bg-[#b91c1c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Gestión de tandas
          </button>
        </div>
      </div>

      <div>
        {tab === 'crear' && <TandasManager />}
        {tab === 'gestion' && <GestionTandas />}
      </div>
    </div>
  );
}
