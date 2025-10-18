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
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-6 bg-primary-50">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-12 border border-primary-100">
        <h2 className="text-2xl text-primary-800 font-bold mb-6 text-center">
          Datos de las Muestras ({samples.length})
        </h2>
        {samples.map((sample, idx) => (
          <div key={idx} className="mb-8 bg-primary-100 rounded-xl p-8 shadow-inner">
            <div className="font-semibold mb-4 text-primary-700 text-lg text-center">
              Muestra #{idx + 1}
            </div>
            <div className="mb-6">
              <label className="block text-primary-800 font-medium mb-1">Nombre de la Muestra *</label>
              <input 
                type="text" 
                name="nombre_muestra" 
                value={sample.nombre_muestra} 
                onChange={e => onChange(idx, e)} 
                required 
                className={`w-full px-4 py-2 rounded-lg border ${
                  validationErrors?.[`muestra_${idx}`] 
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
                } focus:ring-2 transition-colors`}
              />
              {validationErrors?.[`muestra_${idx}`] && (
                <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Categoría</label>
                <select 
                  name="categoria" 
                  value={sample.categoria} 
                  onChange={e => onChange(idx, e)} 
                  className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors bg-white"
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
                <label className="block text-primary-800 font-medium mb-1">Origen</label>
                <input type="text" name="origen" value={sample.origen} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">IGP</label>
                <input type="text" name="igp" value={sample.igp} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">País</label>
                <input type="text" name="pais" value={sample.pais} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Azúcar (g/l)</label>
                <input type="text" name="azucar" value={sample.azucar} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Grado Alcohólico (%)</label>
                <input type="text" name="grado_alcoholico" value={sample.grado_alcoholico} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Existencias (botellas)</label>
                <input type="text" name="existencias" value={sample.existencias} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Año (Cosecha)</label>
                <input type="text" name="anio" value={sample.anio} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Tipo de Uva</label>
                <input type="text" name="tipo_uva" value={sample.tipo_uva} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-primary-800 font-medium mb-1">Tipo de Aceituna</label>
                <input type="text" name="tipo_aceituna" value={sample.tipo_aceituna} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
              <div>
                <label className="block text-primary-800 font-medium mb-1">Destilado</label>
                <input type="text" name="destilado" value={sample.destilado} onChange={e => onChange(idx, e)} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-4">
          <button type="button" onClick={onPrev} className="bg-gray-300 text-gray-700 px-8 py-2 rounded-lg">Atrás</button>
          <button type="button" onClick={onNext} className="bg-primary-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Siguiente</button>
        </div>
      </div>
    </div>
  );
}