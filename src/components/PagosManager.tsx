/**
 * Gestión completa de Pagos
 * Historial, estados, recordatorios y estadísticas
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  Eye,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import * as XLSX from 'xlsx';

interface Pago {
  id: string;
  empresa_id: string;
  nombre_empresa: string;
  email: string;
  telefono?: string;
  pais?: string;
  metodo_pago: 'transferencia' | 'paypal' | 'tarjeta' | string;
  estado_pago: 'pendiente' | 'confirmado' | 'rechazado' | 'reembolsado';
  importe: number;
  num_muestras: number;
  fecha_inscripcion: string;
  fecha_pago?: string;
  referencia?: string;
  notas?: string;
  pedido?: number;
  recordatorios_enviados?: number;
  ultimo_recordatorio?: string;
}

interface EstadisticasPago {
  totalIngresos: number;
  ingresosPendientes: number;
  totalPagados: number;
  totalPendientes: number;
  totalRechazados: number;
  porMetodo: Record<string, { count: number; total: number }>;
}

const ESTADOS_PAGO = [
  { value: 'pendiente', label: 'Pendiente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'confirmado', label: 'Confirmado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'rechazado', label: 'Rechazado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { value: 'reembolsado', label: 'Reembolsado', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

const METODOS_PAGO = [
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'paypal', label: 'PayPal', icon: '💳' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
];

export default function PagosManager() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterMetodo, setFilterMetodo] = useState<string>('all');
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [stats, setStats] = useState<EstadisticasPago | null>(null);
  const [activeView, setActiveView] = useState<'lista' | 'stats'>('lista');
  const [editingNota, setEditingNota] = useState<string | null>(null);
  const [notaText, setNotaText] = useState('');

  const fetchPagos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener empresas con datos de pago
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select(`
          id,
          name,
          email,
          telefono,
          pais,
          metodo_pago,
          status,
          pago_confirmado,
          fecha_pago,
          created_at,
          pedido,
          notas_pago,
          recordatorios_enviados,
          ultimo_recordatorio,
          muestras:muestras(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar a formato de pagos
      const pagosData: Pago[] = (empresas || []).map(e => {
        const numMuestras = e.muestras?.length || 0;
        const precioBase = 85; // Precio por muestra
        const importe = numMuestras * precioBase;

        return {
          id: e.id,
          empresa_id: e.id,
          nombre_empresa: e.name || 'Sin nombre',
          email: e.email,
          telefono: e.telefono,
          pais: e.pais,
          metodo_pago: e.metodo_pago || 'transferencia',
          estado_pago: e.pago_confirmado ? 'confirmado' : (e.status === 'rejected' ? 'rechazado' : 'pendiente'),
          importe,
          num_muestras: numMuestras,
          fecha_inscripcion: e.created_at,
          fecha_pago: e.fecha_pago,
          notas: e.notas_pago,
          pedido: e.pedido,
          recordatorios_enviados: e.recordatorios_enviados || 0,
          ultimo_recordatorio: e.ultimo_recordatorio,
        };
      });

      setPagos(pagosData);
      calcularEstadisticas(pagosData);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularEstadisticas = (data: Pago[]) => {
    const estadisticas: EstadisticasPago = {
      totalIngresos: 0,
      ingresosPendientes: 0,
      totalPagados: 0,
      totalPendientes: 0,
      totalRechazados: 0,
      porMetodo: {},
    };

    data.forEach(pago => {
      if (pago.estado_pago === 'confirmado') {
        estadisticas.totalIngresos += pago.importe;
        estadisticas.totalPagados++;
      } else if (pago.estado_pago === 'pendiente') {
        estadisticas.ingresosPendientes += pago.importe;
        estadisticas.totalPendientes++;
      } else if (pago.estado_pago === 'rechazado') {
        estadisticas.totalRechazados++;
      }

      // Por método
      const metodo = pago.metodo_pago || 'otros';
      if (!estadisticas.porMetodo[metodo]) {
        estadisticas.porMetodo[metodo] = { count: 0, total: 0 };
      }
      estadisticas.porMetodo[metodo].count++;
      if (pago.estado_pago === 'confirmado') {
        estadisticas.porMetodo[metodo].total += pago.importe;
      }
    });

    setStats(estadisticas);
  };

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  // Filtrar pagos
  const pagosFiltrados = pagos.filter(pago => {
    const matchSearch = !searchTerm || 
      pago.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pago.pedido && pago.pedido.toString().includes(searchTerm));
    
    const matchEstado = filterEstado === 'all' || pago.estado_pago === filterEstado;
    const matchMetodo = filterMetodo === 'all' || pago.metodo_pago === filterMetodo;

    return matchSearch && matchEstado && matchMetodo;
  });

  // Cambiar estado de pago
  const cambiarEstadoPago = async (pagoId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ 
          pago_confirmado: nuevoEstado === 'confirmado',
          status: nuevoEstado === 'confirmado' ? 'pagado' : (nuevoEstado === 'rechazado' ? 'rejected' : 'approved'),
          fecha_pago: nuevoEstado === 'confirmado' ? new Date().toISOString() : null
        })
        .eq('id', pagoId);

      if (error) throw error;

      setPagos(prev => prev.map(p => 
        p.id === pagoId 
          ? { ...p, estado_pago: nuevoEstado as any, fecha_pago: nuevoEstado === 'confirmado' ? new Date().toISOString() : undefined }
          : p
      ));
      
      showSuccess(`Pago marcado como ${nuevoEstado}`);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar estado');
    }
  };

  // Enviar recordatorio
  const enviarRecordatorio = async (pago: Pago) => {
    try {
      // Aquí iría la lógica de envío de email
      await supabase
        .from('empresas')
        .update({ 
          recordatorios_enviados: (pago.recordatorios_enviados || 0) + 1,
          ultimo_recordatorio: new Date().toISOString()
        })
        .eq('id', pago.id);

      setPagos(prev => prev.map(p => 
        p.id === pago.id 
          ? { ...p, recordatorios_enviados: (p.recordatorios_enviados || 0) + 1, ultimo_recordatorio: new Date().toISOString() }
          : p
      ));

      showSuccess('Recordatorio enviado');
    } catch (error) {
      showError('Error al enviar recordatorio');
    }
  };

  // Guardar nota
  const guardarNota = async (pagoId: string) => {
    try {
      await supabase
        .from('empresas')
        .update({ notas_pago: notaText })
        .eq('id', pagoId);

      setPagos(prev => prev.map(p => 
        p.id === pagoId ? { ...p, notas: notaText } : p
      ));

      setEditingNota(null);
      showSuccess('Nota guardada');
    } catch (error) {
      showError('Error al guardar nota');
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    const dataExport = pagosFiltrados.map(p => ({
      'Pedido': p.pedido || '-',
      'Empresa': p.nombre_empresa,
      'Email': p.email,
      'País': p.pais || '-',
      'Muestras': p.num_muestras,
      'Importe': p.importe.toFixed(2) + ' €',
      'Método': p.metodo_pago,
      'Estado': ESTADOS_PAGO.find(e => e.value === p.estado_pago)?.label || p.estado_pago,
      'Fecha Inscripción': new Date(p.fecha_inscripcion).toLocaleDateString('es-ES'),
      'Fecha Pago': p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-ES') : '-',
      'Recordatorios': p.recordatorios_enviados || 0,
      'Notas': p.notas || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
    XLSX.writeFile(wb, `pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Excel exportado');
  };

  // Renderizar estado badge
  const EstadoBadge = ({ estado }: { estado: string }) => {
    const config = ESTADOS_PAGO.find(e => e.value === estado) || ESTADOS_PAGO[0];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
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
            <CreditCard className="w-6 h-6 text-green-600" />
            Gestión de Pagos
          </h2>
          <p className="text-sm text-gray-500">
            {pagos.length} inscripciones · {pagosFiltrados.length} mostradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('lista')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeView === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setActiveView('stats')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeView === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Estadísticas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalIngresos.toFixed(2)} €</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>{stats.totalPagados} pagos confirmados</span>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-amber-600">{stats.ingresosPendientes.toFixed(2)} €</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>{stats.totalPendientes} por cobrar</span>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasa Conversión</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pagos.length > 0 ? ((stats.totalPagados / pagos.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <PieChart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <span>{stats.totalPagados}/{pagos.length} convertidos</span>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rechazados</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalRechazados}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-red-600">
              <ArrowDownRight className="w-3 h-3" />
              <span>
                {pagos.length > 0 ? ((stats.totalRechazados / pagos.length) * 100).toFixed(1) : 0}% del total
              </span>
            </div>
          </div>
        </div>
      )}

      {activeView === 'lista' && (
        <>
          {/* Filtros */}
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por empresa, email o pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos los estados</option>
                  {ESTADOS_PAGO.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>

                <select
                  value={filterMetodo}
                  onChange={(e) => setFilterMetodo(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos los métodos</option>
                  {METODOS_PAGO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPagos}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Excel
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Muestras</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Importe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Método</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagosFiltrados.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-500">
                          {pago.pedido || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{pago.nombre_empresa}</div>
                          <div className="text-xs text-gray-500">{pago.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {pago.num_muestras}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{pago.importe.toFixed(2)} €</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {METODOS_PAGO.find(m => m.value === pago.metodo_pago)?.icon || '💳'}{' '}
                          {METODOS_PAGO.find(m => m.value === pago.metodo_pago)?.label || pago.metodo_pago}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={pago.estado_pago} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(pago.fecha_inscripcion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {pago.estado_pago === 'pendiente' && (
                            <>
                              <button
                                onClick={() => cambiarEstadoPago(pago.id, 'confirmado')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Marcar como pagado"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => enviarRecordatorio(pago)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title={`Enviar recordatorio (${pago.recordatorios_enviados || 0} enviados)`}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedPago(pago)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagosFiltrados.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No se encontraron pagos con los filtros seleccionados
              </div>
            )}
          </div>
        </>
      )}

      {activeView === 'stats' && stats && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Por método de pago */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Por Método de Pago</h3>
            <div className="space-y-3">
              {Object.entries(stats.porMetodo).map(([metodo, data]) => {
                const config = METODOS_PAGO.find(m => m.value === metodo);
                const porcentaje = pagos.length > 0 ? (data.count / pagos.length) * 100 : 0;
                
                return (
                  <div key={metodo} className="flex items-center gap-3">
                    <span className="text-xl">{config?.icon || '💳'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{config?.label || metodo}</span>
                        <span className="text-sm text-gray-500">{data.count} ({porcentaje.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {data.total.toFixed(2)} € cobrado
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Resumen Financiero</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Total inscripciones</span>
                <span className="font-semibold">{pagos.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Muestras totales</span>
                <span className="font-semibold">
                  {pagos.reduce((acc, p) => acc + p.num_muestras, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Facturación potencial</span>
                <span className="font-semibold">
                  {(stats.totalIngresos + stats.ingresosPendientes).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-green-600">
                <span>Cobrado</span>
                <span className="font-bold">{stats.totalIngresos.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center py-2 text-amber-600">
                <span>Pendiente</span>
                <span className="font-bold">{stats.ingresosPendientes.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedPago.nombre_empresa}</h3>
                  <span className="text-sm text-gray-500">Pedido #{selectedPago.pedido}</span>
                </div>
                <button
                  onClick={() => setSelectedPago(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="font-medium">{selectedPago.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Teléfono</label>
                    <p className="font-medium">{selectedPago.telefono || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">País</label>
                    <p className="font-medium">{selectedPago.pais || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Muestras</label>
                    <p className="font-medium">{selectedPago.num_muestras}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Importe total</span>
                    <span className="text-2xl font-bold text-green-600">{selectedPago.importe.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Método de pago</span>
                    <span>{METODOS_PAGO.find(m => m.value === selectedPago.metodo_pago)?.label}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Estado del pago</label>
                  <div className="mt-1">
                    <select
                      value={selectedPago.estado_pago}
                      onChange={(e) => {
                        cambiarEstadoPago(selectedPago.id, e.target.value);
                        setSelectedPago({ ...selectedPago, estado_pago: e.target.value as any });
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {ESTADOS_PAGO.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Notas internas</label>
                  {editingNota === selectedPago.id ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={notaText}
                        onChange={(e) => setNotaText(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Añadir nota..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarNota(selectedPago.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingNota(null)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        setEditingNota(selectedPago.id);
                        setNotaText(selectedPago.notas || '');
                      }}
                      className="mt-1 p-3 bg-gray-50 rounded-lg text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {selectedPago.notas || <span className="text-gray-400 italic">Click para añadir nota...</span>}
                    </div>
                  )}
                </div>

                {selectedPago.recordatorios_enviados ? (
                  <div className="text-xs text-gray-500">
                    📧 {selectedPago.recordatorios_enviados} recordatorio(s) enviado(s)
                    {selectedPago.ultimo_recordatorio && (
                      <> · Último: {new Date(selectedPago.ultimo_recordatorio).toLocaleDateString('es-ES')}</>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedPago(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                {selectedPago.estado_pago === 'pendiente' && (
                  <button
                    onClick={() => enviarRecordatorio(selectedPago)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Recordatorio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
