import { useEffect, useState } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Pencil, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import SampleEditModal from './SampleEditModal';

type SortField = 'codigotexto' | 'nombre' | 'categoriadecata' | 'categoria' | 'categoriaoiv';
type SortDirection = 'asc' | 'desc';

interface EditableCell {
  sampleId: string;
  field: string;
  value: string;
}

export default function CategoriasManager() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('codigotexto');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editedRows, setEditedRows] = useState<Map<string, Partial<Sample>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [editModalSample, setEditModalSample] = useState<Sample | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterCategoriaCata, setFilterCategoriaCata] = useState<string>('');

  const CATEGORIAS = [
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

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterAndSortSamples();
  }, [samples, searchTerm, sortField, sortDirection, filterCategoria, filterCategoriaCata]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select('*')
        .order('codigotexto', { ascending: true });

      if (error) throw error;
      setSamples(samplesData || []);
    } catch (err) {
      console.error('Error cargando muestras:', err);
      alert('Error cargando muestras');
    } finally {
      setLoading(false);
    }
  };

  // Extraer categorías de cata únicas
  const categoriasCataUnicas = [...new Set(samples.map(s => s.categoriadecata).filter(Boolean))].sort();

  // Colores para cada categoría de cata
  const getCategoriaCataColor = (categoriaCata: string | null | undefined): string => {
    if (!categoriaCata) return '';
    
    const colorsMap: Record<string, string> = {
      // Vinos
      'VINOS BLANCOS': 'bg-yellow-100 hover:bg-yellow-200',
      'VINOS TINTOS': 'bg-red-100 hover:bg-red-200',
      'VINOS ROSADOS': 'bg-pink-100 hover:bg-pink-200',
      'VINOS ESPUMOSOS': 'bg-amber-100 hover:bg-amber-200',
      'VINOS GENEROSOS': 'bg-orange-100 hover:bg-orange-200',
      'VINOS SIN ALCOHOL': 'bg-cyan-100 hover:bg-cyan-200',
      // Espirituosos
      'ESPIRITUOSOS': 'bg-violet-100 hover:bg-violet-200',
      'ESPIRITUOSOS VÍNICO': 'bg-purple-100 hover:bg-purple-200',
      'ESPIRITUOSOS NO VÍNICO': 'bg-fuchsia-100 hover:bg-fuchsia-200',
      // Aceites
      'ACEITES': 'bg-lime-100 hover:bg-lime-200',
      'ACEITE OLIVA': 'bg-green-100 hover:bg-green-200',
      // Otros comunes
      'AROMATIZADOS': 'bg-teal-100 hover:bg-teal-200',
      'GENEROSOS': 'bg-amber-100 hover:bg-amber-200',
    };

    // Buscar coincidencia exacta primero
    if (colorsMap[categoriaCata.toUpperCase()]) {
      return colorsMap[categoriaCata.toUpperCase()];
    }

    // Buscar coincidencia parcial
    const upperCat = categoriaCata.toUpperCase();
    if (upperCat.includes('BLANCO')) return 'bg-yellow-100 hover:bg-yellow-200';
    if (upperCat.includes('TINTO')) return 'bg-red-100 hover:bg-red-200';
    if (upperCat.includes('ROSADO') || upperCat.includes('ROSA')) return 'bg-pink-100 hover:bg-pink-200';
    if (upperCat.includes('ESPUMOSO')) return 'bg-amber-100 hover:bg-amber-200';
    if (upperCat.includes('GENEROSO')) return 'bg-orange-100 hover:bg-orange-200';
    if (upperCat.includes('ESPIRITUOSO')) return 'bg-violet-100 hover:bg-violet-200';
    if (upperCat.includes('ACEITE')) return 'bg-lime-100 hover:bg-lime-200';
    if (upperCat.includes('AROMATIZADO')) return 'bg-teal-100 hover:bg-teal-200';
    if (upperCat.includes('SIN ALCOHOL')) return 'bg-cyan-100 hover:bg-cyan-200';

    // Color por defecto basado en hash del nombre
    const hash = categoriaCata.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-100 hover:bg-blue-200',
      'bg-indigo-100 hover:bg-indigo-200',
      'bg-sky-100 hover:bg-sky-200',
      'bg-emerald-100 hover:bg-emerald-200',
      'bg-stone-100 hover:bg-stone-200',
      'bg-slate-100 hover:bg-slate-200',
    ];
    return colors[hash % colors.length];
  };

  const filterAndSortSamples = () => {
    const term = searchTerm.toLowerCase();
    let data = samples.filter(s => {
      const matchesSearch =
        (s.codigotexto || '').toLowerCase().includes(term) ||
        s.nombre.toLowerCase().includes(term) ||
        (s.categoriadecata || '').toLowerCase().includes(term) ||
        (s.categoria || '').toLowerCase().includes(term) ||
        (s.categoriaoiv || '').toLowerCase().includes(term);
      
      const matchesCategoria = filterCategoria ? (s.categoria || '').toUpperCase() === filterCategoria : true;
      const matchesCategoriaCata = filterCategoriaCata ? s.categoriadecata === filterCategoriaCata : true;
      
      return matchesSearch && matchesCategoria && matchesCategoriaCata;
    });

    data.sort((a, b) => {
      let aVal: string;
      let bVal: string;
      switch (sortField) {
        case 'codigotexto':
          aVal = (a.codigotexto || '').toLowerCase();
          bVal = (b.codigotexto || '').toLowerCase();
          break;
        case 'nombre':
          aVal = a.nombre.toLowerCase();
          bVal = b.nombre.toLowerCase();
          break;
        case 'categoriadecata':
          aVal = (a.categoriadecata || '').toLowerCase();
          bVal = (b.categoriadecata || '').toLowerCase();
          break;
        case 'categoria':
          aVal = (a.categoria || '').toLowerCase();
          bVal = (b.categoria || '').toLowerCase();
          break;
        case 'categoriaoiv':
          aVal = (a.categoriaoiv || '').toLowerCase();
          bVal = (b.categoriaoiv || '').toLowerCase();
          break;
        default:
          aVal = '';
          bVal = '';
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
      setSortDirection('asc');
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
      alert('Error guardando cambios');
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
      'Código': s.codigotexto || '',
      'Nombre': s.nombre,
      'Categoría de Cata': s.categoriadecata || '',
      'Categoría': s.categoria || '',
      'Categoría OIV': s.categoriaoiv || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categorías');
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 20 }];
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `categorias_muestras_${fecha}.xlsx`);
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

  const renderEditableCell = (sample: Sample, field: string, value: any, width: string = 'w-full') => {
    const isEditing = editingCell?.sampleId === sample.id && editingCell?.field === field;
    const isModified = editedRows.get(sample.id)?.[field as keyof Sample] !== undefined;

    if (isEditing) {
      // Para categoria, mostrar select
      if (field === 'categoria') {
        return (
          <select
            value={editingCell.value}
            onChange={(e) => handleCellChange(e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            className="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded outline-none bg-blue-50"
          >
            <option value="">Sin categoría</option>
            {CATEGORIAS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        );
      }

      // Para categoriadecata, mostrar select con opciones existentes + input
      if (field === 'categoriadecata') {
        return (
          <input
            type="text"
            value={editingCell.value}
            onChange={(e) => handleCellChange(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            list="categorias-cata-list"
            className={`${width} px-1 py-0.5 text-xs border-2 border-blue-500 rounded outline-none bg-blue-50`}
          />
        );
      }

      return (
        <input
          type="text"
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
      {/* Datalist para autocompletado */}
      <datalist id="categorias-cata-list">
        {categoriasCataUnicas.map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

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
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
            title="Filtrar por Categoría"
          >
            <option value="">Todas Categorías</option>
            {CATEGORIAS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterCategoriaCata}
            onChange={(e) => setFilterCategoriaCata(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
            title="Filtrar por Categoría de Cata"
          >
            <option value="">Todas Cat. Cata</option>
            {categoriasCataUnicas.map(cat => (
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
                <th 
                  className="px-3 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                  onClick={() => handleSort('codigotexto')}
                  style={{ width: '100px' }}
                >
                  <div className="flex items-center gap-1">Código {getSortIcon('codigotexto')}</div>
                </th>
                <th 
                  className="px-3 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600"
                  onClick={() => handleSort('nombre')}
                  style={{ minWidth: '200px' }}
                >
                  <div className="flex items-center gap-1">Nombre {getSortIcon('nombre')}</div>
                </th>
                <th 
                  className="px-3 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600 bg-purple-700"
                  onClick={() => handleSort('categoriadecata')}
                  style={{ minWidth: '150px' }}
                  title="Categoría de Cata"
                >
                  <div className="flex items-center gap-1">Cat. Cata {getSortIcon('categoriadecata')}</div>
                </th>
                <th 
                  className="px-3 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600 bg-emerald-700"
                  onClick={() => handleSort('categoria')}
                  style={{ minWidth: '180px' }}
                >
                  <div className="flex items-center gap-1">Categoría {getSortIcon('categoria')}</div>
                </th>
                <th 
                  className="px-3 py-2 text-left font-medium text-white uppercase cursor-pointer hover:bg-gray-600 border-r border-gray-600 bg-orange-700"
                  onClick={() => handleSort('categoriaoiv')}
                  style={{ minWidth: '150px' }}
                  title="Categoría OIV"
                >
                  <div className="flex items-center gap-1">Cat. OIV {getSortIcon('categoriaoiv')}</div>
                </th>
                <th className="px-2 py-2 text-center font-medium text-white uppercase" style={{ width: '70px' }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((sample) => {
                const isEdited = editedRows.has(sample.id);
                const rowColor = isEdited ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-blue-50';
                const cellCataColor = getCategoriaCataColor(sample.categoriadecata);
                return (
                <tr 
                  key={sample.id} 
                  className={`border-b border-gray-200 ${rowColor}`}
                >
                  <td className="px-3 py-1.5 border-r border-gray-200 font-mono">
                    {renderEditableCell(sample, 'codigotexto', sample.codigotexto, 'w-20')}
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    {renderEditableCell(sample, 'nombre', sample.nombre)}
                  </td>
                  <td className={`px-3 py-1.5 border-r border-gray-200 font-medium ${cellCataColor}`}>
                    {renderEditableCell(sample, 'categoriadecata', sample.categoriadecata)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    {renderEditableCell(sample, 'categoria', sample.categoria)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    {renderEditableCell(sample, 'categoriaoiv', sample.categoriaoiv)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
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
              );
              })}
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
            <span className="w-3 h-3 bg-purple-50 border border-purple-200 rounded"></span>
            Cat. Cata
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></span>
            Categoría
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></span>
            Cat. OIV
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
