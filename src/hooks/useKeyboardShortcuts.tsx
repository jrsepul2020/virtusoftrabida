/**
 * Hook para atajos de teclado globales
 */
import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Hook para registrar atajos de teclado
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // No activar atajos si estamos en un input/textarea
    const target = event.target as HTMLElement;
    const isEditing = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        // Permitir Escape incluso en inputs
        if (shortcut.key.toLowerCase() === 'escape' || !isEditing) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook para cerrar modales con Escape
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onEscape, enabled]);
}

/**
 * Hook para guardar con Ctrl+S
 */
export function useSaveShortcut(onSave: () => void, hasChanges: boolean = true) {
  useEffect(() => {
    const handleSave = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (hasChanges) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleSave);
    return () => window.removeEventListener('keydown', handleSave);
  }, [onSave, hasChanges]);
}

/**
 * Hook para buscar con Ctrl+F (focus en input de búsqueda)
 */
export function useSearchShortcut(searchInputRef: React.RefObject<HTMLInputElement>) {
  useEffect(() => {
    const handleSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        // Solo prevenir si hay un input de búsqueda disponible
        if (searchInputRef.current) {
          event.preventDefault();
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener('keydown', handleSearch);
    return () => window.removeEventListener('keydown', handleSearch);
  }, [searchInputRef]);
}

/**
 * Componente para mostrar los atajos disponibles
 */
export function KeyboardShortcutsHelp() {
  return (
    <div className="text-xs text-gray-500 flex items-center gap-4">
      <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">S</kbd> Guardar</span>
      <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">F</kbd> Buscar</span>
      <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">Esc</kbd> Cerrar</span>
    </div>
  );
}
