import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CreditCard, Building, CheckCircle, ArrowLeft } from 'lucide-react';

type PaymentSelectionProps = {
  totalSamples: number;
  companyName: string;
  companyEmail: string;
  onBack: () => void;
};

export default function PaymentSelection({
  totalSamples,
  companyName,
  companyEmail,
  onBack,
}: PaymentSelectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal' | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const calculatePrice = (samples: number): number => {
    if (samples >= 10) {
      return Math.floor(samples / 10) * 9 * 150 + (samples % 10) * 150;
    } else if (samples >= 5) {
      return Math.floor(samples / 5) * 4 * 150 + (samples % 5) * 150;
    }
    return samples * 150;
  };

  const totalPrice = calculatePrice(totalSamples);

  const getDiscountInfo = () => {
    if (totalSamples >= 10) {
      const freeItems = Math.floor(totalSamples / 10);
      return `${freeItems} muestra${freeItems > 1 ? 's' : ''} gratis por cada 10`;
    } else if (totalSamples >= 5) {
      const freeItems = Math.floor(totalSamples / 5);
      return `${freeItems} muestra${freeItems > 1 ? 's' : ''} gratis por cada 5`;
    }
    return null;
  };

  const discountInfo = getDiscountInfo();

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Pago Completado!
        </h2>
        <p className="text-gray-600 mb-6">
          Tu pago ha sido procesado exitosamente. Recibirás un correo de confirmación pronto.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-2">Selecciona tu método de pago</h2>
      <p className="text-gray-600 mb-6">
        Empresa: <span className="font-medium">{companyName}</span> | Email: <span className="font-medium">{companyEmail}</span>
      </p>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-gray-700">
              <span className="font-medium">Total de muestras:</span> {totalSamples}
            </p>
            {discountInfo && (
              <p className="text-green-600 text-sm font-medium mt-1">
                ¡Descuento aplicado! {discountInfo}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total a pagar</p>
            <p className="text-3xl font-bold text-primary-600">{totalPrice}€</p>
          </div>
        </div>
      </div>

      {!paymentMethod ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setPaymentMethod('bank')}
            className="group relative bg-white border-2 border-gray-300 rounded-xl p-8 hover:border-primary-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4 group-hover:bg-primary-500 transition-colors">
                <Building className="w-8 h-8 text-primary-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Transferencia Bancaria</h3>
              <p className="text-gray-600 text-sm">
                Realiza el pago mediante transferencia a nuestra cuenta bancaria
              </p>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('paypal')}
            className="group relative bg-white border-2 border-gray-300 rounded-xl p-8 hover:border-primary-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4 group-hover:bg-primary-500 transition-colors">
                <CreditCard className="w-8 h-8 text-primary-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">PayPal</h3>
              <p className="text-gray-600 text-sm">
                Pago rápido y seguro con PayPal o tarjeta de crédito
              </p>
            </div>
          </button>
        </div>
      ) : paymentMethod === 'bank' ? (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Datos para Transferencia Bancaria</h3>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Titular de la cuenta</p>
                <p className="font-medium text-gray-900">Excelencias de Huelva S.L.</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Banco</p>
                <p className="font-medium text-gray-900">Caja Rural del Sur</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IBAN</p>
                <p className="font-medium text-gray-900">ES21 0237 0506 4091 7146 4247</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">BIC/SWIFT</p>
                <p className="font-medium text-gray-900">CSURES2CXXX</p>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-3 mt-3">
              <p className="text-sm text-gray-600">Concepto</p>
              <p className="font-medium text-gray-900">Inscripción concurso - {companyName}</p>
            </div>

            <div className="border-t border-gray-300 pt-3 mt-3">
              <p className="text-sm text-gray-600">Importe</p>
              <p className="text-2xl font-bold text-primary-600">{totalPrice}€</p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Importante:</span> Por favor, incluye el nombre de tu empresa ({companyName}) en el concepto de la transferencia para poder identificar tu pago correctamente.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cambiar método
            </button>
            <button
              onClick={() => setPaymentSuccess(true)}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Confirmar y finalizar
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Pago con PayPal</h3>

          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Importe a pagar:</span> <span className="text-2xl font-bold text-primary-600">{totalPrice}€</span>
            </p>
            <p className="text-sm text-gray-600">
              Serás redirigido a PayPal para completar el pago de forma segura
            </p>
          </div>

          <PayPalScriptProvider options={{
            clientId: paypalClientId,
            currency: 'EUR'
          }}>
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      description: `Inscripción concurso - ${totalSamples} muestra${totalSamples > 1 ? 's' : ''} - ${companyName}`,
                      amount: {
                        currency_code: 'EUR',
                        value: totalPrice.toString(),
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture();
                  console.log('Payment successful:', details);
                  setPaymentSuccess(true);
                }
              }}
              onError={(err) => {
                console.error('PayPal error:', err);
                alert('Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.');
              }}
              style={{
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
              }}
            />
          </PayPalScriptProvider>

          <button
            onClick={() => setPaymentMethod(null)}
            className="w-full mt-4 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cambiar método de pago
          </button>
        </div>
      )}
    </div>
  );
}
