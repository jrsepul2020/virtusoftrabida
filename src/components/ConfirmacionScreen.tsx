import React, { useState } from "react";
import { CompanyData, SampleData, PaymentMethod } from "./types";
import { Building2, Package, CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { PayPalModal } from './PayPalModal';

export function ConfirmacionScreen({
  company,
  samples,
  payment,
  onPaymentChange,
  precio,
  onPrev,
  onSubmit,
  success,
  loading,
  error,
  onPayPalSuccess,
  isManualInscription = false,
}: {
  company: CompanyData;
  samples: SampleData[];
  payment: PaymentMethod;
  onPaymentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  precio: { pagadas: number; gratis: number; total: number };
  onPrev: () => void;
  onSubmit: () => void;
  success: boolean;
  loading: boolean;
  error: string;
  onPayPalSuccess?: (details: any) => void;
  isManualInscription?: boolean;
}) {
  const [showPayPalModal, setShowPayPalModal] = useState(false);

  return (
    <>
      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-orange-100">
      {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-3 shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl text-primary-800 font-bold mb-2">
            Confirmación de inscripción
          </h2>
          <p className="text-gray-600 text-sm">
            Revisa y confirma los datos de tu inscripción
          </p>
        </div>

        {/* Información de la empresa */}
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-700 text-base">Datos de la empresa</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">NIF:</span>
              <span className="ml-2 text-gray-800">{company.nif}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Empresa:</span>
              <span className="ml-2 text-gray-800">{company.nombre_empresa}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-800 break-all">{company.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Teléfono:</span>
              <span className="ml-2 text-gray-800">{company.telefono}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dirección:</span>
              <span className="ml-2 text-gray-800">{company.direccion || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Población:</span>
              <span className="ml-2 text-gray-800">{company.poblacion}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Código Postal:</span>
              <span className="ml-2 text-gray-800">{company.codigo_postal || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">País:</span>
              <span className="ml-2 text-gray-800">{company.pais}</span>
            </div>
            {company.persona_contacto && (
              <div>
                <span className="font-medium text-gray-700">Contacto:</span>
                <span className="ml-2 text-gray-800">{company.persona_contacto}</span>
              </div>
            )}
          </div>
          
          {/* Resumen de precios */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>{company.num_muestras} muestra{company.num_muestras !== 1 ? 's' : ''} total</span>
                <span>({precio.pagadas} pagada{precio.pagadas !== 1 ? 's' : ''}{precio.gratis > 0 ? ` + ${precio.gratis} gratis` : ''})</span>
              </div>
              {precio.gratis > 0 && (
                <div className="text-xs text-green-600 text-right font-medium">
                  🎉 ¡{precio.gratis} muestra{precio.gratis !== 1 ? 's' : ''} gratis!
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-700">Total a pagar:</span>
                <span className="text-xl font-bold text-primary-800">{precio.total}€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de muestras */}
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-700 text-base">Muestras registradas</h3>
          </div>
          <div className="space-y-3">
            {samples.map((sample, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-orange-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-primary-600 text-white rounded-full text-sm font-bold shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-base mb-2">
                      {sample.nombre_muestra}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-600">Categoría:</span>
                        <span className="ml-1 text-gray-800">{sample.categoria}</span>
                      </div>
                      {sample.origen && (
                        <div>
                          <span className="font-medium text-gray-600">Origen:</span>
                          <span className="ml-1 text-gray-800">{sample.origen}</span>
                        </div>
                      )}
                      {sample.pais && (
                        <div>
                          <span className="font-medium text-gray-600">País:</span>
                          <span className="ml-1 text-gray-800">{sample.pais}</span>
                        </div>
                      )}
                      {sample.igp && (
                        <div>
                          <span className="font-medium text-gray-600">IGP:</span>
                          <span className="ml-1 text-gray-800">{sample.igp}</span>
                        </div>
                      )}
                      {sample.anio && (
                        <div>
                          <span className="font-medium text-gray-600">Año:</span>
                          <span className="ml-1 text-gray-800">{sample.anio}</span>
                        </div>
                      )}
                      {sample.azucar && (
                        <div>
                          <span className="font-medium text-gray-600">Azúcar:</span>
                          <span className="ml-1 text-gray-800">{sample.azucar} g/l</span>
                        </div>
                      )}
                      {sample.grado_alcoholico && (
                        <div>
                          <span className="font-medium text-gray-600">Grado:</span>
                          <span className="ml-1 text-gray-800">{sample.grado_alcoholico}°</span>
                        </div>
                      )}
                      {sample.tipo_uva && (
                        <div>
                          <span className="font-medium text-gray-600">Tipo Uva:</span>
                          <span className="ml-1 text-gray-800">{sample.tipo_uva}</span>
                        </div>
                      )}
                      {sample.tipo_aceituna && (
                        <div>
                          <span className="font-medium text-gray-600">Tipo Aceituna:</span>
                          <span className="ml-1 text-gray-800">{sample.tipo_aceituna}</span>
                        </div>
                      )}
                      {sample.destilado && (
                        <div>
                          <span className="font-medium text-gray-600">Destilado:</span>
                          <span className="ml-1 text-gray-800">{sample.destilado}</span>
                        </div>
                      )}
                      {sample.existencias && (
                        <div>
                          <span className="font-medium text-gray-600">Existencias:</span>
                          <span className="ml-1 text-gray-800">{sample.existencias}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div className="mb-6 bg-gradient-to-br from-primary-50 to-orange-50 border-2 border-primary-300 rounded-xl p-5 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-600 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-primary-900">Selecciona tu método de pago</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`relative flex flex-col p-5 border-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
              payment === 'transferencia' 
                ? 'border-primary-600 bg-white shadow-lg ring-4 ring-primary-200' 
                : 'border-gray-300 bg-white hover:border-primary-400'
            }`}>
              <input 
                type="radio" 
                name="payment" 
                value="transferencia" 
                checked={payment === 'transferencia'} 
                onChange={onPaymentChange}
                className="sr-only"
              />
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  payment === 'transferencia' 
                    ? 'border-primary-600 bg-primary-600' 
                    : 'border-gray-400'
                }`}>
                  {payment === 'transferencia' && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">Transferencia bancaria</div>
              </div>
              <div className="text-sm text-gray-600 ml-9">
                Pago tradicional mediante transferencia
              </div>
              {payment === 'transferencia' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-primary-600" />
                </div>
              )}
            </label>
            
            <label className={`relative flex flex-col p-5 border-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
              payment === 'paypal' 
                ? 'border-blue-600 bg-white shadow-lg ring-4 ring-blue-200' 
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}>
              <input 
                type="radio" 
                name="payment" 
                value="paypal" 
                checked={payment === 'paypal'} 
                onChange={onPaymentChange}
                className="sr-only"
              />
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  payment === 'paypal' 
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-gray-400'
                }`}>
                  {payment === 'paypal' && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">PayPal</div>
              </div>
              <div className="text-sm text-gray-600 ml-9">
                Pago online rápido y seguro
              </div>
              {payment === 'paypal' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-xl">
              <div className="flex items-center justify-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="text-lg font-bold">¡Inscripción enviada con éxito!</div>
              </div>
              <p className="text-sm">
                Recibirás un email de confirmación con los detalles del pago.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Botones de acción */}
                        {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="button" 
                onClick={onPrev} 
                disabled={loading}
                className="w-full sm:w-auto bg-gray-500 text-white px-8 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Atrás
              </button>
              
              {payment === 'transferencia' ? (
                <button 
                  type="button" 
                  disabled={loading} 
                  onClick={onSubmit} 
                  className="w-full sm:w-auto bg-primary-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Enviar inscripción
                    </>
                  )}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowPayPalModal(true)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  Pagar con PayPal
                </button>
              )}
            </div>

            {/* Mensaje de advertencia para muestras manuales */}
            {isManualInscription && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">!</span>
                  </div>
                  <p className="text-red-700 font-bold text-base">
                    ¡¡OJO: Muestras manuales (códigos del 1 al 999)!!
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de PayPal */}
      <PayPalModal
        isOpen={showPayPalModal}
        onClose={() => setShowPayPalModal(false)}
        amount={precio.total}
        companyName={company.nombre_empresa}
        numSamples={company.num_muestras}
        onSuccess={(details) => {
          console.log('Pago de PayPal exitoso:', details);
          if (onPayPalSuccess) {
            onPayPalSuccess(details);
          }
        }}
        onError={(err) => {
          console.error('Error en el pago de PayPal:', err);
        }}
      />
    </>
  );
}