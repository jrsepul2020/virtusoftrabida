import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';

type View = 'home' | 'adminLogin' | 'admin' | 'inscripcion' | 'reglamento' | 'normativa';

type Props = {
  children: React.ReactNode;
  view?: View;
  setView?: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onAdminLogout?: () => void;
};

export default function MainLayout({ children, view, setView, adminLoggedIn, onAdminLogout }: Props) {
  const isAdminView = view === 'admin';

  if (isAdminView) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <main className="flex-1 min-h-0 flex">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {setView && (
        <Header 
          setView={setView} 
          adminLoggedIn={adminLoggedIn}
          onLogout={onAdminLogout}
          currentView={view}
        />
      )}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}