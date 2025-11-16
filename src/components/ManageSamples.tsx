import { useEffect, useState } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Printer, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';

type SortField = 'codigotexto' | 'nombre' | 'empresa' | 'categoria' | 'created_at' | 'pedido';
type SortDirection = 'asc' | 'desc';

export default function ManageSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const CATEGORIES = [
    'VINO BLANCO',
    'VINO TINTO',
    'VINO ROSADO',
    'VINO SIN ALCOHOL',
    'ESPUMOSO',
    'GENEROSO SECO',
    'GENEROSO DULCE',
    'AROMATIZADO',
    'ESPIRITUOSO ORIGEN VÍNICO',
    'ESPIRITUOSO NO VÍNICO',
    'ACEITE OLIVA VIRGEN EXTRA',
    'ACEITE OLIVA VIRGEN EXTRA ORGÁNICO',
  ];
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [visibleColumns, setVisibleColumns] = useState({
    empresa: true,
    pedido: true,
    fecha: true,
    codigo: false,
    fotobotella: false,
    destilado: false,
    anio: false,
    tipoaceituna: false,
    tipouva: false,
    categoriaoiv: false,
    grado: false,
    azucar: false,
    igp: false,
  });

  // Vista de solo lectura

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterAndSortSamples();
  }, [samples, searchTerm, sortField, sortDirection]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select(`
          *,
          empresas:empresa_id (
            name,
            pedido
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const samplesWithEmpresa = samplesData?.map(sample => ({
        ...sample,
        empresa_nombre: sample.empresas?.name || sample.empresa || 'Sin empresa',
        empresa_pedido: sample.empresas?.pedido || null
      })) || [];

      setSamples(samplesWithEmpresa);
    } catch (err) {
      console.error('Error cargando muestras:', err);
      alert('Error cargando muestras');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSamples = () => {
    const term = searchTerm.toLowerCase();
    let data = samples.filter(s => {
      const matchesSearch =
        s.nombre.toLowerCase().includes(term) ||
        (s.codigotexto || s.codigo?.toString() || '').toLowerCase().includes(term) ||
        (s.empresa_nombre || '').toLowerCase().includes(term) ||
        (s.categoria || '').toLowerCase().includes(term);
      const matchesCategory = categoryFilter ? (s.categoria || '').toUpperCase() === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });

    data.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortField) {
        case 'codigotexto':
          aVal = (a.codigotexto || a.codigo?.toString() || '').toLowerCase();
          bVal = (b.codigotexto || b.codigo?.toString() || '').toLowerCase();
          break;
        case 'nombre':
          aVal = a.nombre.toLowerCase();
          bVal = b.nombre.toLowerCase();
          break;
        case 'empresa':
          aVal = (a.empresa_nombre || '').toLowerCase();
          bVal = (b.empresa_nombre || '').toLowerCase();
          break;
        case 'categoria':
          aVal = (a.categoria || '').toLowerCase();
          bVal = (b.categoria || '').toLowerCase();
          break;
        case 'pedido':
          aVal = a.empresa_pedido ?? -Infinity;
          bVal = b.empresa_pedido ?? -Infinity;
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSamples(data);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Vista solo lectura: sin edición en celdas

  const handleExportToExcel = () => {
    const rows = filteredSamples.map(s => {
      const base: Record<string, any> = {
        'Código Texto': s.codigotexto || s.codigo,
        'Nombre': s.nombre,
      };
      if (visibleColumns.empresa) base['Empresa'] = s.empresa_nombre || '';
      if (visibleColumns.pedido) base['Pedido'] = s.empresa_pedido ?? '';
      if (visibleColumns.fecha) base['Fecha'] = s.created_at ? new Date(s.created_at).toLocaleDateString('es-ES') : '';
      base['Categoría'] = s.categoria || '';
      if (visibleColumns.codigo) base['Código Barras'] = s.codigo ?? '';
      // Ajustar a codigobarras real si existe
      if (visibleColumns.codigo) base['Código Barras'] = (s.codigobarras || s.codigo) ?? '';
      if (visibleColumns.fotobotella) base['Foto Botella'] = (s as any).fotobotella || (s as any).foto || (s as any).foto_botella || '';
      if (visibleColumns.destilado) base['Destilado'] = s.destilado || '';
      if (visibleColumns.anio) base['Año'] = s.anio ?? '';
      if (visibleColumns.tipoaceituna) base['Tipo Aceituna'] = s.tipoaceituna || '';
      if (visibleColumns.tipouva) base['Tipo Uva'] = s.tipouva || '';
      if (visibleColumns.categoriaoiv) base['Categoría OIV'] = s.categoriaoiv || '';
      if (visibleColumns.grado) base['Grado'] = s.grado ?? '';
      if (visibleColumns.azucar) base['Azúcar (g/L)'] = s.azucar ?? '';
      if (visibleColumns.igp) base['IGP'] = s.igp || '';
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestión Muestras');
    ws['!cols'] = Array(12).fill({ wch: 20 });
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `gestion_muestras_${fecha}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (sample: Sample) => {
    if (!confirm(`¿Eliminar la muestra "${sample.nombre}"?`)) return;
    try {
      const { error } = await supabase.from('muestras').delete().eq('id', sample.id);
      if (error) throw error;
      await fetchSamples();
    } catch (err) {
      console.error('Error al eliminar', err);
      alert('Error al eliminar la muestra');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando muestras...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
        <div className="flex items-stretch gap-3 flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, empresa, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              title="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-sm">Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Imprimir</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColumnsDropdown(s => !s)}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Mostrar/Ocultar columnas"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Columnas</span>
            </button>
            {showColumnsDropdown && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-64">
                {([
                  ['empresa','Empresa'],
                  ['pedido','Pedido'],
                  ['fecha','Fecha'],
                  ['codigo','Código Barras'],
                  ['fotobotella','Foto Botella'],
                  ['destilado','Destilado'],
                  ['anio','Año'],
                  ['tipoaceituna','Tipo Aceituna'],
                  ['tipouva','Tipo Uva'],
                  ['categoriaoiv','Categoría OIV'],
                  ['grado','Grado'],
                  ['azucar','Azúcar (g/L)'],
                  ['igp','IGP'],
                ] as [keyof typeof visibleColumns, string][]) .map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumn(key)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="bg-primary-50 px-3 py-2 rounded-lg whitespace-nowrap flex items-center">
            <div className="text-sm text-primary-600 font-medium">Total: {samples.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5ch] truncate cursor-pointer" onClick={() => handleSort('codigotexto')}>
                  <div className="flex items-center gap-1">Cód {getSortIcon('codigotexto')}</div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[160px] cursor-pointer" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center gap-1">Nombre {getSortIcon('nombre')}</div>
                </th>
                {visibleColumns.empresa && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[180px] cursor-pointer" onClick={() => handleSort('empresa')}>
                    <div className="flex items-center gap-1">Empresa {getSortIcon('empresa')}</div>
                  </th>
                )}
                {visibleColumns.pedido && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-24 cursor-pointer" onClick={() => handleSort('pedido')}>
                    <div className="flex items-center gap-1">Pedido {getSortIcon('pedido')}</div>
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32 cursor-pointer" onClick={() => handleSort('categoria')}>
                  <div className="flex items-center gap-1">Categoría {getSortIcon('categoria')}</div>
                </th>
                {visibleColumns.fecha && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32 cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">Fecha {getSortIcon('created_at')}</div>
                  </th>
                )}
                {visibleColumns.codigo && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5ch] truncate">Código Barras</th>
                )}
                {visibleColumns.fotobotella && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Foto Botella</th>
                )}
                {visibleColumns.destilado && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Destilado</th>
                )}
                {visibleColumns.anio && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-20">Año</th>
                )}
                {visibleColumns.tipoaceituna && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Tipo Aceituna</th>
                )}
                {visibleColumns.tipouva && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-28">Tipo Uva</th>
                )}
                {visibleColumns.categoriaoiv && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Categoría OIV</th>
                )}
                {visibleColumns.grado && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-20">Grado</th>
                )}
                {visibleColumns.azucar && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-28">Azúcar (g/L)</th>
                )}
                {visibleColumns.igp && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-28">IGP</th>
                )}
                <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase tracking-wider w-16">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredSamples.map((sample, index) => (
                <tr key={sample.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-2 py-2 font-mono text-xs w-[5ch] truncate">{sample.codigotexto || sample.codigo?.toString() || '-'}</td>
                  <td className="px-3 py-2 text-sm">{sample.nombre}</td>
                  {visibleColumns.empresa && (
                    <td className="px-3 py-2 text-sm">{sample.empresa_nombre || sample.empresa || '-'}</td>
                  )}
                  {visibleColumns.pedido && (
                    <td className="px-3 py-2 text-center text-sm">{sample.empresa_pedido ?? '-'}</td>
                  )}
                  <td className="px-3 py-2 text-sm">{sample.categoria || '-'}</td>
                  {visibleColumns.fecha && (
                    <td className="px-3 py-2 text-sm">
                      {sample.created_at ? new Date(sample.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                  )}
                   {visibleColumns.codigo && (
                     <td className="px-3 py-2 text-sm font-mono w-[5ch] truncate">{(sample.codigobarras || sample.codigo) ?? ''}</td>
                   )}
                  {visibleColumns.fotobotella && (
                    <td className="px-3 py-2 text-sm">
                      {((sample as any).fotobotella || (sample as any).foto || (sample as any).foto_botella) ? (
                        <img src={(sample as any).fotobotella || (sample as any).foto || (sample as any).foto_botella} alt="Botella" className="h-10 w-auto rounded" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.destilado && (
                    <td className="px-3 py-2 text-sm">{sample.destilado || ''}</td>
                  )}
                  {visibleColumns.anio && (
                    <td className="px-3 py-2 text-sm">{sample.anio ?? ''}</td>
                  )}
                  {visibleColumns.tipoaceituna && (
                    <td className="px-3 py-2 text-sm">{sample.tipoaceituna || ''}</td>
                  )}
                  {visibleColumns.tipouva && (
                    <td className="px-3 py-2 text-sm">{sample.tipouva || ''}</td>
                  )}
                  {visibleColumns.categoriaoiv && (
                    <td className="px-3 py-2 text-sm">{sample.categoriaoiv || ''}</td>
                  )}
                  {visibleColumns.grado && (
                    <td className="px-3 py-2 text-sm">{sample.grado ?? ''}</td>
                  )}
                  {visibleColumns.azucar && (
                    <td className="px-3 py-2 text-sm">{sample.azucar ?? ''}</td>
                  )}
                  {visibleColumns.igp && (
                    <td className="px-3 py-2 text-sm">{sample.igp || ''}</td>
                  )}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDelete(sample)}
                      className="text-red-600 hover:text-red-700"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12 text-gray-500">No se encontraron muestras</div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-600">Mostrando {filteredSamples.length} de {samples.length} muestras</div>
    </div>
  );
}
