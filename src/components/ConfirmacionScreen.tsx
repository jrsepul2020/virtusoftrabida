import React from "react";
import { CompanyData, SampleData, PaymentMethod } from "./types";

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
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-6 bg-primary-50">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-12 border border-primary-100">
        <h2 className="text-2xl text-primary-800 font-bold mb-6 text-center">Confirmación de inscripción</h2>
        <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="font-semibold mb-2 text-primary-700">Empresa</div>
          <div><strong>NIF:</strong> {company.nif}</div>
          <div><strong>Nombre:</strong> {company.nombre_empresa}</div>
          <div><strong>Email:</strong> {company.email}</div>
          <div><strong>Teléfono:</strong> {company.telefono}</div>
          <div><strong>Población:</strong> {company.poblacion}</div>
          <div><strong>Nº muestras:</strong> {company.num_muestras} ({precio.pagadas} pagadas, {precio.gratis} gratis)</div>
          <div><strong>Total inscripción:</strong> <span className="font-bold">{precio.total}€</span></div>
        </div>
        <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="font-semibold mb-2 text-primary-700">Muestras</div>
          {samples.map((sample, idx) => (
            <div key={idx} className="mb-2">
              <strong>Muestra {idx + 1}:</strong> {sample.nombre_muestra} / {sample.categoria} / {sample.origen}
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-medium text-primary-800 mb-3">Método de pago</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" name="payment" value="transferencia" checked={payment === 'transferencia'} onChange={onPaymentChange} />
              Transferencia bancaria
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="payment" value="paypal" checked={payment === 'paypal'} onChange={onPaymentChange} />
              PayPal
            </label>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success ? (
          <div className="text-center text-green-700 font-medium bg-green-100 p-4 rounded-lg">
            ✅ ¡Formulario enviado con éxito!
          </div>
        ) : (
          <div className="flex justify-between pt-6">
            <button type="button" onClick={onPrev} className="bg-gray-300 text-gray-700 px-8 py-2 rounded-lg">Atrás</button>
            <button type="button" disabled={loading} onClick={onSubmit} className={`bg-primary-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors`}>
              {loading ? 'Enviando...' : 'Enviar inscripción'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}