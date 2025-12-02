/**
 * Hook para detectar cambios sin guardar y advertir al usuario
 */
import { useEffect, useCallback, useState } from 'react';
import { showWarning } from './toast';

interface UseUnsavedChangesOptions {
  message?: string;
  onConfirm?: () => void;
}

/**
 * Hook para manejar cambios sin guardar
 * @param hasChanges - Si hay cambios pendientes
 * @param options - Opciones de configuración
 */
export function useUnsavedChanges(
  hasChanges: boolean,
  options: UseUnsavedChangesOptions = {}
) {
  const { 
    message = '¿Estás seguro? Tienes cambios sin guardar que se perderán.',
  } = options;

  // Prevenir cierre de ventana/pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, message]);

  // Función para confirmar navegación
  const confirmNavigation = useCallback((callback: () => void) => {
    if (hasChanges) {
      if (confirm(message)) {
        callback();
      }
    } else {
      callback();
    }
  }, [hasChanges, message]);

  // Mostrar advertencia
  const warnUnsavedChanges = useCallback(() => {
    if (hasChanges) {
      showWarning('Tienes cambios sin guardar');
    }
  }, [hasChanges]);

  return {
    hasChanges,
    confirmNavigation,
    warnUnsavedChanges,
  };
}

/**
 * Hook para tracking de cambios en un formulario
 */
export function useFormChanges<T extends Record<string, any>>(initialData: T) {
  const [originalData, setOriginalData] = useState<T>(initialData);
  const [currentData, setCurrentData] = useState<T>(initialData);

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(currentData);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setCurrentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetChanges = useCallback(() => {
    setCurrentData(originalData);
  }, [originalData]);

  const commitChanges = useCallback(() => {
    setOriginalData(currentData);
  }, [currentData]);

  const setInitialData = useCallback((data: T) => {
    setOriginalData(data);
    setCurrentData(data);
  }, []);

  return {
    data: currentData,
    hasChanges,
    updateField,
    resetChanges,
    commitChanges,
    setInitialData,
  };
}
