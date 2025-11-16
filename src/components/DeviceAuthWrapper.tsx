import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getOrCreateFingerprint } from '../lib/deviceFingerprint';
import DeviceRegistration from './DeviceRegistration';
import CatadorLogin from './CatadorLogin';

interface Catador {
  id: string;
  nombre: string;
  codigocatador: string;
  tablet: number | null;
  rol: string;
  mesa: number | null;
  puesto: number | null;
}

interface DeviceAuthWrapperProps {
  children: (catador: Catador, tabletNumber: number) => React.ReactNode;
}

export default function DeviceAuthWrapper({ children }: DeviceAuthWrapperProps) {
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [tabletNumber, setTabletNumber] = useState<number | null>(null);
  const [catador, setCatador] = useState<Catador | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDeviceAndSession();
  }, []);

  // Tracking de presencia cuando hay un catador logueado
  useEffect(() => {
    if (!catador) return;

    console.log('👤 Iniciando tracking de presencia para:', catador.nombre);

    // Actualizar dispositivo como activo
    const updatePresence = async () => {
      try {
        const fingerprint = await getOrCreateFingerprint();
        const { error } = await supabase
          .from('dispositivos')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('device_fingerprint', fingerprint);
        
        if (error) {
          console.error('Error actualizando presencia:', error);
        } else {
          console.log('✅ Presencia actualizada:', new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error en updatePresence:', error);
      }
    };

    // Actualización inicial
    updatePresence();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(updatePresence, 30000);

    // Actualizar antes de cerrar/salir
    const handleBeforeUnload = () => {
      // Esto se ejecutará cuando la página se cierre
      console.log('🔌 Página cerrándose...');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup al desmontar
    return () => {
      console.log('🔌 Desconectando presencia');
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [catador, tabletNumber]);

  /**
   * Verifica si el dispositivo está registrado y si hay sesión activa
   */
  const checkDeviceAndSession = async () => {
    try {
      setChecking(true);

      // Verificar sesión activa
      const sessionCatadorId = sessionStorage.getItem('catador_id');
      const sessionTabletNumber = sessionStorage.getItem('tablet_number');

      if (sessionCatadorId && sessionTabletNumber) {
        // Recuperar datos del catador
        const { data: catadorData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', sessionCatadorId)
          .single();

        if (catadorData) {
          setCatador(catadorData);
          setTabletNumber(Number(sessionTabletNumber));
          setDeviceRegistered(true);
          setChecking(false);
          return;
        }
      }

      // Verificar registro del dispositivo
      const fingerprint = await getOrCreateFingerprint();
      const { data: device } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('device_fingerprint', fingerprint)
        .eq('activo', true)
        .single();

      if (device) {
        setTabletNumber(device.tablet_number);
        setDeviceRegistered(true);
      }
    } catch (error) {
      console.error('Error verificando dispositivo:', error);
    } finally {
      setChecking(false);
    }
  };

  /**
   * Callback cuando el dispositivo se registra exitosamente
   */
  const handleDeviceRegistered = (tabletNum: number) => {
    setTabletNumber(tabletNum);
    setDeviceRegistered(true);
  };

  /**
   * Callback cuando el catador inicia sesión exitosamente
   */
  const handleLoginSuccess = (catadorData: Catador) => {
    setCatador(catadorData);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Flujo 1: Dispositivo no registrado → Mostrar pantalla de registro
  if (!deviceRegistered || tabletNumber === null) {
    return <DeviceRegistration onDeviceRegistered={handleDeviceRegistered} />;
  }

  // Flujo 2: Dispositivo registrado pero no hay sesión → Mostrar login
  if (!catador) {
    return <CatadorLogin tabletNumber={tabletNumber} onLoginSuccess={handleLoginSuccess} />;
  }

  // Flujo 3: Todo OK → Mostrar aplicación
  return <>{children(catador, tabletNumber)}</>;
}
