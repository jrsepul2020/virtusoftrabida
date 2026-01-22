import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Printer, FileSpreadsheet, ChevronUp, ChevronDown, Edit2, Trash2, X, Save, Eye } from 'lucide-react';
import type { Company } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface Sample {
  id: string;
  nombre_muestra: string;
  categoria: string;
  pais: string;
  created_at: string;
}

type SortField = 'created_at' | 'pedido' | 'name' | 'totalinscripciones' | 'pais' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ListadoEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ companyId: string; field: string } | null>(null);
  const [viewingSamples, setViewingSamples] = useState<{ company: Company; samples: Sample[] } | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carga de empresas...');
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📡 Respuesta de Supabase:', { 
        data: data?.length, 
        error,
        hasData: !!data 
      });

      if (error) {
        console.error('❌ Error fetching companies:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Empresas cargadas:', data?.length);
      console.log('📊 Primeras 3 empresas:', data?.slice(0, 3));
      setCompanies(data || []);
    } catch (error) {
      console.error('💥 Error en fetchCompanies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const filteredCompanies = companies
    .filter(company => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.pedido?.toString() || '').includes(searchTerm) ||
        (company.pais || company.country || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'pais') {
        aValue = a.pais || a.country || '';
        bValue = b.pais || b.country || '';
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const handleEditCompany = (company: Company) => {
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

      await fetchCompanies();
      setEditingCompany(null);
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la empresa "${companyName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      await fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar la empresa');
    }
  };

  const handleViewSamples = async (company: Company) => {
    setLoadingSamples(true);
    setViewingSamples({ company, samples: [] });
    
    try {
      const { data, error } = await supabase
        .from('muestras')
        .select('id, nombre_muestra, categoria, pais, created_at')
        .eq('empresa_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setViewingSamples({ company, samples: data || [] });
    } catch (error) {
      console.error('Error loading samples:', error);
      alert('Error al cargar las muestras');
      setViewingSamples(null);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleInlineEdit = async (companyId: string, field: keyof Company, value: any) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ [field]: value })
        .eq('id', companyId);

      if (error) throw error;

      // Actualizar el estado local
      setCompanies(companies.map(c => 
        c.id === companyId ? { ...c, [field]: value } : c
      ));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Error al actualizar el campo');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
    };

    const config = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Sin estado' };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllCompanies = () => {
    if (selectedCompanies.length === filteredCompanies.length) setSelectedCompanies([]);
    else setSelectedCompanies(filteredCompanies.map(c => c.id));
  };

  const handleDeleteSelectedCompanies = async () => {
    if (selectedCompanies.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedCompanies.length} empresa(s) seleccionada(s)? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.from('empresas').delete().in('id', selectedCompanies);
      if (error) throw error;
      setSelectedCompanies([]);
      await fetchCompanies();
    } catch (err) {
      console.error('Error eliminando empresas seleccionadas', err);
      alert('Error eliminando empresas seleccionadas');
    }
  };

  const handleExportExcel = () => {
    // Preparar datos para el Excel
    const data = filteredCompanies.map(company => ({
      'Fecha': new Date(company.created_at).toLocaleDateString('es-ES'),
      'Pedido': company.pedido || '-',
      'Nombre': company.name,
      'Email': company.email || '-',
      'Teléfono': company.phone || '-',
      'Móvil': company.movil || '-',
      'Nº Muestras': company.totalinscripciones || 0,
      'Estado': company.status === 'pending' ? 'Pendiente' : company.status === 'approved' ? 'Aprobado' : company.status === 'rejected' ? 'Rechazado' : '-',
      'País': company.country || company.pais || '-',
      'Observaciones': company.observaciones || '-'
    }));

    // Crear libro de trabajo y hoja
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');

    // Ajustar anchos de columna
    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 },  // Pedido
      { wch: 35 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Móvil
      { wch: 10 }, // Nº Muestras
      { wch: 12 }, // Estado
      { wch: 15 }, // País
      { wch: 40 }  // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Descargar archivo
    XLSX.writeFile(workbook, `listado-empresas-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Cargando empresas...</p>
      </div>
    );
  }

  console.log('🎯 Renderizando con:', {
    totalCompanies: companies.length,
    filteredCompanies: filteredCompanies.length,
    searchTerm,
    sortField,
    sortOrder
  });

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-8">
      <div className="w-full max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Listado de Empresas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Total: {filteredCompanies.length} empresas
            {companies.length !== filteredCompanies.length && ` (${companies.length} en total)`}
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, pedido o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleDeleteSelectedCompanies}
                disabled={selectedCompanies.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar ({selectedCompanies.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table / Mobile list */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">
              {companies.length === 0 
                ? 'No hay empresas registradas en el sistema' 
                : 'No se encontraron empresas con los criterios de búsqueda'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: cards list (hidden on lg+) */}
            <div className="lg:hidden space-y-3">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 min-w-0">
                        {company.pedido ? (
                          <span className="text-xs text-gray-700">Pedido:</span>
                        ) : null}
                        {company.pedido ? (
                          <span className="text-sm font-semibold text-gray-900 truncate bg-gray-100 px-2 py-0.5 rounded">
                            {company.pedido}
                          </span>
                        ) : null}
                        <div className="flex-1">
                          <div
                            className="text-base font-semibold text-gray-900 truncate"
                            title={company.name}
                          >
                            {company.name}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 truncate">
                            {company.email || company.contact_person || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 text-right">
                      {company.country || company.pais || '-'}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-gray-500">N Muestras:</span>
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-primary-600 text-white rounded-full text-sm font-semibold">
                          {company.totalinscripciones || 0}
                        </span>
                      </div>
                      <div className="ml-2 flex items-center">
                        <div className="text-sm">{getStatusBadge(company.status)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSamples(company);
                        }}
                        className="p-2 rounded-md text-green-600 hover:bg-green-50"
                        aria-label="Ver muestras"
                        title="Ver muestras"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCompany(company);
                        }}
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-50"
                        aria-label="Editar empresa"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id, company.name);
                        }}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50"
                        aria-label="Eliminar empresa"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table (hidden on small screens) */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-12">
                    <input type="checkbox" checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0} onChange={toggleSelectAllCompanies} className="w-4 h-4" />
                  </th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors w-20"
                  >
                    <div className="flex items-center gap-1">
                      Fecha
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('pedido')}
                    className="px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors w-16"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Ped
                      {getSortIcon('pedido')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Nombre
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-24">
                    Teléfono
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-24">
                    Móvil
                  </th>
                  <th 
                    onClick={() => handleSort('totalinscripciones')}
                    className="px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors w-16"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Muestras
                      {getSortIcon('totalinscripciones')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors w-24"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Estado
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('pais')}
                    className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors w-28"
                  >
                    <div className="flex items-center gap-1">
                      País
                      {getSortIcon('pais')}
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Observaciones
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white uppercase tracking-wider w-20">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCompanies.map((company) => (
                  <tr 
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-2 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                      <input type="checkbox" checked={selectedCompanies.includes(company.id)} onChange={() => toggleSelectCompany(company.id)} className="w-4 h-4" />
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                      {new Date(company.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </td>
                    <td className="px-2 py-1.5 text-center border-l border-gray-200">
                      {company.pedido ? (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-primary-600 text-white rounded font-semibold text-xs">
                          {company.pedido}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 font-medium border-l border-gray-200">
                      {editingCell?.companyId === company.id && editingCell?.field === 'name' ? (
                        <input
                          type="text"
                          defaultValue={company.name}
                          onBlur={(e) => handleInlineEdit(company.id, 'name', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineEdit(company.id, 'name', e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                          className="w-full px-1 py-0.5 border border-blue-500 rounded focus:ring-2 focus:ring-blue-300"
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCell({ companyId: company.id, field: 'name' })}
                          className="cursor-pointer hover:bg-blue-50 block px-1 rounded"
                        >
                          {company.name}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs border-l border-gray-200">
                      {company.email ? (
                        <a 
                          href={`mailto:${company.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs border-l border-gray-200">
                      {company.phone ? (
                        <a 
                          href={`tel:${company.phone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs border-l border-gray-200">
                      {company.movil ? (
                        <a 
                          href={`tel:${company.movil}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.movil}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center border-l border-gray-200">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full font-bold text-xs">
                        {company.totalinscripciones || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center border-l border-gray-200">
                      {getStatusBadge(company.status)}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-700 border-l border-gray-200">
                      {company.country || company.pais || '-'}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-600 border-l border-gray-200 max-w-xs truncate">
                      {company.observaciones || '-'}
                    </td>
                    <td className="px-2 py-1.5 text-center border-l border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSamples(company);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Ver muestras"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCompany(company);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompany(company.id, company.name);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Modal de Edición */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveCompany}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Editar Empresa</h3>
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={editingCompany.name}
                      onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editingCompany.email}
                      onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.phone || ''}
                      onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Móvil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Móvil
                    </label>
                    <input
                      type="tel"
                      value={editingCompany.movil || ''}
                      onChange={(e) => setEditingCompany({ ...editingCompany, movil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* NIF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIF/CIF
                    </label>
                    <input
                      type="text"
                      value={editingCompany.nif || ''}
                      onChange={(e) => setEditingCompany({ ...editingCompany, nif: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Persona de Contacto */}
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

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editingCompany.address || ''}
                      onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Código Postal */}
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

                  {/* Población */}
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

                  {/* País */}
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

                  {/* Página Web */}
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

                  {/* Pedido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Pedido
                    </label>
                    <input
                      type="number"
                      value={editingCompany.pedido || ''}
                      onChange={(e) => setEditingCompany({ ...editingCompany, pedido: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  {/* Total Inscripciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Muestras
                    </label>
                    <input
                      type="number"
                      value={editingCompany.totalinscripciones || 0}
                      onChange={(e) => setEditingCompany({ ...editingCompany, totalinscripciones: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  {/* Estado */}
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
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  {/* Observaciones */}
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
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Muestras */}
      {viewingSamples && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Muestras de {viewingSamples.company.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {viewingSamples.samples.length} muestras
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSamples(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingSamples ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">Cargando muestras...</span>
                </div>
              ) : viewingSamples.samples.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay muestras inscritas para esta empresa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingSamples.samples.map((sample, index) => (
                    <div 
                      key={sample.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm font-bold">
                              {index + 1}
                            </span>
                            <h4 className="text-base font-semibold text-gray-900">
                              {sample.nombre_muestra}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 ml-11">
                            <div>
                              <span className="text-xs text-gray-500">Categoría:</span>
                              <p className="text-sm font-medium text-gray-700">{sample.categoria}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">País:</span>
                              <p className="text-sm font-medium text-gray-700">{sample.pais}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Fecha:</span>
                              <p className="text-sm font-medium text-gray-700">
                                {new Date(sample.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingSamples(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-7xl, .max-w-7xl * {
            visibility: visible;
          }
          .max-w-7xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
          .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
