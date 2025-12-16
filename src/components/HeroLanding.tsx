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

      <div className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-4">
        {/* Título principal - responsive con Cormorant */}
        <div className={`mb-12 -mt-10 md:-mt-20 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} max-w-7xl`}>
            <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-5xl font-black tracking-tight leading-tight" style={{ fontFamily: "'Cormorant', serif" }}>
              <span className="text-white drop-shadow-3xl">
                {t('hero.title')}
              </span>
            </h1>
        </div>

          {/* Eliminado 'LA RABIDA 2026' (subtitle1). Ahora mostramos y destacamos 'IBEROAMERICANO 2026' */}
          <div className={`mb-8 -mt-6 md:-mt-10 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} max-w-7xl`}>
             <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-4xl font-extrabold tracking-tight leading-tight mt-2 uppercase" style={{ fontFamily: "'Lato', serif" }}>
              <span className="text-white drop-shadow-3xl">
                {t('hero.subtitle2')} 2026
              </span>
            </h2>
          </div>

        {/* Botón de inscripción debajo del título principal - ROJO DESTACADO */}
        <div className={`mb-4 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <button
            onClick={onInscribirse}
            className="group relative px-7 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-bold text-white rounded-xl overflow-hidden transition-all duration-500 transform hover:scale-105 shadow-2xl animate-float"
          >
            {/* Fondo rojo destacado del botón con mayor contraste */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-800 to-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Contenido del botón */}
            <span className="relative flex items-center gap-2 sm:gap-3">
              {t('hero.cta')}
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Subtítulo con animación - responsive */}
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-tight px-4">
            <span className="text-white drop-shadow-lg">{t('hero.tagline.line1')}</span>
            <br />
            <span className="text-white drop-shadow-lg">
              {t('hero.tagline.line2')}
            </span>
            <span className="text-white drop-shadow-lg"> {t('hero.tagline.line3')} </span>
            <span className="text-white drop-shadow-lg">
              {t('hero.tagline.line4')}
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}