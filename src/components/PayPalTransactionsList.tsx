import { useState } from 'react';
import { CreditCard, RefreshCw, Loader2, Calendar, DollarSign, Mail, User, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPayPalConfig } from '../lib/paypalConfig';

interface PayPalTransaction {
  id: string;
  payer?: {
    name?: {
      given_name?: string;
      surname?: string;
    };
    email_address?: string;
  };
  amount?: {
    value: string;
    currency_code: string;
  };
  purchase_units?: Array<{
    amount: {
      value: string;
      currency_code: string;
    };
  }>;
  status: string;
  create_time?: string;
  update_time?: string;
  description?: string;
  items?: Array<{
    description?: string;
  }>;
}

export default function PayPalTransactionsList() {
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [paypalConfig, setPaypalConfig] = useState<{ client_id: string; currency: string; mode: string } | null>(null);

  const syncTransactions = async () => {
    setLoading(true);
    setMessage('Conectando con PayPal...');

    try {
      // Cargar configuración si no está cargada
      if (!paypalConfig) {
        const config = await getPayPalConfig();
        setPaypalConfig({
          client_id: config.client_id,
          currency: config.currency,
          mode: config.mode
        });
      }

      // Llamar a la función edge de Supabase
      const { data, error } = await supabase.functions.invoke('paypal-transactions', {
        body: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // últimos 30 días
          end_date: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error calling PayPal function:', error);
        setMessage('❌ Error: ' + (error.message || 'No se pudo conectar con PayPal'));
        return;
      }

      if (data?.success) {
        setTransactions(data.transactions || []);
        setLastSyncTime(new Date());
        setMessage(`✅ ${data.transactions?.length || 0} transacciones sincronizadas correctamente`);
      } else {
        setMessage('⚠️ No se encontraron transacciones en el período seleccionado');
      }

    } catch (error: any) {
      console.error('Error syncing PayPal:', error);
      setMessage('❌ Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'FAILED':
      case 'DECLINED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con acción */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transacciones de PayPal</h2>
          <p className="text-gray-600 mt-1">
            Sincroniza y visualiza las transacciones reales desde tu cuenta PayPal
          </p>
          {lastSyncTime && (
            <p className="text-sm text-gray-500 mt-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Última sincronización: {lastSyncTime.toLocaleString('es-ES')}
            </p>
          )}
        </div>
        <button
          onClick={syncTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Sincronizar con PayPal
            </>
          )}
        </button>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' :
          message.includes('⚠️') ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
          'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="font-medium">{message}</p>
        </div>
      )}

      {/* Lista de transacciones */}
      {transactions.length === 0 && !loading ? (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay transacciones sincronizadas
          </h3>
          <p className="text-gray-600 mb-6">
            Haz clic en "Sincronizar con PayPal" para obtener las transacciones reales de tu cuenta
          </p>
          <button
            onClick={syncTransactions}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Sincronizar ahora
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {transactions.map((transaction, idx) => {
            const amount = transaction.amount?.value || transaction.purchase_units?.[0]?.amount?.value || '0.00';
            const currency = transaction.amount?.currency_code || transaction.purchase_units?.[0]?.amount?.currency_code || 'EUR';
            const description = transaction.description || transaction.items?.[0]?.description || 'Sin descripción';
            const date = new Date(transaction.create_time || transaction.update_time || '');
            const payerName = `${transaction.payer?.name?.given_name || ''} ${transaction.payer?.name?.surname || ''}`.trim() || 'Nombre no disponible';
            const payerEmail = transaction.payer?.email_address || 'Email no disponible';

            return (
              <div
                key={transaction.id || idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1 space-y-3">
                    {/* Nombre y email */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{payerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{payerEmail}</span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{description}</span>
                    </div>

                    {/* Fecha */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{date.toLocaleString('es-ES', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}</span>
                    </div>

                    {/* ID de transacción */}
                    {transaction.id && (
                      <div className="text-xs text-gray-400 font-mono">
                        ID: {transaction.id}
                      </div>
                    )}
                  </div>

                  {/* Monto y estado */}
                  <div className="flex lg:flex-col items-center lg:items-end gap-3">
                    <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                      <DollarSign className="w-6 h-6" />
                      <span>{amount} {currency}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Información sobre la sincronización
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Las transacciones se sincronizan desde PayPal mediante la API oficial</p>
          <p>• Se muestran las transacciones de los últimos 30 días</p>
          <p>• Solo se sincronizan transacciones en modo LIVE (producción)</p>
          <p>• Los datos se obtienen en tiempo real y no se almacenan localmente</p>
        </div>
      </div>
    </div>
  );
}
