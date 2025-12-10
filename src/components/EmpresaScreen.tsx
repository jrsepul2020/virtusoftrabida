import React from "react";
import { CompanyData } from "./types";

// Lista de países para el selector
const PAISES = [
  'España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Reino Unido', 'Estados Unidos',
  'Argentina', 'Chile', 'México', 'Australia', 'Sudáfrica', 'Nueva Zelanda',
  'Austria', 'Suiza', 'Bélgica', 'Países Bajos', 'Grecia', 'Hungría', 'Rumanía',
  'Brasil', 'Uruguay', 'Perú', 'Colombia', 'Marruecos', 'Túnez', 'Líbano', 'Israel',
  'China', 'Japón', 'Corea del Sur', 'India', 'Canadá', 'Otro'
].sort();

// Prefijos telefónicos
const PREFIJOS = [
  { pais: 'España', codigo: '+34' },
  { pais: 'Portugal', codigo: '+351' },
  { pais: 'Francia', codigo: '+33' },
  { pais: 'Italia', codigo: '+39' },
  { pais: 'Alemania', codigo: '+49' },
  { pais: 'Reino Unido', codigo: '+44' },
  { pais: 'Estados Unidos', codigo: '+1' },
  { pais: 'Argentina', codigo: '+54' },
  { pais: 'Chile', codigo: '+56' },
  { pais: 'México', codigo: '+52' },
];

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
  return (
    <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-orange-100">
      <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-4 text-center">Datos de la Empresa / Bodega</h2>
        <div className="company-note mt-2">
 <div className="company-note mt-2 text-center">
          <p className="text-sm text-gray-700 mb-1">
            Realice su inscripción sin límite de muestras.
           Cada muestra tiene un coste de <strong>150 €</strong>. Envíe <strong>3 botellas</strong> por muestra.
          </p>
          <p className="text-sm text-gray-700 font-semibold">
            Por cada 5 muestras inscritas, <span className="text-green-600">una es GRATIS</span>.
          </p>
          
        </div>
</div>
        {/* Primera fila - NIF, Nombre Empresa, Persona Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-primary-800 font-medium mb-1">NIF *</label>
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
            {validationErrors?.nif && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-6">
            <label className="block text-primary-800 font-medium mb-1">Nombre de la Empresa *</label>
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
            {validationErrors?.nombre_empresa && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Persona de Contacto *</label>
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
            {validationErrors?.persona_contacto && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
        </div>
        
        {/* Segunda fila - Teléfono, Móvil, Email, Confirmación Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-primary-800 font-medium mb-1">Teléfono *</label>
            <div className="flex">
              <select 
                className="w-20 px-2 py-2 rounded-l-lg border-r-0 border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-gray-50 text-sm"
                onChange={(e) => {
                  const prefijo = e.target.value;
                  const telefonoActual = company.telefono?.replace(/^\+\d+\s?/, '') || '';
                  onChange({ target: { name: 'telefono', value: prefijo + ' ' + telefonoActual } } as any);
                }}
                defaultValue="+34"
              >
                {PREFIJOS.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.codigo}</option>
                ))}
              </select>
              <input 
                type="tel" 
                inputMode="tel"
                name="telefono" 
                value={company.telefono?.replace(/^\+\d+\s?/, '') || ''} 
                onChange={(e) => {
                  const prefijo = company.telefono?.match(/^\+\d+/)?.[0] || '+34';
                  onChange({ target: { name: 'telefono', value: prefijo + ' ' + e.target.value } } as any);
                }}
                placeholder="600 000 000"
                className={`flex-1 px-4 py-2 rounded-r-lg border ${
                  validationErrors?.telefono 
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
                } focus:ring-2 transition-colors`}
              />
            </div>
            {validationErrors?.telefono && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div>
            <label className="block text-primary-800 font-medium mb-1">Móvil *</label>
            <div className="flex">
              <select 
                className="w-20 px-2 py-2 rounded-l-lg border-r-0 border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-gray-50 text-sm"
                onChange={(e) => {
                  const prefijo = e.target.value;
                  const movilActual = company.movil?.replace(/^\+\d+\s?/, '') || '';
                  onChange({ target: { name: 'movil', value: prefijo + ' ' + movilActual } } as any);
                }}
                defaultValue="+34"
              >
                {PREFIJOS.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.codigo}</option>
                ))}
              </select>
              <input 
                type="tel" 
                inputMode="tel"
                name="movil" 
                value={company.movil?.replace(/^\+\d+\s?/, '') || ''} 
                onChange={(e) => {
                  const prefijo = company.movil?.match(/^\+\d+/)?.[0] || '+34';
                  onChange({ target: { name: 'movil', value: prefijo + ' ' + e.target.value } } as any);
                }}
                placeholder="600 000 000"
                className={`flex-1 px-4 py-2 rounded-r-lg border ${
                  validationErrors?.movil 
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
                } focus:ring-2 transition-colors`}
              />
            </div>
            {validationErrors?.movil && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div>
            <label className="block text-primary-800 font-medium mb-1">Email *</label>
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
            {validationErrors?.email && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>

          {/* Confirmación de Email: colocada a la misma altura que Email */}
          <div>
            <label className="block text-primary-800 font-medium mb-1">Confirmar Email *</label>
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
            {validationErrors?.email_confirmation && (
              <p className="text-red-500 text-sm mt-1">Los emails no coinciden</p>
            )}
            {company.email && emailConfirmation && company.email === emailConfirmation && (
              <p className="text-green-600 text-sm mt-1">✓ Los emails coinciden</p>
            )}
          </div>
        </div>

        {/* (Confirmación de email movida junto al campo Email) */}
        
        {/* Tercera fila - Dirección, Población, CP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-8">
            <label className="block text-primary-800 font-medium mb-1">Dirección *</label>
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
            {validationErrors?.direccion && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Población *</label>
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
            {validationErrors?.poblacion && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
        </div>
        
        {/* Cuarta fila - CP, Ciudad, País */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Código Postal *</label>
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
            {validationErrors?.codigo_postal && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-5">
            <label className="block text-primary-800 font-medium mb-1">Ciudad *</label>
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
            {validationErrors?.ciudad && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">País *</label>
            <select 
              name="pais" 
              value={company.pais} 
              onChange={onChange} 
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors?.pais 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              } focus:ring-2 transition-colors bg-white`}
            >
              <option value="">Seleccionar país...</option>
              {PAISES.map(pais => (
                <option key={pais} value={pais}>{pais}</option>
              ))}
            </select>
            {validationErrors?.pais && (
              <p className="text-red-500 text-sm mt-1">Obligatorio</p>
            )}
          </div>
        </div>
        
        {/* Quinta fila - Medio conoció, Página web */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-primary-800 font-medium mb-1">¿A través de qué medio nos conoció?</label>
            <input 
              type="text" 
              name="medio_conocio" 
              value={company.medio_conocio} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
         
          <div>
            <label className="block text-primary-800 font-medium mb-1">Página Web</label>
            <input 
              type="text" 
              name="pagina_web" 
              value={company.pagina_web} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
        </div>
        
        {/* Sexta fila - Observaciones y Número de muestras */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <label className="block text-primary-800 font-medium mb-1">Observaciones</label>
            <textarea 
              name="observaciones" 
              value={company.observaciones} 
              onChange={onChange} 
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-y" 
            />
          </div>
          <div>
            <label className="block text-primary-800 font-medium mb-1">Nº de muestras</label>
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
            <p className="text-xs text-gray-600 mt-1">Mínimo 1 muestra</p>
          </div>
        </div>
        
        {/* Resumen de precio */}
        <div className="text-center sm:text-right text-primary-700 font-semibold mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{company.num_muestras} muestra{company.num_muestras !== 1 ? 's' : ''} total</span>
              <span>({precio.pagadas} pagada{precio.pagadas !== 1 ? 's' : ''}{precio.gratis > 0 ? ` + ${precio.gratis} gratis` : ''})</span>
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
                <p className="text-red-700 font-bold text-sm">
                  ¡¡OJO: Muestras manuales (códigos del 1 al 999)!!
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3 sm:py-2 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors text-lg sm:text-base"
          >
            Siguiente
          </button>
        </div>
    </div>
  );
}