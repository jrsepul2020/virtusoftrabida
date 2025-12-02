/**
 * Pipeline Kanban para gestión de inscripciones
 * Permite ver y arrastrar inscripciones entre estados
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Wine, 
  GripVertical,
  ChevronRight,
  RefreshCw,
  Filter,
  Eye,
  Euro
} from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';

interface Empresa {
  id: string;
  nombre_empresa: string;
  email: string;
  telefono?: string;
  pais?: string;
  status: string;
  created_at: string;
  totalinscripciones?: number;
  muestras?: { id: string }[];
  pedido?: number;
  metodo_pago?: string;
  pago_confirmado?: boolean;
  fecha_pago?: string;
  importe_total?: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
}

const COLUMNS: Omit<KanbanColumn, 'count'>[] = [
  { 
    id: 'nueva', 
    title: 'Nueva Inscripción', 
    status: 'pending',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300'
  },
  { 
    id: 'documentacion', 
    title: 'En Documentación', 
    status: 'documentacion',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300'
  },
  { 
    id: 'pago_pendiente', 
    title: 'Pago Pendiente', 
    status: 'approved',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300'
  },
  { 
    id: 'confirmada', 
    title: 'Confirmada', 
    status: 'pagado',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300'
  },
];

export default function InscripcionesKanban() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [filterPais, setFilterPais] = useState<string>('');
  const [paises, setPaises] = useState<string[]>([]);

  const fetchEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          muestras:muestras(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const empresasConMuestras = data?.map(e => ({
        ...e,
        totalinscripciones: e.muestras?.length || 0
      })) || [];

      setEmpresas(empresasConMuestras);

      // Extraer países únicos
      const paisesUnicos = [...new Set(empresasConMuestras.map(e => e.pais).filter(Boolean))] as string[];
      setPaises(paisesUnicos.sort());
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  // Filtrar empresas por columna
  const getEmpresasByStatus = (status: string) => {
    return empresas.filter(e => {
      const matchStatus = e.status === status;
      const matchPais = !filterPais || e.pais === filterPais;
      return matchStatus && matchPais;
    });
  };

  // Handlers de Drag & Drop
  const handleDragStart = (e: React.DragEvent, empresaId: string) => {
    setDragging(empresaId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', empresaId);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOver(columnId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const empresaId = e.dataTransfer.getData('text/plain');
    
    if (!empresaId) return;

    try {
      const { error } = await supabase
        .from('empresas')
        .update({ status: newStatus })
        .eq('id', empresaId);

      if (error) throw error;

      // Actualizar estado local
      setEmpresas(prev => 
        prev.map(e => e.id === empresaId ? { ...e, status: newStatus } : e)
      );

      showSuccess('Estado actualizado');
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cambiar estado');
    } finally {
      setDragging(null);
      setDragOver(null);
    }
  };

  // Calcular totales por columna
  const columnsWithCount = COLUMNS.map(col => ({
    ...col,
    count: getEmpresasByStatus(col.status).length
  }));

  // Calcular estadísticas
  const stats = {
    total: empresas.length,
    nuevas: getEmpresasByStatus('pending').length,
    pendientesPago: getEmpresasByStatus('approved').length,
    confirmadas: getEmpresasByStatus('pagado').length,
    totalMuestras: empresas.reduce((acc, e) => acc + (e.totalinscripciones || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pipeline de Inscripciones</h2>
          <p className="text-sm text-gray-500">
            {stats.total} inscripciones · {stats.totalMuestras} muestras totales
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro por país */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterPais}
              onChange={(e) => setFilterPais(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              <option value="">Todos los países</option>
              {paises.map(pais => (
                <option key={pais} value={pais}>{pais}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchEmpresas}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.nuevas}</div>
          <div className="text-sm text-blue-600">Nuevas</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700">{getEmpresasByStatus('documentacion').length}</div>
          <div className="text-sm text-amber-600">En Documentación</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">{stats.pendientesPago}</div>
          <div className="text-sm text-orange-600">Pago Pendiente</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{stats.confirmadas}</div>
          <div className="text-sm text-green-600">Confirmadas</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[500px]">
        {columnsWithCount.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col rounded-xl border-2 ${column.borderColor} ${column.bgColor} transition-all ${
              dragOver === column.id ? 'ring-2 ring-blue-400 scale-[1.02]' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className={`p-3 border-b ${column.borderColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.bgColor} ${column.color} border ${column.borderColor}`}>
                  {column.count}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
              {getEmpresasByStatus(column.status).map((empresa) => (
                <div
                  key={empresa.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, empresa.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                    dragging === empresa.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      {/* Nombre y pedido */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 truncate">
                          {empresa.nombre_empresa}
                        </span>
                        {empresa.pedido && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-mono">
                            #{empresa.pedido}
                          </span>
                        )}
                      </div>

                      {/* Detalles */}
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{empresa.email}</span>
                        </div>
                        
                        {empresa.pais && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🌍</span>
                            <span>{empresa.pais}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <Wine className="w-3 h-3" />
                          <span>{empresa.totalinscripciones || 0} muestras</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(empresa.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      {/* Importe */}
                      {empresa.importe_total && (
                        <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600">
                          <Euro className="w-3 h-3" />
                          {empresa.importe_total.toFixed(2)}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-2 pt-2 border-t flex items-center justify-between">
                        <button
                          onClick={() => setSelectedEmpresa(empresa)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver detalles
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getEmpresasByStatus(column.status).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Sin inscripciones</p>
                  <p className="text-xs mt-1">Arrastra aquí para mover</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalles */}
      {selectedEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedEmpresa.nombre_empresa}</h3>
                  {selectedEmpresa.pedido && (
                    <span className="text-sm text-gray-500">Pedido #{selectedEmpresa.pedido}</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEmpresa(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${selectedEmpresa.email}`} className="text-blue-600 hover:underline">
                    {selectedEmpresa.email}
                  </a>
                </div>

                {selectedEmpresa.telefono && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedEmpresa.telefono}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Inscrito: {new Date(selectedEmpresa.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Wine className="w-4 h-4" />
                  <span>{selectedEmpresa.totalinscripciones || 0} muestras inscritas</span>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Estado actual</div>
                  <select
                    value={selectedEmpresa.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await supabase
                          .from('empresas')
                          .update({ status: newStatus })
                          .eq('id', selectedEmpresa.id);
                        
                        setEmpresas(prev => 
                          prev.map(emp => emp.id === selectedEmpresa.id ? { ...emp, status: newStatus } : emp)
                        );
                        setSelectedEmpresa({ ...selectedEmpresa, status: newStatus });
                        showSuccess('Estado actualizado');
                      } catch (error) {
                        showError('Error al actualizar');
                      }
                    }}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.status}>{col.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedEmpresa(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                <a
                  href={`mailto:${selectedEmpresa.email}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Enviar Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
