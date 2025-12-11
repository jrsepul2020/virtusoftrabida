import { Dispatch, SetStateAction, useState } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "../lib/i18n";

type View = 'home' | 'adminLogin' | 'admin' | 'inscripcion' | 'reglamento' | 'resultados' | 'diplomas';

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
  const { t, lang, setLang } = useI18n();

  const isAdminLoggedIn = adminLoggedIn || false;
  const isHomePage = currentView === 'home';

  const handleNavigation = (view: View) => {
    setView(view);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (isAdminLoggedIn) {
        localStorage.removeItem('adminLoggedIn');
      }
      setView('home');
    }
    setShowMobileMenu(false);
  };

  const menuItems = [
    { name: t('nav.home'), onClick: () => handleNavigation('home') },
    { name: t('nav.inscripcion'), onClick: () => handleNavigation('inscripcion') },
    { name: t('nav.reglamento'), onClick: () => handleNavigation('reglamento') },
  ];

  return (
    <header className={`${isHomePage ? 'bg-transparent absolute top-0 left-0 right-0' : 'bg-white shadow-md'} relative z-50 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button
            type="button"
            className="flex items-center cursor-pointer focus:outline-none"
            onClick={() => handleNavigation('home')}
            aria-label={t('nav.home')}
          >
            <img
              src="/logo-bandera-1.png"
              alt="International Virtus"
              className="h-10 w-auto"
              loading="lazy"
              decoding="async"
            />
          </button>

          <nav className="hidden md:flex space-x-6" aria-label={t('nav.label')}>
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`${isHomePage ? 'text-black hover:text-gray-800 font-semibold' : 'text-black hover:text-gray-800'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="px-3 py-2 text-sm font-semibold text-black border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 flex items-center gap-2"
              aria-label={t('lang.toggle.aria')}
            >
              <span aria-hidden="true" className="text-lg">
                {lang === 'es' ? '🇪🇸' : '🇬🇧'}
              </span>
              <span className="text-xs uppercase tracking-wide">
                {lang === 'es' ? 'ES' : 'EN'}
              </span>
            </button>
            {!isAdminLoggedIn ? null : (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-black" aria-label={t('nav.admin')}>
                  🔧 {t('nav.admin')}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                  aria-label={t('nav.logout')}
                >
                  <LogOut size={16} />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-black hover:text-gray-800 inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
              aria-label={showMobileMenu ? t('nav.close') : t('nav.open')}
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="text-black hover:text-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                >
                  {item.name}
                </button>
              ))}

              <button
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="w-full text-left px-3 py-2 rounded-md text-black border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                aria-label={t('lang.toggle.aria')}
              >
                <span aria-hidden="true" className="text-lg">
                  {lang === 'es' ? '🇪🇸' : '🇬🇧'}
                </span>
                <span className="text-xs uppercase tracking-wide">
                  {lang === 'es' ? 'ES' : 'EN'}
                </span>
              </button>

              <div className="border-t border-gray-200 pt-2 space-y-1">
                {!isAdminLoggedIn ? null : (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm font-medium text-black" aria-label={t('nav.admin')}>
                      🔧 {t('nav.admin')}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-700 hover:text-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors w-full flex items-center space-x-2"
                      aria-label={t('nav.logout')}
                    >
                      <LogOut size={16} />
                      <span>{t('nav.logout')}</span>
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