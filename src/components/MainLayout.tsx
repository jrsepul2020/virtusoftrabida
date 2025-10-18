import React, { Dispatch, SetStateAction } from 'react';
import Header from './Header';
import Footer from './Footer';

type View = 'home' | 'userLogin' | 'adminLogin' | 'user' | 'admin' | 'subscribe' | 'cata' | 'empresa' | 'muestras' | 'confirmacion' | 'pago';

type Props = {
  children: React.ReactNode;
  setView?: Dispatch<SetStateAction<View>>;
};

export default function MainLayout({ children, setView }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      {setView && <Header setView={setView} />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}