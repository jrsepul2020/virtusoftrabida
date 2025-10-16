import React from "react";
import { CompanyData } from "./types";

export function EmpresaScreen({
  company,
  onChange,
  onNext,
  precio,
}: {
  company: CompanyData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onNext: () => void;
  precio: { pagadas: number; gratis: number; total: number };
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-6 bg-primary-50">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-12 border border-primary-100">
        <h2 className="text-2xl font-bold text-primary-800 mb-6 text-center">Datos de la Empresa</h2>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <label className="block text-primary-800 font-medium mb-1">NIF</label>
            <input type="text" name="nif" value={company.nif} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-6">
            <label className="block text-primary-800 font-medium mb-1">Nombre de la Empresa</label>
            <input type="text" name="nombre_empresa" value={company.nombre_empresa} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Persona de Contacto</label>
            <input type="text" name="persona_contacto" value={company.persona_contacto} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Teléfono</label>
            <input type="text" name="telefono" value={company.telefono} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Móvil</label>
            <input type="text" name="movil" value={company.movil} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-6">
            <label className="block text-primary-800 font-medium mb-1">Email</label>
            <input type="email" name="email" value={company.email} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-8">
            <label className="block text-primary-800 font-medium mb-1">Dirección</label>
            <input type="text" name="direccion" value={company.direccion} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Población</label>
            <input type="text" name="poblacion" value={company.poblacion} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-3">
            <label className="block text-primary-800 font-medium mb-1">Código Postal</label>
            <input type="text" name="codigo_postal" value={company.codigo_postal} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-5">
            <label className="block text-primary-800 font-medium mb-1">Ciudad</label>
            <input type="text" name="ciudad" value={company.ciudad} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
          <div className="col-span-4">
            <label className="block text-primary-800 font-medium mb-1">País</label>
            <input type="text" name="pais" value={company.pais} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <label className="block text-primary-800 font-medium mb-1">¿A través de qué medio nos conoció?</label>
            <input type="text" name="medio_conocio" value={company.medio_conocio} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
         
          <div className="col-span-6">
            <label className="block text-primary-800 font-medium mb-1">Página Web</label>
            <input type="text" name="pagina_web" value={company.pagina_web} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-8">
            <label className="block text-primary-800 font-medium mb-1">Observaciones</label>
            <textarea name="observaciones" value={company.observaciones} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
           <div className="col-span-4">
            <label className="block text-primary-800 font-medium mb-1">Nº de muestras</label>
            <input type="number" name="num_muestras" min={1} value={company.num_muestras} onChange={onChange} className="w-full px-4 py-2 rounded-lg border border-primary-200" />
          </div>
        </div>
        <div className="text-right text-primary-700 font-semibold mt-2">
          {company.num_muestras} muestra/s ({precio.pagadas} pagada/s, {precio.gratis} gratis) - <span className="text-xl font-bold">Total: {precio.total}€</span>
        </div>
        <div className="flex justify-end pt-6">
          <button
            type="button"
            onClick={onNext}
            className="bg-primary-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}