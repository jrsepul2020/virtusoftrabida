import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';
import { useI18n } from '../lib/i18n';

type View = 'home' | 'adminLogin' | 'admin' | 'catador' | 'inscripcion' | 'reglamento' | 'resultados' | 'diplomas';

type Props = {
  children: React.ReactNode;
  view?: View;
  setView?: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onAdminLogout?: () => void;
};

export default function MainLayout({ children, view, setView, adminLoggedIn, onAdminLogout }: Props) {
  const { t } = useI18n();
  const isAdminView = view === 'admin';

  if (isAdminView) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <a href="#main-content" className="skip-link">{t('skip.link')}</a>
        <main id="main-content" className="flex-1 min-h-0 flex">{children}</main>
      </div>
    );
  }

  const isHomeView = view === 'home';

  return (
    <div className={`flex flex-col ${isHomeView ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <a href="#main-content" className="skip-link">{t('skip.link')}</a>
      {setView && (
        <Header 
          setView={setView} 
          adminLoggedIn={adminLoggedIn}
          onLogout={onAdminLogout}
          currentView={view}
        />
      )}
      <main
        id="main-content"
        className={`flex-1 min-h-0 flex flex-col ${isHomeView ? 'overflow-hidden' : ''}`}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}