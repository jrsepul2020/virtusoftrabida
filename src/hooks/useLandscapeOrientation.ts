/**
 * Hook para forzar orientación horizontal en tablets
 *
 * Este hook detecta si el dispositivo es una tablet y fuerza
 * la orientación horizontal (landscape) automáticamente.
 */

import { useEffect, useState } from "react";

export function useLandscapeOrientation() {
  useEffect(() => {
    // Detectar si es tablet
    const isTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTabletUA = /ipad|android(?!.*mobile)|tablet|kindle|silk/.test(
        userAgent,
      );

      // También verificar por tamaño de pantalla
      const isTabletSize =
        window.innerWidth >= 768 && window.innerWidth <= 1024;

      return isTabletUA || isTabletSize;
    };

    if (!isTablet()) {
      console.log("📱 No es tablet, no se fuerza orientación");
      return;
    }

    console.log("📱 Tablet detectada, forzando orientación horizontal");

    // Intentar bloquear orientación con Screen Orientation API
    const lockOrientation = async () => {
      try {
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock("landscape");
          console.log("✅ Orientación bloqueada en landscape");
        } else {
          console.warn("⚠️ Screen Orientation API no disponible");
        }
      } catch (error) {
        console.warn("⚠️ No se pudo bloquear orientación:", error);
      }
    };

    // Ejecutar bloqueo
    lockOrientation();

    // Añadir meta tag para sugerir orientación
    const addOrientationMeta = () => {
      let meta = document.querySelector('meta[name="screen-orientation"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "screen-orientation");
        meta.setAttribute("content", "landscape");
        document.head.appendChild(meta);
      }
    };

    addOrientationMeta();

    // Cleanup: desbloquear al desmontar
    return () => {
      try {
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock();
          console.log("🔓 Orientación desbloqueada");
        }
      } catch (error) {
        // Silently fail
      }
    };
  }, []);
}

/**
 * Hook para detectar orientación actual
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation =
        window.innerWidth > window.innerHeight ? "landscape" : "portrait";
      setOrientation(newOrientation);
      console.log(`📱 Orientación cambiada a: ${newOrientation}`);
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return orientation;
}
