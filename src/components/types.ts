export type CompanyData = {
  nif: string;
  nombre_empresa: string;
  persona_contacto: string;
  telefono: string;
  movil: string;
  email: string;
  direccion: string;
  poblacion: string;
  codigo_postal: string;
  ciudad: string;
  pais: string;
  medio_conocio: string;
  pagina_web: string;
  observaciones: string;
  num_muestras: number;
};

export type SampleData = {
  nombre_muestra: string;
  categoria: string;
  origen: string;
  igp: string;
  pais: string;
  azucar: string;
  grado_alcoholico: string;
  existencias: string;
  anio: string;
  tipo_uva: string;
  tipo_aceituna: string;
  destilado: string;
};

export type PaymentMethod = 'transferencia' | 'paypal';