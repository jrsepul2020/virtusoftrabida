import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const APP_VERSION = '2.4.0';

// Declarar la variable global de Vite
declare const __BUILD_DATE__: string;

// Formatear la fecha de build
const formatBuildDate = () => {
  try {
    const date = new Date(__BUILD_DATE__);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

const BUILD_DATE = formatBuildDate();

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
      // Registrar Service Worker con updateViaCache para forzar checks
      navigator.serviceWorker
        .register('/sw.js', {
          updateViaCache: 'none' // No cachear el SW mismo
        })
        .then((reg) => {
          console.log('[App] Service Worker registrado:', reg);
          setRegistration(reg);

          // Verificar actualizaciones inmediatamente
          reg.update();

          // Verificar actualizaciones cada 10 segundos (más agresivo)
          const updateInterval = setInterval(() => {
            console.log('[App] Verificando actualizaciones...');
            reg.update();
          }, 10000);

          // Escuchar cambios en el Service Worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              console.log('[App] Nueva versión detectada');
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  console.log('[App] Nueva versión lista para instalar');
                  setShowUpdate(true);
                }
              });
            }
          });

          // Cleanup del interval al desmontar
          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('[App] Error al registrar Service Worker:', error);
        });

      // Escuchar cuando el Service Worker toma control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          console.log('[App] Nueva versión activada, recargando...');
          refreshing = true;
          // Limpiar caché del navegador antes de recargar
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload();
        }
      });
    }

    // Verificar versión en localStorage para detectar cambios
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`[App] Versión cambiada de ${storedVersion} a ${APP_VERSION}`);
      localStorage.setItem('app_version', APP_VERSION);
      // Opcional: forzar recarga si detectamos cambio de versión
      // window.location.reload();
    } else {
      localStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Enviar mensaje al Service Worker para que se active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-2xl border-2 border-red-500">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-full">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Nueva versión disponible</p>
              <p className="text-xs text-white/90">Actualiza para obtener las últimas mejoras</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors shadow-lg"
            >
              Actualizar
            </button>
            <button
              onClick={handleDismiss}
              className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar la versión actual
export function VersionBadge({ currentView }: { currentView?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const viewNames: Record<string, string> = {
    home: 'Inicio',
    adminLogin: 'Login Admin',
    admin: 'Panel Admin',
    inscripcion: 'Inscripción',
    reglamento: 'Reglamento',
    normativa: 'Normativa',
  };

  const viewName = currentView ? viewNames[currentView] || currentView : '';

  const handleForceUpdate = () => {
    console.log('[App] Forzando actualización manual...');
    // Limpiar todas las cachés
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Desregistrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    // Limpiar localStorage de versión
    localStorage.removeItem('app_version');
    // Recargar con bypass de caché
    window.location.reload();
  };

  return (
    <div 
      className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-mono z-40 hidden md:flex items-center gap-2 hover:bg-black/90 transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleForceUpdate}
      title="Click para forzar actualización"
    >
      <span>v{APP_VERSION}</span>
      <span className="text-white/50">•</span>
      <span className="text-green-400 text-[10px]">{BUILD_DATE}</span>
      {viewName && (
        <>
          <span className="text-white/50">•</span>
          <span className="text-white/80">{viewName}</span>
        </>
      )}
      {isHovered && (
        <RefreshCw className="w-3 h-3 text-white/80 animate-spin-slow" />
      )}
    </div>
  );
}
