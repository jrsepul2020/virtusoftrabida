import { useState, Dispatch, SetStateAction } from "react";
import { LogOut } from "lucide-react";

type View = 'home' | 'adminLogin' | 'admin' | 'inscripcion' | 'cata' | 'reglamento' | 'normativa';

export default function Header({
  setView,
  adminLoggedIn,
  onLogout,
  currentView,
}: {
  setView: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onLogout?: () => void;
  currentView?: View;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Usar los props para determinar el estado de autenticación
  const isAdminLoggedIn = adminLoggedIn || false;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback al método anterior si no se pasa onLogout
      if (isAdminLoggedIn) {
        localStorage.removeItem('adminLoggedIn');
      }
      setView('home');
    }
  };

  const menuItems = [
    { name: "Inicio", onClick: () => setView('home') },
    { name: "Inscripción", onClick: () => setView('inscripcion') },
    { name: "Cata", onClick: () => setView('cata') },
    { name: "Reglamento", onClick: () => setView('reglamento') },
    { name: "Normativa", onClick: () => setView('normativa') },
  ];

  const isHomePage = currentView === 'home';
  
  return (
    <header className={`${isHomePage ? 'bg-transparent absolute top-0 left-0 right-0' : 'bg-white shadow-md'} relative z-50 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <img
              src="/logo-bandera-1.png"
              alt="International Virtus"
              className="h-10 w-auto"
            />

          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`${isHomePage ? 'text-[#7A694E] hover:text-[#3C542E] font-semibold' : 'text-gray-700 hover:text-[#8A754C]'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAdminLoggedIn ? (
              // Mostrar botón de login admin cuando nadie está logueado
              <div className="relative">
                <button
                  onClick={() => setView('adminLogin')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Login Admin
                </button>
              </div>
            ) : (
              // Mostrar información del usuario y botón de logout
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  🔧 Administrador
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 hover:text-[#8A754C] inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    item.onClick();
                    setShowMobileMenu(false);
                  }}
                  className="text-gray-700 hover:text-[#8A754C] block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                >
                  {item.name}
                </button>
              ))}
              <div className="border-t border-gray-200 pt-2 space-y-1">
                {!isAdminLoggedIn ? (
                  // Mostrar botón de login admin en móvil
                  <button
                    onClick={() => {
                      setView('adminLogin');
                      setShowMobileMenu(false);
                    }}
                    className="text-gray-700 hover:text-[#8A754C] block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                  >
                    Login Admin
                  </button>
                ) : (
                  // Mostrar información y logout en móvil
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm font-medium text-gray-600">
                      🔧 Administrador
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-base font-medium transition-colors w-full flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}