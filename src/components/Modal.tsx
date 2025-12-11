import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useEffect, useId } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Entendido',
  onConfirm 
}: ModalProps) {
  if (!isOpen) return null;

  // IDs for accessibility associations
  const baseId = useId();
  const labelId = `${baseId}-title`;
  const descriptionId = `${baseId}-desc`;

  // Close with Escape for keyboard users
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'success':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={labelId} aria-describedby={descriptionId}>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className={`${colors.bg} ${colors.border} border-b px-4 py-3 sm:px-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <h3 id={labelId} className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:px-6">
            <p id={descriptionId} className="text-sm text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-colors ${colors.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}