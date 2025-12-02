/**
 * Componente para importar datos desde Excel/CSV
 */
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { showSuccess, showError, showWarning } from '../lib/toast';

type ImportType = 'empresas' | 'muestras';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  errors: ImportError[];
  total: number;
}

// Campos requeridos por tipo
const REQUIRED_FIELDS: Record<ImportType, string[]> = {
  empresas: ['nombre_empresa', 'email'],
  muestras: ['nombre', 'categoria'],
};

// Plantillas de ejemplo
const TEMPLATES: Record<ImportType, Record<string, string>[]> = {
  empresas: [
    { nombre_empresa: 'Bodega Ejemplo', email: 'info@bodega.com', nif: 'B12345678', telefono: '600123456', pais: 'España' },
    { nombre_empresa: 'Viñedos Demo', email: 'contacto@vinedos.com', nif: 'A87654321', telefono: '600654321', pais: 'Portugal' },
  ],
  muestras: [
    { nombre: 'Vino Reserva 2020', categoria: 'VINO TINTO', grado: '14.5', azucar: '2.5', origen: 'Rioja', pais: 'España' },
    { nombre: 'Blanco Joven 2023', categoria: 'VINO BLANCO', grado: '12.0', azucar: '4.0', origen: 'Rueda', pais: 'España' },
  ],
};

export default function ImportManager() {
  const [importType, setImportType] = useState<ImportType>('empresas');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Descargar plantilla
  const downloadTemplate = () => {
    const template = TEMPLATES[importType];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, importType);
    XLSX.writeFile(wb, `plantilla_${importType}.xlsx`);
    showSuccess('Plantilla descargada');
  };

  // Manejar selección de archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const data = await readExcelFile(selectedFile);
      setPreviewData(data.slice(0, 5)); // Solo primeras 5 filas para preview
      
      if (data.length === 0) {
        showWarning('El archivo está vacío');
        return;
      }

      // Validar campos requeridos
      const firstRow = data[0];
      const missingFields = REQUIRED_FIELDS[importType].filter(
        field => !Object.keys(firstRow).map(k => k.toLowerCase()).includes(field.toLowerCase())
      );

      if (missingFields.length > 0) {
        showWarning(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      }
    } catch (error) {
      showError('Error al leer el archivo');
      console.error(error);
    }
  };

  // Leer archivo Excel/CSV
  const readExcelFile = (file: File): Promise<Record<string, any>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          resolve(jsonData as Record<string, any>[]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  // Validar fila de datos
  const validateRow = (row: Record<string, any>, index: number): ImportError[] => {
    const errors: ImportError[] = [];
    const requiredFields = REQUIRED_FIELDS[importType];

    requiredFields.forEach(field => {
      const value = row[field] || row[field.toLowerCase()];
      if (!value || String(value).trim() === '') {
        errors.push({ row: index + 2, field, message: `${field} es requerido` });
      }
    });

    // Validaciones específicas
    if (importType === 'empresas') {
      const email = row.email || row.Email;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: index + 2, field: 'email', message: 'Email inválido' });
      }
    }

    if (importType === 'muestras') {
      const grado = row.grado || row.Grado;
      if (grado && isNaN(parseFloat(grado))) {
        errors.push({ row: index + 2, field: 'grado', message: 'Grado debe ser numérico' });
      }
    }

    return errors;
  };

  // Importar datos
  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const allErrors: ImportError[] = [];
    let successCount = 0;

    try {
      const data = await readExcelFile(file);
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowErrors = validateRow(row, i);
        
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
          continue;
        }

        // Normalizar nombres de campos a minúsculas
        const normalizedRow: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalizedRow[key.toLowerCase()] = value;
        });

        try {
          const { error } = await supabase
            .from(importType)
            .insert(normalizedRow);

          if (error) {
            allErrors.push({ row: i + 2, field: 'general', message: error.message });
          } else {
            successCount++;
          }
        } catch (err: any) {
          allErrors.push({ row: i + 2, field: 'general', message: err.message });
        }
      }

      setResult({
        success: successCount,
        errors: allErrors,
        total: data.length,
      });

      if (successCount > 0) {
        showSuccess(`${successCount} registros importados correctamente`);
      }
      if (allErrors.length > 0) {
        showWarning(`${allErrors.length} errores encontrados`);
      }
    } catch (error) {
      showError('Error durante la importación');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  // Limpiar
  const handleClear = () => {
    setFile(null);
    setPreviewData([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Importar Datos</h2>

      {/* Selector de tipo */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => { setImportType('empresas'); handleClear(); }}
          className={`px-4 py-2 rounded-lg font-medium ${
            importType === 'empresas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Empresas
        </button>
        <button
          onClick={() => { setImportType('muestras'); handleClear(); }}
          className={`px-4 py-2 rounded-lg font-medium ${
            importType === 'muestras'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Muestras
        </button>
      </div>

      {/* Descargar plantilla */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-800">Plantilla de ejemplo</h3>
            <p className="text-sm text-blue-600">Descarga la plantilla con el formato correcto</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Descargar Plantilla
          </button>
        </div>
      </div>

      {/* Zona de carga */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-800">{file.name}</p>
              <p className="text-sm text-green-600">{previewData.length > 0 ? `${previewData.length}+ filas encontradas` : 'Procesando...'}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="p-1 hover:bg-green-200 rounded"
            >
              <X className="w-5 h-5 text-green-700" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Arrastra un archivo Excel o CSV aquí</p>
            <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
          </>
        )}
      </div>

      {/* Preview de datos */}
      {previewData.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 mb-3">Vista previa (primeras 5 filas)</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(previewData[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-600">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 text-gray-800">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botón de importar */}
      {file && previewData.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importar {importType}
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Resumen */}
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">{result.success} importados</span>
              </div>
            </div>
            <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">{result.errors.length} errores</span>
              </div>
            </div>
          </div>

          {/* Lista de errores */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
              <ul className="space-y-1 text-sm">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i} className="text-red-700">
                    Fila {err.row}: {err.field} - {err.message}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-red-600 font-medium">
                    ... y {result.errors.length - 20} errores más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
