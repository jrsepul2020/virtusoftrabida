import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Edit, X, ChevronDown, Hand } from 'lucide-react';

type SortField = 'codigo' | 'nombre' | 'categoria' | 'pais' | 'azucar' | 'grado';
type SortDirection = 'asc' | 'desc';

export default function SimpleSamplesList() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [empresaPedido, setEmpresaPedido] = useState<number | null>(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterAndSortSamples();
  }, [searchTerm, samples, sortField, sortDirection, selectedCategories]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;

      setSamples(samplesData || []);

      const uniqueCategories = Array.from(
        new Set(samplesData?.map(s => s.categoria).filter(Boolean) as string[])
      ).sort();
      setAvailableCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSamples = () => {
    let filtered = [...samples];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (sample) => sample.categoria && selectedCategories.includes(sample.categoria)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sample) =>
          sample.nombre.toLowerCase().includes(term) ||
          sample.codigo.toString().includes(term) ||
          sample.categoria?.toLowerCase().includes(term) ||
          sample.pais?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'codigo':
          aValue = a.codigo;
          bValue = b.codigo;
          break;
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria?.toLowerCase() || '';
          bValue = b.categoria?.toLowerCase() || '';
          break;
        case 'pais':
          aValue = a.pais?.toLowerCase() || '';
          bValue = b.pais?.toLowerCase() || '';
          break;
        case 'azucar':
          aValue = a.azucar ?? -1;
          bValue = b.azucar ?? -1;
          break;
        case 'grado':
          aValue = a.grado ?? -1;
          bValue = b.grado ?? -1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSamples(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4" /> :
      <ArrowDown className="w-4 h-4" />;
  };

  const handleEditSample = async (sample: Sample) => {
    setEditingSample({ ...sample });

    if (sample.empresa) {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('pedido')
          .eq('name', sample.empresa)
          .maybeSingle();

        if (error) throw error;
        setEmpresaPedido(data?.pedido || null);
      } catch (error) {
        console.error('Error fetching empresa pedido:', error);
        setEmpresaPedido(null);
      }
    } else {
      setEmpresaPedido(null);
    }
  };

  const handleSaveSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('muestras')
        .update({
          nombre: editingSample.nombre,
          categoria: editingSample.categoria,
          empresa: editingSample.empresa,
          codigotexto: editingSample.codigotexto,
          origen: editingSample.origen,
          igp: editingSample.igp,
          pais: editingSample.pais,
          azucar: editingSample.azucar,
          grado: editingSample.grado,
          existencias: editingSample.existencias,
          año: editingSample.año,
          tipouva: editingSample.tipouva,
          tipoaceituna: editingSample.tipoaceituna,
          destilado: editingSample.destilado,
          fecha: editingSample.fecha,
          manual: editingSample.manual,
          categoriaoiv: editingSample.categoriaoiv,
          categoriadecata: editingSample.categoriadecata,
        })
        .eq('id', editingSample.id);

      if (error) throw error;
      setEditingSample(null);
      await fetchSamples();
    } catch (error) {
      console.error('Error updating sample:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
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
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-3">
          <div className="relative sm:w-auto">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                <span className="hidden sm:inline">Filtrar por </span>Categoría
                {selectedCategories.length > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full mt-2 left-0 right-0 sm:right-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10 sm:min-w-[300px] max-h-[400px] overflow-y-auto">
                <div className="p-2">
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="select-none">{category}</span>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No hay categorías disponibles</div>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="bg-primary-50 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">
            <div className="text-xs sm:text-sm text-primary-600 font-medium">
              <span className="hidden sm:inline">Total: </span>{samples.length}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabla para pantallas grandes */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('codigo')}
                >
                  <div className="flex items-center gap-1">
                    Código
                    {getSortIcon('codigo')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    {getSortIcon('nombre')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoría
                    {getSortIcon('categoria')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pais')}
                >
                  <div className="flex items-center gap-1">
                    País
                    {getSortIcon('pais')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('azucar')}
                >
                  <div className="flex items-center gap-1">
                    Azúcar
                    {getSortIcon('azucar')}
                  </div>
                </th>
                <th
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('grado')}
                >
                  <div className="flex items-center gap-1">
                    Grado
                    {getSortIcon('grado')}
                  </div>
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSamples.map((sample, index) => (
                <tr
                  key={sample.id}
                  className={`${
                    sample.manual
                      ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {sample.manual && <Hand className="w-3 h-3 text-red-600" />}
                      <span className={`text-sm font-bold ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>{sample.codigo}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={`text-sm font-medium flex items-center gap-1 ${
                      sample.manual ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {sample.manual && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold border border-red-300">
                          MANUAL
                        </span>
                      )}
                      {sample.nombre}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>{sample.categoria || '-'}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>{sample.pais || '-'}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                      {sample.azucar !== null && sample.azucar !== undefined ? `${sample.azucar}` : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-sm ${sample.manual ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                      {sample.grado !== null && sample.grado !== undefined ? `${sample.grado}` : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => handleEditSample(sample)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden">
          {filteredSamples.map((sample) => (
            <div
              key={sample.id}
              className={`border-b border-gray-200 p-4 ${
                sample.manual ? 'bg-red-50 border-l-4 border-red-500' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {sample.manual && <Hand className="w-4 h-4 text-red-600" />}
                  <span className={`text-lg font-bold ${
                    sample.manual ? 'text-red-700' : 'text-gray-900'
                  }`}>#{sample.codigo}</span>
                  {sample.manual && (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                      MANUAL
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleEditSample(sample)}
                  className="text-primary-600 hover:text-primary-700 p-2"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className={`font-medium text-sm mb-2 ${
                sample.manual ? 'text-red-700' : 'text-gray-900'
              }`}>{sample.nombre}</h3>
              
              <div className="space-y-1 text-xs text-gray-600">
                {sample.categoria && (
                  <div className="flex justify-between">
                    <span>Categoría:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.categoria}
                    </span>
                  </div>
                )}
                {sample.pais && (
                  <div className="flex justify-between">
                    <span>País:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.pais}
                    </span>
                  </div>
                )}
                {(sample.azucar !== null && sample.azucar !== undefined) && (
                  <div className="flex justify-between">
                    <span>Azúcar:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.azucar}
                    </span>
                  </div>
                )}
                {(sample.grado !== null && sample.grado !== undefined) && (
                  <div className="flex justify-between">
                    <span>Grado:</span>
                    <span className={`font-medium ${sample.manual ? 'text-red-700' : 'text-gray-900'}`}>
                      {sample.grado}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron muestras
          </div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Mostrando {filteredSamples.length} de {samples.length} muestras
      </div>

      {editingSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Editar Muestra #{editingSample.codigo}</h2>
              <button
                onClick={() => setEditingSample(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveSample} className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 border-b pb-1">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={editingSample.codigo}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSample.nombre}
                    onChange={(e) => setEditingSample({ ...editingSample, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={editingSample.categoria || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, categoria: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="VINO BLANCO">VINO BLANCO</option>
                        <option value="VINO TINTO">VINO TINTO</option>
                        <option value="VINO ROSADO">VINO ROSADO</option>
                        <option value="VINO SIN ALCOHOL">VINO SIN ALCOHOL</option>
                        <option value="GENEROSO SECO">GENEROSO SECO</option>
                        <option value="GENEROSO DULCE">GENEROSO DULCE</option>
                        <option value="AROMATIZADO">AROMATIZADO</option>
                        <option value="ESPIRITUOSO ORIGEN VÍNICO">ESPIRITUOSO ORIGEN VÍNICO</option>
                        <option value="ESPIRITUOSO NO VÍNICO">ESPIRITUOSO NO VÍNICO</option>
                        <option value="ACEITE OLIVA VIRGEN EXTRA">ACEITE OLIVA VIRGEN EXTRA</option>
                        <option value="ACEITE OLIVA VIRGEN EXTRA ORGÁNICO">ACEITE OLIVA VIRGEN EXTRA ORGÁNICO</option>
                        <option value="ESPUMOSO">ESPUMOSO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Empresa
                      </label>
                      <input
                        type="text"
                        value={editingSample.empresa || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, empresa: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Pedido Empresa
                      </label>
                      <input
                        type="text"
                        value={empresaPedido !== null ? empresaPedido : '-'}
                        disabled
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 border-b pb-1">Detalles del Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={editingSample.pais || ''}
                    onChange={(e) => setEditingSample({ ...editingSample, pais: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Azúcar (g/L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSample.azucar !== null && editingSample.azucar !== undefined ? editingSample.azucar : ''}
                    onChange={(e) => setEditingSample({ ...editingSample, azucar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSample.grado !== null && editingSample.grado !== undefined ? editingSample.grado : ''}
                    onChange={(e) => setEditingSample({ ...editingSample, grado: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSample(null)}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
