import React from "react";
import { CompanyData, SampleData, PaymentMethod } from "./types";
import { Building2, Package, CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

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
}) {
  return (
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
            <div className="sm:col-span-2">
              <span className="font-medium text-gray-700">Población:</span>
              <span className="ml-2 text-gray-800">{company.poblacion}</span>
            </div>
          </div>
          
          {/* Resumen de precios */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {company.num_muestras} muestra{company.num_muestras !== 1 ? 's' : ''} - Total a pagar:
              </div>
              <div className="text-lg font-bold text-primary-800">
                {precio.total}€
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">
                      {sample.nombre_muestra}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded mr-2">
                        {sample.categoria}
                      </span>
                      {sample.origen && (
                        <span className="text-gray-500">{sample.origen}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-medium text-primary-800">Método de pago</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
              <input 
                type="radio" 
                name="payment" 
                value="transferencia" 
                checked={payment === 'transferencia'} 
                onChange={onPaymentChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-800 text-sm">Transferencia bancaria</div>
                <div className="text-xs text-gray-600">Pago tradicional</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
              <input 
                type="radio" 
                name="payment" 
                value="paypal" 
                checked={payment === 'paypal'} 
                onChange={onPaymentChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-800 text-sm">PayPal</div>
                <div className="text-xs text-gray-600">Pago online seguro</div>
              </div>
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
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <button 
              type="button" 
              onClick={onPrev} 
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-8 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Atrás
            </button>
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
          </div>
        )}
    </div>
  );
}