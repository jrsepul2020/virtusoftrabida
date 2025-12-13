import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Mail, X, Edit2, Save, Trash2, ChevronUp, ChevronDown, FileSpreadsheet, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import { type CompanyWithSamples, type Company } from '../lib/supabase';
import { useCompanies } from '../lib/useSupabaseQuery';
import * as queries from '../lib/supabaseQueries';

type SortField = 'name' | 'email' | 'created_at' | 'pais' | 'totalinscripciones' | 'pedido';
type SortDirection = 'asc' | 'desc';

type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
};

export default function CompaniesManager() {
  // ✅ NUEVO: Usar hook en lugar de useEffect manual
  const { data: companiesData, loading, error, refetch } = useCompanies();
  
  const [companiesWithSamples, setCompaniesWithSamples] = useState<CompanyWithSamples[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithSamples[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithSamples | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<CompanyWithSamples | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusConfigs, setStatusConfigs] = useState<any[]>([]);
  const [changingStatus, setChangingStatus] = useState<{ companyId: string; currentStatus: string } | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'pedido', label: 'Pedido', visible: true },
    { key: 'name', label: 'Nombre', visible: true },
    { key: 'totalinscripciones', label: 'Nº Muestras', visible: true },
    { key: 'telefono', label: 'Teléfonos', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'pagado', label: 'Pagado', visible: true },
    { key: 'status', label: 'Estado', visible: true },
    { key: 'pais', label: 'País', visible: true },
  ]);

  // ✅ NUEVO: Cargar muestras para cada empresa cuando cambien los datos
  useEffect(() => {
    if (companiesData) {
      loadCompaniesWithSamples(companiesData);
    }
  }, [companiesData]);

  // ✅ MEJORADO: Función más limpia para cargar muestras
  const loadCompaniesWithSamples = async (companies: Company[]) => {
    try {
      const companiesWithSamples = await Promise.all(
        companies.map(async (company) => {
          const samples = await queries.getSamplesByCompany(company.id);
          return {
            ...company,
            samples: samples || [],
          } as CompanyWithSamples;
        })
      );
      setCompaniesWithSamples(companiesWithSamples);
    } catch (error) {
      console.error('Error loading samples:', error);
    }
  };

  useEffect(() => {
    loadStatusConfigs();
  }, []);

  const loadStatusConfigs = async () => {
    try {
      const { data: configs } = await queries.supabase
        .from('status_configs')
        .select('*')
        .order('is_default', { ascending: false });

      if (configs && configs.length > 0) {
        setStatusConfigs(configs);
      } else {
        setDefaultStatusConfigs();
      }
    } catch (error) {
      console.log('Status configs not available, using defaults');
      setDefaultStatusConfigs();
    }
  };

  const setDefaultStatusConfigs = () => {
    setStatusConfigs([
      { value: 'pending', label: 'Pendiente', bg_color: 'bg-yellow-100', text_color: 'text-yellow-800' },
      { value: 'approved', label: 'Aprobada', bg_color: 'bg-green-100', text_color: 'text-green-800' },
      { value: 'rejected', label: 'Rechazada', bg_color: 'bg-red-100', text_color: 'text-red-800' },
    ]);
  };

  // ✅ MEJORADO: Usar useMemo para filtrado y ordenamiento
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companiesWithSamples];

    // Filtrar por búsqueda
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

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((company) => company.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'pais':
          aValue = (a.pais || '').toLowerCase();
          bValue = (b.pais || '').toLowerCase();
          break;
        case 'totalinscripciones':
          aValue = a.totalinscripciones || 0;
          bValue = b.totalinscripciones || 0;
          break;
        case 'pedido':
          aValue = a.pedido || 0;
          bValue = b.pedido || 0;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [companiesWithSamples, searchTerm, statusFilter, sortField, sortDirection]);

  // Actualizar filteredCompanies cuando cambie el resultado del memo
  useEffect(() => {
    setFilteredCompanies(filteredAndSortedCompanies);
  }, [filteredAndSortedCompanies]);

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
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-white" /> : 
      <ChevronDown className="w-4 h-4 text-white" />;
  };

  const isColumnVisible = (key: string) => {
    return columns.find(col => col.key === key)?.visible ?? true;
  };

  // ✅ MEJORADO: Función de guardado más clara
  const handleSave = async () => {
    if (!editingCompany) return;

    setSaving(true);
    try {
      await queries.updateCompany(editingCompany.id, editingCompany);
      
      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();
      
      setEditingCompany(null);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error('Error updating company:', error);
      alert('Error al actualizar la empresa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ MEJORADO: Función de eliminación más clara
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    setDeleting(true);
    try {
      await queries.deleteCompany(showDeleteConfirm.id);
      
      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();
      
      setShowDeleteConfirm(null);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar la empresa: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // ✅ MEJORADO: Cambio de estado más claro
  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      await queries.updateCompany(companyId, { status: newStatus as any });
      
      // ✅ NUEVO: Recargar datos automáticamente
      await refetch();
      
      setChangingStatus(null);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Error al cambiar el estado: ' + error.message);
    }
  };

  const handleSendEmail = async (company: CompanyWithSamples) => {
    try {
      const response = await fetch('/api/send-inscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (!response.ok) throw new Error('Error sending email');
      alert('Email enviado correctamente');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el email');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredCompanies.map(company => ({
      Pedido: company.pedido || '',
      Nombre: company.name,
      Email: company.email,
      Teléfono: company.telefono || company.phone || '',
      Móvil: company.movil || '',
      NIF: company.nif || '',
      Dirección: company.address || '',
      'Código Postal': company.postal || company.codigo_postal || '',
      Ciudad: company.city || company.ciudad || company.poblacion || '',
      País: company.country || company.pais || '',
      'Persona Contacto': company.contact_person || '',
      'Página Web': company.pagina_web || '',
      Conocimiento: company.conocimiento || '',
      'Nº Muestras': company.totalinscripciones || company.samples.length,
      Estado: company.status,
      Fecha: new Date(company.created_at).toLocaleDateString(),
      Observaciones: company.observaciones || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    XLSX.writeFile(wb, `empresas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusConfig = (status: string) => {
    return statusConfigs.find(config => config.value === status) || {
      value: status,
      label: status,
      bg_color: 'bg-gray-100',
      text_color: 'text-gray-800'
    };
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(columns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };

  // ✅ MEJORADO: Mostrar error si hay
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error al cargar empresas: {error.message}
          <button 
            onClick={() => refetch()} 
            className="ml-4 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Gestión de Empresas
        </h1>
        <p className="text-gray-600">
          Total: {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''}
          {searchTerm && ` (filtradas de ${companiesWithSamples.length})`}
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, país o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          {statusConfigs.map(config => (
            <option key={config.value} value={config.value}>
              {config.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowColumnConfig(!showColumnConfig)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          Columnas
        </button>

        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Excel
        </button>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Column Configuration */}
      {showColumnConfig && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3">Configurar columnas visibles</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {columns.map(col => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumnVisibility(col.key)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ✅ MEJORADO: Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Cargando empresas...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No se encontraron empresas</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-primary-600 hover:text-primary-700 underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-600 text-white">
                <tr>
                  {isColumnVisible('pedido') && (
                    <th
                      onClick={() => handleSort('pedido')}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-700"
                    >
                      <div className="flex items-center gap-1">
                        Pedido
                        {getSortIcon('pedido')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('name') && (
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-700"
                    >
                      <div className="flex items-center gap-1">
                        Nombre
                        {getSortIcon('name')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('totalinscripciones') && (
                    <th
                      onClick={() => handleSort('totalinscripciones')}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-700"
                    >
                      <div className="flex items-center gap-1">
                        Nº Muestras
                        {getSortIcon('totalinscripciones')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('telefono') && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Teléfonos
                    </th>
                  )}
                  {isColumnVisible('email') && (
                    <th
                      onClick={() => handleSort('email')}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-700"
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('pagado') && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Pagado
                    </th>
                  )}
                  {isColumnVisible('status') && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Estado
                    </th>
                  )}
                  {isColumnVisible('pais') && (
                    <th
                      onClick={() => handleSort('pais')}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-700"
                    >
                      <div className="flex items-center gap-1">
                        País
                        {getSortIcon('pais')}
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    {isColumnVisible('pedido') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.pedido || '-'}
                      </td>
                    )}
                    {isColumnVisible('name') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                        {company.contact_person && (
                          <div className="text-sm text-gray-500">
                            {company.contact_person}
                          </div>
                        )}
                      </td>
                    )}
                    {isColumnVisible('totalinscripciones') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.totalinscripciones || company.samples.length}
                      </td>
                    )}
                    {isColumnVisible('telefono') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          {(company.telefono || company.phone) && (
                            <a 
                              href={`tel:${company.telefono || company.phone}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {company.telefono || company.phone}
                            </a>
                          )}
                          {company.movil && (
                            <a 
                              href={`tel:${company.movil}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {company.movil}
                            </a>
                          )}
                          {!company.telefono && !company.phone && !company.movil && '-'}
                        </div>
                      </td>
                    )}
                    {isColumnVisible('email') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a 
                          href={`mailto:${company.email}`} 
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {company.email}
                        </a>
                      </td>
                    )}
                    {isColumnVisible('pagado') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const status = company.status?.toLowerCase();
                          const isPagado = (company as any).pago_confirmado;
                          
                          // Colores según estado
                          if (status === 'approved' || status === 'aprobada' || isPagado) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Sí
                              </span>
                            );
                          } else if (status === 'rejected' || status === 'rechazada') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                No
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Pendiente
                              </span>
                            );
                          }
                        })()}
                      </td>
                    )}
                    {isColumnVisible('status') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {changingStatus?.companyId === company.id ? (
                          <select
                            value={company.status}
                            onChange={(e) => handleStatusChange(company.id, e.target.value)}
                            className="text-sm rounded-full px-3 py-1 border border-gray-300"
                            autoFocus
                            onBlur={() => setChangingStatus(null)}
                          >
                            {statusConfigs.map(config => (
                              <option key={config.value} value={config.value}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            onClick={() => setChangingStatus({ companyId: company.id, currentStatus: company.status })}
                            className={`inline-flex text-xs leading-5 font-semibold rounded-full px-3 py-1 cursor-pointer ${getStatusConfig(company.status).bg_color} ${getStatusConfig(company.status).text_color}`}
                          >
                            {getStatusConfig(company.status).label}
                          </span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('pais') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.pais || company.country || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleSendEmail(company)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Enviar email"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(company)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCompany && !editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedCompany.name}
                  </h2>
                  <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-3 py-1 mt-2 ${getStatusConfig(selectedCompany.status).bg_color} ${getStatusConfig(selectedCompany.status).text_color}`}>
                    {getStatusConfig(selectedCompany.status).label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCompany(selectedCompany)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Información de Contacto
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {selectedCompany.email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedCompany.telefono || selectedCompany.phone || '-'}</p>
                    <p><span className="font-medium">Móvil:</span> {selectedCompany.movil || '-'}</p>
                    <p><span className="font-medium">Contacto:</span> {selectedCompany.contact_person || '-'}</p>
                    <p><span className="font-medium">Página Web:</span> {selectedCompany.pagina_web || '-'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Información de la Empresa
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">NIF:</span> {selectedCompany.nif || '-'}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedCompany.address || '-'}</p>
                    <p><span className="font-medium">Código Postal:</span> {selectedCompany.postal || selectedCompany.codigo_postal || '-'}</p>
                    <p><span className="font-medium">Ciudad:</span> {selectedCompany.city || selectedCompany.ciudad || selectedCompany.poblacion || '-'}</p>
                    <p><span className="font-medium">País:</span> {selectedCompany.pais || selectedCompany.country || '-'}</p>
                    <p><span className="font-medium">Conoció por:</span> {selectedCompany.conocimiento || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedCompany.observaciones && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Observaciones</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedCompany.observaciones}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Muestras ({selectedCompany.samples.length})
                </h3>
                {selectedCompany.samples.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay muestras registradas</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Código
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Categoría
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCompany.samples.map((sample) => (
                          <tr key={sample.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {sample.codigotexto || sample.codigo}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {sample.nombre}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {sample.categoria || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Editar Empresa
                </h2>
                <button
                  onClick={() => {
                    setEditingCompany(null);
                    setSelectedCompany(null);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCompany.name}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={editingCompany.nif || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, nif: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={editingCompany.contact_person || ''}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.telefono || editingCompany.phone || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, telefono: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Móvil
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.movil || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, movil: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editingCompany.address || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={editingCompany.postal || editingCompany.codigo_postal || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, postal: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={
                        editingCompany.city ||
                        editingCompany.ciudad ||
                        editingCompany.poblacion ||
                        ''
                      }
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, ciudad: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={editingCompany.pais || editingCompany.country || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, pais: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Página Web
                    </label>
                    <input
                      type="url"
                      value={editingCompany.pagina_web || ''}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, pagina_web: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={editingCompany.status}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {statusConfigs.map(config => (
                        <option key={config.value} value={config.value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={editingCompany.observaciones || ''}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          observaciones: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompany(null);
                      setSelectedCompany(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la empresa "
              {showDeleteConfirm.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
