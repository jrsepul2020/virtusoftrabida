import { useState } from 'react';

type CriterioScore = {
  [key: string]: number | null;
};

export default function CataForm() {
  const [scores, setScores] = useState<CriterioScore>({
    vistaLimpidez: null,
    vistaColor: null,
    olfatoLimpidez: null,
    olfatoIntensidad: null,
    olfatoCalidad: null,
    saborLimpio: null,
    saborIntensidad: null,
    saborPersistencia: null,
    saborCalidad: null,
    juicioGlobal: null,
  });

  const handleScoreClick = (criterio: string, valor: number) => {
    setScores(prev => ({
      ...prev,
      [criterio]: prev[criterio] === valor ? null : valor
    }));
  };

  const ScoreButton = ({ value, isSelected, onClick }: { value: number; isSelected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`
        w-9 h-7 rounded font-bold text-xs transition-all duration-150
        ${isSelected 
          ? 'bg-red-600 text-white shadow-md' 
          : 'bg-black text-white hover:bg-gray-800'
        }
      `}
    >
      {value}
    </button>
  );

  const ScoreRow = ({ 
    label, 
    criterio, 
    valores, 
    showArrow 
  }: { 
    label: string; 
    criterio: string; 
    valores: number[]; 
    showArrow?: boolean;
  }) => (
    <div className="flex items-center gap-1 py-0.5">
      <div className="w-20 text-right font-medium text-gray-700 text-[10px]">{label}</div>
      <div className="w-9 h-7 border-2 border-gray-300 rounded flex items-center justify-center bg-white">
        <span className="text-sm font-bold text-gray-800">{scores[criterio] ?? 0}</span>
      </div>
      {showArrow && (
        <div className="flex items-center mx-0.5">
          <svg width="30" height="8" viewBox="0 0 30 8" className="text-black">
            <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth="2"/>
            <polygon points="24,0 30,4 24,8" fill="currentColor"/>
          </svg>
        </div>
      )}
      <div className="flex gap-0.5">
        {valores.map((valor) => (
          <ScoreButton 
            key={valor}
            value={valor} 
            isSelected={scores[criterio] === valor}
            onClick={() => handleScoreClick(criterio, valor)}
          />
        ))}
      </div>
    </div>
  );

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum: number, val) => sum + (val ?? 0), 0);
  };

  const handleReset = () => {
    setScores({
      vistaLimpidez: null,
      vistaColor: null,
      olfatoLimpidez: null,
      olfatoIntensidad: null,
      olfatoCalidad: null,
      saborLimpio: null,
      saborIntensidad: null,
      saborPersistencia: null,
      saborCalidad: null,
      juicioGlobal: null,
    });
  };

  return (
    <div className="h-[600px] w-[1200px] bg-gradient-to-br from-gray-50 to-gray-100 p-2 overflow-hidden">
      <div className="h-full w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-3 py-1.5">
          <h1 className="text-base font-bold text-white text-center">
            FICHA DE CATA
          </h1>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Form Area - Left 2/3 */}
          <div className="flex-1 p-2 overflow-y-auto">
            {/* VISTA Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-1.5 border border-yellow-300 mb-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-[11px] font-bold text-gray-800 uppercase w-20">Vista</h2>
                <div className="flex-1">
                  <ScoreRow 
                    label="Limpidez" 
                    criterio="vistaLimpidez" 
                    valores={[5, 4, 3, 2, 1]}
                    showArrow={true}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Color" 
                    criterio="vistaColor" 
                    valores={[10, 8, 6, 4, 2]}
                  />
                </div>
              </div>
            </div>

            {/* OLFATO Section */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-1.5 border border-purple-300 mb-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-[11px] font-bold text-gray-800 uppercase w-20">Olfato</h2>
                <div className="flex-1">
                  <ScoreRow 
                    label="Limpidez" 
                    criterio="olfatoLimpidez" 
                    valores={[6, 5, 4, 3, 2]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Intensidad" 
                    criterio="olfatoIntensidad" 
                    valores={[8, 7, 6, 4, 2]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Calidad" 
                    criterio="olfatoCalidad" 
                    valores={[16, 14, 12, 10, 8]}
                  />
                </div>
              </div>
            </div>

            {/* SABOR Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-1.5 border border-yellow-300 mb-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-[11px] font-bold text-gray-800 uppercase w-20">Sabor</h2>
                <div className="flex-1">
                  <ScoreRow 
                    label="Limpio" 
                    criterio="saborLimpio" 
                    valores={[6, 5, 4, 3, 2]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Intensidad" 
                    criterio="saborIntensidad" 
                    valores={[8, 7, 6, 4, 2]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Persistencia" 
                    criterio="saborPersistencia" 
                    valores={[8, 7, 6, 5, 4]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20"></div>
                <div className="flex-1">
                  <ScoreRow 
                    label="Calidad" 
                    criterio="saborCalidad" 
                    valores={[22, 19, 16, 13, 10]}
                  />
                </div>
              </div>
            </div>

            {/* JUICIO GLOBAL Section */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-1.5 border border-gray-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[11px] font-bold text-gray-800 uppercase w-20">Juicio Global</h2>
                <div className="flex-1">
                  <ScoreRow 
                    label="Valoración" 
                    criterio="juicioGlobal" 
                    valores={[11, 10, 9, 8, 7]}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5 mt-1.5">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded shadow-md transition-all text-xs">
                Siguiente Vino
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded shadow-md transition-all text-xs">
                Desechar Vino
              </button>
              <button 
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded shadow-md transition-all text-xs"
              >
                Reset
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded shadow-md transition-all text-xs">
                ENVIAR
              </button>
            </div>
          </div>

          {/* Info Sidebar - Right 1/3 */}
          <div className="w-44 bg-gradient-to-b from-gray-50 to-gray-100 border-l-4 border-purple-600 p-2 space-y-1.5">
            {/* Código */}
            <div className="bg-white rounded-lg p-1.5 shadow-md border-2 border-gray-300">
              <div className="text-[9px] text-gray-600 uppercase font-semibold mb-0.5">Código</div>
              <div className="text-xl font-bold text-purple-700">3975</div>
            </div>

            {/* Puntos */}
            <div className="bg-white rounded-lg p-1.5 shadow-md border-2 border-red-300">
              <div className="text-[9px] text-gray-600 uppercase font-semibold mb-0.5">Puntos</div>
              <div className="text-3xl font-bold text-red-600">{calculateTotal()}</div>
            </div>

            {/* Orden */}
            <div className="bg-white rounded-lg p-1.5 shadow-md border-2 border-gray-300">
              <div className="text-[9px] text-gray-600 uppercase font-semibold mb-0.5">Orden</div>
              <div className="text-xl font-bold text-gray-800">1</div>
            </div>

            {/* Nº Catador */}
            <div className="bg-white rounded-lg p-1.5 shadow-md border-2 border-gray-300">
              <div className="text-[9px] text-gray-600 uppercase font-semibold mb-0.5">Nº Catador</div>
              <div className="text-xl font-bold text-gray-800">115</div>
            </div>

            {/* Tanda */}
            <div className="bg-white rounded-lg p-1.5 shadow-md border-2 border-blue-300">
              <div className="text-[9px] text-gray-600 uppercase font-semibold mb-0.5">Tanda</div>
              <div className="text-xl font-bold text-blue-700">Tanda13</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}