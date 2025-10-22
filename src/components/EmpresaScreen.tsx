import React from "react";
import { CompanyData } from "./types";

export function EmpresaScreen({
  company,
  onChange,
  onNext,
  precio,
  validationErrors = {},
}: {
  company: CompanyData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onNext: () => void;
  precio: { pagadas: number; gratis: number; total: number };
  validationErrors?: {[key: string]: boolean};
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-4 sm:py-6 px-4 sm:px-6">
      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-orange-100 mt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-4 text-center">Datos de la Empresa / Bodega</h2>
        
        {/* Primera fila - NIF, Nombre Empresa, Persona Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-primary-800 font-medium mb-1">NIF</label>
            <input 
              type="text" 
              name="nif" 
              value={company.nif} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
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
              <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
            )}
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Persona de Contacto</label>
            <input 
              type="text" 
              name="persona_contacto" 
              value={company.persona_contacto} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
        </div>
        
        {/* Segunda fila - Teléfono, Móvil, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Teléfono</label>
            <input 
              type="text" 
              name="telefono" 
              value={company.telefono} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Móvil</label>
            <input 
              type="text" 
              name="movil" 
              value={company.movil} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
          <div className="lg:col-span-6">
            <label className="block text-primary-800 font-medium mb-1">Email *</label>
            <input 
              type="email" 
              name="email" 
              value={company.email} 
              onChange={onChange} 
              required 
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors?.email 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              } focus:ring-2 transition-colors`}
            />
            {validationErrors?.email && (
              <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
            )}
          </div>
        </div>
        
        {/* Tercera fila - Dirección, Población, CP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-8">
            <label className="block text-primary-800 font-medium mb-1">Dirección</label>
            <input 
              type="text" 
              name="direccion" 
              value={company.direccion} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Población</label>
            <input 
              type="text" 
              name="poblacion" 
              value={company.poblacion} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
        </div>
        
        {/* Cuarta fila - CP, Ciudad, País */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Código Postal</label>
            <input 
              type="text" 
              name="codigo_postal" 
              value={company.codigo_postal} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
          <div className="lg:col-span-5">
            <label className="block text-primary-800 font-medium mb-1">Ciudad</label>
            <input 
              type="text" 
              name="ciudad" 
              value={company.ciudad} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
          </div>
          <div className="lg:col-span-4">
            <label className="block text-primary-800 font-medium mb-1">País</label>
            <input 
              type="text" 
              name="pais" 
              value={company.pais} 
              onChange={onChange} 
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
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
              type="number" 
              name="num_muestras" 
              value={company.num_muestras} 
              onChange={onChange} 
              min="1"
              className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors" 
            />
            <p className="text-xs text-gray-600 mt-1">Mínimo 1 muestra</p>
          </div>
        </div>
        
        {/* Resumen de precio */}
        <div className="text-center sm:text-right text-primary-700 font-semibold mt-4 p-4 bg-primary-50 rounded-lg">
          <div className="text-sm sm:text-base">
            {company.num_muestras} muestra/s ({precio.pagadas} pagada/s, {precio.gratis} gratis)
          </div>
          <div className="text-xl sm:text-2xl font-bold text-primary-800 mt-1">
            Total: {precio.total}€
          </div>
        </div>
        
        {/* Botón de continuar */}
        <div className="flex justify-center sm:justify-end pt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3 sm:py-2 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors text-lg sm:text-base"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}