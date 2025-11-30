import { useState, useMemo, Suspense, ComponentType } from 'react';
import { Search, FileCode, Layout, Monitor, Folder, Eye, ChevronDown, ChevronRight, Play, ArrowLeft } from 'lucide-react';

// Importar componentes que se pueden previsualizar
import StatisticsManager from './StatisticsManager';
import CompaniesManager from './CompaniesManager';
import ListadoEmpresas from './ListadoEmpresas';
import SimpleSamplesList from './SimpleSamplesList';
import ManageSamples from './ManageSamples';
import PrintSamples from './PrintSamples';
import Chequeo from './Chequeo';
import TandasManager from './TandasManager';
import GestionTandas from './GestionTandas';
import MesasManager from './MesasManager';
import MesasVisualizacion from './MesasVisualizacion';
import AsignacionesMesas from './AsignacionesMesas';
import CatadoresManager from './CatadoresManager';
import DispositivosManager from './DispositivosManager';
import UnifiedInscriptionForm from './UnifiedInscriptionForm';
import SettingsManager from './SettingsManager';
import DiagnosticoSupabase from './DiagnosticoSupabase';
import EmailTest from './EmailTest';
import HeroLanding from './HeroLanding';
import LoginForm from './LoginForm';
import Reglamento from './Reglamento';
import Normativa from './Normativa';
import ImageUploader from './ImageUploader';
import Footer from './Footer';

interface ComponentInfo {
  name: string;
  path: string;
  category: string;
  description: string;
  canPreview: boolean;
}

// Mapa de componentes que se pueden previsualizar
const componentMap: Record<string, ComponentType<any>> = {
  'StatisticsManager': StatisticsManager,
  'CompaniesManager': CompaniesManager,
  'ListadoEmpresas': ListadoEmpresas,
  'SimpleSamplesList': SimpleSamplesList,
  'ManageSamples': ManageSamples,
  'PrintSamples': PrintSamples,
  'Chequeo': Chequeo,
  'TandasManager': TandasManager,
  'GestionTandas': GestionTandas,
  'MesasManager': MesasManager,
  'MesasVisualizacion': MesasVisualizacion,
  'AsignacionesMesas': AsignacionesMesas,
  'CatadoresManager': CatadoresManager,
  'DispositivosManager': DispositivosManager,
  'UnifiedInscriptionForm': () => <UnifiedInscriptionForm isAdmin={true} />,
  'SettingsManager': SettingsManager,
  'DiagnosticoSupabase': DiagnosticoSupabase,
  'EmailTest': EmailTest,
  'HeroLanding': () => <HeroLanding onInscribirse={() => {}} />,
  'LoginForm': () => <LoginForm onLogin={() => {}} onBack={() => {}} />,
  'Reglamento': Reglamento,
  'Normativa': Normativa,
  'ImageUploader': () => <ImageUploader onImageUploaded={() => {}} />,
  'Footer': Footer,
};

// Lista de todos los componentes TSX del proyecto
const allComponents: ComponentInfo[] = [
  // Core / App
  { name: 'App', path: 'src/App.tsx', category: 'Core', description: 'Componente principal de la aplicación', canPreview: false },
  { name: 'main', path: 'src/main.tsx', category: 'Core', description: 'Punto de entrada de la aplicación', canPreview: false },

  // Admin
  { name: 'AdminDashboard', path: 'src/components/AdminDashboard.tsx', category: 'Admin', description: 'Panel principal de administración', canPreview: false },
  { name: 'AdminInscriptionForm', path: 'src/components/AdminInscriptionForm.tsx', category: 'Admin', description: 'Formulario de inscripción para admin', canPreview: false },
  { name: 'StatisticsManager', path: 'src/components/StatisticsManager.tsx', category: 'Admin', description: 'Gestor de estadísticas', canPreview: true },
  { name: 'SettingsManager', path: 'src/components/SettingsManager.tsx', category: 'Admin', description: 'Gestor de configuración', canPreview: true },
  { name: 'ConfiguracionManager', path: 'src/components/ConfiguracionManager.tsx', category: 'Admin', description: 'Gestor de configuración avanzada', canPreview: false },
  { name: 'DiagnosticoSupabase', path: 'src/components/DiagnosticoSupabase.tsx', category: 'Admin', description: 'Diagnóstico de conexión Supabase', canPreview: true },

  // Empresas
  { name: 'CompaniesManager', path: 'src/components/CompaniesManager.tsx', category: 'Empresas', description: 'Gestor principal de empresas', canPreview: true },
  { name: 'CompaniesManager_NEW', path: 'src/components/CompaniesManager_NEW.tsx', category: 'Empresas', description: 'Nueva versión del gestor de empresas', canPreview: false },
  { name: 'ListadoEmpresas', path: 'src/components/ListadoEmpresas.tsx', category: 'Empresas', description: 'Listado de empresas inscritas', canPreview: true },
  { name: 'EmpresaScreen', path: 'src/components/EmpresaScreen.tsx', category: 'Empresas', description: 'Pantalla de datos de empresa', canPreview: false },

  // Muestras
  { name: 'SamplesManager', path: 'src/components/SamplesManager.tsx', category: 'Muestras', description: 'Gestor de muestras', canPreview: false },
  { name: 'SimpleSamplesList', path: 'src/components/SimpleSamplesList.tsx', category: 'Muestras', description: 'Lista simple de muestras', canPreview: true },
  { name: 'ManageSamples', path: 'src/components/ManageSamples.tsx', category: 'Muestras', description: 'Gestión avanzada de muestras', canPreview: true },
  { name: 'MuestrasScreen', path: 'src/components/MuestrasScreen.tsx', category: 'Muestras', description: 'Pantalla de muestras', canPreview: false },
  { name: 'SampleEditModal', path: 'src/components/SampleEditModal.tsx', category: 'Muestras', description: 'Modal de edición de muestra', canPreview: false },
  { name: 'PrintSamples', path: 'src/components/PrintSamples.tsx', category: 'Muestras', description: 'Impresión de etiquetas', canPreview: true },
  { name: 'Chequeo', path: 'src/components/Chequeo.tsx', category: 'Muestras', description: 'Chequeo de recepción de muestras', canPreview: true },

  // Tandas
  { name: 'TandasManager', path: 'src/components/TandasManager.tsx', category: 'Tandas', description: 'Gestor de tandas', canPreview: true },
  { name: 'GestionTandas', path: 'src/components/GestionTandas.tsx', category: 'Tandas', description: 'Gestión avanzada de tandas', canPreview: true },
  { name: 'TandaViewer', path: 'src/components/TandaViewer.tsx', category: 'Tandas', description: 'Visor de tandas', canPreview: false },

  // Mesas
  { name: 'MesasManager', path: 'src/components/MesasManager.tsx', category: 'Mesas', description: 'Gestor de mesas', canPreview: true },
  { name: 'MesasManagerWithTabs', path: 'src/components/MesasManagerWithTabs.tsx', category: 'Mesas', description: 'Gestor de mesas con pestañas', canPreview: false },
  { name: 'MesasVisualizacion', path: 'src/components/MesasVisualizacion.tsx', category: 'Mesas', description: 'Visualización de mesas', canPreview: true },
  { name: 'AsignacionesMesas', path: 'src/components/AsignacionesMesas.tsx', category: 'Mesas', description: 'Asignaciones de mesas', canPreview: true },

  // Catadores
  { name: 'CatadoresManager', path: 'src/components/CatadoresManager.tsx', category: 'Catadores', description: 'Gestor de catadores', canPreview: true },

  // Dispositivos
  { name: 'DispositivosManager', path: 'src/components/DispositivosManager.tsx', category: 'Dispositivos', description: 'Gestor de dispositivos', canPreview: true },

  // Inscripción
  { name: 'UnifiedInscriptionForm', path: 'src/components/UnifiedInscriptionForm.tsx', category: 'Inscripción', description: 'Formulario unificado de inscripción', canPreview: true },
  { name: 'ConfirmacionScreen', path: 'src/components/ConfirmacionScreen.tsx', category: 'Inscripción', description: 'Pantalla de confirmación', canPreview: false },
  { name: 'InscripcionExitosa', path: 'src/components/InscripcionExitosa.tsx', category: 'Inscripción', description: 'Pantalla de inscripción exitosa', canPreview: false },
  { name: 'SubscriptionForm', path: 'src/components/SubscriptionForm.tsx', category: 'Inscripción', description: 'Formulario de suscripción', canPreview: false },

  // Pagos
  { name: 'PaymentSelection', path: 'src/components/PaymentSelection.tsx', category: 'Pagos', description: 'Selección de método de pago', canPreview: false },
  { name: 'PayPalButton', path: 'src/components/PayPalButton.tsx', category: 'Pagos', description: 'Botón de PayPal', canPreview: false },
  { name: 'PayPalModal', path: 'src/components/PayPalModal.tsx', category: 'Pagos', description: 'Modal de PayPal', canPreview: false },

  // Auth / Login
  { name: 'LoginForm', path: 'src/components/LoginForm.tsx', category: 'Autenticación', description: 'Formulario de login admin', canPreview: true },
  { name: 'UserLoginForm', path: 'src/components/UserLoginForm.tsx', category: 'Autenticación', description: 'Formulario de login usuario', canPreview: false },
  { name: 'UserDashboard', path: 'src/components/UserDashboard.tsx', category: 'Autenticación', description: 'Dashboard de usuario', canPreview: false },

  // Layout / UI
  { name: 'MainLayout', path: 'src/components/MainLayout.tsx', category: 'Layout', description: 'Layout principal', canPreview: false },
  { name: 'Header', path: 'src/components/Header.tsx', category: 'Layout', description: 'Cabecera de la aplicación', canPreview: false },
  { name: 'Footer', path: 'src/components/Footer.tsx', category: 'Layout', description: 'Pie de página', canPreview: true },
  { name: 'HeroLanding', path: 'src/components/HeroLanding.tsx', category: 'Layout', description: 'Hero de la landing page', canPreview: true },
  { name: 'Modal', path: 'src/components/Modal.tsx', category: 'Layout', description: 'Componente modal reutilizable', canPreview: false },

  // Utilidades
  { name: 'ImageUploader', path: 'src/components/ImageUploader.tsx', category: 'Utilidades', description: 'Cargador de imágenes', canPreview: true },
  { name: 'EmailTest', path: 'src/components/EmailTest.tsx', category: 'Utilidades', description: 'Prueba de envío de emails', canPreview: true },
  { name: 'PWAInstallBanner', path: 'src/components/PWAInstallBanner.tsx', category: 'Utilidades', description: 'Banner de instalación PWA', canPreview: false },
  { name: 'UpdateNotification', path: 'src/components/UpdateNotification.tsx', category: 'Utilidades', description: 'Notificación de actualizaciones', canPreview: false },

  // Información
  { name: 'Reglamento', path: 'src/components/Reglamento.tsx', category: 'Información', description: 'Reglamento del concurso', canPreview: true },
  { name: 'Normativa', path: 'src/components/Normativa.tsx', category: 'Información', description: 'Normativa aplicable', canPreview: true },
];

// Colores por categoría
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'Core': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  'Admin': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  'Empresas': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  'Muestras': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  'Tandas': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  'Mesas': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  'Catadores': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  'Dispositivos': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  'Inscripción': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'Pagos': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  'Autenticación': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  'Layout': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  'Utilidades': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  'Información': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
};

export default function PantallasManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [previewComponent, setPreviewComponent] = useState<ComponentInfo | null>(null);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = [...new Set(allComponents.map(c => c.category))];
    return cats.sort();
  }, []);

  // Filtrar componentes
  const filteredComponents = useMemo(() => {
    return allComponents.filter(component => {
      const matchesSearch = 
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Agrupar por categoría
  const groupedComponents = useMemo(() => {
    const grouped: Record<string, ComponentInfo[]> = {};
    filteredComponents.forEach(component => {
      if (!grouped[component.category]) {
        grouped[component.category] = [];
      }
      grouped[component.category].push(component);
    });
    return grouped;
  }, [filteredComponents]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  };

  const handleComponentClick = (component: ComponentInfo) => {
    if (component.canPreview && componentMap[component.name]) {
      setPreviewComponent(component);
    }
  };

  const closePreview = () => {
    setPreviewComponent(null);
  };

  // Si hay un componente en preview, mostrarlo
  if (previewComponent) {
    const PreviewComp = componentMap[previewComponent.name];
    const colors = getCategoryColor(previewComponent.category);
    
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header de preview */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={closePreview}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al catálogo
                </button>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <FileCode className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">{previewComponent.name}</h2>
                    <p className="text-sm text-gray-500">{previewComponent.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors.bg} ${colors.text}`}>
                  {previewComponent.category}
                </span>
                <code className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded">
                  {previewComponent.path}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del componente */}
        <div className="p-4">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          }>
            {PreviewComp && <PreviewComp />}
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pantallas del Sistema</h1>
            <p className="text-gray-500">Catálogo de todos los componentes TSX del proyecto - Haz clic en los que tienen <Play className="w-4 h-4 inline text-green-500" /> para previsualizarlos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{allComponents.length}</p>
              <p className="text-xs text-gray-500">Total Componentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Folder className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
              <p className="text-xs text-gray-500">Categorías</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{allComponents.filter(c => c.canPreview).length}</p>
              <p className="text-xs text-gray-500">Con Preview</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{filteredComponents.length}</p>
              <p className="text-xs text-gray-500">Mostrando</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar componente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Lista
            </button>
          </div>

          {/* Expand/Collapse buttons */}
          {viewMode === 'list' && (
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Expandir todo
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Colapsar todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredComponents.map((component) => {
            const colors = getCategoryColor(component.category);
            const canClick = component.canPreview && componentMap[component.name];
            return (
              <div
                key={component.path}
                onClick={() => handleComponentClick(component)}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 group ${
                  canClick 
                    ? 'hover:shadow-lg hover:border-green-400 cursor-pointer hover:scale-[1.02]' 
                    : 'hover:shadow-md hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${colors.bg} relative`}>
                    <FileCode className={`w-5 h-5 ${colors.text}`} />
                    {canClick && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                    {component.category}
                  </span>
                </div>
                <h3 className={`font-semibold text-gray-800 mb-1 transition-colors ${canClick ? 'group-hover:text-green-600' : 'group-hover:text-primary-600'}`}>
                  {component.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {component.description}
                </p>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <code className="text-xs text-gray-400 font-mono block truncate flex-1" title={component.path}>
                    {component.path}
                  </code>
                  {canClick && (
                    <span className="ml-2 text-xs text-green-600 font-medium flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      Preview
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {Object.entries(groupedComponents)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, components]) => {
              const colors = getCategoryColor(category);
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${colors.bg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                        <Folder className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="text-left">
                        <h3 className={`font-semibold ${colors.text}`}>{category}</h3>
                        <p className="text-sm text-gray-500">{components.length} componentes</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {components.map((component) => {
                        const canClick = component.canPreview && componentMap[component.name];
                        return (
                          <div
                            key={component.path}
                            onClick={() => handleComponentClick(component)}
                            className={`flex items-center justify-between p-4 transition-colors ${
                              canClick 
                                ? 'hover:bg-green-50 cursor-pointer' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <FileCode className="w-5 h-5 text-gray-400" />
                                {canClick && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                    <Play className="w-2 h-2 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className={`font-medium ${canClick ? 'text-green-700' : 'text-gray-800'}`}>
                                  {component.name}
                                  {canClick && <span className="ml-2 text-xs text-green-500">(Click para preview)</span>}
                                </h4>
                                <p className="text-sm text-gray-500">{component.description}</p>
                              </div>
                            </div>
                            <code className="text-xs text-gray-400 font-mono hidden md:block">
                              {component.path}
                            </code>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Empty state */}
      {filteredComponents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No se encontraron componentes</h3>
          <p className="text-gray-500">Intenta con otro término de búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
}
