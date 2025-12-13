/**
 * Sistema de identificación de dispositivos para control de acceso
 */

/**
 * Información detallada del dispositivo para mostrar al admin
 */
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screen: string;
  timezone: string;
  browser: string;
  os: string;
}

/**
 * Obtiene información completa del dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browser: getBrowserName(),
    os: getOSName(),
  };
}

/**
 * Detecta el nombre del navegador
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Desconocido';
}

/**
 * Detecta el sistema operativo
 */
function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Desconocido';
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
 * Genera un ID único para el dispositivo actual
 * Combina características del navegador con un componente aleatorio persistente
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    // Intentar recuperar ID existente de localStorage
    const stored = getStoredFingerprint();
    if (stored) return stored;

    const info = getDeviceInfo();
    
    // Combinar características del dispositivo con timestamp y random
    const fingerprintData = [
      info.userAgent,
      info.platform,
      info.screen,
      info.timezone,
      info.language,
      Date.now().toString(),
      Math.random().toString()
    ].join('|');
    
    // Generar hash
    const fingerprint = await simpleHash(fingerprintData);
    const deviceId = `dev_${fingerprint.substring(0, 16)}`;
    
    // Guardar en localStorage
    storeFingerprint(deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Error generando device ID:', error);
    // Fallback: usar timestamp + random
    const fallback = `dev_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
    storeFingerprint(fallback);
    return fallback;
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
