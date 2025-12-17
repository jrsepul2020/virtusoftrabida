import { useEffect, useState } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Printer, Save, X, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import SampleEditModal from './SampleEditModal';
import { showError } from '../lib/toast';

type SortField = 'codigotexto' | 'nombre' | 'empresa' | 'categoria' | 'grado' | 'azucar' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface EditableCell {
  sampleId: string;
  field: string;
  value: string;
}

export default function ManageSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editedRows, setEditedRows] = useState<Map<string, Partial<Sample>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [editModalSample, setEditModalSample] = useState<Sample | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);

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

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterAndSortSamples();
  }, [samples, searchTerm, sortField, sortDirection, categoryFilter]);

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
      showError('Error cargando muestras');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSamples = () => {
    const term = searchTerm.toLowerCase();
    const data = samples.filter(s => {
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
        case 'grado':
          aVal = parseFloat(a.grado?.toString() || '0') || 0;
          bVal = parseFloat(b.grado?.toString() || '0') || 0;
          break;
        case 'azucar':
          aVal = parseFloat(a.azucar?.toString() || '0') || 0;
          bVal = parseFloat(b.azucar?.toString() || '0') || 0;
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
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const handleCellClick = (sampleId: string, field: string, currentValue: any) => {
    setEditingCell({
      sampleId,
      field,
      value: currentValue?.toString() || ''
    });
  };

  const handleCellChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value });
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const sample = samples.find(s => s.id === editingCell.sampleId);
      if (sample) {
        const originalValue = (sample as any)[editingCell.field]?.toString() || '';
        if (editingCell.value !== originalValue) {
          const current = editedRows.get(editingCell.sampleId) || {};
          const newEdits = new Map(editedRows);
          newEdits.set(editingCell.sampleId, {
            ...current,
            [editingCell.field]: editingCell.value
          });
          setEditedRows(newEdits);

          setSamples(prev => prev.map(s => {
            if (s.id === editingCell.sampleId) {
              return { ...s, [editingCell.field]: editingCell.value };
            }
            return s;
          }));
        }
      }
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const saveAllChanges = async () => {
    if (editedRows.size === 0) return;

    setSaving(true);
    try {
      const updates = Array.from(editedRows.entries()).map(async ([id, changes]) => {
        const { error } = await supabase
          .from('muestras')
          .update(changes)
          .eq('id', id);
        if (error) throw error;
      });

      await Promise.all(updates);
      setEditedRows(new Map());
    } catch (err) {
      console.error('Error guardando cambios:', err);
      showError('Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    if (editedRows.size === 0) return;
    if (!confirm('¿Descartar todos los cambios?')) return;
    setEditedRows(new Map());
    fetchSamples();
  };

  const handleExportToExcel = () => {
    const rows = filteredSamples.map(s => ({
      'Código': s.codigotexto || s.codigo,
      'Nombre': s.nombre,
      'Empresa': s.empresa_nombre || '',
      'Categoría': s.categoria || '',
      'Grado': s.grado ?? '',
      'Azúcar (g/L)': s.azucar ?? '',
      'Año': s.anio ?? '',
      'Tipo Uva': s.tipouva || '',
      'IGP': s.igp || '',
      'Fecha': s.created_at ? new Date(s.created_at).toLocaleDateString('es-ES') : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestión Muestras');
    ws['!cols'] = Array(10).fill({ wch: 18 });
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
      showError('Error al eliminar la muestra');
    }
  };

  const toggleSelectSample = (id: string) => {
    setSelectedSamples(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedSamples.length === filteredSamples.length) {
      setSelectedSamples([]);
    } else {
      setSelectedSamples(filteredSamples.map(s => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSamples.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedSamples.length} muestra(s) seleccionada(s)? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.from('muestras').delete().in('id', selectedSamples);
      if (error) throw error;
      setSelectedSamples([]);
      await fetchSamples();
    } catch (err) {
      console.error('Error eliminando muestras seleccionadas', err);
      showError('Error eliminando muestras seleccionadas');
    }
  };

  const renderEditableCell = (sample: Sample, field: string, value: any, type: 'text' | 'number' = 'text', width: string = 'w-full') => {
    const isEditing = editingCell?.sampleId === sample.id && editingCell?.field === field;
    const isModified = editedRows.get(sample.id)?.[field as keyof Sample] !== undefined;

    if (isEditing) {
      return (
        <input
          type={type}
          value={editingCell.value}
          onChange={(e) => handleCellChange(e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`${width} px-1 py-0.5 text-xs border-2 border-blue-500 rounded outline-none bg-blue-50`}
        />
      );
    }

    return (
      <div
        onClick={() => handleCellClick(sample.id, field, value)}
        className={`cursor-pointer px-1 py-0.5 text-xs rounded hover:bg-blue-100 min-h-[20px] ${
          isModified ? 'bg-yellow-100 border border-yellow-400' : ''
        }`}
        title="Click para editar"
      >
        {value || <span className="text-gray-300">-</span>}
      </div>
    );
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
      {/* Barra superior */}
      <div className="bg-white rounded-xl shadow-md p-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Todas</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {editedRows.size > 0 && (
            <>
              <button
                onClick={saveAllChanges}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar ({editedRows.size})
              </button>
              <button
                onClick={discardChanges}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
                Descartar
              </button>
            </>
          )}

          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedSamples.length === 0}
            className="flex items-center gap-1 px-2 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
            title="Eliminar seleccionadas"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Eliminar ({selectedSamples.length})</span>
          </button>
          <div className="bg-blue-50 px-2 py-1.5 rounded-lg">
            <span className="text-xs text-blue-600 font-medium">{filteredSamples.length}/{samples.length}</span>
          </div>
        </div>
      </div>

      {/* Tabla tipo Excel */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                    <th className="px-2 py-2 text-left font-medium text-white uppercase border-r border-gray-600 w-10">
                      <input type="checkbox" checked={selectedSamples.length === filteredSamples.length && filteredSamples.length > 0} onChange={toggleSelectAll} className="w-4 h-4" />
                    </th>
                    <th 
                      className="px-2 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                      onClick={() => handleSort('codigotexto')}
                      style={{ width: '70px' }}
                    >
                      <div className="flex items-center gap-1">Cód {getSortIcon('codigotexto')}</div>
                    </th>
                <th 
                  className="px-2 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                  onClick={() => handleSort('nombre')}
                  style={{ minWidth: '150px' }}
                >
                  <div className="flex items-center gap-1">Nombre {getSortIcon('nombre')}</div>
                </th>
                <th 
                  className="px-2 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                  onClick={() => handleSort('empresa')}
                  style={{ minWidth: '120px' }}
                >
                  <div className="flex items-center gap-1">Empresa {getSortIcon('empresa')}</div>
                </th>
                <th 
                  className="px-2 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                  onClick={() => handleSort('categoria')}
                  style={{ minWidth: '100px' }}
                >
                  <div className="flex items-center gap-1">Categoría {getSortIcon('categoria')}</div>
                </th>
                <th 
                  className="px-2 py-2 text-center font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600 bg-amber-700"
                  onClick={() => handleSort('grado')}
                  style={{ width: '70px' }}
                  title="Ordenar por Grado"
                >
                  <div className="flex items-center justify-center gap-1">Grado {getSortIcon('grado')}</div>
                </th>
                <th 
                  className="px-2 py-2 text-center font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600 bg-amber-700"
                  onClick={() => handleSort('azucar')}
                  style={{ width: '80px' }}
                  title="Ordenar por Azúcar"
                >
                  <div className="flex items-center justify-center gap-1">Azúcar {getSortIcon('azucar')}</div>
                </th>
                <th className="px-2 py-2 text-center font-medium text-white uppercase border-r border-gray-600" style={{ width: '60px' }}>
                  Año
                </th>
                <th className="px-2 py-2 text-left font-medium text-white uppercase border-r border-gray-600" style={{ minWidth: '100px' }}>
                  Tipo Uva
                </th>
                <th className="px-2 py-2 text-left font-medium text-white uppercase border-r border-gray-600" style={{ minWidth: '80px' }}>
                  IGP
                </th>
                <th className="px-2 py-2 text-center font-medium text-white uppercase" style={{ width: '50px' }}>
                  
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((sample, index) => {
                const codigoNum = parseInt(String(sample.codigotexto || sample.codigo || '0'), 10);
                const isLowCode = !isNaN(codigoNum) && codigoNum <= 999;
                return (
                <tr 
                  key={sample.id} 
                  className={`border-b border-gray-200 hover:bg-blue-50 ${
                    isLowCode ? 'bg-red-100 border-l-4 border-l-red-500' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                  } ${editedRows.has(sample.id) ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input type="checkbox" checked={selectedSamples.includes(sample.id)} onChange={() => toggleSelectSample(sample.id)} className="w-4 h-4" />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 font-mono">
                    <div className="flex items-center gap-1">
                      {isLowCode && <span className="text-red-600 font-bold text-xs">M</span>}
                      {renderEditableCell(sample, 'codigotexto', sample.codigotexto || sample.codigo, 'text', 'w-16')}
                    </div>
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    {renderEditableCell(sample, 'nombre', sample.nombre)}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-gray-600">
                    {sample.empresa_nombre || '-'}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    {renderEditableCell(sample, 'categoria', sample.categoria)}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center bg-amber-50">
                    {renderEditableCell(sample, 'grado', sample.grado, 'number', 'w-14 text-center')}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center bg-amber-50">
                    {renderEditableCell(sample, 'azucar', sample.azucar, 'number', 'w-16 text-center')}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center">
                    {renderEditableCell(sample, 'anio', sample.anio, 'number', 'w-14 text-center')}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    {renderEditableCell(sample, 'tipouva', sample.tipouva)}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    {renderEditableCell(sample, 'igp', sample.igp)}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditModalSample(sample)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Editar todos los campos"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sample)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-8 text-gray-500">No se encontraron muestras</div>
        )}
      </div>

      {/* Info y leyenda */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Click en una celda para editar • Enter para confirmar • Escape para cancelar</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></span>
            Modificado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-50 border border-amber-200 rounded"></span>
            Ordenable
          </span>
        </div>
      </div>

      {/* Modal de edición completa */}
      <SampleEditModal
        sample={editModalSample}
        onClose={() => setEditModalSample(null)}
        onSave={() => {
          setEditModalSample(null);
          fetchSamples();
        }}
      />
    </div>
  );
}
