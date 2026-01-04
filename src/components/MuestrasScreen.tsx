import React from "react";
import { SampleData } from "./types";
import ImageUploader from "./ImageUploader";
import { useI18n } from '../lib/i18n';

// Funciones helper para determinar qué campos mostrar según categoría
const isAceite = (categoria: string) => {
  return categoria?.toUpperCase().includes('ACEITE');
};

const isVinoSinAlcohol = (categoria: string) => {
  return categoria?.toUpperCase() === 'VINO SIN ALCOHOL';
};

const isEspirituoso = (categoria: string) => {
  return categoria?.toUpperCase().includes('ESPIRITUOSO');
};

// Determina si el campo grado es requerido (no para vino sin alcohol ni aceite)
const requiresGrado = (categoria: string) => {
  return !isVinoSinAlcohol(categoria) && !isAceite(categoria);
};

export function MuestrasScreen({
  samples,
  onChange,
  onImageChange,
  onPrev,
  onNext,
  validationErrors = {},
}: {
  samples: SampleData[];
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onImageChange: (index: number, imageUrl: string) => void;
  onPrev: () => void;
  onNext: () => void;
  validationErrors?: {[key: string]: boolean};
}) {
  const { t } = useI18n();

  // Determinar si todas las muestras tienen sus campos obligatorios rellenados
  const allRequiredFilled = samples.every((s) => {
    const baseOk =
      !!s.nombre_muestra?.trim() &&
      !!s.categoria?.trim() &&
      !!s.pais?.trim() &&
      !!s.azucar?.toString().trim() &&
      !!s.existencias?.toString().trim() &&
      !!s.anio?.toString().trim();

    if (!baseOk) return false;

    // Grado obligatorio salvo vino sin alcohol y aceites
    if (requiresGrado(s.categoria) && !s.grado_alcoholico?.toString().trim()) return false;

    // Tipo de aceituna obligatorio si es aceite
    if (isAceite(s.categoria) && !s.tipo_aceituna?.trim()) return false;

    // Tipo de uva obligatorio si es vino (no sin alcohol)
    const isVino = s.categoria?.toUpperCase().includes('VINO');
    if (isVino && !isVinoSinAlcohol(s.categoria) && !s.tipo_uva?.trim()) return false;

    return true;
  });
  // Función para obtener el estilo del input según si hay error
  const getInputClass = (idx: number, field: string) => {
    const hasError = validationErrors?.[`muestra_${idx}_${field}`];
    return `w-full px-4 py-2 rounded-lg border ${
      hasError 
        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
        : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
    } focus:ring-2 transition-colors`;
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-orange-100">
      <h2 className="text-xl sm:text-2xl text-primary-800 font-bold mb-4 text-center">
        {t('form.samples.title').replace('{count}', String(samples.length))}
      </h2>
        {samples.map((sample, idx) => (
          <div key={idx} className="mb-4 bg-orange-50 rounded-xl p-4 sm:p-6 border border-orange-100">
            <div className="font-semibold mb-3 text-primary-700 text-base text-center">
              {t('form.sample.item').replace('{n}', String(idx + 1))}
            </div>
            
            {/* Nombre de la muestra */}
            <div className="mb-4">
              <label className="block text-primary-800 font-medium mb-1">{t('form.sample.name')}</label>
              <input 
                type="text" 
                name="nombre_muestra" 
                value={sample.nombre_muestra} 
                onChange={e => onChange(idx, e)} 
                required 
                className={getInputClass(idx, 'nombre_muestra')}
                placeholder={t('placeholder.sample.name')}
              />
              {validationErrors?.[`muestra_${idx}_nombre_muestra`] && (
                <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
              )}
            </div>

            {/* Foto de la Botella */}
            <div className="mb-4">
              <ImageUploader
                onImageUploaded={(url) => onImageChange(idx, url)}
                currentImageUrl={sample.foto_botella}
                label={t('form.sample.photo')}
              />
            </div>
            
            {/* Primera fila - Categoría, País, Año */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.category')}</label>
                <select 
                  name="categoria" 
                  value={sample.categoria} 
                  onChange={e => onChange(idx, e)} 
                  className={`${getInputClass(idx, 'categoria')} bg-white`}
                >
                  <option value="">{t('form.sample.category.select')}</option>
                  <option value="VINO BLANCO">VINO BLANCO</option>
                  <option value="VINO TINTO">VINO TINTO</option>
                  <option value="VINO ROSADO">VINO ROSADO</option>
                  <option value="VINO SIN ALCOHOL">VINO SIN ALCOHOL</option>
                  <option value="ESPUMOSO">ESPUMOSO</option>
                  <option value="GENEROSO SECO">GENEROSO SECO</option>
                  <option value="GENEROSO DULCE">GENEROSO DULCE</option>
                  <option value="AROMATIZADO">AROMATIZADO</option>
                  <option value="ESPIRITUOSO ORIGEN VÍNICO">ESPIRITUOSO ORIGEN VÍNICO</option>
                  <option value="ESPIRITUOSO NO VÍNICO">ESPIRITUOSO NO VÍNICO</option>
                  <option value="ACEITE OLIVA VIRGEN EXTRA">ACEITE OLIVA VIRGEN EXTRA</option>
                  <option value="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO">ACEITE OLIVA VIRGEN EXTRA ORGÁNICO</option>
                </select>
                {validationErrors?.[`muestra_${idx}_categoria`] && (
                  <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                )}
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.country')}</label>
                <input 
                  type="text" 
                  name="pais" 
                  value={sample.pais} 
                  onChange={e => onChange(idx, e)} 
                  className={getInputClass(idx, 'pais')}
                  placeholder={t('placeholder.sample.country')}
                />
                {validationErrors?.[`muestra_${idx}_pais`] && (
                  <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                )}
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.year')}</label>
                <select 
                  name="anio" 
                  value={sample.anio} 
                  onChange={e => onChange(idx, e)} 
                  className={`${getInputClass(idx, 'anio')} bg-white`}
                >
                  <option value="">{t('form.sample.year.select')}</option>
                  {Array.from({ length: 2025 - 2000 + 1 }, (_, i) => 2025 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {validationErrors?.[`muestra_${idx}_anio`] && (
                  <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                )}
              </div>
            </div>
            
            {/* Segunda fila - Origen, IGP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.origin')}</label>
                <input 
                  type="text" 
                  name="origen" 
                  value={sample.origen} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
                  placeholder={t('placeholder.sample.region')}
                />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.igp')}</label>
                <input 
                  type="text" 
                  name="igp" 
                  value={sample.igp} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
                  placeholder={t('placeholder.sample.igp')}
                />
              </div>
            </div>
            
            {/* Tercera fila - Azúcar, Grado Alcohólico (condicional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.sugar')}</label>
                <input 
                  type="text" 
                  name="azucar" 
                  value={sample.azucar} 
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]+([.,][0-9]*)?$/.test(value)) {
                      onChange(idx, e);
                    }
                  }}
                    className={getInputClass(idx, 'azucar')}
                    placeholder={t('placeholder.sample.sugar')}
                  title="Ingrese solo números con punto o coma decimal"
                />
                {validationErrors?.[`muestra_${idx}_azucar`] && (
                  <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                )}
              </div>
              {/* Grado Alcohólico - No mostrar si es vino sin alcohol o aceite */}
              {requiresGrado(sample.categoria) && (
                <div>
                  <label className="block text-primary-800 font-medium mb-1">{t('form.sample.degree')}</label>
                  <input 
                    type="text" 
                    name="grado_alcoholico" 
                    value={sample.grado_alcoholico} 
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]+([.,][0-9]*)?$/.test(value)) {
                        onChange(idx, e);
                      }
                    }}
                    className={getInputClass(idx, 'grado_alcoholico')}
                    placeholder={t('placeholder.sample.degree')}
                    title="Ingrese solo números con punto o coma decimal"
                  />
                  {validationErrors?.[`muestra_${idx}_grado_alcoholico`] && (
                    <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Cuarta fila - Existencias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">{t('form.sample.stock')}</label>
                <input 
                  type="number" 
                  name="existencias" 
                  value={sample.existencias} 
                  onChange={e => onChange(idx, e)} 
                  className={getInputClass(idx, 'existencias')}
                  placeholder={t('placeholder.sample.stock')}
                  min="0"
                />
                {validationErrors?.[`muestra_${idx}_existencias`] && (
                  <p className="text-red-500 text-sm mt-1">{t('form.required')}</p>
                )}
              </div>
            </div>
            
            {/* Campos condicionales según categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Tipo de Uva - No mostrar si es aceite */}
              {!isAceite(sample.categoria) && (
                <div>
                  <label className="block text-primary-800 font-medium mb-1">{t('form.sample.grape_type')}</label>
                  <input 
                    type="text" 
                    name="tipo_uva" 
                    value={sample.tipo_uva} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
                    placeholder={t('placeholder.sample.variety')}
                  />
                </div>
              )}
              
              {/* Tipo de Aceituna - Solo mostrar si es aceite */}
              {isAceite(sample.categoria) && (
                <div>
                  <label className="block text-primary-800 font-medium mb-1">{t('form.sample.olive_type')}</label>
                  <input 
                    type="text" 
                    name="tipo_aceituna" 
                    value={sample.tipo_aceituna} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
                    placeholder={t('placeholder.sample.olive_variety')}
                  />
                </div>
              )}
              
              {/* Destilado - Solo mostrar si es espirituoso */}
              {isEspirituoso(sample.categoria) && (
                <div>
                  <label className="block text-primary-800 font-medium mb-1">{t('form.sample.distillate')}</label>
                  <input 
                    type="text" 
                    name="destilado" 
                    value={sample.destilado} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
                    placeholder={t('placeholder.sample.distilled')}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
          <button 
            type="button" 
            onClick={onPrev} 
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-8 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            {t('button.prev')}
          </button>
          <button 
            type="button" 
            onClick={onNext} 
            className={
              `w-full sm:w-auto text-white px-8 py-2 rounded-lg font-semibold transition-colors ` +
              (allRequiredFilled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary-600 hover:bg-primary-700')
            }
          >
            {t('button.next')}
          </button>
        </div>
    </div>
  );
}