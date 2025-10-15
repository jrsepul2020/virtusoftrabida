import { useState, useEffect } from 'react';
import { supabase, type Sample } from '../lib/supabase';
import { Search, MapPin, Calendar, Droplet, Wine, Grape, Edit, Trash2, X, Hand } from 'lucide-react';

export default function SamplesManager() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [saving, setSaving] = useState(false);
  const [empresaPedido, setEmpresaPedido] = useState<number | null>(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data: samplesData, error } = await supabase
        .from('muestras')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;
      setSamples(samplesData || []);
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSamples = () => {
    if (!searchTerm) {
      setFilteredSamples(samples);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = samples.filter(
      (sample) =>
        sample.nombre.toLowerCase().includes(term) ||
        sample.codigo.toString().includes(term) ||
        sample.empresa?.toLowerCase().includes(term) ||
        sample.categoria?.toLowerCase().includes(term) ||
        sample.pais?.toLowerCase().includes(term)
    );
    setFilteredSamples(filtered);
  };

  const getCategoryColor = (categoria: string | null) => {
    if (!categoria) return 'bg-gray-100 text-gray-700';

    const cat = categoria.toLowerCase();
    if (cat.includes('blanco')) return 'bg-yellow-100 text-yellow-800';
    if (cat.includes('tinto')) return 'bg-red-100 text-red-800';
    if (cat.includes('rosado')) return 'bg-pink-100 text-pink-800';
    if (cat.includes('espumoso') || cat.includes('cava')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('aceite')) return 'bg-green-100 text-green-800';

    return 'bg-primary-100 text-primary-800';
  };

  const getPaymentBadge = (pagada: boolean) => {
    if (pagada) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagada</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">No Pagada</span>;
  };

  const togglePaymentStatus = async (sample: Sample) => {
    try {
      const { error } = await supabase
        .from('muestras')
        .update({ pagada: !sample.pagada })
        .eq('id', sample.id);

      if (error) throw error;
      await fetchSamples();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
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

  const handleDeleteSample = async (sample: Sample) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la muestra "${sample.nombre}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('muestras')
        .delete()
        .eq('id', sample.id);

      if (error) throw error;
      await fetchSamples();
    } catch (error) {
      console.error('Error deleting sample:', error);
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
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, empresa, categoría o país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando {filteredSamples.length} de {samples.length} muestras
        </div>
      </div>

      <div className="space-y-4">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            className={`rounded-xl shadow-md hover:shadow-lg transition-shadow ${
              sample.manual ? 'bg-red-50 border-2 border-red-200' : 'bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                    sample.manual ? 'bg-red-600' : 'bg-primary-600'
                  }`}>
                    <Wine className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                    {sample.manual && (
                      <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white">
                        <Hand className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                      {sample.manual && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                          <Hand className="w-3 h-3" />
                          MANUAL
                        </span>
                      )}
                      <span className={`text-base lg:text-lg font-bold ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>#{sample.codigo}</span>
                      <h3 className={`text-lg lg:text-xl font-bold ${
                        sample.manual ? 'text-red-700' : 'text-gray-900'
                      }`}>{sample.nombre}</h3>
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(sample.categoria)}`}>
                        {sample.categoria || 'Sin categoría'}
                      </span>
                      <button
                        onClick={() => togglePaymentStatus(sample)}
                        className="cursor-pointer"
                      >
                        {getPaymentBadge(sample.pagada)}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm mb-3">

                      {sample.pais && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{sample.pais}</span>
                        </div>
                      )}

                      {sample.año && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{sample.año}</span>
                        </div>
                      )}

                      {sample.existencias !== undefined && sample.existencias !== null && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>{sample.existencias} unidades</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      {sample.origen && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Origen:</span> {sample.origen}</span>
                        </div>
                      )}

                      {sample.igp && (
                        <div>
                          <span className="font-medium">IGP:</span> {sample.igp}
                        </div>
                      )}

                      {sample.azucar && (
                        <div className="flex items-center gap-2">
                          <Droplet className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Azúcar:</span> {sample.azucar} g/L</span>
                        </div>
                      )}

                      {sample.grado && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span><span className="font-medium">Grado:</span> {sample.grado}°</span>
                        </div>
                      )}

                      {sample.tipouva && (
                        <div className="flex items-center gap-2">
                          <Grape className="w-4 h-4 text-gray-400" />
                          <span><span className="font-medium">Uva:</span> {sample.tipouva}</span>
                        </div>
                      )}

                      {sample.tipoaceituna && (
                        <div>
                          <span className="font-medium">Aceituna:</span> {sample.tipoaceituna}
                        </div>
                      )}

                      {sample.destilado && (
                        <div>
                          <span className="font-medium">Destilado:</span> {sample.destilado}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-4 lg:ml-4">
                  {sample.empresa && (
                    <span className="text-lg font-medium text-gray-700">{sample.empresa}</span>
                  )}
                  <button
                    onClick={() => handleEditSample(sample)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSample(sample)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No se encontraron muestras</p>
        </div>
      )}

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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        value={editingSample.codigo}
                        disabled
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Código Texto
                      </label>
                      <input
                        type="text"
                        value={editingSample.codigotexto || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, codigotexto: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingSample.nombre}
                        onChange={(e) => setEditingSample({ ...editingSample, nombre: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingSample.categoria || ''}
                    onChange={(e) => setEditingSample({ ...editingSample, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={editingSample.fecha || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, fecha: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingSample.manual || false}
                          onChange={(e) => setEditingSample({ ...editingSample, manual: e.target.checked })}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Manual</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 border-b pb-1">Detalles del Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen
                  </label>
                  <input
                    type="text"
                    value={editingSample.origen || ''}
                    onChange={(e) => setEditingSample({ ...editingSample, origen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IGP
                  </label>
                  <input
                    type="text"
                    value={editingSample.igp || ''}
                    onChange={(e) => setEditingSample({ ...editingSample, igp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={editingSample.pais || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, pais: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Año
                      </label>
                      <input
                        type="number"
                        value={editingSample.año || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, año: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría OIV
                      </label>
                      <input
                        type="text"
                        value={editingSample.categoriaoiv || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, categoriaoiv: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría de Cata
                      </label>
                      <input
                        type="text"
                        value={editingSample.categoriadecata || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, categoriadecata: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Azúcar (g/L)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingSample.azucar || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, azucar: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Grado (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingSample.grado || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, grado: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Existencias (unidades)
                      </label>
                      <input
                        type="number"
                        value={editingSample.existencias !== undefined ? editingSample.existencias : ''}
                        onChange={(e) => setEditingSample({ ...editingSample, existencias: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {!editingSample.categoria?.includes('ACEITE') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tipo de Uva
                        </label>
                        <input
                          type="text"
                          value={editingSample.tipouva || ''}
                          onChange={(e) => setEditingSample({ ...editingSample, tipouva: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {editingSample.categoria?.includes('ACEITE') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tipo de Aceituna
                        </label>
                        <input
                          type="text"
                          value={editingSample.tipoaceituna || ''}
                          onChange={(e) => setEditingSample({ ...editingSample, tipoaceituna: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {!editingSample.categoria?.includes('ACEITE') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Destilado
                        </label>
                        <input
                          type="text"
                          value={editingSample.destilado || ''}
                          onChange={(e) => setEditingSample({ ...editingSample, destilado: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}
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
