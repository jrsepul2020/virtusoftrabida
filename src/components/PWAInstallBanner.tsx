import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { showInstallPrompt, installApp, dismissInstallPrompt, isInstallable } = usePWAInstall();

  if (!showInstallPrompt || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await installApp();
    } catch (error) {
      console.error('Failed to install app:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up" role="status" aria-live="polite">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-lg p-4 mx-auto max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                ¿Instalar Virtus Cata?
              </h3>
              <p className="text-xs text-white/90 line-clamp-2">
                Accede más rápido como una aplicación en tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={dismissInstallPrompt}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar banner de instalación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-white text-primary-700 px-3 py-2 rounded-lg font-medium text-sm hover:bg-white/95 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Instalar
          </button>
          <button
            onClick={dismissInstallPrompt}
            className="px-3 py-2 text-white/90 hover:text-white text-sm transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;