/**
 * Sistema de Comunicaciones
 * Plantillas de email, envíos masivos e historial
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Mail,
  Send,
  Users,
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';
import { showSuccess, showError, showWarning } from '../lib/toast';

interface PlantillaEmail {
  id: string;
  nombre: string;
  asunto: string;
  contenido: string;
  tipo: 'inscripcion' | 'recordatorio_pago' | 'confirmacion_pago' | 'general' | 'resultado';
  variables: string[];
  created_at: string;
}

interface HistorialEmail {
  id: string;
  empresa_id: string;
  nombre_empresa: string;
  email: string;
  asunto: string;
  tipo: string;
  estado: 'enviado' | 'fallido' | 'pendiente';
  fecha_envio: string;
}

interface Empresa {
  id: string;
  nombre_empresa: string;
  email: string;
  status: string;
  pago_confirmado: boolean;
  pedido?: string;
  created_at?: string;
}

const TIPOS_PLANTILLA = [
  { value: 'inscripcion', label: 'Confirmación Inscripción', icon: '📝' },
  { value: 'recordatorio_pago', label: 'Recordatorio de Pago', icon: '💰' },
  { value: 'confirmacion_pago', label: 'Confirmación de Pago', icon: '✅' },
  { value: 'resultado', label: 'Resultados', icon: '🏆' },
  { value: 'general', label: 'General', icon: '📧' },
];

const PLANTILLAS_DEFAULT: Omit<PlantillaEmail, 'id' | 'created_at'>[] = [
  {
    nombre: 'Confirmación de Inscripción',
    asunto: 'Confirmación de inscripción - International Virtus',
    tipo: 'inscripcion',
    variables: ['{{nombre_empresa}}', '{{num_muestras}}', '{{importe}}', '{{pedido}}'],
    contenido: `Estimado/a representante de {{nombre_empresa}},

Hemos recibido correctamente su inscripción al concurso International Virtus.

Detalles de su inscripción:
- Número de pedido: {{pedido}}
- Muestras inscritas: {{num_muestras}}
- Importe total: {{importe}} €

Para completar su inscripción, por favor realice el pago mediante transferencia bancaria a:
IBAN: ES00 0000 0000 0000 0000 0000
Concepto: Virtus - {{pedido}}

O a través de PayPal en nuestra web.

Quedamos a su disposición para cualquier consulta.

Saludos cordiales,
Organización International Virtus`
  },
  {
    nombre: 'Recordatorio de Pago',
    asunto: 'Recordatorio: Pago pendiente - International Virtus',
    tipo: 'recordatorio_pago',
    variables: ['{{nombre_empresa}}', '{{importe}}', '{{pedido}}', '{{dias_pendiente}}'],
    contenido: `Estimado/a representante de {{nombre_empresa}},

Le recordamos que tiene pendiente el pago de su inscripción al concurso International Virtus.

- Número de pedido: {{pedido}}
- Importe pendiente: {{importe}} €
- Días desde inscripción: {{dias_pendiente}}

Por favor, realice el pago a la mayor brevedad para confirmar su participación.

Datos bancarios:
IBAN: ES00 0000 0000 0000 0000 0000
Concepto: Virtus - {{pedido}}

Si ya ha realizado el pago, por favor ignore este mensaje y envíenos el justificante.

Saludos cordiales,
Organización International Virtus`
  },
  {
    nombre: 'Confirmación de Pago',
    asunto: '✅ Pago confirmado - International Virtus',
    tipo: 'confirmacion_pago',
    variables: ['{{nombre_empresa}}', '{{num_muestras}}', '{{pedido}}'],
    contenido: `Estimado/a representante de {{nombre_empresa}},

Confirmamos la recepción de su pago. Su inscripción al concurso International Virtus está completa.

- Número de pedido: {{pedido}}
- Muestras inscritas: {{num_muestras}}

Próximos pasos:
1. Recibirá instrucciones para el envío de muestras
2. Las etiquetas de identificación le serán enviadas por email
3. Las muestras deben llegar antes de la fecha límite

¡Gracias por su participación!

Saludos cordiales,
Organización International Virtus`
  },
];

export default function ComunicacionesManager() {
  const [activeTab, setActiveTab] = useState<'plantillas' | 'enviar' | 'historial'>('plantillas');
  const [plantillas, setPlantillas] = useState<PlantillaEmail[]>([]);
  const [historial, setHistorial] = useState<HistorialEmail[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para edición de plantilla
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaEmail | null>(null);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  
  // Estados para envío
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaEmail | null>(null);
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewEmail, setPreviewEmail] = useState<{ asunto: string; contenido: string } | null>(null);
  const [sending, setSending] = useState(false);
  
  // Nuevos estados para BCC y preview modal
  const [bccEmail, setBccEmail] = useState('');
  const [enableBcc, setEnableBcc] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewEmpresa, setPreviewEmpresa] = useState<Empresa | null>(null);

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar plantillas (desde localStorage por ahora, podría ser tabla en Supabase)
      const savedPlantillas = localStorage.getItem('email_plantillas');
      if (savedPlantillas) {
        setPlantillas(JSON.parse(savedPlantillas));
      } else {
        // Crear plantillas por defecto si no existen
        const defaultPlantillas = PLANTILLAS_DEFAULT.map((p, i) => ({
          ...p,
          id: `plantilla-default-${i}`,
          created_at: new Date().toISOString()
        }));
        setPlantillas(defaultPlantillas);
        localStorage.setItem('email_plantillas', JSON.stringify(defaultPlantillas));
      }
      
      // Cargar empresas desde Supabase
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, name, email, status, pago_confirmado, pedido, created_at')
        .order('created_at', { ascending: false });

      if (empresasError) {
        console.error('Error cargando empresas:', empresasError);
      }

      // Mapear name a nombre_empresa para mantener compatibilidad
      const empresasMapeadas = (empresasData || []).map((e: any) => ({
        ...e,
        nombre_empresa: e.name || 'Sin nombre'
      }));
      
      setEmpresas(empresasMapeadas);

      // Cargar historial (desde localStorage)
      const savedHistorial = localStorage.getItem('email_historial');
      if (savedHistorial) {
        setHistorial(JSON.parse(savedHistorial));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Guardar plantilla
  const guardarPlantilla = (plantilla: PlantillaEmail) => {
    let nuevasPlantillas;
    if (plantilla.id.startsWith('new-')) {
      // Nueva plantilla
      const newPlantilla = {
        ...plantilla,
        id: `plantilla-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      nuevasPlantillas = [...plantillas, newPlantilla];
    } else {
      // Editar existente
      nuevasPlantillas = plantillas.map(p => p.id === plantilla.id ? plantilla : p);
    }
    
    setPlantillas(nuevasPlantillas);
    localStorage.setItem('email_plantillas', JSON.stringify(nuevasPlantillas));
    setShowPlantillaModal(false);
    setEditingPlantilla(null);
    showSuccess('Plantilla guardada');
  };

  // Eliminar plantilla
  const eliminarPlantilla = (id: string) => {
    const nuevasPlantillas = plantillas.filter(p => p.id !== id);
    setPlantillas(nuevasPlantillas);
    localStorage.setItem('email_plantillas', JSON.stringify(nuevasPlantillas));
    showSuccess('Plantilla eliminada');
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter(e => {
    const matchSearch = !searchTerm || 
      e.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchEstado = true;
    if (filterEstado === 'pendiente') matchEstado = !e.pago_confirmado && e.status !== 'rejected';
    if (filterEstado === 'pagado') matchEstado = e.pago_confirmado;
    if (filterEstado === 'rechazado') matchEstado = e.status === 'rejected';

    return matchSearch && matchEstado;
  });

  // Seleccionar/deseleccionar todas
  const toggleSelectAll = () => {
    if (selectedEmpresas.length === empresasFiltradas.length) {
      setSelectedEmpresas([]);
    } else {
      setSelectedEmpresas(empresasFiltradas.map(e => e.id));
    }
  };

  // Generar preview con datos reales
  const generarPreviewCompleto = async (empresa: Empresa) => {
    if (!selectedPlantilla) return;

    try {
      // Obtener datos completos de la empresa y sus muestras
      const { data: muestras, error } = await supabase
        .from('muestras')
        .select('*')
        .eq('empresa_id', empresa.id);

      if (error) throw error;

      const numMuestras = muestras?.length || 0;
      const precioUnitario = 150;
      const muestrasGratis = Math.floor(numMuestras / 5);
      const muestrasCobradas = numMuestras - muestrasGratis;
      const importe = muestrasCobradas * precioUnitario;

      // Calcular días desde inscripción
      const fechaInscripcion = new Date(empresa.created_at || Date.now());
      const diasPendiente = Math.floor((Date.now() - fechaInscripcion.getTime()) / (1000 * 60 * 60 * 24));

      let contenido = selectedPlantilla.contenido;
      let asunto = selectedPlantilla.asunto;

      // Reemplazar todas las variables
      const pedido = empresa.pedido || 'SIN-PEDIDO';
      contenido = contenido.replace(/\{\{nombre_empresa\}\}/g, empresa.nombre_empresa);
      contenido = contenido.replace(/\{\{num_muestras\}\}/g, numMuestras.toString());
      contenido = contenido.replace(/\{\{importe\}\}/g, importe.toString());
      contenido = contenido.replace(/\{\{pedido\}\}/g, pedido);
      contenido = contenido.replace(/\{\{dias_pendiente\}\}/g, diasPendiente.toString());
      
      asunto = asunto.replace(/\{\{nombre_empresa\}\}/g, empresa.nombre_empresa);
      asunto = asunto.replace(/\{\{pedido\}\}/g, pedido);
      asunto = asunto.replace(/\{\{importe\}\}/g, importe.toString());

      setPreviewEmail({ asunto, contenido });
      setPreviewEmpresa(empresa);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generando preview:', error);
      showError('Error al generar vista previa');
    }
  };

  // Enviar emails
  const enviarEmails = async () => {
    if (!selectedPlantilla || selectedEmpresas.length === 0) {
      showWarning('Selecciona una plantilla y al menos una empresa');
      return;
    }

    if (enableBcc && !bccEmail) {
      showWarning('Introduce un email BCC válido');
      return;
    }

    setSending(true);
    const resultados: HistorialEmail[] = [];

    try {
      for (const empresaId of selectedEmpresas) {
        const empresa = empresas.find(e => e.id === empresaId);
        if (!empresa) continue;

        // Aquí iría la llamada real al API de envío de email
        // Por ahora simulamos el envío
        // En producción: llamar a api/send-inscription-email.ts con { to: empresa.email, bcc: enableBcc ? bccEmail : undefined, ... }
        await new Promise(resolve => setTimeout(resolve, 100));

        resultados.push({
          id: `email-${Date.now()}-${empresaId}`,
          empresa_id: empresaId,
          nombre_empresa: empresa.nombre_empresa,
          email: empresa.email,
          asunto: selectedPlantilla.asunto,
          tipo: selectedPlantilla.tipo,
          estado: 'enviado',
          fecha_envio: new Date().toISOString()
        });
      }

      // Guardar en historial
      const nuevoHistorial = [...resultados, ...historial];
      setHistorial(nuevoHistorial);
      localStorage.setItem('email_historial', JSON.stringify(nuevoHistorial));

      showSuccess(`${resultados.length} emails enviados correctamente${enableBcc ? ` (BCC: ${bccEmail})` : ''}`);
      setSelectedEmpresas([]);
    } catch (error) {
      showError('Error al enviar emails');
    } finally {
      setSending(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            Comunicaciones
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona plantillas y envía emails masivos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'plantillas', label: 'Plantillas', icon: FileText },
          { id: 'enviar', label: 'Enviar Email', icon: Send },
          { id: 'historial', label: 'Historial', icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Plantillas */}
      {activeTab === 'plantillas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingPlantilla({
                  id: `new-${Date.now()}`,
                  nombre: '',
                  asunto: '',
                  contenido: '',
                  tipo: 'general',
                  variables: [],
                  created_at: ''
                });
                setShowPlantillaModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantillas.map(plantilla => {
              const tipo = TIPOS_PLANTILLA.find(t => t.value === plantilla.tipo);
              return (
                <div key={plantilla.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tipo?.icon || '📧'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{plantilla.nombre}</h3>
                        <span className="text-xs text-gray-500">{tipo?.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingPlantilla(plantilla);
                          setShowPlantillaModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta plantilla?')) {
                            eliminarPlantilla(plantilla.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Asunto:</strong> {plantilla.asunto}
                  </div>
                  
                  <div className="text-xs text-gray-400 line-clamp-2">
                    {plantilla.contenido.substring(0, 100)}...
                  </div>

                  {plantilla.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {plantilla.variables.map(v => (
                        <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Enviar Email */}
      {activeTab === 'enviar' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Selección de plantilla y empresas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Seleccionar plantilla */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">1. Seleccionar Plantilla</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {plantillas.map(p => {
                  const tipo = TIPOS_PLANTILLA.find(t => t.value === p.tipo);
                  const isSelected = selectedPlantilla?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlantilla(p)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{tipo?.icon}</span>
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {p.nombre}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleccionar destinatarios */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">2. Seleccionar Destinatarios</h3>
                <span className="text-sm text-gray-500">
                  {selectedEmpresas.length} seleccionados
                </span>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pendiente">Pago pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  {selectedEmpresas.length === empresasFiltradas.length ? 'Deseleccionar' : 'Seleccionar'} todos
                </button>
              </div>

              {/* Lista de empresas */}
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {empresasFiltradas.map(empresa => (
                  <label
                    key={empresa.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmpresas.includes(empresa.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmpresas([...selectedEmpresas, empresa.id]);
                        } else {
                          setSelectedEmpresas(selectedEmpresas.filter(id => id !== empresa.id));
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{empresa.nombre_empresa}</div>
                      <div className="text-xs text-gray-500">{empresa.email}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      empresa.pago_confirmado 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {empresa.pago_confirmado ? 'Pagado' : 'Pendiente'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview y envío */}
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-3">3. Opciones y Envío</h3>
              
              {/* Opción BCC */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableBcc}
                    onChange={(e) => setEnableBcc(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Enviar copia oculta (BCC)</span>
                </label>
                
                {enableBcc && (
                  <input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={bccEmail}
                    onChange={(e) => setBccEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                )}
              </div>

              {/* Vista previa de plantilla */}
              {selectedPlantilla ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Asunto (plantilla)</div>
                    <div className="font-medium text-sm">{selectedPlantilla.asunto}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-500 mb-1">Contenido (plantilla)</div>
                    <div className="text-xs whitespace-pre-wrap line-clamp-4">{selectedPlantilla.contenido}</div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Las variables serán reemplazadas con datos reales.
                  </div>

                  {/* Botón de previsualización */}
                  {selectedEmpresas.length > 0 && (
                    <button
                      onClick={() => {
                        const primeraEmpresa = empresas.find(e => e.id === selectedEmpresas[0]);
                        if (primeraEmpresa) generarPreviewCompleto(primeraEmpresa);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Ver email real (primera empresa)
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Selecciona una plantilla
                </div>
              )}

              <button
                onClick={enviarEmails}
                disabled={!selectedPlantilla || selectedEmpresas.length === 0 || sending || (enableBcc && !bccEmail)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar a {selectedEmpresas.length} empresa(s)
                  </>
                )}
              </button>
              
              {enableBcc && !bccEmail && (
                <p className="text-xs text-red-600 mt-2">* Introduce un email BCC para continuar</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {activeTab === 'historial' && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Historial de Envíos</h3>
            <button
              onClick={() => {
                localStorage.removeItem('email_historial');
                setHistorial([]);
                showSuccess('Historial limpiado');
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Limpiar historial
            </button>
          </div>
          
          {historial.length > 0 ? (
            <div className="divide-y">
              {historial.slice(0, 50).map(email => (
                <div key={email.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{email.nombre_empresa}</div>
                      <div className="text-sm text-gray-500">{email.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        email.estado === 'enviado' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {email.estado === 'enviado' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {email.estado}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(email.fecha_envio).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Asunto:</strong> {email.asunto}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No hay emails en el historial
            </div>
          )}
        </div>
      )}

      {/* Modal de edición de plantilla */}
      {showPlantillaModal && editingPlantilla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingPlantilla.id.startsWith('new-') ? 'Nueva Plantilla' : 'Editar Plantilla'}
                </h3>
                <button
                  onClick={() => {
                    setShowPlantillaModal(false);
                    setEditingPlantilla(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editingPlantilla.nombre}
                      onChange={(e) => setEditingPlantilla({ ...editingPlantilla, nombre: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nombre de la plantilla"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={editingPlantilla.tipo}
                      onChange={(e) => setEditingPlantilla({ ...editingPlantilla, tipo: e.target.value as any })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {TIPOS_PLANTILLA.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                  <input
                    type="text"
                    value={editingPlantilla.asunto}
                    onChange={(e) => setEditingPlantilla({ ...editingPlantilla, asunto: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Asunto del email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                  <textarea
                    value={editingPlantilla.contenido}
                    onChange={(e) => setEditingPlantilla({ ...editingPlantilla, contenido: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    rows={12}
                    placeholder="Contenido del email..."
                  />
                </div>

                <div className="text-xs text-gray-500">
                  <strong>Variables disponibles:</strong> {'{{nombre_empresa}}'}, {'{{email}}'}, {'{{num_muestras}}'}, {'{{importe}}'}, {'{{pedido}}'}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowPlantillaModal(false);
                    setEditingPlantilla(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => guardarPlantilla(editingPlantilla)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Previsualización de Email Real */}
      {showPreviewModal && previewEmail && previewEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-semibold">Vista Previa del Email</h3>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewEmail(null);
                  setPreviewEmpresa(null);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destinatario */}
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 font-medium">Para:</span>
                <div>
                  <div className="font-medium text-gray-900">{previewEmpresa.nombre_empresa}</div>
                  <div className="text-gray-600">{previewEmpresa.email}</div>
                </div>
              </div>
              {enableBcc && bccEmail && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="text-gray-500 font-medium">BCC:</span>
                  <span className="text-gray-600">{bccEmail}</span>
                </div>
              )}
            </div>

            {/* Asunto */}
            <div className="px-6 py-3 bg-blue-50 border-b">
              <div className="text-sm text-gray-500 mb-1">Asunto:</div>
              <div className="font-semibold text-gray-900">{previewEmail.asunto}</div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                  {previewEmail.contenido}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Este es el email que se enviará con los datos reales de {previewEmpresa.nombre_empresa}
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewEmail(null);
                  setPreviewEmpresa(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
