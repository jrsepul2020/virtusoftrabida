import { X } from 'lucide-react';
import { PayPalButton } from './PayPalButton';

interface PayPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  companyName: string;
  numSamples: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export function PayPalModal({
  isOpen,
  onClose,
  amount,
  companyName,
  numSamples,
  onSuccess,
  onError,
}: PayPalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con degradado */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-t-3xl px-8 py-6 text-white relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Contenido del header */}
            <div className="relative">
              <h2 className="text-2xl font-bold text-center mb-1">
                PayPal - Pago seguro
              </h2>
              <p className="text-blue-100 text-center text-sm">
                Completa tu pago de forma rápida y segura
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-8 py-6">
            {/* Resumen del pago */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Resumen del pago
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="font-semibold text-gray-900">{companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Muestras:</span>
                  <span className="font-semibold text-gray-900">{numSamples}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{amount.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Pago 100% seguro</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tu información está protegida con encriptación SSL
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de PayPal */}
            <div className="mb-4">
              <PayPalButton
                amount={amount}
                onSuccess={(details) => {
                  console.log('Pago exitoso desde modal:', details);
                  onSuccess(details);
                  onClose();
                }}
                onError={(error) => {
                  console.error('Error en pago desde modal:', error);
                  onError(error);
                }}
                onCancel={() => {
                  console.log('Pago cancelado desde modal');
                  // No cerramos el modal para que el usuario pueda intentar de nuevo
                }}
              />
            </div>

            {/* Nota adicional */}
            <p className="text-xs text-center text-gray-500">
              Al completar el pago, aceptas los términos y condiciones
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 rounded-b-3xl px-8 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar y elegir otro método de pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
