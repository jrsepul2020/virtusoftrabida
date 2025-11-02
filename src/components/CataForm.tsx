import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CriterioScore = {
  [key: string]: number | null;
};

export default function CataForm() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [scores, setScores] = useState<CriterioScore>({
    vistaLimpidez: null,
    vistaColor: null,
    olfatoLimpidez: null,
    olfatoIntensidadPositiva: null,
    olfatoCalidad: null,
    saborLimpio: null,
    saborIntensidad: null,
    saborPersistenciaArmoniosa: null,
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
        w-14 h-11 rounded-lg font-bold text-base transition-all duration-150
        ${isSelected 
          ? 'bg-red-600 text-white shadow-lg scale-105' 
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
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 text-right font-medium text-gray-800 text-sm pr-2">{label}</div>
      <div className="w-16 h-11 border-2 border-gray-400 rounded-lg flex items-center justify-center bg-white">
        <span className="text-xl font-bold text-gray-800">{scores[criterio] ?? 0}</span>
      </div>
      {showArrow && (
        <div className="flex items-center mx-1">
          <svg width="50" height="12" viewBox="0 0 50 12" className="text-black">
            <line x1="0" y1="6" x2="42" y2="6" stroke="currentColor" strokeWidth="2.5"/>
            <polygon points="42,0 50,6 42,12" fill="currentColor"/>
          </svg>
        </div>
      )}
      <div className="flex gap-2">
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
      olfatoIntensidadPositiva: null,
      olfatoCalidad: null,
      saborLimpio: null,
      saborIntensidad: null,
      saborPersistenciaArmoniosa: null,
      saborCalidad: null,
      juicioGlobal: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con logo */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b-2 border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Vinos Tranquilos
          </h1>
          <div className="flex items-center gap-2">
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='75' font-size='80'%3E🏆%3C/text%3E%3C/svg%3E" 
              alt="Logo" 
              className="h-12 w-12"
            />
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">International Awards</div>
              <div className="text-lg font-bold text-amber-600">VIRTUS</div>
            </div>
          </div>
        </div>

        {/* Escala de calidad */}
        <div className="bg-gradient-to-r from-emerald-50 via-lime-50 to-red-50 px-6 py-2 flex justify-center gap-8 text-sm font-semibold border-b border-gray-200">
          <span className="text-emerald-600">Excelente</span>
          <span className="text-lime-600">Muy Bueno</span>
          <span className="text-yellow-600">Bueno</span>
          <span className="text-orange-600">Regular</span>
          <span className="text-red-600">Insuficiente</span>
        </div>

        <div className="flex relative">
          {/* Main Form Area */}
          <div className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'mr-0' : 'mr-0'}`}>
            {/* VISTA Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-300 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <h2 className="text-lg font-bold text-gray-800 uppercase w-32 pt-2">Vista</h2>
                <div className="flex-1 space-y-2">
                  <ScoreRow 
                    label="Limpidez" 
                    criterio="vistaLimpidez" 
                    valores={[5, 4, 3, 2, 1]}
                    showArrow={true}
                  />
                  <ScoreRow 
                    label="Color" 
                    criterio="vistaColor" 
                    valores={[10, 8, 6, 4, 2]}
                  />
                </div>
              </div>
            </div>

            {/* OLFATO Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <h2 className="text-lg font-bold text-gray-800 uppercase w-32 pt-2">Olfato / Olor</h2>
                <div className="flex-1 space-y-2">
                  <ScoreRow 
                    label="Limpidez" 
                    criterio="olfatoLimpidez" 
                    valores={[6, 5, 4, 3, 2]}
                  />
                  <ScoreRow 
                    label="Intensidad Positiva" 
                    criterio="olfatoIntensidadPositiva" 
                    valores={[8, 7, 6, 4, 2]}
                  />
                  <ScoreRow 
                    label="Calidad" 
                    criterio="olfatoCalidad" 
                    valores={[16, 14, 12, 10, 8]}
                  />
                </div>
              </div>
            </div>

            {/* SABOR Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-300 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <h2 className="text-lg font-bold text-gray-800 uppercase w-32 pt-2">Sabor</h2>
                <div className="flex-1 space-y-2">
                  <ScoreRow 
                    label="Limpio" 
                    criterio="saborLimpio" 
                    valores={[6, 5, 4, 3, 2]}
                  />
                  <ScoreRow 
                    label="Intensidad" 
                    criterio="saborIntensidad" 
                    valores={[8, 7, 6, 4, 2]}
                  />
                  <ScoreRow 
                    label="Persistencia Armoniosa" 
                    criterio="saborPersistenciaArmoniosa" 
                    valores={[8, 7, 6, 5, 4]}
                  />
                  <ScoreRow 
                    label="Calidad" 
                    criterio="saborCalidad" 
                    valores={[22, 19, 16, 13, 10]}
                  />
                </div>
              </div>
            </div>

            {/* JUICIO GLOBAL Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <h2 className="text-lg font-bold text-gray-800 uppercase w-32 pt-2">Juicio Global</h2>
                <div className="flex-1">
                  <ScoreRow 
                    label="" 
                    criterio="juicioGlobal" 
                    valores={[11, 10, 9, 8, 7]}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-base">
                Siguiente Vino
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-base flex items-center justify-center gap-2">
                <span>✕</span> Desechar Vino
              </button>
              <button 
                onClick={handleReset}
                className="px-8 bg-white hover:bg-gray-100 text-red-600 font-bold py-3 rounded-lg shadow-lg transition-all text-base border-2 border-red-600"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Sidebar Retráctil */}
          <div className={`relative transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-12'}`}>
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute left-0 top-4 bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-r-lg shadow-lg z-20 transition-all"
            >
              {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Sidebar Content */}
            <div className={`h-full bg-gradient-to-b from-gray-700 to-gray-800 border-l-2 border-gray-600 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              <div className="p-3 pt-16 space-y-1.5">
                {/* Código */}
                <div className="bg-gray-900 rounded-lg p-1.5 shadow-md border border-gray-600">
                  <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5 text-center">Código</div>
                  <div className="text-xl font-bold text-purple-400 text-center">3975</div>
                </div>

                {/* Puntos */}
                <div className="bg-gray-900 rounded-lg p-1.5 shadow-md border border-red-500">
                  <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5 text-center">Puntos</div>
                  <div className="text-3xl font-bold text-red-500 text-center">{calculateTotal()}</div>
                </div>

                {/* Orden */}
                <div className="bg-gray-900 rounded-lg p-1.5 shadow-md border border-gray-600">
                  <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5 text-center">Orden</div>
                  <div className="text-xl font-bold text-gray-100 text-center">1</div>
                </div>

                {/* Nº Catador */}
                <div className="bg-gray-900 rounded-lg p-1.5 shadow-md border border-gray-600">
                  <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5 text-center">Nº Catador</div>
                  <div className="text-xl font-bold text-gray-100 text-center">115</div>
                </div>

                {/* Tanda */}
                <div className="bg-gray-900 rounded-lg p-1.5 shadow-md border border-gray-600">
                  <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5 text-center">Tanda</div>
                  <div className="text-lg font-bold text-blue-400 text-center">Tanda13</div>
                </div>

                {/* Botón ENVIAR */}
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all text-sm mt-2">
                  ENVIAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}