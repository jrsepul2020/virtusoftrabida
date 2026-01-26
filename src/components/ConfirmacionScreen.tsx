import React, { useState } from "react";
import { CompanyData, SampleData, PaymentMethod } from "./types";
import {
  Building2,
  Package,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { PayPalModal } from "./PayPalModal";

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
  const { t } = useI18n();
  const [showPayPalModal, setShowPayPalModal] = useState(false);

  return (
    <>
      <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-3 shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl text-black font-bold mb-2">
            {t("form.confirm.title")}
          </h2>
          <p className="text-gray-600 text-sm">{t("form.confirm.review")}</p>
        </div>

        {/* Información de la empresa */}
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-5 h-5 text-black" />
            <h3 className="font-semibold text-black text-base">
              {t("form.company.title")}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.nif")}
              </span>
              <span className="ml-2 text-gray-800">{company.nif}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.name")}
              </span>
              <span className="ml-2 text-gray-800">
                {company.nombre_empresa}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.email")}
              </span>
              <div className="mt-1">
                <a
                  className="text-gray-800 break-all"
                  href={`mailto:${company.email}`}
                >
                  {company.email}
                </a>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.phone")}
              </span>
              <span className="ml-2 text-gray-800">{company.telefono}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.address")}
              </span>
              <span className="ml-2 text-gray-800">
                {company.direccion || "-"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.city")}
              </span>
              <span className="ml-2 text-gray-800">{company.poblacion}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.postal")}
              </span>
              <span className="ml-2 text-gray-800">
                {company.codigo_postal || "-"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                {t("form.company.country")}
              </span>
              <span className="ml-2 text-gray-800">{company.pais}</span>
            </div>
            {company.persona_contacto && (
              <div>
                <span className="font-medium text-gray-700">
                  {t("form.company.contact")}
                </span>
                <span className="ml-2 text-gray-800">
                  {company.persona_contacto}
                </span>
              </div>
            )}
          </div>

          {/* Resumen de precios */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>
                  {company.num_muestras} muestra
                  {company.num_muestras !== 1 ? "s" : ""} total
                </span>
                <span>
                  ({precio.pagadas} muestra{precio.pagadas !== 1 ? "s" : ""}
                  {precio.gratis > 0 ? ` + ${precio.gratis} gratis` : ""})
                </span>
              </div>
              {precio.gratis > 0 && (
                <div className="text-xs text-green-600 text-right font-medium">
                  🎉 ¡{precio.gratis} muestra{precio.gratis !== 1 ? "s" : ""}{" "}
                  gratis!
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-700">
                  {t("summary.total_label")}
                </span>
                <span className="text-xl font-bold text-black">
                  {precio.total}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de muestras */}
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-black" />
            <h3 className="font-semibold text-black text-base">
              {t("form.samples.registered")}
            </h3>
          </div>
          <div className="space-y-3">
            {samples.map((sample, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-orange-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-black text-white rounded-full text-sm font-bold shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-base mb-2">
                      {sample.nombre_muestra}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-600">
                          {t("form.sample.category")}:
                        </span>
                        <span className="ml-1 text-gray-800">
                          {sample.categoria}
                        </span>
                      </div>
                      {sample.origen && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Origen:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.origen}
                          </span>
                        </div>
                      )}
                      {sample.pais && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.country")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.pais}
                          </span>
                        </div>
                      )}
                      {sample.igp && (
                        <div>
                          <span className="font-medium text-gray-600">
                            IGP:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.igp}
                          </span>
                        </div>
                      )}
                      {sample.anio && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.year")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.anio}
                          </span>
                        </div>
                      )}
                      {sample.azucar && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.sugar")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.azucar} g/l
                          </span>
                        </div>
                      )}
                      {sample.grado_alcoholico && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.degree")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.grado_alcoholico}°
                          </span>
                        </div>
                      )}
                      {sample.tipo_uva && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.grape_type")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.tipo_uva}
                          </span>
                        </div>
                      )}
                      {sample.tipo_aceituna && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.olive_type")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.tipo_aceituna}
                          </span>
                        </div>
                      )}
                      {sample.destilado && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.distillate")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.destilado}
                          </span>
                        </div>
                      )}
                      {sample.existencias && (
                        <div>
                          <span className="font-medium text-gray-600">
                            {t("form.sample.stock")}:
                          </span>
                          <span className="ml-1 text-gray-800">
                            {sample.existencias}
                          </span>
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
        <div className="mb-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-black p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-black">
              {t("form.payment.title")}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`relative flex flex-col p-5 border-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
                payment === "transferencia"
                  ? "border-black bg-white shadow-lg ring-4 ring-gray-200"
                  : "border-gray-300 bg-white hover:border-primary-400"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="transferencia"
                checked={payment === "transferencia"}
                onChange={onPaymentChange}
                className="sr-only"
              />
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    payment === "transferencia"
                      ? "border-black bg-black"
                      : "border-gray-400"
                  }`}
                >
                  {payment === "transferencia" && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {t("payment.transfer")}
                </div>
              </div>
              <div className="text-sm text-gray-600 ml-9">
                {t("payment.transfer.desc")}
              </div>
              {payment === "transferencia" && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
              )}
            </label>

            <label
              className={`relative flex flex-col p-5 border-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
                payment === "paypal"
                  ? "border-gray-900 bg-white shadow-lg ring-4 ring-gray-200"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="paypal"
                checked={payment === "paypal"}
                onChange={onPaymentChange}
                className="sr-only"
              />
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    payment === "paypal"
                      ? "border-black bg-black"
                      : "border-gray-400"
                  }`}
                >
                  {payment === "paypal" && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {t("payment.paypal")}
                </div>
              </div>
              <div className="text-sm text-gray-600 ml-9">
                {t("payment.paypal.desc")}
              </div>
              {payment === "paypal" && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-black" />
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
                <div className="text-lg font-bold">{t("success.title")}</div>
              </div>
              <p className="text-sm">{t("success.check_email")}</p>
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
                className="w-full sm:w-auto bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("button.prev")}
              </button>

              {payment === "transferencia" ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    onSubmit();
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("loading.sending")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t("button.submit")}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPayPalModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  {t("payment.paypal")}
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
        numSamples={Number(company.num_muestras)}
        onSuccess={(details) => {
          console.log("Pago de PayPal exitoso:", details);
          if (onPayPalSuccess) {
            onPayPalSuccess(details);
          }
        }}
        onError={(err) => {
          console.error("Error en el pago de PayPal:", err);
        }}
      />
    </>
  );
}
