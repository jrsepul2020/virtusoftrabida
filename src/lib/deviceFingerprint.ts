// Device fingerprinting removed — stub file preserved for compatibility.
export type DeviceInfo = Record<string, any>;

export function getDeviceInfo(): DeviceInfo {
  throw new Error('deviceFingerprint: feature removed');
}

export async function generateDeviceFingerprint(): Promise<string> {
  throw new Error('deviceFingerprint: feature removed');
}

export function storeFingerprint(_fingerprint: string): void {
  // no-op
}

export function getStoredFingerprint(): string | null {
  return null;
}

export async function getOrCreateFingerprint(): Promise<string> {
  throw new Error('deviceFingerprint: feature removed');
}
