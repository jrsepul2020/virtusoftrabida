import { useEffect, useRef } from 'react';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

export function PayPalButton({ amount, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  useEffect(() => {
    // Cargar el script de PayPal si no está cargado
    if (!window.paypal && !document.querySelector('#paypal-sdk')) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      
      // Obtener credenciales desde variables de entorno o usar valores por defecto
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';
      const currency = 'EUR';
      
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
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
  }, [amount]);

  const renderPayPalButton = () => {
    if (!window.paypal || !paypalRef.current || buttonRendered.current) return;

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
              currency_code: 'EUR'
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

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full"></div>
    </div>
  );
}
