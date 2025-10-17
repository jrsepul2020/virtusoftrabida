import React, { useState } from "react";

export interface CataResults {
  vista: number;
  olfato: number;
  gusto: number;
  observaciones: string;
}

interface CataFormProps {
  onNext: (results: CataResults, total: number) => void;
}

export default function CataForm({ onNext }: CataFormProps) {
  const [vistaPuntuacion, setVistaPuntuacion] = useState("");
  const [olfatoPuntuacion, setOlfatoPuntuacion] = useState("");
  const [gustoPuntuacion, setGustoPuntuacion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vista = parseFloat(vistaPuntuacion) || 0;
    const olfato = parseFloat(olfatoPuntuacion) || 0;
    const gusto = parseFloat(gustoPuntuacion) || 0;
    const total = vista + olfato + gusto;

    const results: CataResults = {
      vista,
      olfato,
      gusto,
      observaciones,
    };

    onNext(results, total);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-primary-800 mb-6 text-center">
            Formulario de Cata
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-primary-700 font-semibold mb-2">
                Vista (0-20 puntos)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={vistaPuntuacion}
                onChange={(e) => setVistaPuntuacion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                required
              />
            </div>

            <div>
              <label className="block text-primary-700 font-semibold mb-2">
                Olfato (0-30 puntos)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={olfatoPuntuacion}
                onChange={(e) => setOlfatoPuntuacion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                required
              />
            </div>

            <div>
              <label className="block text-primary-700 font-semibold mb-2">
                Gusto (0-50 puntos)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={gustoPuntuacion}
                onChange={(e) => setGustoPuntuacion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                required
              />
            </div>

            <div>
              <label className="block text-primary-700 font-semibold mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="Notas adicionales sobre la cata..."
              />
            </div>

            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <p className="text-primary-700 font-semibold">
                Puntuación Total: {
                  (parseFloat(vistaPuntuacion) || 0) +
                  (parseFloat(olfatoPuntuacion) || 0) +
                  (parseFloat(gustoPuntuacion) || 0)
                } / 100
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-700 text-white font-semibold py-3 rounded-lg shadow hover:bg-primary-800 transition-colors"
            >
              Enviar Cata
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
