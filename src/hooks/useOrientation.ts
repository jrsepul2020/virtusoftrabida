import { useEffect, useState } from 'react';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // Verificar orientación guardada
    const checkOrientation = () => {
      const savedOrientation = localStorage.getItem('app-orientation');
      const hasLandscapeClass = document.body.classList.contains('force-landscape');
      setIsLandscape(savedOrientation === 'landscape' || hasLandscapeClass);
    };

    checkOrientation();

    // Observar cambios en el body class
    const observer = new MutationObserver(checkOrientation);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isLandscape;
}
