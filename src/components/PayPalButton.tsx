import { useEffect, useRef, useState } from 'react';
import { getPayPalConfig } from '../lib/paypalConfig';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

export function PayPalButton({ amount, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState<{ client_id: string; currency: string } | null>(null);

  // Cargar configuración de PayPal
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getPayPalConfig();
        setPaypalConfig({
          client_id: config.client_id,
          currency: config.currency
        });
        setConfigLoaded(true);
      } catch (error) {
        console.error('Error loading PayPal config:', error);
        // Usar valores por defecto
        setPaypalConfig({
          client_id: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
          currency: 'EUR'
        });
        setConfigLoaded(true);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!configLoaded || !paypalConfig) return;

    // Cargar el script de PayPal si no está cargado
    const existingScript = document.querySelector('#paypal-sdk');
    
    // Si hay un script existente con diferente client_id, removerlo
    if (existingScript) {
      const currentSrc = existingScript.getAttribute('src') || '';
      if (!currentSrc.includes(paypalConfig.client_id)) {
        existingScript.remove();
        const win = window as typeof window & { paypal?: any };
        win.paypal = undefined;
        buttonRendered.current = false;
      }
    }

    if (!window.paypal && !document.querySelector('#paypal-sdk')) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.client_id}&currency=${paypalConfig.currency}`;
      script.async = true;
      
      script.onload = () => {
        if (window.paypal && paypalRef.current && !buttonRendered.current) {
          renderPayPalButton();
        }
      };
      
      script.onerror = () => {
        console.error('Error al cargar el SDK de PayPal');
        onError({ message: 'Error al cargar PayPal SDK' });
      };
      
      document.body.appendChild(script);
    } else if (window.paypal && paypalRef.current && !buttonRendered.current) {
      renderPayPalButton();
    }

    return () => {
      // Cleanup: remover el botón si el componente se desmonta
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
        buttonRendered.current = false;
      }
    };
  }, [amount, configLoaded, paypalConfig]);

  const renderPayPalButton = () => {
    if (!window.paypal || !paypalRef.current || buttonRendered.current || !paypalConfig) return;

    buttonRendered.current = true;

    const paypalInstance = window.paypal as any;
    paypalInstance.Buttons({
      // Estilo del botón
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 50,
      },

      // Crear la orden
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2),
              currency_code: paypalConfig.currency
            },
            description: 'Inscripción International Virtus Awards'
          }]
        });
      },

      // Aprobar el pago
      onApprove: async (_data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          console.log('Pago completado:', details);
          onSuccess(details);
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          onError(error);
        }
      },

      // Cancelar el pago
      onCancel: (data: any) => {
        console.log('Pago cancelado:', data);
        if (onCancel) {
          onCancel();
        }
      },

      // Error en el pago
      onError: (err: any) => {
        console.error('Error de PayPal:', err);
        onError(err);
      }
    }).render(paypalRef.current);
  };

  if (!configLoaded) {
    return (
      <div className="w-full flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full"></div>
    </div>
  );
}
