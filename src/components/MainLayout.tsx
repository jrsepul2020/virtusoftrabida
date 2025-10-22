import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';
import Footer from './Footer';

type View = 'home' | 'adminLogin' | 'admin' | 'inscripcion' | 'reglamento' | 'normativa';

type Props = {
  children: React.ReactNode;
  view?: View;
  setView?: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onAdminLogout?: () => void;
};

export default function MainLayout({ children, view, setView, adminLoggedIn, onAdminLogout }: Props) {
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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}