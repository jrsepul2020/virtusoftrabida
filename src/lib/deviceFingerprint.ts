/**
 * Device Fingerprint Utility
 * Generates stable device fingerprints using browser APIs and SHA-256 hashing
 */

const STORAGE_KEY = 'virtus_device_fingerprint';

export type DeviceInfo = Record<string, any>;

/**
 * Generates a SHA-256 hash of the input string
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Collects device characteristics for fingerprinting
 */
export function getDeviceInfo(): DeviceInfo {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
  };

  return info;
}

/**
 * Generates a device fingerprint string from collected info
 */
function generateFingerprintString(info: DeviceInfo): string {
  return [
    info.userAgent,
    info.platform,
    `${info.screenWidth}x${info.screenHeight}x${info.screenDepth}`,
    info.timezone,
    info.language,
    info.hardwareConcurrency,
  ].join('|');
}

/**
 * Generates a device fingerprint hash
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const deviceInfo = getDeviceInfo();
  const fingerprintString = generateFingerprintString(deviceInfo);
  return await sha256(fingerprintString);
}

/**
 * Stores fingerprint in localStorage
 */
export function storeFingerprint(fingerprint: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
  } catch (e) {
    console.error('Failed to store fingerprint:', e);
  }
}

/**
 * Gets stored fingerprint from localStorage
 */
export function getStoredFingerprint(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Gets or creates the device fingerprint
 * Returns the fingerprint hash
 */
export async function getOrCreateFingerprint(): Promise<string> {
  const stored = getStoredFingerprint();
  
  if (stored) {
    return stored;
  }

  const fingerprint = await generateDeviceFingerprint();
  storeFingerprint(fingerprint);
  return fingerprint;
}

/**
 * Clears the stored fingerprint
 */
export function clearDeviceFingerprint(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear fingerprint:', e);
  }
}

/**
 * Validates if the current device matches the stored fingerprint
 */
export async function validateDeviceFingerprint(): Promise<boolean> {
  const stored = getStoredFingerprint();
  if (!stored) return false;

  try {
    const current = await generateDeviceFingerprint();
    return stored === current;
  } catch (e) {
    return false;
  }
}
