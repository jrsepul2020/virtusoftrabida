import { useState, useEffect } from 'react';
import { supabase, type CompanyWithSamples, type Company } from '../lib/supabase';
import { Search, Eye, Mail, MapPin, X, Edit2, Save } from 'lucide-react';

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<CompanyWithSamples[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithSamples[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithSamples | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, statusFilter, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data: companiesData, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companiesWithSamples = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: samples } = await supabase
            .from('muestras')
            .select('*')
            .eq('ididempresa', company.id)
            .order('codigo', { ascending: true });

          return {
            ...company,
            samples: samples || [],
          };
        })
      );

      setCompanies(companiesWithSamples);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(term) ||
          company.email.toLowerCase().includes(term) ||
          company.pais?.toLowerCase().includes(term) ||
          company.contact_person?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((company) => company.status === statusFilter);
    }

    setFilteredCompanies(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleViewCompany = (company: CompanyWithSamples) => {
    setSelectedCompany(company);
  };

  const handleEditCompany = (company: CompanyWithSamples) => {
    setEditingCompany(company);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          name: editingCompany.name,
          email: editingCompany.email,
          phone: editingCompany.phone,
          movil: editingCompany.movil,
          address: editingCompany.address,
          contact_person: editingCompany.contact_person,
          nif: editingCompany.nif,
          codigo_postal: editingCompany.codigo_postal,
          poblacion: editingCompany.poblacion,
          ciudad: editingCompany.ciudad,
          pais: editingCompany.pais,
          observaciones: editingCompany.observaciones,
          conocimiento: editingCompany.conocimiento,
          pagina_web: editingCompany.pagina_web,
          pedido: editingCompany.pedido,
          totalinscripciones: editingCompany.totalinscripciones,
          status: editingCompany.status,
        })
        .eq('id', editingCompany.id);

      if (error) throw error;
      setEditingCompany(null);
      await fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Cargando empresas...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="text-sm text-primary-600 font-medium">Total Empresas</div>
            <div className="text-2xl font-bold text-primary-700">{companies.length}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-700">
              {companies.filter((c) => c.status === 'pending').length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Aprobadas</div>
            <div className="text-2xl font-bold text-green-700">
              {companies.filter((c) => c.status === 'approved').length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Rechazadas</div>
            <div className="text-2xl font-bold text-red-700">
              {companies.filter((c) => c.status === 'rejected').length}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, país o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredCompanies.length} de {companies.length} empresas
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabla para pantallas grandes */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscr.
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr 
                  key={company.id} 
                  onClick={() => setSelectedCompany(company)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    {company.pedido ? (
                      <span className="inline-flex items-center justify-center px-2 lg:px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold text-xs lg:text-sm">
                        {company.pedido}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div className="font-medium text-gray-900 text-sm lg:text-base">{company.name}</div>
                    {company.contact_person && (
                      <div className="text-xs lg:text-sm text-gray-500 truncate max-w-[150px]">{company.contact_person}</div>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-primary-100 text-primary-700 rounded-full font-bold text-xs lg:text-base">
                      {company.totalinscripciones || company.samples?.length || 0}
                    </span>
                  </td>
                  <td className="px-3 py-3 lg:py-4">
                    <a
                      href={`mailto:${company.email}`}
                      className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 text-xs lg:text-sm"
                      title={company.email}
                    >
                      <Mail className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                      <span className="truncate max-w-[120px] lg:max-w-[160px]">{company.email}</span>
                    </a>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    {getStatusBadge(company.status)}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-2 text-gray-700 text-xs lg:text-sm">
                      <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                      <span className="truncate max-w-[80px] lg:max-w-none">{company.pais || '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    <div className="flex items-center justify-center gap-1 lg:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCompany(company);
                        }}
                        className="inline-flex items-center justify-center p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar empresa"
                      >
                        <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompany(company);
                        }}
                        className="inline-flex items-center justify-center p-1.5 lg:p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móviles */}
        <div className="lg:hidden">
          {filteredCompanies.map((company) => (
            <div 
              key={company.id} 
              onClick={() => setSelectedCompany(company)}
              className="border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
                  {company.contact_person && (
                    <p className="text-xs text-gray-600 mt-1">{company.contact_person}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {company.pedido && (
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                      #{company.pedido}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                    {company.totalinscripciones || company.samples?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-xs text-gray-600">
                  <Mail className="w-3 h-3 mr-2" />
                  <span className="truncate">{company.email}</span>
                </div>
                {company.pais && (
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mr-2" />
                    <span>{company.pais}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {new Date(company.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>{getStatusBadge(company.status)}</div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCompany(company);
                    }}
                    className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar empresa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCompany(company);
                    }}
                    className="inline-flex items-center justify-center p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron empresas
          </div>
        )}
      </div>

      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Muestras de {selectedCompany.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {selectedCompany.samples?.length || 0} {selectedCompany.samples?.length === 1 ? 'muestra registrada' : 'muestras registradas'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              {selectedCompany.samples && selectedCompany.samples.length > 0 ? (
                <>
                  {/* Tabla para pantallas grandes */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-800 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Año
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Origen
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCompany.samples.map((sample) => (
                        <tr key={sample.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-primary-600">#{sample.codigo}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{sample.nombre}</div>
                            {(sample.tipouva || sample.tipoaceituna || sample.destilado) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {sample.tipouva && <span>Uva: {sample.tipouva}</span>}
                                {sample.tipoaceituna && <span>Aceituna: {sample.tipoaceituna}</span>}
                                {sample.destilado && <span>Destilado: {sample.destilado}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {sample.categoria ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {sample.categoria}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {sample.pais || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {sample.año || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            <div>{sample.origen || '-'}</div>
                            {sample.igp && (
                              <div className="text-xs text-gray-500 mt-1">IGP: {sample.igp}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {sample.pagada ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Pagada
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                No Pagada
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {/* Vista de tarjetas para móvil */}
                  <div className="sm:hidden space-y-4">
                    {selectedCompany.samples.map((sample) => (
                      <div key={sample.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{sample.nombre}</h4>
                          <span className="text-lg font-bold text-primary-600">#{sample.codigo}</span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          {sample.categoria && (
                            <div className="flex justify-between">
                              <span>Categoría:</span>
                              <span className="font-medium">{sample.categoria}</span>
                            </div>
                          )}
                          {sample.pais && (
                            <div className="flex justify-between">
                              <span>País:</span>
                              <span className="font-medium">{sample.pais}</span>
                            </div>
                          )}
                          {sample.año && (
                            <div className="flex justify-between">
                              <span>Año:</span>
                              <span className="font-medium">{sample.año}</span>
                            </div>
                          )}
                          {sample.origen && (
                            <div className="flex justify-between">
                              <span>Origen:</span>
                              <span className="font-medium">{sample.origen}</span>
                            </div>
                          )}
                          {sample.igp && (
                            <div className="flex justify-between">
                              <span>IGP:</span>
                              <span className="font-medium">{sample.igp}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <div className="text-xs">
                            {(sample.tipouva || sample.tipoaceituna || sample.destilado) && (
                              <div className="text-gray-500">
                                {sample.tipouva && <span>Uva: {sample.tipouva}</span>}
                                {sample.tipoaceituna && <span>Aceituna: {sample.tipoaceituna}</span>}
                                {sample.destilado && <span>Destilado: {sample.destilado}</span>}
                              </div>
                            )}
                          </div>
                          <div>
                            {sample.pagada ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Pagada
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                No Pagada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm sm:text-lg">No hay muestras registradas para esta empresa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Editar Empresa</h2>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingCompany.email}
                    onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={editingCompany.contact_person || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Móvil
                  </label>
                  <input
                    type="text"
                    value={editingCompany.movil || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, movil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={editingCompany.nif || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, nif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={editingCompany.pais || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, pais: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={editingCompany.ciudad || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, ciudad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Población
                  </label>
                  <input
                    type="text"
                    value={editingCompany.poblacion || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, poblacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={editingCompany.codigo_postal || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, codigo_postal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={editingCompany.address || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Página Web
                  </label>
                  <input
                    type="url"
                    value={editingCompany.pagina_web || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, pagina_web: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pedido
                  </label>
                  <input
                    type="number"
                    value={editingCompany.pedido || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, pedido: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Inscripciones
                  </label>
                  <input
                    type="number"
                    value={editingCompany.totalinscripciones}
                    onChange={(e) => setEditingCompany({ ...editingCompany, totalinscripciones: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editingCompany.status}
                    onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cómo nos conoció
                  </label>
                  <input
                    type="text"
                    value={editingCompany.conocimiento || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, conocimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={editingCompany.observaciones || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
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
