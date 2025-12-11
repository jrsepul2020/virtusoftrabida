import { useState } from 'react';
import { useI18n } from '../lib/i18n';
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
    // Cada 5 muestras, 1 gratis
    const gratis = Math.floor(samples / 5);
    const pagadas = samples - gratis;
    return pagadas * 150;
  };

  const totalPrice = calculatePrice(totalSamples);

  const getDiscountInfo = () => {
    if (totalSamples >= 5) {
      const freeItems = Math.floor(totalSamples / 5);
      return `${freeItems} muestra${freeItems > 1 ? 's' : ''} gratis - cada 5 muestras, 1 gratis`;
    }
    return null;
  };

  const discountInfo = getDiscountInfo();

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';
  const { t } = useI18n();

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('payment.success.title')}</h2>
        <p className="text-gray-600 mb-6">{t('payment.success.message')}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('payment.success.backhome')}
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
        {t('payment.change_method')}
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('payment.select_title')}</h2>
      <p className="text-gray-600 mb-6">
        {t('payment.company_label')}: <span className="font-medium">{companyName}</span> | {t('payment.company_email')}: <span className="font-medium">{companyEmail}</span>
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
            <p className="text-sm text-gray-600">{t('payment.total_to_pay')}</p>
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
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('payment.bank.title')}</h3>
              <p className="text-gray-600 text-sm">{t('payment.bank.desc')}</p>
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
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('payment.paypal.title')}</h3>
              <p className="text-gray-600 text-sm">{t('payment.paypal.desc')}</p>
            </div>
          </button>
        </div>
      ) : paymentMethod === 'bank' ? (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('payment.bank.details_title')}</h3>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('payment.bank.holder')}</p>
                <p className="font-medium text-gray-900">Excelencias de Huelva S.L.</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('payment.bank.name')}</p>
                <p className="font-medium text-gray-900">Caja Rural del Sur</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('payment.bank.iban')}</p>
                <p className="font-medium text-gray-900">ES21 0237 0506 4091 7146 4247</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('payment.bank.swift')}</p>
                <p className="font-medium text-gray-900">CSURES2CXXX</p>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-3 mt-3">
              <p className="text-sm text-gray-600">{t('payment.concept_label')}</p>
              <p className="font-medium text-gray-900">Inscripción concurso - {companyName}</p>
            </div>

            <div className="border-t border-gray-300 pt-3 mt-3">
              <p className="text-sm text-gray-600">{t('payment.amount_label')}</p>
              <p className="text-2xl font-bold text-primary-600">{totalPrice}€</p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">{t('payment.important_label')}</span> {t('payment.important_text').replace('{company}', companyName)}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('payment.change_method')}
            </button>
            <button
              onClick={() => setPaymentSuccess(true)}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {t('payment.confirm_finish')}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('payment.paypal.title_header')}</h3>

          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-medium">{t('payment.paypal.amount_label')}</span> <span className="text-2xl font-bold text-primary-600">{totalPrice}€</span>
            </p>
            <p className="text-sm text-gray-600">{t('payment.paypal.redirect_text')}</p>
          </div>

          <PayPalScriptProvider options={{
            clientId: paypalClientId,
            currency: 'EUR'
          }}>
            <PayPalButtons
              createOrder={(_data, actions) => {
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
              onApprove={async (_data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture();
                  console.log('Payment successful:', details);
                  setPaymentSuccess(true);
                }
              }}
              onError={(err) => {
                console.error('PayPal error:', err);
                alert(t('payment.paypal.error_alert'));
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
            {t('payment.change_method_full')}
          </button>
        </div>
      )}
    </div>
  );
}
