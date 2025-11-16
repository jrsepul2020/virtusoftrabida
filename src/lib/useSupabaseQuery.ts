/**
 * Custom React Hooks for Supabase Queries
 * 
 * Estos hooks facilitan el uso de datos de Supabase en componentes React:
 * - Manejo automático de loading y errores
 * - Revalidación automática
 * - Type safety
 */

import { useState, useEffect } from 'react';
import type { Company, Sample, Catador } from './supabase';
import * as queries from './supabaseQueries';

// ============================================
// Hook genérico para queries
// ============================================

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// Hooks para Empresas
// ============================================

export function useCompanies() {
  return useQuery<Company[]>(queries.getAllCompanies);
}

export function useCompany(id: string) {
  return useQuery<Company>(
    () => queries.getCompanyById(id),
    [id]
  );
}

export function useMyCompany() {
  return useQuery<Company>(queries.getMyCompany);
}

export function useSearchCompanies(searchQuery: string) {
  return useQuery<Company[]>(
    () => queries.searchCompanies(searchQuery),
    [searchQuery]
  );
}

// ============================================
// Hooks para Muestras
// ============================================

export function useSamples() {
  return useQuery<Sample[]>(queries.getAllSamples);
}

export function useSample(id: string) {
  return useQuery<Sample>(
    () => queries.getSampleById(id),
    [id]
  );
}

export function useCompanySamples(companyId: string) {
  return useQuery<Sample[]>(
    () => queries.getSamplesByCompany(companyId),
    [companyId]
  );
}

export function useSamplesWithCompany() {
  return useQuery(queries.getSamplesWithCompany);
}

export function useSearchSamples(searchQuery: string) {
  return useQuery<Sample[]>(
    () => queries.searchSamples(searchQuery),
    [searchQuery]
  );
}

export function useSamplesByTanda(tanda: number) {
  return useQuery<Sample[]>(
    () => queries.getSamplesByTanda(tanda),
    [tanda]
  );
}

// ============================================
// Hooks para Catadores
// ============================================

export function useCatadores() {
  return useQuery<Catador[]>(queries.getAllCatadores);
}

export function useActiveCatadores() {
  return useQuery<Catador[]>(queries.getActiveCatadores);
}

// ============================================
// Hooks para Estadísticas
// ============================================

export function useGeneralStats() {
  return useQuery(queries.getGeneralStats);
}

export function useSamplesByCategory() {
  return useQuery(queries.getSamplesByCategory);
}

// ============================================
// Hook para autenticación
// ============================================

export function useAuth() {
  return useQuery(queries.getCurrentUser);
}
