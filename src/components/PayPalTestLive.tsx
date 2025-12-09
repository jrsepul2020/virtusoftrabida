import { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, User, Package, Euro, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPayPalConfig } from '../lib/paypalConfig';

interface TestPayment {
  id: string;
  nombre: string;
  apellidos: string;
  producto: string;
  precio: number;
  paypal_order_id: string;
  paypal_payer_email: string;
  status: string;
  created_at: string;
}

export default function PayPalTestLive() {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [producto, setProducto] = useState('Producto de prueba');
  const [precio, setPrecio] = useState(0.05);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [paypalConfig, setPaypalConfig] = useState<{ client_id: string; currency: string; mode: string } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [payments, setPayments] = useState<TestPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  
  // Estado para transacciones reales de PayPal
  const [realPayPalTransactions, setRealPayPalTransactions] = useState<any[]>([]);
  const [syncingPayPal, setSyncingPayPal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  // Cargar configuración de PayPal
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getPayPalConfig();
        setPaypalConfig({
          client_id: config.client_id,
          currency: config.currency,
          mode: config.mode
        });
      } catch (error) {
        console.error('Error loading PayPal config:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
    loadPayments();
  }, []);

  // Cargar pagos de prueba anteriores
  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('paypal_test_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('Tabla paypal_test_payments no existe aún');
        setPayments([]);
      } else {
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Renderizar botón de PayPal cuando el formulario está completo
  useEffect(() => {
    if (!paypalConfig || !nombre || !apellidos || configLoading) {
      // Limpiar botón si no hay datos
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
        buttonRendered.current = false;
      }
      return;
    }

    // Verificar si PayPal SDK ya está cargado
    const loadAndRenderPayPal = async () => {
      // Si ya hay un script de PayPal, verificar si es el correcto
      const existingScript = document.querySelector('#paypal-sdk-test');
      
      if (existingScript) {
        const currentSrc = existingScript.getAttribute('src') || '';
        if (!currentSrc.includes(paypalConfig.client_id)) {
          existingScript.remove();
          // @ts-ignore
          window.paypal = undefined;
          buttonRendered.current = false;
        }
      }

      if (!window.paypal && !document.querySelector('#paypal-sdk-test')) {
        const script = document.createElement('script');
        script.id = 'paypal-sdk-test';
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.client_id}&currency=${paypalConfig.currency}`;
        script.async = true;
        
        script.onload = () => {
          renderPayPalButton();
        };
        
        script.onerror = () => {
          setMessage('Error al cargar PayPal SDK');
          setPaymentStatus('error');
        };
        
        document.body.appendChild(script);
      } else if (window.paypal) {
        // Limpiar y renderizar de nuevo
        if (paypalRef.current) {
          paypalRef.current.innerHTML = '';
          buttonRendered.current = false;
        }
        renderPayPalButton();
      }
    };

    loadAndRenderPayPal();
  }, [nombre, apellidos, producto, precio, paypalConfig, configLoading]);

  const renderPayPalButton = () => {
    if (!window.paypal || !paypalRef.current || buttonRendered.current || !paypalConfig) return;

    buttonRendered.current = true;

    const paypalInstance = window.paypal as any;
    paypalInstance.Buttons({
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 45,
      },

      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: precio.toFixed(2),
              currency_code: paypalConfig.currency
            },
            description: `TEST: ${producto} - ${nombre} ${apellidos}`
          }]
        });
      },

      onApprove: async (_data: any, actions: any) => {
        setPaymentStatus('processing');
        setMessage('Procesando pago...');
        
        try {
          const details = await actions.order.capture();
          console.log('✅ Pago TEST completado:', details);
          
          // Guardar en la base de datos
          const { error } = await supabase
            .from('paypal_test_payments')
            .insert({
              nombre,
              apellidos,
              producto,
              precio,
              paypal_order_id: details.id,
              paypal_payer_email: details.payer?.email_address || 'N/A',
              status: details.status
            });

          if (error) {
            console.log('No se pudo guardar en BD (tabla puede no existir):', error);
          }

          setPaymentStatus('success');
          setMessage(`¡Pago recibido! Order ID: ${details.id}`);
          
          // Recargar lista de pagos
          loadPayments();
          
          // Limpiar formulario
          setNombre('');
          setApellidos('');
          
        } catch (error: any) {
          console.error('Error al capturar pago:', error);
          setPaymentStatus('error');
          setMessage(`Error: ${error.message || 'Error desconocido'}`);
        }
      },

      onCancel: () => {
        setPaymentStatus('idle');
        setMessage('Pago cancelado por el usuario');
      },

      onError: (err: any) => {
        console.error('Error de PayPal:', err);
        setPaymentStatus('error');
        setMessage('Error en el proceso de pago');
      }
    }).render(paypalRef.current);
  };

  const clearPayments = async () => {
    if (!confirm('¿Eliminar todos los pagos de prueba?')) return;
    
    try {
      const { error } = await supabase
        .from('paypal_test_payments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

      if (!error) {
        setPayments([]);
        setMessage('Historial limpiado');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Sincronizar con PayPal API para obtener transacciones reales
  const syncPayPalTransactions = async () => {
    if (!paypalConfig) {
      setSyncMessage('Configuración de PayPal no disponible');
      return;
    }

    setSyncingPayPal(true);
    setSyncMessage('Conectando con PayPal...');

    try {
      // Llamar a la función edge de Supabase que se conecta a PayPal API
      const { data, error } = await supabase.functions.invoke('paypal-transactions', {
        body: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // últimos 30 días
          end_date: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error calling PayPal function:', error);
        setSyncMessage('Error: ' + (error.message || 'No se pudo conectar con PayPal'));
        
        // Fallback: intentar con endpoint local si existe
        try {
          const response = await fetch('/api/paypal-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: paypalConfig.client_id,
              start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date().toISOString()
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            setRealPayPalTransactions(result.transactions || []);
            setLastSyncTime(new Date());
            setSyncMessage(`✅ ${result.transactions?.length || 0} transacciones sincronizadas`);
          } else {
            throw new Error('API endpoint no disponible');
          }
        } catch (fallbackError) {
          setSyncMessage('⚠️ Función de sincronización no configurada. Ver instrucciones abajo.');
        }
        return;
      }

      setRealPayPalTransactions(data?.transactions || []);
      setLastSyncTime(new Date());
      setSyncMessage(`✅ ${data?.transactions?.length || 0} transacciones reales sincronizadas`);

    } catch (error: any) {
      console.error('Error syncing PayPal:', error);
      setSyncMessage('Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setSyncingPayPal(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const isFormValid = nombre.trim() && apellidos.trim() && producto.trim() && precio > 0;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 p-3 rounded-xl">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test PayPal Live</h1>
            <p className="text-gray-600">Prueba de pagos reales con PayPal</p>
          </div>
        </div>
        
        {/* Estado del modo */}
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          paypalConfig?.mode === 'live' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${
            paypalConfig?.mode === 'live' ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <span className={`font-medium ${
            paypalConfig?.mode === 'live' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Modo actual: {paypalConfig?.mode?.toUpperCase() || 'DESCONOCIDO'}
          </span>
          {paypalConfig?.mode === 'sandbox' && (
            <span className="text-yellow-600 text-sm ml-2">
              (Cambia a LIVE en Configuración PayPal para pagos reales)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de prueba */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            Datos del Pago de Prueba
          </h2>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Tus apellidos"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-1" />
                Producto
              </label>
              <input
                type="text"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Euro className="w-4 h-4 inline mr-1" />
                Precio (€)
              </label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo recomendado: 0.05€ para pruebas
              </p>
            </div>

            {/* Resumen */}
            {isFormValid && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Resumen del pago:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Cliente:</strong> {nombre} {apellidos}</p>
                  <p><strong>Producto:</strong> {producto}</p>
                  <p><strong>Total:</strong> {precio.toFixed(2)}€</p>
                </div>
              </div>
            )}

            {/* Botón de PayPal */}
            {isFormValid ? (
              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-2 text-center">
                  Haz clic en el botón para pagar:
                </p>
                <div ref={paypalRef} className="w-full"></div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                <p>Completa todos los campos para ver el botón de PayPal</p>
              </div>
            )}

            {/* Estado del pago */}
            {paymentStatus !== 'idle' && (
              <div className={`rounded-lg p-4 flex items-center gap-3 ${
                paymentStatus === 'success' ? 'bg-green-50 border border-green-200' :
                paymentStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                {paymentStatus === 'processing' && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
                {paymentStatus === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {paymentStatus === 'error' && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  paymentStatus === 'success' ? 'text-green-700' :
                  paymentStatus === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {message}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Historial de Pagos
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadPayments}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Recargar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {payments.length > 0 && (
                <button
                  onClick={clearPayments}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Limpiar historial"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay pagos de prueba registrados</p>
              <p className="text-sm">Realiza un pago para verlo aquí</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.nombre} {payment.apellidos}
                      </p>
                      <p className="text-sm text-gray-600">{payment.producto}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{payment.precio.toFixed(2)}€</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  {payment.paypal_order_id && (
                    <p className="text-xs text-gray-400 mt-2 font-mono">
                      Order: {payment.paypal_order_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel de transacciones reales de PayPal */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Transacciones Reales de PayPal
            </h2>
            {lastSyncTime && (
              <p className="text-xs text-gray-500 mt-1">
                Última sincronización: {lastSyncTime.toLocaleString('es-ES')}
              </p>
            )}
          </div>
          <button
            onClick={syncPayPalTransactions}
            disabled={syncingPayPal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {syncingPayPal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sincronizar con PayPal
              </>
            )}
          </button>
        </div>

        {syncMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            syncMessage.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
            syncMessage.includes('⚠️') ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {syncMessage}
          </div>
        )}

        {realPayPalTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay transacciones sincronizadas</p>
            <p className="text-sm">Haz clic en "Sincronizar" para obtener transacciones reales de PayPal</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {realPayPalTransactions.map((transaction, idx) => (
              <div
                key={transaction.id || idx}
                className="bg-blue-50 rounded-lg p-4 border border-blue-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {transaction.payer?.name?.given_name} {transaction.payer?.name?.surname || ''}
                    </p>
                    <p className="text-sm text-gray-600">{transaction.payer?.email_address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.description || transaction.items?.[0]?.description || 'Sin descripción'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(transaction.create_time || transaction.update_time).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {transaction.amount?.value || transaction.purchase_units?.[0]?.amount?.value} {transaction.amount?.currency_code || transaction.purchase_units?.[0]?.amount?.currency_code || 'EUR'}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      transaction.status === 'COMPLETED' || transaction.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-700' 
                        : transaction.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
                {transaction.id && (
                  <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                    ID: {transaction.id}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instrucciones para configurar la sincronización */}
        <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">📘 Configurar sincronización con PayPal:</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>Para que la sincronización funcione, necesitas crear una función edge en Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Ve a tu proyecto Supabase → Edge Functions</li>
              <li>Crea una función llamada <code className="bg-blue-100 px-1 rounded">paypal-transactions</code></li>
              <li>La función debe usar PayPal REST API para obtener transacciones</li>
              <li>Necesitas CLIENT_ID y SECRET de PayPal en las variables de entorno</li>
              <li>API endpoint: <code className="bg-blue-100 px-1 rounded">https://api-m.paypal.com/v1/reporting/transactions</code></li>
            </ol>
            <p className="mt-2 text-xs">
              Alternativamente, puedes crear un endpoint local en <code className="bg-blue-100 px-1 rounded">/api/paypal-transactions</code>
            </p>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">📋 Instrucciones:</h3>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Asegúrate de tener configurado PayPal en modo <strong>LIVE</strong> en la sección de configuración</li>
          <li>Rellena el formulario con datos de prueba</li>
          <li>El precio mínimo recomendado es <strong>0.05€</strong></li>
          <li>Haz clic en el botón de PayPal y completa el pago con tu cuenta real</li>
          <li>El pago se registrará en el historial</li>
        </ol>
      </div>
    </div>
  );
}
