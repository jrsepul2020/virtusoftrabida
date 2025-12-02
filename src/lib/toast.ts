/**
 * Sistema de notificaciones Toast
 * Centraliza todas las notificaciones de la aplicación
 */
import toast, { Toaster } from 'react-hot-toast';

// Configuración de estilos por defecto
const defaultStyle = {
  borderRadius: '10px',
  background: '#333',
  color: '#fff',
};

// Toast de éxito
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    style: {
      ...defaultStyle,
      background: '#10B981',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

// Toast de error
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    style: {
      ...defaultStyle,
      background: '#EF4444',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

// Toast de información
export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      ...defaultStyle,
      background: '#3B82F6',
    },
  });
};

// Toast de advertencia
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      ...defaultStyle,
      background: '#F59E0B',
    },
  });
};

// Toast de carga (devuelve el id para poder cerrarlo)
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: defaultStyle,
  });
};

// Cerrar toast de carga
export const dismissLoading = (toastId: string) => {
  toast.dismiss(toastId);
};

// Toast de promesa (para operaciones async)
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages, {
    style: defaultStyle,
    success: {
      style: {
        ...defaultStyle,
        background: '#10B981',
      },
    },
    error: {
      style: {
        ...defaultStyle,
        background: '#EF4444',
      },
    },
  });
};

export { Toaster };
export default toast;
