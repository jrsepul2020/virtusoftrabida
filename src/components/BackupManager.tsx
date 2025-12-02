/**
 * Componente para gestionar respaldos y ver audit log
 */
import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, History, Trash2, RefreshCw } from 'lucide-react';
import { 
  downloadBackupJSON, 
  exportTableToCSV, 
  getAuditLog, 
  clearAuditLog, 
  exportAuditLog,
  type AuditLogEntry 
} from '../lib/backup';
import { showSuccess, showError } from '../lib/toast';

export default function BackupManager() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'backup' | 'audit'>('backup');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const handleFullBackup = async () => {
    setLoading(true);
    try {
      await downloadBackupJSON();
      showSuccess('Backup completo descargado');
    } catch (error) {
      showError('Error al generar backup');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTable = async (table: 'empresas' | 'muestras' | 'usuarios' | 'mesas') => {
    setLoading(true);
    try {
      await exportTableToCSV(table);
      showSuccess(`${table} exportado a CSV`);
    } catch (error: any) {
      showError(error.message || 'Error al exportar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = () => {
    setAuditLogs(getAuditLog());
  };

  const handleClearAudit = () => {
    if (confirm('¿Seguro que quieres limpiar todo el historial de cambios?')) {
      clearAuditLog();
      setAuditLogs([]);
      showSuccess('Historial limpiado');
    }
  };

  const handleExportAudit = () => {
    exportAuditLog();
    showSuccess('Historial exportado');
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'crear': return 'bg-green-100 text-green-800';
      case 'actualizar': return 'bg-blue-100 text-blue-800';
      case 'eliminar': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sistema de Respaldos</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'backup' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Respaldos
        </button>
        <button
          onClick={() => { setActiveTab('audit'); loadAuditLogs(); }}
          className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'audit' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Cambios
        </button>
      </div>

      {activeTab === 'backup' ? (
        <div className="space-y-6">
          {/* Backup Completo */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileJson className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Backup Completo (JSON)</h3>
                <p className="text-sm text-gray-500">Exporta todas las tablas en un archivo JSON</p>
              </div>
            </div>
            <button
              onClick={handleFullBackup}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Descargar Backup Completo
            </button>
          </div>

          {/* Exportar por tabla */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Exportar a CSV</h3>
                <p className="text-sm text-gray-500">Exporta tablas individuales para Excel</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleExportTable('empresas')}
                disabled={loading}
                className="bg-emerald-50 text-emerald-700 py-3 px-4 rounded-lg font-medium hover:bg-emerald-100 disabled:opacity-50 text-sm"
              >
                Empresas
              </button>
              <button
                onClick={() => handleExportTable('muestras')}
                disabled={loading}
                className="bg-amber-50 text-amber-700 py-3 px-4 rounded-lg font-medium hover:bg-amber-100 disabled:opacity-50 text-sm"
              >
                Muestras
              </button>
              <button
                onClick={() => handleExportTable('usuarios')}
                disabled={loading}
                className="bg-purple-50 text-purple-700 py-3 px-4 rounded-lg font-medium hover:bg-purple-100 disabled:opacity-50 text-sm"
              >
                Catadores
              </button>
              <button
                onClick={() => handleExportTable('mesas')}
                disabled={loading}
                className="bg-cyan-50 text-cyan-700 py-3 px-4 rounded-lg font-medium hover:bg-cyan-100 disabled:opacity-50 text-sm"
              >
                Mesas
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Acciones del audit log */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={loadAuditLogs}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={handleExportAudit}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={handleClearAudit}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>

          {/* Lista de cambios */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay registros de cambios</p>
                <p className="text-sm mt-1">Los cambios se registrarán automáticamente</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tabla</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Acción</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">ID Registro</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(log.timestamp).toLocaleString('es-ES')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {log.tabla}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccionColor(log.accion)}`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {log.registro_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.usuario}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
