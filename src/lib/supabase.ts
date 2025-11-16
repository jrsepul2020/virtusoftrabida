import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
