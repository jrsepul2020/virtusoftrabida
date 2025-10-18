import { useMemo, useState } from "react";

/**
 * Componente CataForm
 *
 * - Cada fila contiene varios botones con valores (por ejemplo 5,4,3,2,1 o 20,18,...).
 * - Al pulsar un botón se selecciona ese valor para la fila; el botón cambia de color.
 * - La puntuación total se calcula sumando los valores seleccionados.
 * - Botones: Reset (borra selecciones) y Siguiente Vino (llama al callback onNext con los resultados).
 *
 * Tailwind: el ejemplo usa clases de Tailwind. Si no lo usas, adapta las clases a CSS normal.
 */

type RowConfig = {
  id: string; // clave única para la fila
  label: string;
  values: number[]; // valores que muestra la fila (ordenados como quieras)
};

type CategoryConfig = {
  id: string;
  title: string;
  rows: RowConfig[];
};

type Results = Record<string, number | null>;

export default function CataForm({
  onNext,
  initial,
}: {
  onNext?: (results: Results, total: number) => void; // callback cuando pulsas "Siguiente Vino"
  initial?: Results; // valores iniciales opcionales
}) {
  // Define las categorías y filas (adáptalas a tu formulario real)
  const categories: CategoryConfig[] = [
    {
      id: "vista",
      title: "Vista",
      rows: [
        { id: "vista_limpidez", label: "Limpidez", values: [5, 4, 3, 2, 1] },
        { id: "vista_color", label: "Color", values: [5, 4, 3, 2, 1] },
      ],
    },
    {
      id: "olfato",
      title: "Olfato / Olor",
      rows: [
        { id: "olfato_limpidez", label: "Limpidez", values: [5, 4, 3, 2, 1] },
        { id: "olfato_intensidad", label: "Intensidad", values: [5, 4, 3, 2, 1] },
        { id: "olfato_calidad", label: "Calidad", values: [5, 4, 3, 2, 1] },
      ],
    },
    {
      id: "sabor",
      title: "Sabor",
      rows: [
        { id: "sabor_limpio", label: "Limpio", values: [5, 4, 3, 2, 1] },
        { id: "sabor_intensidad", label: "Intensidad", values: [5, 4, 3, 2, 1] },
        { id: "sabor_persistencia", label: "Persistencia", values: [5, 4, 3, 2, 1] },
        { id: "sabor_calidad", label: "Calidad", values: [5, 4, 3, 2, 1] },
      ],
    },
    {
      id: "global",
      title: "Juicio Global",
      rows: [
        { id: "valoracion_global", label: "Valoración Global", values: [20, 18, 14, 10, 6] },
      ],
    },
  ];

  // inicializa estado con nulls
  const initialState: Results = useMemo(() => {
    const out: Results = {};
    categories.forEach((cat) => cat.rows.forEach((r) => (out[r.id] = null)));
    if (initial) {
      Object.keys(initial).forEach((k) => {
        if (k in out) out[k] = initial[k];
      });
    }
    return out;
  }, [initial, categories]);

  const [results, setResults] = useState<Results>(initialState);

  // <-- FIX: explícitamente pide que el reduce devuelva un number para evitar problemas de inferencia -->
  const total = useMemo(() => {
    return Object.values(results).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  }, [results]);

  const handleSelect = (rowId: string, value: number) => {
    setResults((prev: Results) => {
      const current = prev[rowId];
      // Si pulsas mismo valor, se deselecciona (opcional). Si no quieres esto elimina la condición.
      const nextValue: number | null = current === value ? null : value;
      return { ...prev, [rowId]: nextValue };
    });
  };

  const handleReset = () => {
    const cleared: Results = {};
    Object.keys(results).forEach((k) => (cleared[k] = null));
    setResults(cleared);
  };

  const handleNext = () => {
    if (onNext) onNext(results, total);
    // por defecto resetea para siguiente vino
    handleReset();
  };

  return (
    <div className="cata-container w-full h-screen flex flex-col p-2 md:p-3 lg:p-4 max-w-none mx-auto bg-gray-50">
      {/* Header compacto */}
      <header className="cata-footer flex items-center justify-between mb-2 md:mb-3 bg-white rounded-lg px-3 py-2 shadow-sm">
        <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-800">Cata de Vinos</h2>
        <div className="bg-rose-900 text-white rounded-full w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center font-bold text-sm md:text-base">
          {total}
        </div>
      </header>

      {/* Contenido principal optimizado para 1000x600 */}
      <div className="flex-1 overflow-hidden min-h-0">
        {/* Grid responsive: 2 columnas en tablet horizontal, 4 en desktop */}
        <div className="cata-grid h-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3">
          {categories.map((cat) => (
            <section key={cat.id} className="cata-section bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="cata-header px-2 py-1.5 md:px-3 md:py-2 border-b bg-gradient-to-r from-gray-50 to-gray-100 font-medium text-xs md:text-sm lg:text-base text-center text-gray-700">
                {cat.title}
              </div>
              <div className="cata-content flex-1 p-1.5 md:p-2 lg:p-3 overflow-y-auto">
                <div className="space-y-1.5 md:space-y-2">
                  {cat.rows.map((row) => (
                    <div key={row.id} className="cata-row space-y-1 md:space-y-1.5">
                      <div className="cata-label text-xs md:text-sm font-medium text-center text-gray-600 leading-tight">
                        {row.label}
                      </div>
                      <div className="flex gap-1 md:gap-1.5 justify-center flex-wrap">
                        {row.values.map((v, idx) => {
                          const selected = results[row.id] === v;
                          return (
                            <button
                              key={`${row.id}-${idx}-${v}`}
                              type="button"
                              onClick={() => handleSelect(row.id, v)}
                              aria-pressed={selected}
                              className={
                                "cata-button w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-md md:rounded-lg flex items-center justify-center text-xs md:text-sm font-semibold shadow-sm transition-all duration-200 " +
                                (selected
                                  ? "bg-rose-900 text-white scale-105 shadow-md"
                                  : "bg-white text-rose-900 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:scale-105")
                              }
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Footer compacto y fijo */}
      <footer className="cata-footer mt-2 md:mt-3 flex items-center justify-between border-t pt-2 md:pt-3 bg-white rounded-lg px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={handleNext}
          className="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 rounded-full font-semibold shadow text-xs md:text-sm lg:text-base hover:bg-red-700 transition-colors"
        >
          Siguiente Vino
        </button>

        <div className="flex items-center gap-2 md:gap-3 lg:gap-6">
          <button 
            type="button" 
            onClick={handleReset} 
            className="text-red-600 underline text-xs md:text-sm lg:text-base hover:text-red-700 transition-colors"
          >
            Reset
          </button>
          <div className="text-xs md:text-sm text-gray-600">
            Total: <span className="font-bold text-sm md:text-base lg:text-lg text-gray-800">{total}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}