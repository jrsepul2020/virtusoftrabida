import React from "react";
import { SampleData } from "./types";

export function MuestrasScreen({
  samples,
  onChange,
  onPrev,
  onNext,
  validationErrors = {},
}: {
  samples: SampleData[];
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  validationErrors?: {[key: string]: boolean};
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4 sm:px-6 bg-primary-50">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-6 sm:p-12 border border-primary-100">
        <h2 className="text-xl sm:text-2xl text-primary-800 font-bold mb-6 text-center">
          Datos de las Muestras ({samples.length})
        </h2>
        {samples.map((sample, idx) => (
          <div key={idx} className="mb-6 sm:mb-8 bg-primary-100 rounded-xl p-4 sm:p-8 shadow-inner">
            <div className="font-semibold mb-4 text-primary-700 text-lg text-center">
              Muestra #{idx + 1}
            </div>
            
            {/* Nombre de la muestra */}
            <div className="mb-6">
              <label className="block text-primary-800 font-medium mb-1">Nombre de la Muestra *</label>
              <input 
                type="text" 
                name="nombre_muestra" 
                value={sample.nombre_muestra} 
                onChange={e => onChange(idx, e)} 
                required 
                className={`w-full px-4 py-3 rounded-lg border ${
                  validationErrors?.[`muestra_${idx}`] 
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
                } focus:ring-2 transition-colors text-base`}
                placeholder="Introduzca el nombre de la muestra"
              />
              {validationErrors?.[`muestra_${idx}`] && (
                <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
              )}
            </div>
            
            {/* Primera fila - Categoría, País, Año */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Categoría</label>
                <select 
                  name="categoria" 
                  value={sample.categoria} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors bg-white text-base"
                >
                  <option value="">Seleccionar categoría...</option>
                  <option value="VINO BLANCO">VINO BLANCO</option>
                  <option value="VINO TINTO">VINO TINTO</option>
                  <option value="VINO ROSADO">VINO ROSADO</option>
                  <option value="VINO SIN ALCOHOL">VINO SIN ALCOHOL</option>
                  <option value="GENEROSO SECO">GENEROSO SECO</option>
                  <option value="GENEROSO DULCE">GENEROSO DULCE</option>
                  <option value="AROMATIZADO">AROMATIZADO</option>
                  <option value="ESPIRITUOSO ORIGEN VÍNICO">ESPIRITUOSO ORIGEN VÍNICO</option>
                  <option value="ESPIRITUOSO NO VÍNICO">ESPIRITUOSO NO VÍNICO</option>
                  <option value="ACEITE OLIVA VIRGEN EXTRA">ACEITE OLIVA VIRGEN EXTRA</option>
                  <option value="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO">ACEITE OLIVA VIRGEN EXTRA ORGÁNICO</option>
                  <option value="ESPUMOSO">ESPUMOSO</option>
                </select>
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">País</label>
                <input 
                  type="text" 
                  name="pais" 
                  value={sample.pais} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="País de origen"
                />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Año</label>
                <input 
                  type="number" 
                  name="anio" 
                  value={sample.anio} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="2024"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            {/* Segunda fila - Origen, IGP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Origen</label>
                <input 
                  type="text" 
                  name="origen" 
                  value={sample.origen} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="Región de origen"
                />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">IGP</label>
                <input 
                  type="text" 
                  name="igp" 
                  value={sample.igp} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="Indicación Geográfica Protegida"
                />
              </div>
            </div>
            
            {/* Tercera fila - Azúcar, Grado Alcohólico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Azúcar (g/l)</label>
                <input 
                  type="text" 
                  name="azucar" 
                  value={sample.azucar} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="g/l"
                />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Grado Alcohólico (%)</label>
                <input 
                  type="text" 
                  name="grado_alcoholico" 
                  value={sample.grado_alcoholico} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="% vol."
                />
              </div>
            </div>
            
            {/* Cuarta fila - Existencias */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Existencias (botellas)</label>
                <input 
                  type="number" 
                  name="existencias" 
                  value={sample.existencias} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                  placeholder="Número de botellas"
                  min="0"
                />
              </div>
            </div>
            
            {/* Campos específicos según categoría */}
            {(sample.categoria === 'vino' || sample.categoria === 'vino_generoso') && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-primary-800 font-medium mb-1">Tipo de Uva</label>
                  <input 
                    type="text" 
                    name="tipo_uva" 
                    value={sample.tipo_uva} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                    placeholder="Variedad de uva"
                  />
                </div>
              </div>
            )}
            
            {sample.categoria === 'aceite' && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-primary-800 font-medium mb-1">Tipo de Aceituna</label>
                  <input 
                    type="text" 
                    name="tipo_aceituna" 
                    value={sample.tipo_aceituna} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                    placeholder="Variedad de aceituna"
                  />
                </div>
              </div>
            )}
            
            {sample.categoria === 'espirituoso' && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-primary-800 font-medium mb-1">Tipo de Destilado</label>
                  <input 
                    type="text" 
                    name="destilado" 
                    value={sample.destilado} 
                    onChange={e => onChange(idx, e)} 
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-base" 
                    placeholder="Tipo de destilado"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button 
            type="button" 
            onClick={onPrev} 
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Atrás
          </button>
          <button 
            type="button" 
            onClick={onNext} 
            className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}