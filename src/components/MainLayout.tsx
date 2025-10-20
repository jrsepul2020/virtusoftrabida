import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';
import Footer from './Footer';

type View = 'home' | 'adminLogin' | 'admin' | 'subscribe' | 'cata' | 'empresa' | 'muestras' | 'confirmacion' | 'pago' | 'reglamento' | 'normativa';

type Props = {
  children: React.ReactNode;
  setView?: Dispatch<SetStateAction<View>>;
  adminLoggedIn?: boolean;
  onLogout?: () => void;
  currentView?: View;
};

export default function MainLayout({ children, setView, adminLoggedIn, onLogout, currentView }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      {setView && (
        <Header 
          setView={setView} 
          adminLoggedIn={adminLoggedIn}
          onLogout={onLogout}
          currentView={currentView}
        />
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}