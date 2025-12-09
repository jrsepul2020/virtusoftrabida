# Sincronización con PayPal API

Este documento explica cómo configurar la sincronización automática con PayPal para obtener transacciones reales en el Test PayPal Live.

## Requisitos Previos

1. **Cuenta PayPal Business o Developer**
2. **Credenciales de API REST de PayPal**
   - Client ID
   - Secret

## Opción 1: Función Edge de Supabase (Recomendado)

### Paso 1: Obtener Credenciales de PayPal

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Navega a **My Apps & Credentials**
3. Selecciona **Live** (para producción) o **Sandbox** (para pruebas)
4. Crea una nueva app o usa una existente
5. Copia el **Client ID** y **Secret**

### Paso 2: Configurar Variables de Entorno en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Edge Functions** → **Settings**
3. Añade las siguientes variables de entorno:

```bash
PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_SECRET=tu_secret_aqui
PAYPAL_MODE=live  # o 'sandbox' para pruebas
```

### Paso 3: Desplegar la Función Edge

```bash
# Instala Supabase CLI si no lo tienes
npm install -g supabase

# Autentícate
supabase login

# Despliega la función
supabase functions deploy paypal-transactions --project-ref tu-proyecto-id
```

### Paso 4: Probar la Función

```bash
# Prueba local
supabase functions serve paypal-transactions

# En otra terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/paypal-transactions' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"start_date":"2024-01-01T00:00:00Z","end_date":"2024-12-31T23:59:59Z"}'
```

## Opción 2: API Local (Alternativa)

Si prefieres no usar Supabase Functions, puedes crear un endpoint local.

### Estructura del endpoint

**POST** `/api/paypal-transactions`

**Body:**
```json
{
  "client_id": "tu_client_id",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z"
}
```

**Respuesta:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "transaction_id",
      "status": "COMPLETED",
      "amount": {
        "value": "150.00",
        "currency_code": "EUR"
      },
      "payer": {
        "email_address": "cliente@example.com",
        "name": {
          "given_name": "Juan",
          "surname": "Pérez"
        }
      },
      "description": "Pago inscripción",
      "create_time": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### Ejemplo con Express.js

```javascript
// api/paypal-transactions.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/paypal-transactions', async (req, res) => {
  try {
    const { client_id, start_date, end_date } = req.body;
    
    // Obtener credenciales de variables de entorno
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

    const baseURL = PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // 1. Obtener token
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // 2. Obtener transacciones
    const transactionsURL = `${baseURL}/v1/reporting/transactions?start_date=${start_date}&end_date=${end_date}&fields=all`;
    
    const transactionsResponse = await fetch(transactionsURL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await transactionsResponse.json();
    
    res.json({
      success: true,
      transactions: data.transaction_details || []
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

## Uso en la Aplicación

Una vez configurado cualquiera de los dos métodos:

1. Ve a **Test PayPal Live** en el dashboard
2. Haz clic en **"Sincronizar con PayPal"**
3. Las transacciones reales aparecerán en el panel inferior
4. Puedes sincronizar las veces que quieras para obtener datos actualizados

## API de PayPal - Endpoints Útiles

### Transactions API (Reporting)
- Documentación: https://developer.paypal.com/docs/api/transaction-search/v1/
- Endpoint: `GET /v1/reporting/transactions`
- Requiere: Access Token OAuth 2.0

### Parámetros de búsqueda
- `start_date`: Fecha inicio (ISO 8601)
- `end_date`: Fecha fin (ISO 8601)
- `transaction_status`: Filtrar por estado (S=Success, P=Pending, etc.)
- `fields`: `all` para todos los campos

### Estados de transacción
- `S`: Success (Completado)
- `P`: Pending (Pendiente)
- `V`: Reversed (Revertido)
- `D`: Denied (Denegado)

## Troubleshooting

### Error: "PayPal authentication failed"
- Verifica que CLIENT_ID y SECRET sean correctos
- Asegúrate de usar las credenciales del modo correcto (Live vs Sandbox)

### Error: "Failed to fetch transactions"
- Verifica el formato de fechas (debe ser ISO 8601)
- Asegúrate de que el rango de fechas no supere 31 días
- Comprueba que tu cuenta tenga permisos de API

### No aparecen transacciones
- Verifica que haya transacciones reales en el periodo seleccionado
- Comprueba que estés usando el modo correcto (Live vs Sandbox)
- Revisa los logs de la función edge en Supabase

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca expongas tu SECRET en el frontend
- Usa siempre HTTPS en producción
- Las credenciales deben estar en variables de entorno
- Implementa rate limiting en tu API
- Valida y sanitiza todos los inputs

## Recursos Adicionales

- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Transaction Search API](https://developer.paypal.com/docs/api/transaction-search/v1/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
