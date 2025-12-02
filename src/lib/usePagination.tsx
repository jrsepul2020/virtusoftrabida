/**
 * Hook para paginación desde el servidor (Supabase)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

interface PaginationState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsePaginationOptions {
  table: string;
  select?: string;
  pageSize?: number;
  orderBy?: string;
  orderAsc?: boolean;
  filters?: Record<string, any>;
}

export function usePaginatedQuery<T>({
  table,
  select = '*',
  pageSize = 20,
  orderBy = 'created_at',
  orderAsc = false,
  filters = {},
}: UsePaginationOptions) {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    loading: true,
    error: null,
    page: 1,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchData = useCallback(async (page: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Primero obtener el conteo total
      let countQuery = supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros al conteo
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            countQuery = countQuery.ilike(key, value);
          } else {
            countQuery = countQuery.eq(key, value);
          }
        }
      });

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Calcular offset
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query de datos con paginación
      let dataQuery = supabase
        .from(table)
        .select(select)
        .range(from, to)
        .order(orderBy, { ascending: orderAsc });

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            dataQuery = dataQuery.ilike(key, value);
          } else {
            dataQuery = dataQuery.eq(key, value);
          }
        }
      });

      const { data, error: dataError } = await dataQuery;

      if (dataError) throw dataError;

      setState({
        data: (data || []) as T[],
        loading: false,
        error: null,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos',
      }));
    }
  }, [table, select, pageSize, orderBy, orderAsc, JSON.stringify(filters)]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchData(page);
    }
  };

  const nextPage = () => {
    if (state.hasNextPage) {
      fetchData(state.page + 1);
    }
  };

  const prevPage = () => {
    if (state.hasPrevPage) {
      fetchData(state.page - 1);
    }
  };

  const refresh = () => {
    fetchData(state.page);
  };

  return {
    ...state,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  };
}

/**
 * Componente de controles de paginación
 */
interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageSize,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  onGoToPage,
}: PaginationControlsProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (page < totalPages - 2) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{totalCount}</span> resultados
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        
        {getPageNumbers().map((pageNum, idx) => (
          typeof pageNum === 'number' ? (
            <button
              key={idx}
              onClick={() => onGoToPage(pageNum)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                pageNum === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ) : (
            <span key={idx} className="px-2 text-gray-400">...</span>
          )
        ))}
        
        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
