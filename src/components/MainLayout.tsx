import React, { Dispatch, SetStateAction } from "react";
import Header from "./Header";
import { View } from "./types";
import { useI18n } from "../lib/i18n";

type Props = {
  children: React.ReactNode;
  view?: View;
  setView?: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onAdminLogout?: () => void;
  currentUser?: { nombre: string; email: string } | null;
};

export default function MainLayout({
  children,
  view,
  setView,
  adminLoggedIn,
  onAdminLogout,
  currentUser,
}: Props) {
  const { t } = useI18n();
  const isAdminView = view === "admin" || view === "catador";

  if (isAdminView) {
    return (
      <div className="flex flex-col h-screen bg-[#E6EBEE] overflow-hidden">
        <a href="#main-content" className="skip-link">
          {t("skip.link")}
        </a>
        <main id="main-content" className="flex-1 min-h-0 flex overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  const isHomeView = view === "home";

  return (
    <div
      className={`flex flex-col ${isHomeView ? "h-screen overflow-hidden" : "min-h-screen"} bg-var(--bg-main)`}
    >
      <a href="#main-content" className="skip-link">
        {t("skip.link")}
      </a>
      {setView && (
        <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-100 dark:bg-slate-900/70 dark:border-slate-800">
          <Header
            setView={setView}
            adminLoggedIn={adminLoggedIn}
            onLogout={onAdminLogout}
            currentView={view}
            currentUser={currentUser}
          />
        </div>
      )}
      <main
        id="main-content"
        className={`flex-1 min-h-0 flex flex-col ${isHomeView ? "overflow-hidden" : "max-w-7xl mx-auto w-full p-4 md:p-8"}`}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
