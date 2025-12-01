import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Medal, RefreshCw, Download, ChevronDown, ChevronUp, Settings, Plus, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';

interface Muestra {
  id: number;
  codigo: number;
  codigotexto: string;
  nombre: string;
  categoria?: string;
  categoriadecata?: string;
  pais?: string;
  empresa_nombre?: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  puntuacion_total: number | null;
  medalla: string | null;
}

interface MedalConfig {
  id?: number;
  medalla: string;
  puntuacion_minima: number;
  puntuacion_maxima: number;
  color_hex: string;
  orden: number;
  activo: boolean;
}

export default function PuntuacionesManager() {
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [medalConfig, setMedalConfig] = useState<MedalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  const [showMedalConfig, setShowMedalConfig] = useState(false);
  const [savingMedals, setSavingMedals] = useState(false);
  
  // Filtros, búsqueda y ordenación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [sortField, setSortField] = useState<'puntuacion_total' | 'categoriadecata' | 'codigo'>('codigo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  // Obtener categorías únicas para el filtro
  const categoriasUnicas = useMemo(() => {
    const categorias = new Set<string>();
    muestras.forEach(m => {
      if (m.categoriadecata) categorias.add(m.categoriadecata);
    });
    return Array.from(categorias).sort();
  }, [muestras]);

  // Filtrar y ordenar muestras
  const muestrasFiltradas = useMemo(() => {
    let resultado = [...muestras];

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(m => 
        m.nombre.toLowerCase().includes(term) ||
        m.codigotexto?.toLowerCase().includes(term) ||
        m.codigo.toString().includes(term) ||
        m.empresa_nombre?.toLowerCase().includes(term) ||
        m.categoria?.toLowerCase().includes(term) ||
        m.pais?.toLowerCase().includes(term)
      );
    }

    // Filtro por categoría de cata
    if (filterCategoria) {
      resultado = resultado.filter(m => m.categoriadecata === filterCategoria);
    }

    // Ordenación
    resultado.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'puntuacion_total':
          const puntA = a.puntuacion_total ?? -1;
          const puntB = b.puntuacion_total ?? -1;
          comparison = puntA - puntB;
          break;
        case 'categoriadecata':
          comparison = (a.categoriadecata || '').localeCompare(b.categoriadecata || '');
          break;
        case 'codigo':
        default:
          comparison = a.codigo - b.codigo;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [muestras, searchTerm, filterCategoria, sortField, sortDirection]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar configuración de medallas
      const { data: medals, error: medalsError } = await supabase
        .from('configuracion_medallas')
        .select('*')
        .order('orden');

      if (medalsError) {
        console.error('Error loading medal config:', medalsError);
      }
      
      // Si no hay medallas en la base de datos, usar valores por defecto
      if (!medals || medals.length === 0) {
        console.log('No medal config found, using defaults');
        const defaultMedals: MedalConfig[] = [
          { medalla: 'Gran Oro', puntuacion_minima: 94, puntuacion_maxima: 100, color_hex: '#B8860B', orden: 1, activo: true },
          { medalla: 'Oro', puntuacion_minima: 90, puntuacion_maxima: 93.99, color_hex: '#FFD700', orden: 2, activo: true },
          { medalla: 'Plata', puntuacion_minima: 87, puntuacion_maxima: 89.99, color_hex: '#C0C0C0', orden: 3, activo: true },
        ];
        setMedalConfig(defaultMedals);
        
        // Guardar los valores por defecto en la base de datos
        try {
          for (const medal of defaultMedals) {
            await supabase
              .from('configuracion_medallas')
              .insert({
                medalla: medal.medalla,
                puntuacion_minima: medal.puntuacion_minima,
                puntuacion_maxima: medal.puntuacion_maxima,
                color_hex: medal.color_hex,
                orden: medal.orden,
                activo: medal.activo
              });
          }
          // Recargar para obtener los IDs
          const { data: newMedals } = await supabase
            .from('configuracion_medallas')
            .select('*')
            .order('orden');
          if (newMedals) {
            setMedalConfig(newMedals);
          }
        } catch (insertError) {
          console.error('Error inserting default medals:', insertError);
        }
      } else {
        console.log('Loaded medal config:', medals);
        setMedalConfig(medals);
      }

      // Cargar muestras con puntuaciones
      const { data: muestrasData, error: muestrasError } = await supabase
        .from('muestras')
        .select(`
          id,
          codigo,
          codigotexto,
          nombre,
          categoria,
          categoriadecata,
          pais,
          p1,
          p2,
          p3,
          p4,
          p5,
          puntuacion_total,
          medalla,
          empresas:empresa_id (name)
        `)
        .order('codigo', { ascending: false });

      if (muestrasError) throw muestrasError;

      const muestrasConEmpresa = muestrasData?.map(m => ({
        ...m,
        empresa_nombre: (m.empresas as any)?.name || 'Sin empresa',
        p1: m.p1 ?? null,
        p2: m.p2 ?? null,
        p3: m.p3 ?? null,
        p4: m.p4 ?? null,
        p5: m.p5 ?? null,
      })) || [];

      setMuestras(muestrasConEmpresa);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (p1: number | null, p2: number | null, p3: number | null, p4: number | null, p5: number | null): number | null => {
    const puntuaciones = [p1, p2, p3, p4, p5].filter(p => p !== null && p !== undefined) as number[];
    if (puntuaciones.length === 0) return null;
    const sum = puntuaciones.reduce((a, b) => a + b, 0);
    return Math.round((sum / puntuaciones.length) * 100) / 100;
  };

  const getActiveMedals = () => medalConfig.filter(m => m.activo);

  const getMedalla = (total: number | null): string | null => {
    if (total === null) return null;
    for (const medal of getActiveMedals()) {
      if (total >= medal.puntuacion_minima && total <= medal.puntuacion_maxima) {
        return medal.medalla;
      }
    }
    return null;
  };

  const getMedalColor = (medalla: string | null): string => {
    if (!medalla) return '';
    const config = medalConfig.find(m => m.medalla === medalla);
    return config?.color_hex || '#888';
  };

  // ============ MEDAL CONFIG HANDLERS ============

  const handleMedalChange = (index: number, field: keyof MedalConfig, value: string | number | boolean) => {
    setMedalConfig(prev => prev.map((m, i) => {
      if (i !== index) return m;
      return { ...m, [field]: value };
    }));
  };

  const handleAddMedal = () => {
    const maxOrden = Math.max(...medalConfig.map(m => m.orden), 0);
    const newMedal: MedalConfig = {
      medalla: 'Nueva Medalla',
      puntuacion_minima: 0,
      puntuacion_maxima: 69.99,
      color_hex: '#888888',
      orden: maxOrden + 1,
      activo: true
    };
    setMedalConfig(prev => [...prev, newMedal]);
  };

  const handleDeleteMedal = async (index: number) => {
    const medal = medalConfig[index];
    if (!medal.id) {
      setMedalConfig(prev => prev.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`¿Eliminar la medalla "${medal.medalla}"?`)) return;

    try {
      const { error } = await supabase
        .from('configuracion_medallas')
        .delete()
        .eq('id', medal.id);

      if (error) throw error;
      setMedalConfig(prev => prev.filter((_, i) => i !== index));
    } catch (error: any) {
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  const handleSaveMedals = async () => {
    setSavingMedals(true);
    try {
      console.log('Saving medals:', medalConfig);
      
      for (const medal of medalConfig) {
        // Validar valores
        if (isNaN(medal.puntuacion_minima) || isNaN(medal.puntuacion_maxima)) {
          throw new Error(`Valores inválidos para ${medal.medalla}`);
        }

        if (medal.id) {
          // Actualizar medalla existente
          console.log('Updating medal:', medal.id, medal);
          const { error } = await supabase
            .from('configuracion_medallas')
            .update({
              medalla: medal.medalla,
              puntuacion_minima: Number(medal.puntuacion_minima),
              puntuacion_maxima: Number(medal.puntuacion_maxima),
              color_hex: medal.color_hex,
              orden: Number(medal.orden),
              activo: medal.activo
            })
            .eq('id', medal.id);
          
          if (error) {
            console.error('Error updating medal:', error);
            throw error;
          }
        } else {
          // Insertar nueva medalla
          console.log('Inserting new medal:', medal);
          const { data, error } = await supabase
            .from('configuracion_medallas')
            .insert({
              medalla: medal.medalla,
              puntuacion_minima: Number(medal.puntuacion_minima),
              puntuacion_maxima: Number(medal.puntuacion_maxima),
              color_hex: medal.color_hex,
              orden: Number(medal.orden),
              activo: medal.activo
            })
            .select()
            .single();
          
          if (error) {
            console.error('Error inserting medal:', error);
            throw error;
          }
          console.log('Inserted medal:', data);
        }
      }

      // Recargar configuración desde la base de datos para confirmar los cambios
      const { data: freshMedals, error: reloadError } = await supabase
        .from('configuracion_medallas')
        .select('*')
        .order('orden');

      if (reloadError) {
        console.error('Error reloading medals:', reloadError);
        throw reloadError;
      }
      
      console.log('Fresh medals from DB:', freshMedals);
      setMedalConfig(freshMedals || []);

      recalculateAllMedals();
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setSavingMedals(false);
    }
  };

  const recalculateAllMedals = () => {
    setMuestras(prev => prev.map(m => {
      const newMedalla = getMedalla(m.puntuacion_total);
      if (newMedalla !== m.medalla) {
        setEditedRows(er => new Set(er).add(m.id));
      }
      return { ...m, medalla: newMedalla };
    }));
  };

  // ============ PUNTUACIONES HANDLERS ============

  const handlePuntuacionChange = (muestraId: number, field: 'p1' | 'p2' | 'p3' | 'p4' | 'p5', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    // Validar rango
    if (numValue !== null && (numValue < 0 || numValue > 100)) return;

    setMuestras(prev => prev.map(m => {
      if (m.id !== muestraId) return m;
      
      const updated = { ...m, [field]: numValue };
      const total = calculateTotal(updated.p1, updated.p2, updated.p3, updated.p4, updated.p5);
      updated.puntuacion_total = total;
      updated.medalla = getMedalla(total);
      
      return updated;
    }));

    setEditedRows(prev => new Set(prev).add(muestraId));
  };

  const handleSave = async (muestra: Muestra) => {
    setSaving(muestra.id);
    try {
      const { error } = await supabase
        .from('muestras')
        .update({
          p1: muestra.p1,
          p2: muestra.p2,
          p3: muestra.p3,
          p4: muestra.p4,
          p5: muestra.p5,
          puntuacion_total: muestra.puntuacion_total,
          medalla: muestra.medalla,
          catada: muestra.puntuacion_total !== null,
          num_puntuaciones: [muestra.p1, muestra.p2, muestra.p3, muestra.p4, muestra.p5].filter(p => p !== null).length
        })
        .eq('id', muestra.id);

      if (error) throw error;

      setEditedRows(prev => {
        const next = new Set(prev);
        next.delete(muestra.id);
        return next;
      });

      // Feedback visual breve
      setTimeout(() => setSaving(null), 500);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Error al guardar: ${error.message}`);
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    const editedMuestras = muestras.filter(m => editedRows.has(m.id));
    for (const muestra of editedMuestras) {
      await handleSave(muestra);
    }
  };

  const exportCSV = () => {
    const headers = ['Código', 'Nombre', 'Categoría', 'Cat. Cata', 'País', 'P1', 'P2', 'P3', 'P4', 'P5', 'Total', 'Medalla'];
    const rows = muestras.map(m => [
      m.codigotexto || m.codigo,
      m.nombre,
      m.categoria || '',
      m.categoriadecata || '',
      m.pais || '',
      m.p1 ?? '',
      m.p2 ?? '',
      m.p3 ?? '',
      m.p4 ?? '',
      m.p5 ?? '',
      m.puntuacion_total ?? '',
      m.medalla || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `puntuaciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando puntuaciones...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: muestras.length,
    filtradas: muestrasFiltradas.length,
    catadas: muestras.filter(m => m.puntuacion_total !== null).length,
    granOro: muestras.filter(m => m.medalla === 'Gran Oro').length,
    oro: muestras.filter(m => m.medalla === 'Oro').length,
    plata: muestras.filter(m => m.medalla === 'Plata').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Medal className="w-7 h-7 text-yellow-500" />
            Puntuaciones de Muestras
          </h2>
          <p className="text-gray-600 mt-1">Introduce las 5 puntuaciones para cada muestra</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          {editedRows.size > 0 && (
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Todo ({editedRows.size})
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por categoría de cata */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Todas las categorías de cata</option>
              {categoriasUnicas.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Ordenación */}
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="codigo">Ordenar por Código</option>
              <option value="puntuacion_total">Ordenar por Puntuación</option>
              <option value="categoriadecata">Ordenar por Cat. Cata</option>
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              <ArrowUpDown className={`w-5 h-5 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </button>
          </div>
        </div>

        {/* Indicador de resultados */}
        {(searchTerm || filterCategoria) && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Mostrando {muestrasFiltradas.length} de {muestras.length} muestras
            </span>
            <button
              onClick={() => { setSearchTerm(''); setFilterCategoria(''); }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Medal Configuration (Collapsible) */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setShowMedalConfig(!showMedalConfig)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Configuración de Medallas</span>
            <span className="text-sm text-gray-500">
              ({getActiveMedals().length} activas)
            </span>
          </div>
          {showMedalConfig ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showMedalConfig && (
          <div className="border-t p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mín</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Máx</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Activa</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medalConfig.map((medal, index) => (
                    <tr key={medal.id || `new-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={medal.medalla}
                          onChange={(e) => handleMedalChange(index, 'medalla', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={medal.puntuacion_minima}
                          onChange={(e) => handleMedalChange(index, 'puntuacion_minima', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={medal.puntuacion_maxima}
                          onChange={(e) => handleMedalChange(index, 'puntuacion_maxima', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={medal.color_hex}
                            onChange={(e) => handleMedalChange(index, 'color_hex', e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                          />
                          <span className="text-xs text-gray-500">{medal.color_hex}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={medal.orden}
                          onChange={(e) => handleMedalChange(index, 'orden', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={medal.activo}
                          onChange={(e) => handleMedalChange(index, 'activo', e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleDeleteMedal(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar medalla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={handleAddMedal}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir Medalla
              </button>
              <button
                onClick={handleSaveMedals}
                disabled={savingMedals}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingMedals ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Muestras</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.catadas}</p>
          <p className="text-sm text-gray-500">Catadas</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#B8860B' }}>{stats.granOro}</p>
          <p className="text-sm text-gray-500">🏆 Gran Oro</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>{stats.oro}</p>
          <p className="text-sm text-gray-500">🥇 Oro</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#C0C0C0' }}>{stats.plata}</p>
          <p className="text-sm text-gray-500">🥈 Plata</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Código
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Categoría
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Cat. Cata
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  País
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  P1
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  P2
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  P3
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  P4
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  P5
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Total
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Medalla
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {muestrasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm || filterCategoria ? 
                      'No se encontraron muestras con los filtros aplicados' : 
                      'No hay muestras disponibles'
                    }
                  </td>
                </tr>
              ) : muestrasFiltradas.map((muestra) => (
                <tr 
                  key={muestra.id} 
                  className={`hover:bg-gray-50 ${editedRows.has(muestra.id) ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 w-16">
                    {muestra.codigotexto || muestra.codigo}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-700 max-w-[150px] truncate" title={muestra.nombre}>
                    {muestra.nombre}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-500 hidden lg:table-cell max-w-[100px] truncate" title={muestra.categoria}>
                    {muestra.categoria || '-'}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-500 hidden lg:table-cell max-w-[100px] truncate" title={muestra.categoriadecata}>
                    {muestra.categoriadecata || '-'}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-500 hidden md:table-cell max-w-[80px] truncate" title={muestra.pais}>
                    {muestra.pais || '-'}
                  </td>
                  {(['p1', 'p2', 'p3', 'p4', 'p5'] as const).map((field) => (
                    <td key={field} className="px-1 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={muestra[field] ?? ''}
                        onChange={(e) => handlePuntuacionChange(muestra.id, field, e.target.value)}
                        className="w-14 px-1 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    <span className={`text-base font-bold ${muestra.puntuacion_total !== null ? 'text-primary-600' : 'text-gray-400'}`}>
                      {muestra.puntuacion_total !== null ? muestra.puntuacion_total.toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {muestra.medalla ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getMedalColor(muestra.medalla) }}
                      >
                        {muestra.medalla === 'Oro' && '🥇'}
                        {muestra.medalla === 'Plata' && '🥈'}
                        {muestra.medalla === 'Bronce' && '🥉'}
                        {' '}{muestra.medalla}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {editedRows.has(muestra.id) && (
                      <button
                        onClick={() => handleSave(muestra)}
                        disabled={saving === muestra.id}
                        className={`p-1.5 rounded transition-colors ${
                          saving === muestra.id 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        }`}
                        title="Guardar"
                      >
                        <Save className={`w-4 h-4 ${saving === muestra.id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Escala de Medallas Activas:</h3>
        <div className="flex flex-wrap gap-4">
          {getActiveMedals().map((medal) => (
            <div key={medal.medalla} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: medal.color_hex }}
              ></span>
              <span className="text-sm text-gray-600">
                {medal.medalla}: {medal.puntuacion_minima} - {medal.puntuacion_maxima} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
