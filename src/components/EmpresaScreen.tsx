import React from "react";
import { CompanyData } from "./types";
import { useI18n } from '../lib/i18n';

// Prefijo editable; ya no dependemos de listas cerradas

export function EmpresaScreen({
  company,
  onChange,
  onNext,
  precio,
  validationErrors = {},
  isManualInscription = false,
  emailConfirmation = '',
  onEmailConfirmationChange,
}: {
  company: CompanyData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onNext: () => void;
  precio: { pagadas: number; gratis: number; total: number };
  validationErrors?: {[key: string]: boolean};
  isManualInscription?: boolean;
  emailConfirmation?: string;
  onEmailConfirmationChange?: (value: string) => void;
}) {
  const { t } = useI18n();

  const setTelefonoPrefijo = (prefijo: string) => {
    const num = company.telefono?.replace(/^\+\d+\s?/, '') || '';
    onChange({ target: { name: 'telefono', value: `${prefijo} ${num}` } } as any);
  };

  const setTelefonoNumero = (num: string) => {
    const prefijo = company.telefono?.match(/^\+\d+/)?.[0] || '+34';
    onChange({ target: { name: 'telefono', value: `${prefijo} ${num}` } } as any);
  };

  const setMovilPrefijo = (prefijo: string) => {
    const num = company.movil?.replace(/^\+\d+\s?/, '') || '';
    onChange({ target: { name: 'movil', value: `${prefijo} ${num}` } } as any);
  };

  const setMovilNumero = (num: string) => {
    const prefijo = company.movil?.match(/^\+\d+/)?.[0] || '+34';
    onChange({ target: { name: 'movil', value: `${prefijo} ${num}` } } as any);
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-orange-100">
      <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-4 text-center">{t('form.company.title')}</h2>
      <div className="company-note mt-2 text-center">
        <p className="text-sm text-gray-700 mb-1">
          {t('company.note.line1').replace('{price}', '150').replace('{bottles}', '3')}
        </p>
        <p className="text-sm text-gray-700 font-semibold">
          {t('company.note.line2').replace('{per}', '5')}
        </p>
      </div>

      {/* Primera fila - NIF, Nombre Empresa, Persona Contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-2">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.nif')}</label>
          <input
            type="text"
            name="nif"
            value={company.nif}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.nif
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.nif && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div className="lg:col-span-6">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.name')}</label>
          <input
            type="text"
            name="nombre_empresa"
            value={company.nombre_empresa}
            onChange={onChange}
            required
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.nombre_empresa
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.nombre_empresa && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div className="lg:col-span-4">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.contact')}</label>
          <input
            type="text"
            name="persona_contacto"
            value={company.persona_contacto}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.persona_contacto
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.persona_contacto && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>
      </div>

      {/* Segunda fila - Teléfono, Móvil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.phone')}</label>
          <div className="flex">
            <input
              type="text"
              name="telefono_prefijo"
              value={company.telefono?.match(/^\+\d+/)?.[0] || '+34'}
              onChange={(e) => setTelefonoPrefijo(e.target.value || '+34')}
              className="w-16 px-2 py-2 rounded-l-lg border-r-0 border border-black bg-black text-white text-sm focus:border-black focus:ring-2 focus:ring-red-500"
              placeholder="+34"
            />
            <input
              type="tel"
              inputMode="tel"
              name="telefono"
              maxLength={20}
              value={company.telefono?.replace(/^\+\d+\s?/, '') || ''}
              onChange={(e) => setTelefonoNumero(e.target.value)}
              placeholder="600 000 000"
              className={`flex-1 md:w-40 px-4 py-2 rounded-r-lg border ${
                validationErrors?.telefono
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              } focus:ring-2 transition-colors`}
            />
          </div>
          {validationErrors?.telefono && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.mobile')}</label>
          <div className="flex">
            <input
              type="text"
              name="movil_prefijo"
              value={company.movil?.match(/^\+\d+/)?.[0] || '+34'}
              onChange={(e) => setMovilPrefijo(e.target.value || '+34')}
              className="w-16 px-2 py-2 rounded-l-lg border-r-0 border border-black bg-black text-white text-sm focus:border-black focus:ring-2 focus:ring-red-500"
              placeholder="+34"
            />
            <input
              type="tel"
              inputMode="tel"
              name="movil"
              maxLength={20}
              value={company.movil?.replace(/^\+\d+\s?/, '') || ''}
              onChange={(e) => setMovilNumero(e.target.value)}
              placeholder="600 000 000"
              className={`flex-1 md:w-40 px-4 py-2 rounded-r-lg border ${
                validationErrors?.movil
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              } focus:ring-2 transition-colors`}
            />
          </div>
          {validationErrors?.movil && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>
      </div>

      {/* Tercera fila - Email y Confirmación Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.email')}</label>
          <input
            type="email"
            name="email"
            value={company.email}
            onChange={onChange}
            required
            placeholder="ejemplo@empresa.com"
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.email
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.email && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.confirm_email')}</label>
          <input
            type="email"
            value={emailConfirmation}
            onChange={(e) => onEmailConfirmationChange?.(e.target.value)}
            placeholder="Repita su email"
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.email_confirmation
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : company.email && emailConfirmation && company.email === emailConfirmation
                ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.email_confirmation && <p className="text-red-500 text-sm mt-1">Los emails no coinciden</p>}
          {company.email && emailConfirmation && company.email === emailConfirmation && (
            <p className="text-green-600 text-sm mt-1">✓ Los emails coinciden</p>
          )}
        </div>
      </div>

      {/* Cuarta fila - Dirección, Población, CP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-8">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.address')}</label>
          <input
            type="text"
            name="direccion"
            value={company.direccion}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.direccion
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.direccion && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>
        <div className="lg:col-span-4">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.city')}</label>
          <input
            type="text"
            name="poblacion"
            value={company.poblacion}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.poblacion
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.poblacion && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>
      </div>

      {/* Quinta fila - CP, Ciudad, País */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-3">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.postal')}</label>
          <input
            type="text"
            name="codigo_postal"
            value={company.codigo_postal}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.codigo_postal
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.codigo_postal && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div className="lg:col-span-5">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.city')}</label>
          <input
            type="text"
            name="ciudad"
            value={company.ciudad}
            onChange={onChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.ciudad
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.ciudad && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div className="lg:col-span-4">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.country')}</label>
          <input
            type="text"
            name="pais"
            value={company.pais}
            onChange={onChange}
            placeholder="Ej. España, Portugal, Argentina"
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.pais
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.pais && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>
      </div>

      {/* Sexta fila - Medio conoció, Página web */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.medium')}</label>
          <input
            type="text"
            name="medio_conocio"
            value={company.medio_conocio}
            onChange={onChange}
            placeholder={t('form.company.medium.placeholder')}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors?.medio_conocio
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
            } focus:ring-2 transition-colors`}
          />
          {validationErrors?.medio_conocio && <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>}
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.website')}</label>
          <input
            type="text"
            name="pagina_web"
            value={company.pagina_web}
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
          />
        </div>
      </div>

      {/* Séptima fila - Observaciones y Número de muestras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <label className="block text-primary-800 font-medium mb-1">{t('form.company.observations')}</label>
          <textarea
            name="observaciones"
            value={company.observaciones}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-y"
          />
        </div>

        <div>
          <label className="block text-primary-800 font-medium mb-1">{t('label.num_samples')}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="num_muestras"
            value={company.num_muestras}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              e.target.value = value;
              onChange(e);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '' || parseInt(value) < 1) {
                e.target.value = '1';
                onChange(e as any);
              }
            }}
            className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
          />
          <p className="text-xs text-gray-600 mt-1">{t('company.min_samples')}</p>
        </div>
      </div>

      {/* Consentimientos: reglamento obligatorio y marketing opcional */}
      <div className="mt-4 border-t pt-4">
        <div className="flex items-start gap-3">
          <input
            id="acepto_reglamento"
            name="acepto_reglamento"
            type="checkbox"
            checked={!!company.acepto_reglamento}
            onChange={(e) => onChange({ target: { name: 'acepto_reglamento', value: e.target.checked } } as any)}
            className="w-4 h-4 mt-1 text-primary-600 rounded"
          />
          <label htmlFor="acepto_reglamento" className="text-sm text-gray-700">
            <span className="font-medium">{t('form.company.accept_rules')}</span>
            <div className="text-xs text-gray-600">{t('form.company.accept_rules_desc')}</div>
          </label>
        </div>

        <div className="flex items-start gap-3 mt-3">
          <input
            id="consentimiento_marketing"
            name="consentimiento_marketing"
            type="checkbox"
            checked={!!company.consentimiento_marketing}
            onChange={(e) => onChange({ target: { name: 'consentimiento_marketing', value: e.target.checked } } as any)}
            className="w-4 h-4 mt-1 text-primary-600 rounded"
          />
          <label htmlFor="consentimiento_marketing" className="text-sm text-gray-700">
            <span className="font-medium">{t('form.company.accept_marketing')}</span>
            <div className="text-xs text-gray-600">{t('form.company.accept_marketing_desc')}</div>
          </label>
        </div>
        {validationErrors?.acepto_reglamento && <p className="text-red-500 text-sm mt-2">{t('form.required')}</p>}
      </div>

      {/* Resumen de precio */}
      <div className="text-center sm:text-right text-primary-700 font-semibold mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{company.num_muestras} muestra{company.num_muestras !== 1 ? 's' : ''} total</span>
            <span>({precio.pagadas} muestra{precio.pagadas !== 1 ? 's' : ''}{precio.gratis > 0 ? ` + ${precio.gratis} gratis` : ''})</span>
          </div>
          {precio.gratis > 0 && (
            <div className="text-xs text-green-600 text-right">
              🎉 ¡{precio.gratis} muestra{precio.gratis !== 1 ? 's' : ''} gratis!
            </div>
          )}
          <div className="flex items-center justify-between border-t border-orange-200 pt-2">
            <span className="text-base">Total a pagar:</span>
            <span className="text-xl font-bold text-primary-800">{precio.total}€</span>
          </div>
        </div>
      </div>

      {/* Botón de continuar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
        {isManualInscription && (
          <div className="w-full sm:flex-1 p-3 bg-red-50 border-2 border-red-400 rounded-xl">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <p className="text-red-700 font-bold text-sm">{t('admin.manual.title')}</p>
            </div>
            <p className="text-red-700 text-sm mt-2">{t('admin.manual.description')}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 sm:py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 transition-all shadow-md hover:shadow-lg text-lg sm:text-base"
        >
          {t('button.next')}
        </button>
      </div>
    </div>
  );
}