import { useState, useRef } from 'react';
import { Upload, FileJson, FileSpreadsheet, File, CheckCircle, AlertCircle, Loader2, Eye, Download, Globe } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportadorAvanzadoProps {
  tipo: 'empresas' | 'muestras' | 'catadores';
  onImportComplete: (data: any[]) => Promise<void>;
}

interface PreviewData {
  headers: string[];
  rows: any[];
  totalRows: number;
  errores: {
    fila: number;
    campo: string;
    mensaje: string;
  }[];
}

export default function ImportadorAvanzado({ tipo, onImportComplete }: ImportadorAvanzadoProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [urlImport, setUrlImport] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const camposEsperados = {
    empresas: ['nombre_empresa', 'email', 'telefono', 'nif', 'direccion', 'poblacion', 'codigo_postal', 'pais'],
    muestras: ['nombre', 'categoria', 'origen', 'pais', 'anio', 'tipo_uva', 'tipo_aceituna', 'grado_alcoholico'],
    catadores: ['nombre', 'email', 'telefono', 'especialidad', 'mesa', 'puesto']
  };

  const procesarArchivo = async (file: File) => {
    setLoading(true);
    setPreview(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'json') {
        await procesarJSON(file);
      } else if (extension === 'csv') {
        await procesarCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        await procesarExcel(file);
      } else {
        throw new Error('Formato no soportado. Use JSON, CSV o Excel (.xlsx, .xls)');
      }
    } catch (error: any) {
      alert(error.message || 'Error procesando archivo');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarJSON = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : [data];
    validarYMostrarPreview(rows);
  };

  const procesarCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    
    if (lines.length < 2) {
      throw new Error('El CSV debe tener al menos una fila de encabezados y una de datos');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    validarYMostrarPreview(rows);
  };

  const procesarExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet);
    validarYMostrarPreview(rows);
  };

  const procesarDesdeURL = async () => {
    if (!urlImport.trim()) {
      alert('Ingresa una URL válida');
      return;
    }

    setLoading(true);
    setPreview(null);

    try {
      // Detectar si es Google Sheets
      let url = urlImport;
      if (url.includes('docs.google.com/spreadsheets')) {
        // Convertir a URL de exportación CSV
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          url = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo desde la URL');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        const rows = Array.isArray(data) ? data : [data];
        validarYMostrarPreview(rows);
      } else {
        // Asumir CSV
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        validarYMostrarPreview(rows);
      }
    } catch (error: any) {
      alert(error.message || 'Error importando desde URL');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarYMostrarPreview = (rows: any[]) => {
    if (rows.length === 0) {
      throw new Error('No se encontraron datos para importar');
    }

    const headers = Object.keys(rows[0]);
    const esperados = camposEsperados[tipo];
    const errores: PreviewData['errores'] = [];

    // Validar cada fila
    rows.forEach((row, index) => {
      esperados.forEach(campo => {
        if (!row[campo]) {
          errores.push({
            fila: index + 1,
            campo,
            mensaje: `Campo obligatorio vacío: ${campo}`
          });
        }
      });

      // Validaciones específicas
      if (tipo === 'empresas' && row.email && !row.email.includes('@')) {
        errores.push({
          fila: index + 1,
          campo: 'email',
          mensaje: 'Email inválido'
        });
      }

      if (tipo === 'muestras' && row.anio && (row.anio < 1900 || row.anio > new Date().getFullYear())) {
        errores.push({
          fila: index + 1,
          campo: 'anio',
          mensaje: 'Año inválido'
        });
      }
    });

    setPreview({
      headers,
      rows: rows.slice(0, 10), // Solo primeras 10 para preview
      totalRows: rows.length,
      errores: errores.slice(0, 20) // Solo primeros 20 errores
    });
  };

  const confirmarImportacion = async () => {
    if (!preview) return;

    setImporting(true);
    try {
      // Aquí se llamaría a la función de importación real
      await onImportComplete(preview.rows);
      alert(`✅ ${preview.totalRows} registros importados correctamente`);
      setPreview(null);
      setUrlImport('');
    } catch (error: any) {
      alert(error.message || 'Error durante la importación');
      console.error('Error:', error);
    } finally {
      setImporting(false);
    }
  };

  const descargarPlantilla = () => {
    const plantilla = [camposEsperados[tipo]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(plantilla);
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `plantilla_${tipo}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Importación Avanzada</h2>
        <p className="text-blue-100">
          Importa datos desde archivos CSV, Excel, JSON o directamente desde Google Sheets
        </p>
      </div>

      {/* Opciones de importación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-6 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Subir Archivo</p>
          <p className="text-sm text-gray-600">CSV, Excel o JSON</p>
        </button>

        <div className="p-6 bg-white rounded-lg border-2 border-gray-200">
          <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-2">Desde URL</p>
          <input
            type="text"
            value={urlImport}
            onChange={(e) => setUrlImport(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
            disabled={loading}
          />
          <button
            onClick={procesarDesdeURL}
            disabled={loading || !urlImport.trim()}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importar
          </button>
        </div>

        <button
          onClick={descargarPlantilla}
          className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Download className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Descargar Plantilla</p>
          <p className="text-sm text-gray-600">Excel con campos requeridos</p>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) procesarArchivo(file);
        }}
        className="hidden"
      />

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Procesando archivo...</p>
        </div>
      )}

      {/* Preview */}
      {preview && !loading && (
        <div className="space-y-4">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{preview.totalRows}</p>
                  <p className="text-sm text-blue-700">Registros totales</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {preview.totalRows - preview.errores.filter((e, i, arr) => arr.findIndex(x => x.fila === e.fila) === i).length}
                  </p>
                  <p className="text-sm text-green-700">Registros válidos</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {preview.errores.filter((e, i, arr) => arr.findIndex(x => x.fila === e.fila) === i).length}
                  </p>
                  <p className="text-sm text-red-700">Registros con errores</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errores */}
          {preview.errores.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Errores de Validación ({preview.errores.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview.errores.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 flex gap-2">
                    <span className="font-medium">Fila {error.fila}:</span>
                    <span>{error.mensaje}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de preview */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Preview (primeras 10 filas)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    {preview.headers.map(header => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.rows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {preview.headers.map(header => (
                        <td key={header} className="px-4 py-3 text-sm text-gray-900">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setPreview(null)}
              disabled={importing}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarImportacion}
              disabled={importing || preview.errores.length > 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Importación
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
