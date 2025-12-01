import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface PayPalConfig {
  client_id: string;
  mode: 'sandbox' | 'live';
  currency: string;
  enabled: boolean;
}

const defaultConfig: PayPalConfig = {
  client_id: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
  mode: 'sandbox',
  currency: 'EUR',
  enabled: true
};

export function usePayPalConfig() {
  const [config, setConfig] = useState<PayPalConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_paypal')
        .select('*')
        .single();

      if (error) {
        console.log('Using default PayPal config (from env or defaults)');
        setConfig(defaultConfig);
      } else if (data) {
        setConfig({
          client_id: data.client_id || defaultConfig.client_id,
          mode: data.mode || 'sandbox',
          currency: data.currency || 'EUR',
          enabled: data.enabled !== false
        });
      }
    } catch (error) {
      console.error('Error loading PayPal config:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, reload: loadConfig };
}

// Función para obtener la configuración de PayPal de forma síncrona (para scripts)
export async function getPayPalConfig(): Promise<PayPalConfig> {
  try {
    const { data, error } = await supabase
      .from('configuracion_paypal')
      .select('*')
      .single();

    if (error || !data) {
      return defaultConfig;
    }

    return {
      client_id: data.client_id || defaultConfig.client_id,
      mode: data.mode || 'sandbox',
      currency: data.currency || 'EUR',
      enabled: data.enabled !== false
    };
  } catch {
    return defaultConfig;
  }
}
