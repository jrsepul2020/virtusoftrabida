/**
 * Etiquetado de Muestras - Versión simplificada
 * Genera etiquetas con código de barras + codigotexto
 * Sin marcos, solo color negro, medidas configurables
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Tag,
  Printer,
  Download,
  Search,
  Filter,
  Settings,
  Eye,
  RefreshCw,
  Copy,
  Ruler
} from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import JsBarcode from 'jsbarcode';
import * as XLSX from 'xlsx';

interface Muestra {
  id: string;
  nombre: string;
  categoria: string;
  codigotexto?: string;
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

// Modelos de etiqueta predefinidos (en mm)
interface ModeloEtiqueta {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  columnas: number;
  marginH: number;
  marginV: number;
  barcodeHeight: number;
  fontSize: number;
}

const MODELOS_ETIQUETA: ModeloEtiqueta[] = [
  { id: 'mini', nombre: 'Mini (30x15mm)', ancho: 30, alto: 15, columnas: 5, marginH: 2, marginV: 2, barcodeHeight: 25, fontSize: 10 },
  { id: 'pequena', nombre: 'Pequeña (40x20mm)', ancho: 40, alto: 20, columnas: 4, marginH: 3, marginV: 3, barcodeHeight: 30, fontSize: 11 },
  { id: 'mediana', nombre: 'Mediana (50x25mm)', ancho: 50, alto: 25, columnas: 3, marginH: 4, marginV: 4, barcodeHeight: 35, fontSize: 12 },
  { id: 'grande', nombre: 'Grande (70x35mm)', ancho: 70, alto: 35, columnas: 2, marginH: 5, marginV: 5, barcodeHeight: 45, fontSize: 14 },
  { id: 'xl', nombre: 'Extra Grande (100x50mm)', ancho: 100, alto: 50, columnas: 2, marginH: 8, marginV: 8, barcodeHeight: 60, fontSize: 16 },
  { id: 'custom', nombre: 'Personalizada', ancho: 50, alto: 25, columnas: 3, marginH: 4, marginV: 4, barcodeHeight: 35, fontSize: 12 },
];

export default function EtiquetadoMuestras() {
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedMuestras, setSelectedMuestras] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Configuración de etiqueta
  const [modeloId, setModeloId] = useState('mediana');
  const [customConfig, setCustomConfig] = useState<ModeloEtiqueta>(MODELOS_ETIQUETA[2]);
  
  // Obtener modelo actual
  const modeloActual = modeloId === 'custom' 
    ? customConfig 
    : MODELOS_ETIQUETA.find(m => m.id === modeloId) || MODELOS_ETIQUETA[2];

  const fetchMuestras = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('muestras')
        .select(`
          *,
          empresas:empresa_id (
            name,
            pais
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error Supabase:', error);
        throw error;
      }

      console.log('Muestras cargadas:', data?.length);

      const muestrasData = (data || []).map((m, index) => ({
        ...m,
        nombre_empresa: m.empresas?.name || m.empresa || 'Sin empresa',
        pais: m.empresas?.pais || m.pais,
        codigotexto: m.codigotexto || m.codigo || `M${String(index + 1).padStart(4, '0')}`,
        codigo_ciego: m.codigo_ciego || m.codigotexto || String(index + 1).padStart(3, '0'),
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

  // Generar códigos de barras cuando se muestra preview
  useEffect(() => {
    if (showPreview) {
      setTimeout(() => {
        const barcodeElements = document.querySelectorAll('.barcode-svg');
        barcodeElements.forEach((el) => {
          const code = el.getAttribute('data-code');
          if (code) {
            try {
              JsBarcode(el, code, {
                format: 'CODE128',
                width: 1.5,
                height: modeloActual.barcodeHeight,
                displayValue: false, // No mostrar valor debajo del barcode, lo ponemos nosotros
                margin: 0,
                background: 'transparent',
                lineColor: '#000000',
              });
            } catch (e) {
              console.error('Error generando barcode:', e);
            }
          }
        });
      }, 100);
    }
  }, [showPreview, selectedMuestras, modeloActual.barcodeHeight]);

  // Filtrar muestras
  const muestrasFiltradas = muestras.filter(m => {
    const matchSearch = !searchTerm ||
      m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigotexto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      'Código': m.codigotexto,
      'Nombre': m.nombre,
      'Categoría': m.categoria,
      'Empresa': m.nombre_empresa,
      'País': m.pais,
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

    // Clonar el contenido para la impresión
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas de Muestras</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page { 
            margin: 5mm;
            size: A4;
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
          }
          .etiqueta-grid { 
            display: flex; 
            flex-wrap: wrap; 
            gap: ${modeloActual.marginV}mm ${modeloActual.marginH}mm;
            justify-content: flex-start;
          }
          .etiqueta { 
            width: ${modeloActual.ancho}mm;
            height: ${modeloActual.alto}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
            padding: 2mm;
          }
          .barcode-container {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          .barcode-svg {
            max-width: 100%;
            height: auto;
          }
          .codigo-texto { 
            font-size: ${modeloActual.fontSize}pt;
            font-weight: bold;
            text-align: center;
            color: #000;
            margin-top: 1mm;
            font-family: 'Courier New', monospace;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="etiqueta-grid">
          ${muestras
            .filter(m => selectedMuestras.includes(m.id))
            .map(muestra => `
              <div class="etiqueta">
                <div class="barcode-container">
                  <svg class="barcode-svg" data-code="${muestra.codigotexto}"></svg>
                </div>
                <div class="codigo-texto">${muestra.codigotexto}</div>
              </div>
            `).join('')}
        </div>
        <script>
          document.querySelectorAll('.barcode-svg').forEach(function(el) {
            var code = el.getAttribute('data-code');
            if (code) {
              try {
                JsBarcode(el, code, {
                  format: 'CODE128',
                  width: 1.5,
                  height: ${modeloActual.barcodeHeight},
                  displayValue: false,
                  margin: 0,
                  background: 'transparent',
                  lineColor: '#000000'
                });
              } catch (e) {
                console.error('Error:', e);
              }
            }
          });
          setTimeout(function() { window.print(); }, 500);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copiar códigos al portapapeles
  const copiarCodigos = () => {
    const seleccionadas = muestras.filter(m => selectedMuestras.includes(m.id));
    const codigos = seleccionadas.map(m => m.codigotexto).join('\n');
    navigator.clipboard.writeText(codigos);
    showSuccess(`${seleccionadas.length} códigos copiados`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-gray-700" />
            Etiquetado de Muestras
          </h2>
          <p className="text-sm text-gray-500">
            {muestras.length} muestras · {selectedMuestras.length} seleccionadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showConfig ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Medidas
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={selectedMuestras.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Vista Previa
          </button>
        </div>
      </div>

      {/* Panel de configuración de medidas */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Etiquetas
          </h3>
          
          {/* Selector de modelo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Modelo de etiqueta</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {MODELOS_ETIQUETA.map(modelo => (
                <button
                  key={modelo.id}
                  onClick={() => {
                    setModeloId(modelo.id);
                    if (modelo.id !== 'custom') {
                      setCustomConfig(modelo);
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    modeloId === modelo.id
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {modelo.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Configuración personalizada */}
          {modeloId === 'custom' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ancho (mm)</label>
                <input
                  type="number"
                  value={customConfig.ancho}
                  onChange={(e) => setCustomConfig({ ...customConfig, ancho: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="20"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alto (mm)</label>
                <input
                  type="number"
                  value={customConfig.alto}
                  onChange={(e) => setCustomConfig({ ...customConfig, alto: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="10"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Altura código barras</label>
                <input
                  type="number"
                  value={customConfig.barcodeHeight}
                  onChange={(e) => setCustomConfig({ ...customConfig, barcodeHeight: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="15"
                  max="80"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño texto (pt)</label>
                <input
                  type="number"
                  value={customConfig.fontSize}
                  onChange={(e) => setCustomConfig({ ...customConfig, fontSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="8"
                  max="24"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Margen horizontal (mm)</label>
                <input
                  type="number"
                  value={customConfig.marginH}
                  onChange={(e) => setCustomConfig({ ...customConfig, marginH: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Margen vertical (mm)</label>
                <input
                  type="number"
                  value={customConfig.marginV}
                  onChange={(e) => setCustomConfig({ ...customConfig, marginV: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Columnas por fila</label>
                <input
                  type="number"
                  value={customConfig.columnas}
                  onChange={(e) => setCustomConfig({ ...customConfig, columnas: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="1"
                  max="8"
                />
              </div>
            </div>
          )}

          {/* Preview del tamaño actual */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">Tamaño actual:</span>
            <span className="px-2 py-1 bg-gray-100 rounded">{modeloActual.ancho} × {modeloActual.alto} mm</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Barcode: {modeloActual.barcodeHeight}px</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Texto: {modeloActual.fontSize}pt</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-800"
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
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              {selectedMuestras.length === muestrasFiltradas.length ? 'Deseleccionar' : 'Seleccionar'} todas
            </button>
            <button
              onClick={copiarCodigos}
              disabled={selectedMuestras.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="Copiar códigos"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={fetchMuestras}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMuestras.length === muestrasFiltradas.length && muestrasFiltradas.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-gray-800 focus:ring-gray-800"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {muestrasFiltradas.map((muestra, index) => (
                <tr 
                  key={muestra.id} 
                  className={`hover:bg-gray-50 transition-colors ${selectedMuestras.includes(muestra.id) ? 'bg-gray-100' : ''}`}
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
                      className="rounded border-gray-300 text-gray-800 focus:ring-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-gray-900">
                      {muestra.codigotexto}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{muestra.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {muestra.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{muestra.nombre_empresa}</td>
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
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Vista Previa de Etiquetas
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedMuestras.length} etiquetas · {modeloActual.ancho}×{modeloActual.alto}mm
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={imprimirEtiquetas}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-100" ref={printRef}>
              <div 
                className="etiqueta-grid flex flex-wrap justify-start bg-white p-4 rounded-lg"
                style={{ gap: `${modeloActual.marginV}mm ${modeloActual.marginH}mm` }}
              >
                {muestras
                  .filter(m => selectedMuestras.includes(m.id))
                  .map(muestra => (
                    <div
                      key={muestra.id}
                      className="etiqueta flex flex-col items-center justify-center"
                      style={{
                        width: `${modeloActual.ancho}mm`,
                        height: `${modeloActual.alto}mm`,
                        padding: '2mm',
                      }}
                    >
                      <div className="barcode-container flex justify-center w-full">
                        <svg 
                          className="barcode-svg" 
                          data-code={muestra.codigotexto}
                        />
                      </div>
                      <div 
                        className="codigo-texto font-mono font-bold text-center text-black mt-1"
                        style={{ fontSize: `${modeloActual.fontSize}pt` }}
                      >
                        {muestra.codigotexto}
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
