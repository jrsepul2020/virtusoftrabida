import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getStoredFingerprint, getOrCreateFingerprint } from './deviceFingerprint';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize fingerprint asynchronously on module load
let fingerprintReady = false;
getOrCreateFingerprint().then(() => {
  fingerprintReady = true;
}).catch(console.error);

// Create client with custom fetch that adds fingerprint header
const customFetch: typeof fetch = async (input, init) => {
  // Get fingerprint (sync if already loaded, otherwise wait)
  let fingerprint = getStoredFingerprint();
  if (!fingerprint && !fingerprintReady) {
    fingerprint = await getOrCreateFingerprint();
  }

  // Add fingerprint header
  const headers = new Headers(init?.headers);
  if (fingerprint) {
    headers.set('x-device-fingerprint', fingerprint);
  }

  return fetch(input, { ...init, headers });
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
});

export type Company = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  telefono?: string;
  address?: string;
  contact_person?: string;
  status: 'pending' | 'approved' | 'rejected' | 'pagado';
  totalinscripciones: number;
  created_at: string;
  updated_at: string;
  nif?: string;
  codigo_postal?: string;
  postal?: string;
  poblacion?: string;
  ciudad?: string;
  city?: string;
  pais?: string;
  country?: string;
  observaciones?: string;
  movil?: string;
  conocimiento?: string;
  pagina_web?: string;
  user_id?: string;
  pedido?: number;
};

export type Sample = {
  id: string;
  codigo: number;
  nombre: string;
  categoria?: string;
  empresa?: string;
  empresa_id?: string;
  empresa_nombre?: string; // Nombre de la empresa (del JOIN con empresas)
  empresa_pedido?: number; // Pedido de la empresa (del JOIN con empresas)
  codigotexto?: string;
  codigobarras?: string; // Código de barras (visible en gestión muestras)
  origen?: string;
  igp?: string;
  pais?: string;
  azucar?: number;
  grado?: number;
  existencias?: number;
  anio?: number;
  tipouva?: string;
  tipoaceituna?: string;
  destilado?: string;
  fecha?: string;
  pedido?: string;
  manual?: boolean;
  creada: string;
  categoriaoiv?: string;
  categoriadecata?: string;
  created_at: string;
  tanda?: number;
  // Scoring fields (added 2025-11-30)
  puntuacion_total?: number;
  medalla?: string;
  num_puntuaciones?: number;
  catada?: boolean;
};

export type CompanyWithSamples = Company & {
  samples: Sample[];
};

export type Catador = {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  activo: boolean;
  created_at: string;
};

export type PuntuacionCatador = {
  id: string;
  muestra_id: number;
  catador_id: string;
  mesa_id?: number;
  puntuacion: number;
  notas?: string;
  created_at: string;
  updated_at: string;
};

export type MedalConfig = {
  id: number;
  medalla: string;
  puntuacion_minima: number;
  puntuacion_maxima: number;
  color_hex: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Device = {
  id: string;
  device_fingerprint: string;
  user_id?: string;
  tablet_number?: number;
  device_info?: Record<string, any>;
  nombre_asignado?: string;
  activo: boolean;
  first_registered_at: string;
  last_seen_at: string;
  created_at: string;
};

export type Usuario = {
  id: string;
  email: string;
  nombre?: string;
  rol: 'Administrador' | 'Presidente' | 'Supervisor' | 'Catador';
  mesa?: number;
  tandaencurso?: number;
  activo: boolean;
  created_at: string;
};
