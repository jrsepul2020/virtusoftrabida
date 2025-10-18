import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';
import Footer from './Footer';

type View = 'home' | 'adminLogin' | 'admin' | 'subscribe' | 'cata' | 'empresa' | 'muestras' | 'confirmacion' | 'pago' | 'reglamento' | 'normativa' | 'catadorLogin' | 'catas';

type Props = {
  children: React.ReactNode;
  setView?: Dispatch<SetStateAction<View>>;
  catadorLoggedIn?: any;
  adminLoggedIn?: boolean;
  onLogout?: () => void;
};

export default function MainLayout({ children, setView, catadorLoggedIn, adminLoggedIn, onLogout }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      {setView && (
        <Header 
          setView={setView} 
          catadorLoggedIn={catadorLoggedIn}
          adminLoggedIn={adminLoggedIn}
          onLogout={onLogout}
        />
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}