import { useState, useEffect } from 'react';
import { Trophy, Award, Globe, Sparkles, Star, Crown, ArrowRight } from 'lucide-react';

interface HeroLandingProps {
  onInscribirse: () => void;
}

export default function HeroLanding({ onInscribirse }: HeroLandingProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#7A694E]/20 via-[#3C542E]/15 to-[#7A694E]/25">
      {/* Elementos decorativos animados - adaptados para mobile */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Formas geométricas inspiradas en cultura iberoamericana */}
        <div className="absolute top-20 left-4 sm:left-10 w-16 sm:w-32 h-16 sm:h-32 bg-gradient-to-br from-[#7A694E]/20 to-[#3C542E]/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 sm:top-60 right-4 sm:right-20 w-12 sm:w-24 h-12 sm:h-24 bg-gradient-to-br from-[#3C542E]/20 to-[#7A694E]/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 sm:bottom-40 left-4 sm:left-20 w-20 sm:w-40 h-20 sm:h-40 bg-gradient-to-br from-[#7A694E]/15 to-[#3C542E]/15 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-4 sm:right-10 w-14 sm:w-28 h-14 sm:h-28 bg-gradient-to-br from-[#3C542E]/20 to-[#7A694E]/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Patrones geométricos sutiles */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center min-h-screen text-center">
        {/* Logo pequeño */}
        <div className={`mb-6 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <img
            src="/logo-bandera-1.png"
            alt="International Virtus Awards"
            className="h-12 sm:h-16 w-auto mx-auto"
          />
        </div>

        {/* Iconos decorativos superiores */}
        <div className={`flex justify-center gap-4 sm:gap-6 mb-6 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="p-2 sm:p-3 bg-gradient-to-br from-[#7A694E] to-[#3C542E] rounded-full shadow-lg animate-pulse">
            <Trophy className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
          <div className="p-2 sm:p-3 bg-gradient-to-br from-[#3C542E] to-[#7A694E] rounded-full shadow-lg animate-pulse" style={{ animationDelay: '0.3s' }}>
            <Award className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
          <div className="p-2 sm:p-3 bg-gradient-to-br from-[#7A694E] to-[#3C542E] rounded-full shadow-lg animate-pulse" style={{ animationDelay: '0.6s' }}>
            <Crown className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
        </div>

        {/* Título principal con efecto espectacular - responsive */}
        <div className={`mb-6 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{ transitionDelay: '0.3s' }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-[#7A694E] via-[#3C542E] to-[#7A694E] bg-clip-text text-transparent animate-pulse">
              INTERNATIONAL
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#3C542E] via-[#7A694E] to-[#3C542E] bg-clip-text text-transparent animate-pulse" style={{ animationDelay: '0.5s' }}>
              VIRTUS AWARDS
            </span>
          </h1>
          
          {/* Elementos decorativos en el título */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 mt-3">
            <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-[#7A694E] to-[#3C542E] rounded-full animate-pulse"></div>
            <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-[#7A694E] animate-spin" style={{ animationDuration: '3s' }} />
            <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-[#3C542E] to-[#7A694E] rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Botón de inscripción debajo del título principal - ROJO DESTACADO */}
        <div className={`mb-6 transition-all duration-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{ transitionDelay: '0.6s' }}>
          <button
            onClick={onInscribirse}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white rounded-xl overflow-hidden transition-all duration-500 transform hover:scale-105 shadow-xl"
          >
            {/* Fondo rojo destacado del botón */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Efectos de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Contenido del botón */}
            <span className="relative flex items-center gap-2 sm:gap-3">
              ¡INSCRÍBETE AHORA!
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>

        {/* Subtítulo con animación - responsive */}
        <div className={`mb-6 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{ transitionDelay: '0.9s' }}>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight px-4">
            <span className="text-gray-700">CONCURSO INTERNACIONAL DE</span>
            <br />
            <span className="bg-gradient-to-r from-[#7A694E] to-[#3C542E] bg-clip-text text-transparent">
              VINOS, ESPIRITUOSOS
            </span>
            <span className="text-gray-700"> Y </span>
            <span className="bg-gradient-to-r from-[#3C542E] to-[#7A694E] bg-clip-text text-transparent">
              ACEITE VIRGEN EXTRA
            </span>
          </h2>
        </div>

        {/* Elementos temáticos iberoamericanos - responsive */}
        <div className={`flex flex-wrap justify-center items-center gap-3 sm:gap-6 mb-6 px-4 transition-all duration-1000 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} style={{ transitionDelay: '1.2s' }}>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 rounded-full shadow-lg backdrop-blur-sm">
            <Globe className="w-4 sm:w-5 h-4 sm:h-5 text-[#7A694E]" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Iberoamérica</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 rounded-full shadow-lg backdrop-blur-sm">
            <Star className="w-4 sm:w-5 h-4 sm:h-5 text-[#3C542E]" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Excelencia</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 rounded-full shadow-lg backdrop-blur-sm">
            <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-[#7A694E]" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Prestigio</span>
          </div>
        </div>

        {/* Texto adicional - responsive */}
        <div className={`px-4 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} style={{ transitionDelay: '1.5s' }}>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            🏆 Participa en el concurso más prestigioso de Iberoamérica
          </p>
        </div>

        {/* Elementos flotantes decorativos - adaptados para mobile */}
        <div className="hidden sm:block absolute top-20 left-1/4 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
          <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
        </div>
        <div className="hidden sm:block absolute top-32 right-1/3 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '4s' }}>
          <div className="w-2 h-2 bg-red-400 rounded-full shadow-lg"></div>
        </div>
        <div className="hidden sm:block absolute bottom-32 left-1/3 animate-bounce" style={{ animationDelay: '3s', animationDuration: '3.5s' }}>
          <div className="w-4 h-4 bg-orange-400 rounded-full shadow-lg"></div>
        </div>
      </div>
    </div>
  );
}