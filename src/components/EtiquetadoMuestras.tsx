/**
 * Listado para Etiquetado de Muestras
 * Genera listados con códigos de barras y QR para identificar muestras
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Tag,
  Printer,
  Download,
  Search,
  Filter,
  QrCode,
  BarChart3,
  Check,
  ChevronDown,
  Settings,
  Eye,
  RefreshCw,
  Copy
} from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import JsBarcode from 'jsbarcode';
import * as XLSX from 'xlsx';

interface Muestra {
  id: string;
  nombre: string;
  categoria: string;
  codigo?: string;
  codigo_ciego?: string;
  empresa_id: string;
  nombre_empresa?: string;
  pais?: string;
  grado?: number;
  anada?: number;
  estado?: string;
  orden?: number;
}

interface ConfigEtiqueta {
  mostrarNombre: boolean;
  mostrarCategoria: boolean;
  mostrarEmpresa: boolean;
  mostrarPais: boolean;
  mostrarCodigo: boolean;
  mostrarCodigoCiego: boolean;
  mostrarBarcode: boolean;
  mostrarQR: boolean;
  tamano: 'pequeno' | 'mediano' | 'grande';
}

const CONFIG_DEFAULT: ConfigEtiqueta = {
  mostrarNombre: false, // Para cata ciega
  mostrarCategoria: true,
  mostrarEmpresa: false, // Para cata ciega
  mostrarPais: false,
  mostrarCodigo: true,
  mostrarCodigoCiego: true,
  mostrarBarcode: true,
  mostrarQR: false,
  tamano: 'mediano',
};

export default function EtiquetadoMuestras() {
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedMuestras, setSelectedMuestras] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigEtiqueta>(CONFIG_DEFAULT);
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchMuestras = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('muestras')
        .select(`
          *,
          empresas:empresa_id(nombre_empresa, pais)
        `)
        .order('categoria')
        .order('codigo_ciego');

      if (error) throw error;

      const muestrasData = (data || []).map((m, index) => ({
        ...m,
        nombre_empresa: m.empresas?.nombre_empresa,
        pais: m.empresas?.pais,
        codigo: m.codigo || `M${String(index + 1).padStart(4, '0')}`,
        codigo_ciego: m.codigo_ciego || String(index + 1).padStart(3, '0'),
        orden: index + 1
      }));

      setMuestras(muestrasData);

      // Extraer categorías únicas
      const cats = [...new Set(muestrasData.map(m => m.categoria).filter(Boolean))];
      setCategorias(cats.sort());
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cargar muestras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMuestras();
  }, [fetchMuestras]);

  // Generar código de barras
  useEffect(() => {
    if (showPreview) {
      const barcodeElements = document.querySelectorAll('.barcode-svg');
      barcodeElements.forEach((el) => {
        const code = el.getAttribute('data-code');
        if (code) {
          try {
            JsBarcode(el, code, {
              format: 'CODE128',
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12,
              margin: 5,
            });
          } catch (e) {
            console.error('Error generando barcode:', e);
          }
        }
      });
    }
  }, [showPreview, selectedMuestras]);

  // Filtrar muestras
  const muestrasFiltradas = muestras.filter(m => {
    const matchSearch = !searchTerm ||
      m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo_ciego?.includes(searchTerm) ||
      m.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria = filterCategoria === 'all' || m.categoria === filterCategoria;

    return matchSearch && matchCategoria;
  });

  // Toggle selección
  const toggleSelectAll = () => {
    if (selectedMuestras.length === muestrasFiltradas.length) {
      setSelectedMuestras([]);
    } else {
      setSelectedMuestras(muestrasFiltradas.map(m => m.id));
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    const dataExport = muestrasFiltradas.map((m, i) => ({
      '#': i + 1,
      'Código': m.codigo,
      'Código Ciego': m.codigo_ciego,
      'Nombre': m.nombre,
      'Categoría': m.categoria,
      'Empresa': m.nombre_empresa,
      'País': m.pais,
      'Grado': m.grado,
      'Añada': m.anada,
    }));

    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Muestras');
    XLSX.writeFile(wb, `listado_muestras_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Excel exportado');
  };

  // Imprimir etiquetas
  const imprimirEtiquetas = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas de Muestras</title>
        <style>
          @page { margin: 10mm; }
          body { font-family: Arial, sans-serif; }
          .etiqueta-grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .etiqueta { 
            border: 1px solid #ccc; 
            padding: 10px; 
            page-break-inside: avoid;
            ${config.tamano === 'pequeno' ? 'width: 60mm; height: 30mm;' : ''}
            ${config.tamano === 'mediano' ? 'width: 80mm; height: 40mm;' : ''}
            ${config.tamano === 'grande' ? 'width: 100mm; height: 50mm;' : ''}
          }
          .codigo-ciego { font-size: 24px; font-weight: bold; text-align: center; }
          .info { font-size: 10px; margin-top: 5px; }
          .categoria { 
            display: inline-block; 
            padding: 2px 8px; 
            background: #eee; 
            border-radius: 10px; 
            font-size: 9px; 
          }
          svg { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Copiar códigos al portapapeles
  const copiarCodigos = () => {
    const seleccionadas = muestras.filter(m => selectedMuestras.includes(m.id));
    const codigos = seleccionadas.map(m => `${m.codigo_ciego}\t${m.nombre}\t${m.categoria}`).join('\n');
    navigator.clipboard.writeText(codigos);
    showSuccess('Códigos copiados al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-600" />
            Etiquetado de Muestras
          </h2>
          <p className="text-sm text-gray-500">
            {muestras.length} muestras · {selectedMuestras.length} seleccionadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={selectedMuestras.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Vista Previa
          </button>
        </div>
      </div>

      {/* Panel de configuración */}
      {showConfig && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Configuración de Etiquetas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'mostrarCodigo', label: 'Código interno' },
              { key: 'mostrarCodigoCiego', label: 'Código ciego' },
              { key: 'mostrarNombre', label: 'Nombre muestra' },
              { key: 'mostrarCategoria', label: 'Categoría' },
              { key: 'mostrarEmpresa', label: 'Empresa' },
              { key: 'mostrarPais', label: 'País' },
              { key: 'mostrarBarcode', label: 'Código de barras' },
              { key: 'mostrarQR', label: 'Código QR' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[item.key as keyof ConfigEtiqueta] as boolean}
                  onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">Tamaño:</span>
            {['pequeno', 'mediano', 'grande'].map(size => (
              <label key={size} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tamano"
                  checked={config.tamano === size}
                  onChange={() => setConfig({ ...config, tamano: size as any })}
                  className="text-purple-600"
                />
                <span className="text-sm capitalize">{size}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              {selectedMuestras.length === muestrasFiltradas.length ? 'Deseleccionar' : 'Seleccionar'} todas
            </button>
            <button
              onClick={copiarCodigos}
              disabled={selectedMuestras.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={fetchMuestras}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMuestras.length === muestrasFiltradas.length && muestrasFiltradas.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-purple-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Código Ciego</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">País</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Código</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {muestrasFiltradas.map((muestra, index) => (
                <tr 
                  key={muestra.id} 
                  className={`hover:bg-gray-50 ${selectedMuestras.includes(muestra.id) ? 'bg-purple-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMuestras.includes(muestra.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMuestras([...selectedMuestras, muestra.id]);
                        } else {
                          setSelectedMuestras(selectedMuestras.filter(id => id !== muestra.id));
                        }
                      }}
                      className="rounded text-purple-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-lg">
                      {muestra.codigo_ciego}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{muestra.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {muestra.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{muestra.nombre_empresa}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{muestra.pais}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{muestra.codigo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {muestrasFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No se encontraron muestras
          </div>
        )}
      </div>

      {/* Modal de vista previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Vista Previa de Etiquetas ({selectedMuestras.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={imprimirEtiquetas}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6" ref={printRef}>
              <div className="etiqueta-grid flex flex-wrap gap-4">
                {muestras
                  .filter(m => selectedMuestras.includes(m.id))
                  .map(muestra => (
                    <div
                      key={muestra.id}
                      className={`etiqueta border-2 border-gray-300 rounded-lg p-4 ${
                        config.tamano === 'pequeno' ? 'w-48' : 
                        config.tamano === 'mediano' ? 'w-64' : 'w-80'
                      }`}
                    >
                      {config.mostrarCodigoCiego && (
                        <div className="codigo-ciego text-3xl font-bold text-center text-purple-700 mb-2">
                          {muestra.codigo_ciego}
                        </div>
                      )}

                      {config.mostrarBarcode && (
                        <div className="flex justify-center my-2">
                          <svg 
                            className="barcode-svg" 
                            data-code={muestra.codigo_ciego}
                          />
                        </div>
                      )}

                      <div className="info space-y-1 text-center">
                        {config.mostrarCategoria && (
                          <span className="categoria inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {muestra.categoria}
                          </span>
                        )}

                        {config.mostrarNombre && (
                          <div className="text-sm font-medium">{muestra.nombre}</div>
                        )}

                        {config.mostrarEmpresa && (
                          <div className="text-xs text-gray-500">{muestra.nombre_empresa}</div>
                        )}

                        {config.mostrarPais && (
                          <div className="text-xs text-gray-400">{muestra.pais}</div>
                        )}

                        {config.mostrarCodigo && (
                          <div className="text-xs font-mono text-gray-400">{muestra.codigo}</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
