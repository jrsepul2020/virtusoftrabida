import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface HeroLandingProps {
  onInscribirse: () => void;
}

export default function HeroLanding({ onInscribirse }: HeroLandingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen relative overflow-hidden bg-midnight-900">
      {/* Background Images - No filters as requested */}
      <div className="absolute inset-0 z-0">
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110"
          style={{
            backgroundImage: `url(/virtus.jpg)`,
            transform: isVisible ? "scale(1)" : "scale(1.1)",
          }}
        />
        <div
          className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(/virtus-movil.jpg)` }}
        />
        {/* Subtle overlay only for text legibility, minimal interference with background */}
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-1000" />
      </div>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-40 pb-32 md:pt-48 md:pb-40">
        {/* Main Title - Cormorant Garamond - Smaller size, Bold */}
        <div
          className={`mb-4 transition-all duration-1000 delay-300 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          } max-w-[95vw] w-full`}
        >
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-none font-display whitespace-nowrap">
            <span className="text-white drop-shadow-lg uppercase">
              INTERNATIONAL AWARDS VIRTUS
            </span>
          </h1>
        </div>

        {/* Location & Dates - Staggered - Reduced spacing */}
        <div
          className={`mb-4 transition-all duration-1000 delay-500 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          } max-w-7xl w-full`}
        >
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-light tracking-[0.2em] leading-tight uppercase font-body text-champagne-400 mb-1">
            LA RÁBIDA
          </h2>
          <div className="h-px w-16 bg-champagne-500/50 mx-auto mb-3" />
          <p className="text-sm xs:text-base sm:text-lg md:text-xl font-light text-white/90 font-body">
            25, 26 Y 27 DE ABRIL 2028
          </p>
        </div>

        {/* Subtitle - IBEROAMERICANO 2026 - BOLD, THICK, NON-ITALIC */}
        <div
          className={`mb-6 transition-all duration-1000 delay-700 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          } max-w-7xl w-full`}
        >
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black tracking-wider leading-tight uppercase text-white font-body selection:bg-champagne-500">
            IBEROAMERICANO 2026
          </h2>
        </div>

        {/* Improved CTA Button - Reduced spacing */}
        <div
          className={`mb-10 transition-all duration-1000 delay-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <button
            onClick={onInscribirse}
            className="group relative px-10 py-5 text-lg font-bold text-white overflow-hidden transition-all duration-500 transform hover:scale-105"
          >
            {/* Elegant Button Background - Red variation */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-shadow duration-500 group-hover:shadow-[0_0_35px_rgba(220,38,38,0.5)]"></div>

            {/* Button Content */}
            <span className="relative flex items-center gap-4 whitespace-nowrap font-body tracking-wider uppercase text-sm font-black">
              {t("hero.cta")}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Tagline - Subtle finish - Reduced spacing - NO BORDER, BOLD, TIGHT SPACING, WHITE */}
        <div
          className={`transition-all duration-1000 delay-[1200ms] transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          } max-w-2xl w-full px-4 pt-2`}
        >
          <h3 className="text-xs xs:text-sm md:text-base font-bold leading-relaxed text-white font-body tracking-tight uppercase">
            {t("hero.tagline.line1")}
          </h3>
        </div>
      </div>
    </div>
  );
}
