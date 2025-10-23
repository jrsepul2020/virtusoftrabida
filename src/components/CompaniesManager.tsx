import { useState, useEffect } from 'react';
import { supabase, type CompanyWithSamples, type Company } from '../lib/supabase';
import { Search, Eye, Mail, X, Edit2, Save, Trash2, ChevronUp, ChevronDown, Printer } from 'lucide-react';

type SortField = 'name' | 'email' | 'created_at' | 'pais' | 'totalinscripciones' | 'pedido';
type SortDirection = 'asc' | 'desc';

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<CompanyWithSamples[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithSamples[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchCompanies();
    loadStatusConfigs();
  }, []);

  const loadStatusConfigs = async () => {
    try {
      const { data: configs } = await supabase
        .from('status_configs')
        .select('*')
        .order('is_default', { ascending: false });

      if (configs && configs.length > 0) {
        setStatusConfigs(configs);
      } else {
        // Estados por defecto si no hay configuración personalizada
        setStatusConfigs([
          { value: 'pending', label: 'Pendiente', bg_color: 'bg-yellow-100', text_color: 'text-yellow-800' },
          { value: 'approved', label: 'Aprobada', bg_color: 'bg-green-100', text_color: 'text-green-800' },
          { value: 'rejected', label: 'Rechazada', bg_color: 'bg-red-100', text_color: 'text-red-800' },
        ]);
      }
    } catch (error) {
      console.log('Status configs not available, using defaults');
      setStatusConfigs([
        { value: 'pending', label: 'Pendiente', bg_color: 'bg-yellow-100', text_color: 'text-yellow-800' },
        { value: 'approved', label: 'Aprobada', bg_color: 'bg-green-100', text_color: 'text-green-800' },
        { value: 'rejected', label: 'Rechazada', bg_color: 'bg-red-100', text_color: 'text-red-800' },
      ]);
    }
  };

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, statusFilter, companies, sortField, sortDirection]);

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
            id: company.id,
            name: company.name,
            nif: company.nif,
            address: company.address,
            postal: company.postal,
            city: company.city,
            country: company.country,
            telefono: company.telefono,
            email: company.email,
            status: company.status || 'pending',
            totalinscripciones: company.totalinscripciones,
            user_id: company.user_id,
            created_at: company.created_at,
            updated_at: company.updated_at,
            phone: company.phone,
            contact_person: company.contact_person,
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

    // Aplicar ordenamiento
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCompanies(filtered);
  };

  const getStatusBadge = (status: string, companyId?: string, isClickable: boolean = false) => {
    const statusConfig = statusConfigs.find(config => config.value === status) || {
      bg_color: 'bg-gray-100',
      text_color: 'text-gray-800',
      label: status || 'Sin estado'
    };
    
    return (
      <span 
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg_color} ${statusConfig.text_color} ${
          isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
        onClick={isClickable && companyId ? (e) => {
          e.stopPropagation();
          setChangingStatus({ companyId, currentStatus: status });
        } : undefined}
        title={isClickable ? 'Haz clic para cambiar estado' : undefined}
      >
        {statusConfig.label}
      </span>
    );
  };

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      // Asegurar que newStatus es del tipo correcto
      const validStatus = newStatus as 'pending' | 'approved' | 'rejected';
      
      const { error } = await supabase
        .from('empresas')
        .update({ status: validStatus })
        .eq('id', companyId);

      if (error) throw error;

      // Actualizar la lista local
      setCompanies(companies.map(company => 
        company.id === companyId ? { ...company, status: validStatus } : company
      ));
      
      setChangingStatus(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al cambiar el estado');
    }
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

  const handleDeleteCompany = async (company: CompanyWithSamples) => {
    setShowDeleteConfirm(company);
  };

  const confirmDeleteCompany = async () => {
    if (!showDeleteConfirm) return;

    setDeleting(true);
    try {
      // Primero eliminar todas las muestras asociadas
      const { error: samplesError } = await supabase
        .from('muestras')
        .delete()
        .eq('ididempresa', showDeleteConfirm.id);

      if (samplesError) {
        console.error('Error deleting samples:', samplesError);
        throw new Error('Error al eliminar las muestras de la empresa');
      }

      // Luego eliminar la empresa
      const { error: companyError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', showDeleteConfirm.id);

      if (companyError) {
        console.error('Error deleting company:', companyError);
        throw new Error('Error al eliminar la empresa');
      }

      // Actualizar la lista
      await fetchCompanies();
      setShowDeleteConfirm(null);
      
      // Mostrar notificación de éxito
      alert(`Empresa "${showDeleteConfirm.name}" y sus ${showDeleteConfirm.samples?.length || 0} muestras han sido eliminadas correctamente.`);
      
    } catch (error: any) {
      console.error('Error in delete operation:', error);
      alert(error.message || 'Error al eliminar la empresa');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    // Crear una ventana de impresión con todos los datos de las empresas
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Listado de Empresas - VIRTUS</title>
          <style>
            @media print {
              @page { margin: 1.5cm; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              font-size: 11px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3C542E;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #3C542E;
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .header p {
              color: #666;
              margin: 0;
              font-size: 12px;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin-bottom: 20px;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
            }
            .stat-box {
              text-align: center;
            }
            .stat-box .label {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
            }
            .stat-box .value {
              font-size: 20px;
              font-weight: bold;
              color: #3C542E;
            }
            .company {
              border: 1px solid #ddd;
              margin-bottom: 20px;
              padding: 15px;
              page-break-inside: avoid;
              border-radius: 8px;
              background: #fff;
            }
            .company-header {
              background: #3C542E;
              color: white;
              padding: 10px;
              margin: -15px -15px 15px -15px;
              border-radius: 8px 8px 0 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
            }
            .company-status {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-rejected { background: #fee2e2; color: #991b1b; }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 10px;
            }
            .info-item {
              padding: 5px 0;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .info-value {
              color: #000;
              font-size: 11px;
            }
            .samples-section {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
            }
            .samples-title {
              font-weight: bold;
              color: #3C542E;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 2px solid #ddd;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 INTERNATIONAL VIRTUS LA RÁBIDA</h1>
            <p>Listado Completo de Empresas Registradas</p>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="label">Total Empresas</div>
              <div class="value">${filteredCompanies.length}</div>
            </div>
            <div class="stat-box">
              <div class="label">Pendientes</div>
              <div class="value">${filteredCompanies.filter(c => c.status === 'pending').length}</div>
            </div>
            <div class="stat-box">
              <div class="label">Aprobadas</div>
              <div class="value">${filteredCompanies.filter(c => c.status === 'approved').length}</div>
            </div>
            <div class="stat-box">
              <div class="label">Total Muestras</div>
              <div class="value">${filteredCompanies.reduce((total, company) => total + (company.totalinscripciones || 0), 0)}</div>
            </div>
          </div>

          ${filteredCompanies.map((company, index) => `
            <div class="company">
              <div class="company-header">
                <span class="company-name">${index + 1}. ${company.name}</span>
                <span class="company-status status-${company.status}">
                  ${statusConfigs.find(s => s.value === company.status)?.label || company.status}
                </span>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">NIF / CIF</div>
                  <div class="info-value">${company.nif || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Nº Pedido</div>
                  <div class="info-value">${company.pedido || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${company.email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Teléfono</div>
                  <div class="info-value">${company.phone || company.telefono || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Móvil</div>
                  <div class="info-value">${company.movil || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Persona de Contacto</div>
                  <div class="info-value">${company.contact_person || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Dirección</div>
                  <div class="info-value">${company.address || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Código Postal</div>
                  <div class="info-value">${company.codigo_postal || company.postal || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Población</div>
                  <div class="info-value">${company.poblacion || company.ciudad || company.city || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">País</div>
                  <div class="info-value">${company.pais || company.country || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Página Web</div>
                  <div class="info-value">${company.pagina_web || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Fecha de Registro</div>
                  <div class="info-value">${new Date(company.created_at).toLocaleDateString('es-ES')}</div>
                </div>
              </div>

              ${company.observaciones ? `
                <div class="info-item" style="grid-column: span 2; margin-top: 10px;">
                  <div class="info-label">Observaciones</div>
                  <div class="info-value">${company.observaciones}</div>
                </div>
              ` : ''}

              ${company.conocimiento ? `
                <div class="info-item" style="grid-column: span 2; margin-top: 5px;">
                  <div class="info-label">¿Cómo nos conoció?</div>
                  <div class="info-value">${company.conocimiento}</div>
                </div>
              ` : ''}

              <div class="samples-section">
                <div class="samples-title">
                  📊 Muestras Inscritas: ${company.totalinscripciones || company.samples?.length || 0}
                </div>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <p>INTERNATIONAL VIRTUS LA RÁBIDA 2026 - Documento generado el ${new Date().toLocaleString('es-ES')}</p>
            <p>Total de empresas en este listado: ${filteredCompanies.length}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que se cargue el contenido antes de imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Muestras</div>
            <div className="text-2xl font-bold text-blue-700">
              {companies.reduce((total, company) => total + (company.totalinscripciones || company.samples?.length || 0), 0)}
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
            {statusConfigs.map((config) => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md"
            title="Imprimir listado de empresas"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden md:inline">Imprimir</span>
          </button>
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
                <th 
                  onClick={() => handleSort('pedido')}
                  className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Pedido
                    {getSortIcon('pedido')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('totalinscripciones')}
                  className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Nº Muestras
                    {getSortIcon('totalinscripciones')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('email')}
                  className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                  Estado
                </th>
                <th 
                  onClick={() => handleSort('created_at')}
                  className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('pais')}
                  className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    País
                    {getSortIcon('pais')}
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
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
                    <div>
                      {company.pedido ? (
                        <span className="inline-flex items-center justify-center px-2 lg:px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold text-xs lg:text-sm">
                          {company.pedido}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm lg:text-base">{company.name}</div>
                      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        {company.contact_person && <div>Contacto: {company.contact_person}</div>}
                        {company.nif && <div>NIF: {company.nif}</div>}
                        {company.telefono && <div>Tel: {company.telefono}</div>}
                        {company.address && <div className="truncate max-w-[200px]">Dir: {company.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-primary-100 text-primary-700 rounded-full font-bold text-xs lg:text-base">
                      {company.totalinscripciones || company.samples?.length || 0}
                    </span>
                  </td>
                  <td className="px-3 py-3 lg:py-4">
                    <div>
                      <a
                        href={`mailto:${company.email}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 text-xs lg:text-sm"
                        title={company.email}
                      >
                        <Mail className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] lg:max-w-[160px]">{company.email}</span>
                      </a>
                      <div className="text-xs text-gray-400 mt-1">
                        {company.movil && <div>Móvil: {company.movil}</div>}
                        {company.pagina_web && <div className="truncate max-w-[150px]">Web: {company.pagina_web}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                    {getStatusBadge(company.status, company.id, true)}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-500">
                    <div>
                      {new Date(company.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(company.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div>
                      <div className="text-gray-700 text-xs lg:text-sm">
                        <span className="truncate max-w-[80px] lg:max-w-none">{company.country || company.pais || '-'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        {company.city && <div>{company.city}</div>}
                        {company.postal && <div>CP: {company.postal}</div>}
                      </div>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company);
                        }}
                        className="inline-flex items-center justify-center p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar empresa y sus muestras"
                      >
                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
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
                  <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                    {company.contact_person && <div>Contacto: {company.contact_person}</div>}
                    {company.nif && <div>NIF: {company.nif}</div>}
                    {company.telefono && <div>Tel: {company.telefono}</div>}
                  </div>
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
                {(company.country || company.pais) && (
                  <div className="text-xs text-gray-600">
                    <span>{company.country || company.pais}</span>
                    {company.city && <span> - {company.city}</span>}
                  </div>
                )}
                <div className="text-xs text-gray-400 space-y-0.5">
                  {company.movil && <div>Móvil: {company.movil}</div>}
                  {company.address && <div className="truncate">Dir: {company.address}</div>}
                  <div>
                    {new Date(company.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })} - {new Date(company.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>{getStatusBadge(company.status, company.id, true)}</div>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCompany(company);
                    }}
                    className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar empresa y muestras"
                  >
                    <Trash2 className="w-4 h-4" />
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Año
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Origen
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
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
                    {statusConfigs.map((config) => (
                      <option key={config.value} value={config.value}>
                        {config.label}
                      </option>
                    ))}
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

      {/* Modal para cambiar estado */}
      {changingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar Estado</h3>
            
            <p className="text-gray-600 mb-4">
              Selecciona el nuevo estado para esta empresa:
            </p>

            <div className="space-y-2 mb-6">
              {statusConfigs.map((config) => (
                <button
                  key={config.value}
                  onClick={() => handleStatusChange(changingStatus.companyId, config.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    changingStatus.currentStatus === config.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{config.label}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg_color} ${config.text_color}`}>
                      {config.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setChangingStatus(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Empresa</h3>
                <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que quieres eliminar la empresa <strong>"{showDeleteConfirm.name}"</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium mb-1">⚠️ Esto eliminará permanentemente:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Los datos de la empresa</li>
                  <li>• <strong>{showDeleteConfirm.samples?.length || 0} muestra(s)</strong> asociada(s)</li>
                  <li>• Todo el historial relacionado</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCompany}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
