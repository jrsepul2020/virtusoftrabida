import { StrictMode } from 'react';
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryProvider } from './lib/queryCache';
import { initSentry } from './lib/sentry';
import { I18nProvider } from './lib/i18n';

initSentry();

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white shadow-lg rounded-xl p-6 max-w-md w-full text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-3">Ha ocurrido un error</h1>
      <p className="text-sm text-gray-600 mb-4">{error?.message ?? 'Error inesperado'}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Recargar
        </button>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  </div>
);

// Sentry's ErrorBoundary may call the fallback with a different shape depending on version.
const ErrorFallbackWrapper = (errorData: any) => {
  const err = errorData?.error ?? errorData?.error?.error ?? new Error('Unknown error');
  const reset = () => {
    if (typeof errorData?.resetError === 'function') errorData.resetError();
    if (typeof errorData?.resetErrorBoundary === 'function') errorData.resetErrorBoundary();
  };
  return ErrorFallback({ error: err as Error, resetErrorBoundary: reset });
};

// Register Service Worker for PWA functionality (disabled in dev to avoid noisy prompts)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install prompt disabled for public views - only available in admin config
// The hook usePWAInstall() can still be used in admin areas if needed
/*
let deferredPrompt: any;
if (!import.meta.env.DEV) {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button/banner (you can customize this)
    showInstallPrompt();
  });
}
*/

function showInstallPrompt_DISABLED() {
  // Create a subtle install prompt
  const installBanner = document.createElement('div');
  installBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideUp 0.3s ease-out;
    ">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">¿Instalar Virtus Cata?</div>
        <div style="font-size: 14px; opacity: 0.9;">Accede más rápido como una app</div>
      </div>
      <div>
        <button id="install-btn" style="
          background: white;
          color: #dc2626;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 8px;
        ">Instalar</button>
        <button id="dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
        ">×</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    </style>
  `;
  
  document.body.appendChild(installBanner);
  
  // Handle install button click
  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
    }
    installBanner.remove();
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    installBanner.remove();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(installBanner)) {
      installBanner.remove();
    }
  }, 10000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallbackWrapper}>
      <I18nProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </I18nProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
