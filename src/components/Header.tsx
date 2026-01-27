import { Dispatch, SetStateAction, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { View } from "./types";

export default function Header({
  setView,
  adminLoggedIn,
  onLogout,
  currentView,
  currentUser,
}: {
  setView: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onLogout?: () => void;
  currentView?: View;
  currentUser?: { nombre: string; email: string; rol?: string } | null;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t, lang, setLang } = useI18n();

  const isAdminLoggedIn = adminLoggedIn || false;
  const isHomePage = currentView === "home";

  const handleNavigation = (view: View) => {
    setView(view);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (isAdminLoggedIn) {
        localStorage.removeItem("adminLoggedIn");
      }
      setView("home");
    }
    setShowMobileMenu(false);
  };

  const handleLoginClick = () => {
    handleNavigation("pinGate");
  };

  const menuItems = [
    { name: t("nav.home"), onClick: () => handleNavigation("home") },
    {
      name: t("nav.inscripcion"),
      onClick: () => handleNavigation("inscripcion"),
    },
    {
      name: t("nav.reglamento"),
      onClick: () => handleNavigation("reglamento"),
    },
  ];

  // Añadir Monitor de Tablets si es admin
  const userRole = currentUser?.rol || localStorage.getItem("userRole") || "";
  const isAdmin = ["SuperAdmin", "Administrador"].includes(userRole);

  if (isAdmin) {
    menuItems.push({
      name: "Tablets",
      onClick: () => handleNavigation("tabletSessions"),
    });
  }

  return (
    <header
      className={`${isHomePage ? "bg-transparent absolute top-0 left-0 right-0 border-b border-transparent" : "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0"} z-50 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          <button
            type="button"
            className="flex items-center cursor-pointer focus:outline-none transition-transform hover:scale-105"
            onClick={() => handleNavigation("home")}
            aria-label={t("nav.home")}
          >
            <img
              src={
                isHomePage ? "/logo-blanco-virtus.png" : "/logo-bandera-1.png"
              }
              alt="International Virtus"
              className="h-12 w-auto"
              loading="lazy"
              decoding="async"
            />
          </button>

          <nav className="hidden md:flex space-x-1" aria-label={t("nav.label")}>
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`${
                  isHomePage
                    ? "text-white hover:text-champagne-300"
                    : "text-midnight-500 hover:text-champagne-600"
                } px-5 py-2 rounded-full text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 font-body`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-6">
            <div
              className={`flex gap-1 ${isHomePage ? "border border-white/20" : "border border-gray-100"} rounded-full p-1`}
            >
              <button
                onClick={() => setLang("es")}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                  lang === "es"
                    ? isHomePage
                      ? "bg-white text-midnight-900 shadow-lg"
                      : "bg-midnight-500 text-white shadow-md"
                    : isHomePage
                      ? "text-white hover:bg-white/10"
                      : "text-midnight-500 hover:bg-midnight-50"
                }`}
                aria-label="Español"
                title="Español"
              >
                <span aria-hidden="true" className="text-sm">
                  ES
                </span>
              </button>
              <button
                onClick={() => setLang("en")}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                  lang === "en"
                    ? isHomePage
                      ? "bg-white text-midnight-900 shadow-lg"
                      : "bg-midnight-500 text-white shadow-md"
                    : isHomePage
                      ? "text-white hover:bg-white/10"
                      : "text-midnight-500 hover:bg-midnight-50"
                }`}
                aria-label="English"
                title="English"
              >
                <span aria-hidden="true" className="text-sm">
                  EN
                </span>
              </button>
              <button
                onClick={() => setLang("pt")}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                  lang === "pt"
                    ? isHomePage
                      ? "bg-white text-midnight-900 shadow-lg"
                      : "bg-midnight-500 text-white shadow-md"
                    : isHomePage
                      ? "text-white hover:bg-white/10"
                      : "text-midnight-500 hover:bg-midnight-50"
                }`}
                aria-label="Português"
                title="Português"
              >
                <span aria-hidden="true" className="text-sm">
                  PT
                </span>
              </button>
            </div>

            {!isAdminLoggedIn && (
              <button
                onClick={handleLoginClick}
                className={`${
                  isHomePage
                    ? "text-white bg-white/10 border border-white/30 hover:bg-white/20"
                    : "text-midnight-600 bg-midnight-50 border border-midnight-100 hover:bg-midnight-100"
                } text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300`}
                aria-label="Acceso"
                title={import.meta.env.DEV ? "Acceso local" : "Acceso"}
              >
                <LogIn size={12} />
                Acceso
              </button>
            )}

            {isAdminLoggedIn && (
              <div className="flex items-center space-x-3 sm:space-x-5">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-midnight-900 tracking-tighter uppercase leading-none mb-0.5">
                    {currentUser?.nombre || "Admin"}
                  </span>
                  <div className="h-0.5 w-full bg-champagne-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-right" />
                  <span className="text-[8px] text-midnight-400 font-medium">
                    {currentUser?.rol ? `${currentUser.rol} | ` : ""}
                    {currentUser?.email || ""}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2 shadow-sm"
                  aria-label={t("nav.logout")}
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`${isHomePage ? "text-white hover:text-gray-100" : "text-black hover:text-gray-800"} inline-flex items-center justify-center p-2 rounded-md focus:outline-none`}
              aria-label={showMobileMenu ? t("nav.close") : t("nav.open")}
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

        {showMobileMenu && (
          <div className="md:hidden bg-white shadow-md border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className={`text-black hover:text-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left`}
                >
                  {item.name}
                </button>
              ))}

              <div className="px-3 py-3 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLang("es")}
                    className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                      lang === "es"
                        ? "bg-gray-200 text-black"
                        : "text-black hover:bg-gray-100"
                    }`}
                    aria-label="Español"
                    title="Español"
                  >
                    <span aria-hidden="true" className="text-lg">
                      🇪🇸
                    </span>
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                      lang === "en"
                        ? "bg-gray-200 text-black"
                        : "text-black hover:bg-gray-100"
                    }`}
                    aria-label="English"
                    title="English"
                  >
                    <span aria-hidden="true" className="text-lg">
                      🇬🇧
                    </span>
                  </button>
                  <button
                    onClick={() => setLang("pt")}
                    className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                      lang === "pt"
                        ? "bg-gray-200 text-black"
                        : "text-black hover:bg-gray-100"
                    }`}
                    aria-label="Português"
                    title="Português"
                  >
                    <span aria-hidden="true" className="text-lg">
                      🇵🇹
                    </span>
                  </button>
                </div>
                {!isAdminLoggedIn && (
                  <button
                    onClick={handleLoginClick}
                    className="w-full mt-2 px-3 py-2.5 text-sm font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    aria-label="Acceso"
                    title={import.meta.env.DEV ? "Acceso local" : "Acceso"}
                  >
                    <LogIn size={16} />
                    <span>Acceso</span>
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 pt-2 space-y-1">
                {!isAdminLoggedIn ? null : (
                  <div className="space-y-2">
                    <div
                      className="px-3 py-2 text-sm font-medium text-black"
                      aria-label={t("nav.admin")}
                    >
                      🔧 {t("nav.admin")}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-700 hover:text-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors w-full flex items-center space-x-2"
                      aria-label={t("nav.logout")}
                    >
                      <LogOut size={16} />
                      <span>{t("nav.logout")}</span>
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
