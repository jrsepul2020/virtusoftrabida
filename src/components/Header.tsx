import { useState, Dispatch, SetStateAction } from "react";

type View = 'home' | 'userLogin' | 'adminLogin' | 'user' | 'admin' | 'subscribe' | 'cata' | 'empresa' | 'muestras' | 'confirmacion' | 'pago';

export default function Header({
  setView,
}: {
  setView: Dispatch<SetStateAction<View>>;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  const menuItems = [
    { name: "Inicio", onClick: () => setView('home') },
    { name: "Inscripción", onClick: () => setView('empresa') },
    { name: "Cata", onClick: () => setView('cata') },
  ];

  return (
    <header className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <img
              src="/logo-bandera-1.png"
              alt="International Virtus"
              className="h-10 w-auto"
            />
            <span className="ml-2 text-xl font-bold text-[#4B3A2A]">
              International Virtus
            </span>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className="text-gray-700 hover:text-[#8A754C] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Admin Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="text-gray-700 hover:text-[#8A754C] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Acceso
              </button>
              
              {showAdminDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setView('userLogin');
                      setShowAdminDropdown(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Acceso Usuario
                  </button>
                  <button
                    onClick={() => {
                      setView('adminLogin');
                      setShowAdminDropdown(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Acceso Admin
                  </button>
                </div>
              )}
            </div>
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
              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={() => {
                    setView('userLogin');
                    setShowMobileMenu(false);
                  }}
                  className="text-gray-700 hover:text-[#8A754C] block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                >
                  Acceso Usuario
                </button>
                <button
                  onClick={() => {
                    setView('adminLogin');
                    setShowMobileMenu(false);
                  }}
                  className="text-gray-700 hover:text-[#8A754C] block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                >
                  Acceso Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}