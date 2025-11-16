/**
 * Genera una huella digital única del dispositivo basada en características del navegador
 */

interface DeviceInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  touchSupport: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
}

/**
 * Recopila información del dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: 'ontouchstart' in window,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,
  };
}

/**
 * Genera un hash simple de una cadena
 */
async function simpleHash(str: string): Promise<string> {
  try {
    // Verificar si crypto.subtle está disponible
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('crypto.subtle no disponible, usando hash simple');
      // Fallback: hash simple basado en código
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generando hash:', error);
    // Fallback en caso de error
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Genera la huella digital del dispositivo
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const info = getDeviceInfo();
    
    // Combinar características importantes
    const fingerprintData = [
      info.userAgent,
      info.platform,
      info.screenResolution,
      info.colorDepth,
      info.timezone,
      info.hardwareConcurrency,
    ].join('|');
    
    console.log('Generando fingerprint con datos:', fingerprintData.substring(0, 50) + '...');
    
    // Generar hash
    const fingerprint = await simpleHash(fingerprintData);
    
    console.log('Fingerprint generado:', fingerprint.substring(0, 10) + '...');
    
    return fingerprint;
  } catch (error) {
    console.error('Error generando fingerprint:', error);
    // Fallback: usar timestamp + random
    return Date.now().toString(16) + Math.random().toString(16).substring(2);
  }
}

/**
 * Almacena la huella digital en localStorage como respaldo
 */
export function storeFingerprint(fingerprint: string): void {
  localStorage.setItem('device_fingerprint', fingerprint);
}

/**
 * Recupera la huella digital almacenada (si existe)
 */
export function getStoredFingerprint(): string | null {
  return localStorage.getItem('device_fingerprint');
}

/**
 * Obtiene o genera la huella digital del dispositivo
 */
export async function getOrCreateFingerprint(): Promise<string> {
  // Primero intentar recuperar del localStorage
  let fingerprint = getStoredFingerprint();
  
  if (!fingerprint) {
    // Si no existe, generar nueva
    fingerprint = await generateDeviceFingerprint();
    storeFingerprint(fingerprint);
  }
  
  return fingerprint;
}
