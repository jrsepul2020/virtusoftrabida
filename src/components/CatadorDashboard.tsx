import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import MesasManager from './MesasManager';

interface Catador {
  id: string;
  nombre: string;
  codigocatador: string;
  tablet: number | null;
  rol: string;
  mesa: number | null;
  puesto: number | null;
}

interface CatadorDashboardProps {
  catador: Catador;
  tabletNumber: number;
}

export default function CatadorDashboard({ catador, tabletNumber }: CatadorDashboardProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{catador.nombre}</h1>
              <p className="text-sm text-gray-500">
                {catador.rol} • Mesa {catador.mesa || '-'} • Puesto {catador.puesto || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Tablet {tabletNumber}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sin tabs - directamente mesas */}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <MesasManager />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cerrar Sesión
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas cerrar sesión?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
