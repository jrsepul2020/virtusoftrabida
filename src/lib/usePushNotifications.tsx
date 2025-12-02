/**
 * Hook para gestionar Push Notifications
 */
import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, options?: NotificationOptions) => void;
}

// VAPID public key - Generar en producción con web-push
const VAPID_PUBLIC_KEY = 'BDummyKeyReplaceMeWithRealVAPIDKey';

/**
 * Convertir base64 a Uint8Array para VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook para gestionar Push Notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
    error: null,
  });

  // Verificar soporte y estado inicial
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window;

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          loading: false,
          error: 'Push notifications no soportadas',
        }));
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission: Notification.permission,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSupported: true,
          loading: false,
          error: 'Error al verificar suscripción',
        }));
      }
    };

    checkSupport();
  }, []);

  // Solicitar permiso
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al solicitar permiso' }));
      return false;
    }
  }, [state.isSupported]);

  // Suscribirse a push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Primero solicitar permiso
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Permiso denegado' 
          }));
          return false;
        }
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Guardar suscripción en localStorage (en producción: enviar al servidor)
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      
      console.log('📬 Push subscription:', subscription);

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al suscribirse',
      }));
      return false;
    }
  }, [state.isSupported, requestPermission]);

  // Cancelar suscripción
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        localStorage.removeItem('pushSubscription');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cancelar suscripción',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Enviar notificación local (sin servidor push)
  const sendLocalNotification = useCallback((
    title: string, 
    options: NotificationOptions = {}
  ) => {
    if (!state.isSupported || Notification.permission !== 'granted') {
      console.warn('No se puede enviar notificación');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200],
      tag: `virtus-${Date.now()}`,
      requireInteraction: false,
      ...options,
    };

    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, defaultOptions);
    });
  }, [state.isSupported]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    sendLocalNotification,
  };
}

/**
 * Componente de botón para activar notificaciones
 */
export function PushNotificationButton() {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    loading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="text-sm text-red-600">
        Notificaciones bloqueadas. Actívalas en configuración del navegador.
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      } disabled:opacity-50`}
    >
      {loading ? (
        'Cargando...'
      ) : isSubscribed ? (
        '🔕 Desactivar notificaciones'
      ) : (
        '🔔 Activar notificaciones'
      )}
    </button>
  );
}

/**
 * Helper para enviar notificación desde cualquier parte de la app
 */
export function sendNotification(title: string, body: string, data?: any) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('📬 Notificación (sin permisos):', title, body);
    return;
  }

  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200],
      data,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Cerrar' },
      ],
    });
  });
}
