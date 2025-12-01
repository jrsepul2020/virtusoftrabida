/**
 * Supabase Query Helpers
 * 
 * Centraliza todas las consultas a Supabase para:
 * - Mejor mantenibilidad
 * - Reutilización de código
 * - Manejo consistente de errores
 * - Type safety
 */

import { supabase } from './supabase';
import type { Company, Sample, Catador } from './supabase';

// Re-exportar supabase para uso directo
export { supabase };

// ============================================
// EMPRESAS (Companies) Queries
// ============================================

/**
 * Obtener todas las empresas
 */
export async function getAllCompanies() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Company[];
}

/**
 * Obtener empresa por ID
 */
export async function getCompanyById(id: string) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Company;
}

/**
 * Obtener empresa del usuario autenticado
 */
export async function getMyCompany() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as Company;
}

/**
 * Crear nueva empresa
 */
export async function createCompany(company: Partial<Company>) {
  const { data, error } = await supabase
    .from('empresas')
    .insert(company)
    .select()
    .single();

  if (error) throw error;
  return data as Company;
}

/**
 * Actualizar empresa
 */
export async function updateCompany(id: string, updates: Partial<Company>) {
  const { data, error } = await supabase
    .from('empresas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Company;
}

/**
 * Eliminar empresa
 */
export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Buscar empresas por nombre o email
 */
export async function searchCompanies(query: string) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Company[];
}

// ============================================
// MUESTRAS (Samples) Queries
// ============================================

/**
 * Obtener todas las muestras
 */
export async function getAllSamples() {
  const { data, error } = await supabase
    .from('muestras')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sample[];
}

/**
 * Obtener muestra por ID
 */
export async function getSampleById(id: string) {
  const { data, error } = await supabase
    .from('muestras')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Sample;
}

/**
 * Obtener muestras de una empresa
 */
export async function getSamplesByCompany(companyId: string) {
  const { data, error } = await supabase
    .from('muestras')
    .select('*')
    .eq('empresa_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sample[];
}

/**
 * Obtener muestras con información de empresa
 */
export async function getSamplesWithCompany() {
  const { data, error } = await supabase
    .from('muestras')
    .select(`
      *,
      empresas (
        id,
        name,
        email,
        pedido
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Crear nueva muestra
 */
export async function createSample(sample: Partial<Sample>) {
  const { data, error } = await supabase
    .from('muestras')
    .insert(sample)
    .select()
    .single();

  if (error) throw error;
  return data as Sample;
}

/**
 * Actualizar muestra
 */
export async function updateSample(id: string, updates: Partial<Sample>) {
  const { data, error } = await supabase
    .from('muestras')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Sample;
}

/**
 * Eliminar muestra
 */
export async function deleteSample(id: string) {
  const { error } = await supabase
    .from('muestras')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Buscar muestras por nombre o código
 */
export async function searchSamples(query: string) {
  const { data, error } = await supabase
    .from('muestras')
    .select('*')
    .or(`nombre.ilike.%${query}%,codigotexto.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sample[];
}

/**
 * Obtener muestras por tanda
 */
export async function getSamplesByTanda(tanda: number) {
  const { data, error } = await supabase
    .from('muestras')
    .select('*')
    .eq('tanda', tanda)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sample[];
}

// ============================================
// CATADORES (Tasters) Queries
// ============================================

/**
 * Obtener todos los catadores
 */
export async function getAllCatadores() {
  const { data, error } = await supabase
    .from('catadores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Catador[];
}

/**
 * Obtener catadores activos
 */
export async function getActiveCatadores() {
  const { data, error } = await supabase
    .from('catadores')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Catador[];
}

/**
 * Crear nuevo catador
 */
export async function createCatador(catador: Partial<Catador>) {
  const { data, error } = await supabase
    .from('catadores')
    .insert(catador)
    .select()
    .single();

  if (error) throw error;
  return data as Catador;
}

/**
 * Actualizar catador
 */
export async function updateCatador(id: string, updates: Partial<Catador>) {
  const { data, error } = await supabase
    .from('catadores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Catador;
}

// ============================================
// ESTADÍSTICAS (Statistics) Queries
// ============================================

/**
 * Obtener estadísticas generales
 */
export async function getGeneralStats() {
  const [companies, samples, catadores] = await Promise.all([
    supabase.from('empresas').select('id', { count: 'exact', head: true }),
    supabase.from('muestras').select('id', { count: 'exact', head: true }),
    supabase.from('catadores').select('id', { count: 'exact', head: true })
  ]);

  return {
    totalCompanies: companies.count || 0,
    totalSamples: samples.count || 0,
    totalCatadores: catadores.count || 0
  };
}

/**
 * Obtener muestras por categoría
 */
export async function getSamplesByCategory() {
  const { data, error } = await supabase
    .from('muestras')
    .select('categoria')
    .not('categoria', 'is', null);

  if (error) throw error;

  // Agrupar por categoría
  const counts = data.reduce((acc: Record<string, number>, sample) => {
    const cat = sample.categoria || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([categoria, count]) => ({
    categoria,
    count
  }));
}

// ============================================
// AUTENTICACIÓN (Authentication) Helpers
// ============================================

/**
 * Obtener usuario actual
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated() {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
