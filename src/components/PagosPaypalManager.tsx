import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Search, Filter, ArrowUpDown } from 'lucide-react';

export default function PagosPaypalManager() {
  type Row = Record<string, any>;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Load data
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('pagos_paypal').select('*');
      const { data, error } = await query;
      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Discover columns dynamically from data
  const columns = useMemo(() => {
    const allKeys = new Set<string>();
    rows.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
    // Move id and created_at to the front if they exist
    const keys = Array.from(allKeys);
    const preferred = ['id', 'created_at'];
    const ordered = [...preferred.filter(k => keys.includes(k)), ...keys.filter(k => !preferred.includes(k))];
    return ordered;
  }, [rows]);

  // Build filter sets
  const hasStatus = useMemo(() => columns.includes('status'), [columns]);
  const statusOptions = useMemo(() => {
    if (!hasStatus) return [] as string[];
    const set = new Set<string>();
    rows.forEach(r => {
      const v = r['status'];
      if (typeof v === 'string' && v.trim() !== '') set.add(v);
    });
    return Array.from(set).sort();
  }, [rows, hasStatus]);

  const dateKey = useMemo(() => {
    // Pick the first date-like column
    const candidates = ['created_at', 'update_time', 'updated_at', 'fecha'];
    return candidates.find(c => columns.includes(c));
  }, [columns]);

  // Derived filtered + sorted rows
  const filteredRows = useMemo(() => {
    let data = [...rows];

    // Text search across all columns
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        columns.some(k => String(r[k] ?? '').toLowerCase().includes(q))
      );
    }

    // Status filter
    if (hasStatus && statusFilter) {
      data = data.filter(r => (r['status'] ?? '') === statusFilter);
    }

    // Date range filter
    if (dateKey) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from || to) {
        data = data.filter(r => {
          const v = r[dateKey];
          if (!v) return false;
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return false;
          if (from && d < from) return false;
          if (to) {
            const end = new Date(to);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
          }
          return true;
        });
      }
    }

    // Sorting
    if (sortKey) {
      data.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return sortAsc ? -1 : 1;
        if (bv == null) return sortAsc ? 1 : -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortAsc ? av - bv : bv - av;
        }
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as < bs) return sortAsc ? -1 : 1;
        if (as > bs) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [rows, search, sortKey, sortAsc, hasStatus, statusFilter, dateFrom, dateTo, dateKey, columns]);

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en todos los campos..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" /> Recargar
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasStatus && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm"
              >
                <option value="">Estado (todos)</option>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          {dateKey && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm"
              />
              <span className="text-xs text-gray-500">a</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => onSort(col)}
                  className="text-left font-semibold text-gray-700 px-3 py-2 border-b border-gray-200 cursor-pointer select-none whitespace-nowrap"
                  title={`Ordenar por ${col}`}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === col ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={columns.length}>Cargando pagos...</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-3 py-4 text-red-600" colSpan={columns.length}>{error}</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-600" colSpan={columns.length}>Sin resultados</td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 border-b border-gray-100 whitespace-nowrap max-w-xs truncate" title={String(r[col] ?? '')}>
                      {formatCell(r[col])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(value: any) {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
  // ISO date formatting
  const asStr = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(asStr)) {
    const d = new Date(asStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('es-ES');
    }
  }
  return asStr;
}
