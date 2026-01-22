import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface HeroLandingProps {
  onInscribirse: () => void;
}

export default function HeroLanding({ onInscribirse }: HeroLandingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Imagen de portada virtus-2026 - Desktop (oculta en móvil) */}
      <div 
        className="hidden md:block fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(/virtus.jpg)`
        }}
      >
      </div>

      {/* Imagen de portada virtus-2026 - Móvil (oculta en desktop) */}
      <div 
        className="md:hidden fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(/virtus-movil.jpg)`
        }}
      >
      </div>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-3 sm:px-6">
        {/* Título principal - responsive con Cormorant */}
        <div className={`mb-2 sm:mb-3 transition-all duration-1200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        } max-w-7xl w-full`}>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.1] px-2" 
              style={{ fontFamily: "'Cormorant', serif" }}>
              <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {t('hero.title')}
              </span>
          </h1>
        </div>

        {/* LA RÁBIDA con fechas */}
        <div className={`mb-1 sm:mb-2 transition-all duration-1200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        } max-w-7xl w-full`}>
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight uppercase px-2" 
              style={{ fontFamily: "'Lato', sans-serif" }}>
            <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              LA RÁBIDA
            </span>
          </h2>
          <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            25, 26 Y 27 DE ABRIL 2028
          </p>
        </div>

        {/* IBEROAMERICANO 2026 */}
        <div className={`mb-5 sm:mb-6 transition-all duration-1200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        } max-w-7xl w-full`}>
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight uppercase px-2" 
              style={{ fontFamily: "'Lato', sans-serif" }}>
            <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {t('hero.subtitle2')}
            </span>
          </h2>
        </div>

        {/* Botón de inscripción - ROJO DESTACADO */}
        <div className={`mb-4 sm:mb-6 transition-all duration-1200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}>
          <button
            onClick={onInscribirse}
            className="group relative px-6 xs:px-8 sm:px-10 md:px-12 py-3 sm:py-3.5 md:py-4 text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-500 transform hover:scale-105 shadow-2xl"
          >
            {/* Fondo rojo destacado del botón */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Contenido del botón */}
            <span className="relative flex items-center gap-2 sm:gap-3 whitespace-nowrap">
              {t('hero.cta')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Subtítulo con animación - responsive */}
        <div className={`transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        } max-w-4xl w-full px-3 sm:px-4`}>
          <h2 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-snug">
            <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{t('hero.tagline.line1')}</span>
          </h2>
        </div>
      </div>
    </div>
  );
}