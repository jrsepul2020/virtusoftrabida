/**
 * Configuración de React Query y hooks de cache
 */
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import React from 'react';

// Crear cliente de Query con configuración optimizada
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (antes cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Provider para React Query
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============== HOOKS DE CACHE ==============

type QueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
};

/**
 * Hook para obtener empresas con cache
 */
export function useEmpresas(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nombre_empresa', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    ...options,
  });
}

/**
 * Hook para obtener muestras con cache
 */
export function useMuestras(empresaId?: string, options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['muestras', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('muestras')
        .select('*, empresas(nombre_empresa)')
        .order('created_at', { ascending: false });
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    ...options,
  });
}

/**
 * Hook para obtener categorías con cache
 */
export function useCategorias(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categoriasdecata')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    ...options,
  });
}

/**
 * Hook para obtener usuarios/catadores con cache
 */
export function useUsuarios(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    ...options,
  });
}

/**
 * Hook para obtener configuración con cache
 */
export function useConfiguracion(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*');
      
      if (error) throw error;
      
      // Convertir a objeto key-value
      const config: Record<string, string> = {};
      data?.forEach(item => {
        config[item.clave] = item.valor;
      });
      
      return config;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos para config
    ...options,
  });
}

/**
 * Hook para estadísticas del dashboard
 */
export function useEstadisticas(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['estadisticas'],
    queryFn: async () => {
      const [empresas, muestras, usuarios, catas] = await Promise.all([
        supabase.from('empresas').select('id, pago_confirmado, pais', { count: 'exact' }),
        supabase.from('muestras').select('id, categoria, estado', { count: 'exact' }),
        supabase.from('usuarios').select('id, rol, mesa', { count: 'exact' }),
        supabase.from('catas').select('id', { count: 'exact' }),
      ]);

      return {
        totalEmpresas: empresas.count || 0,
        empresasPagadas: empresas.data?.filter(e => e.pago_confirmado).length || 0,
        totalMuestras: muestras.count || 0,
        muestrasPorCategoria: muestras.data?.reduce((acc, m) => {
          acc[m.categoria || 'Sin categoría'] = (acc[m.categoria || 'Sin categoría'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        totalCatadores: usuarios.count || 0,
        catadoresConMesa: usuarios.data?.filter(u => u.mesa !== null).length || 0,
        totalCatas: catas.count || 0,
        paisesPorEmpresa: empresas.data?.reduce((acc, e) => {
          acc[e.pais || 'Desconocido'] = (acc[e.pais || 'Desconocido'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos para stats
    ...options,
  });
}

// ============== MUTATIONS ==============

/**
 * Hook para crear/actualizar empresa
 */
export function useEmpresaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Record<string, any> }) => {
      if (id) {
        const { data: result, error } = await supabase
          .from('empresas')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('empresas')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
}

/**
 * Hook para crear/actualizar muestra
 */
export function useMuestraMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Record<string, any> }) => {
      if (id) {
        const { data: result, error } = await supabase
          .from('muestras')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('muestras')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
}

/**
 * Hook para eliminar registros
 */
export function useDeleteMutation(tableName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
}

// ============== HELPERS ==============

/**
 * Invalidar cache manualmente
 */
export function invalidateCache(key: string | string[]) {
  const keys = Array.isArray(key) ? key : [key];
  keys.forEach(k => {
    queryClient.invalidateQueries({ queryKey: [k] });
  });
}

/**
 * Prefetch datos antes de necesitarlos
 */
export async function prefetchData(key: string, fetcher: () => Promise<any>) {
  await queryClient.prefetchQuery({
    queryKey: [key],
    queryFn: fetcher,
  });
}

/**
 * Obtener datos del cache sin refetch
 */
export function getCachedData<T>(key: string): T | undefined {
  return queryClient.getQueryData<T>([key]);
}
