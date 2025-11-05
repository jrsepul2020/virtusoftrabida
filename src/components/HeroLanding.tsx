import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroLandingProps {
  onInscribirse: () => void;
}

export default function HeroLanding({ onInscribirse }: HeroLandingProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Imagen de portada virtus-2026 - Desktop (oculta en móvil) */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/virtus-2026-11.webp)`
        }}
      >
      </div>

      {/* Imagen de portada virtus-2026 - Móvil (oculta en desktop) */}
      <div 
        className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/virtus13.png)`
        }}
      >
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {/* Título principal EN UNA SOLA LÍNEA - responsive */}
        <div className={`mb-4 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight whitespace-nowrap">
            <span className="text-white drop-shadow-2xl">
              INTERNATIONAL VIRTUS AWARDS
            </span>
          </h1>
        </div>

        {/* Botón de inscripción debajo del título principal - ROJO DESTACADO */}
        <div className={`mb-4 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <button
            onClick={onInscribirse}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white rounded-xl overflow-hidden transition-all duration-500 transform hover:scale-105 shadow-xl"
          >
            {/* Fondo rojo destacado del botón */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Contenido del botón */}
            <span className="relative flex items-center gap-2 sm:gap-3">
              ¡INSCRÍBETE AHORA!
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Subtítulo con animación - responsive */}
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-tight px-4">
            <span className="text-white drop-shadow-lg">CONCURSO INTERNACIONAL DE</span>
            <br />
            <span className="text-yellow-300 drop-shadow-lg">
              VINOS, ESPIRITUOSOS
            </span>
            <span className="text-white drop-shadow-lg"> Y </span>
            <span className="text-yellow-300 drop-shadow-lg">
              ACEITE VIRGEN EXTRA
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}