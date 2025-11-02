# Integración de PayPal - Guía de Configuración

## 📋 Resumen

Se ha integrado PayPal como método de pago en el formulario de inscripción. Los usuarios pueden pagar directamente con PayPal o seleccionar transferencia bancaria.

## 🔧 Configuración

### 1. Obtener credenciales de PayPal Sandbox

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Inicia sesión con tu cuenta de PayPal
3. Ve a **"Apps & Credentials"**
4. En la sección **Sandbox**, haz clic en **"Create App"**
5. Dale un nombre a tu aplicación (ej: "Virtus Awards Sandbox")
6. Copia el **Client ID** que aparece

### 2. Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
# PayPal Sandbox (Para pruebas)
VITE_PAYPAL_CLIENT_ID=tu_client_id_sandbox_aqui
```

Para **producción**, usa las credenciales de **Live** en lugar de Sandbox:

```bash
# PayPal Live (Para producción)
VITE_PAYPAL_CLIENT_ID=tu_client_id_live_aqui
```

### 3. Probar en modo Sandbox

PayPal proporciona cuentas de prueba automáticas:

#### Cuenta de comprador de prueba:
- **Email**: [Generado por PayPal en Sandbox Accounts]
- **Contraseña**: [Generada por PayPal]

Para crear/ver cuentas de prueba:
1. Ve a **Sandbox** > **Accounts** en el Dashboard
2. Usa las cuentas **Personal (Buyer)** para simular compradores
3. Usa las cuentas **Business (Seller)** para recibir pagos

### 4. Cuentas de prueba típicas

PayPal Sandbox genera automáticamente:
- Email: `sb-xxxxx@personal.example.com` (Comprador)
- Email: `sb-xxxxx@business.example.com` (Vendedor)
- Contraseña: Visible en el Dashboard

## 🎯 Funcionamiento

### Flujo de pago con PayPal:

1. Usuario completa el formulario de inscripción
2. En la pantalla de confirmación, selecciona **"PayPal"**
3. Hace clic en el botón **"Pagar con PayPal"**
4. **Se abre un modal elegante** con:
   - Logo de PayPal
   - Resumen del pago (empresa, muestras, total)
   - Información de seguridad
   - Botón oficial de PayPal
5. Usuario hace clic en el botón de PayPal dentro del modal
6. Se abre el modal/ventana de PayPal
7. Usuario inicia sesión en PayPal y confirma el pago
8. PayPal procesa el pago
9. La aplicación recibe la confirmación
10. El modal se cierra automáticamente
11. Se crea la inscripción en la base de datos
12. Se envían los emails de confirmación
13. Usuario ve la pantalla de éxito

### Flujo con transferencia bancaria:

1. Usuario completa el formulario
2. Selecciona **"Transferencia bancaria"**
3. Hace clic en **"Enviar inscripción"**
4. Se crea la inscripción con estado pendiente
5. Usuario recibe email con datos bancarios
6. Debe realizar la transferencia manualmente

## 💻 Código implementado

### Archivos creados/modificados:

1. **`src/components/PayPalButton.tsx`** (Nuevo)
   - Componente React para el botón de PayPal
   - Carga dinámicamente el SDK de PayPal
   - Maneja la creación de órdenes y captura de pagos

2. **`src/components/PayPalModal.tsx`** (Nuevo) ⭐
   - Modal elegante para pagos de PayPal
   - Diseño moderno con degradados azules
   - Resumen del pago con empresa, muestras y total
   - Logo de PayPal integrado
   - Información de seguridad SSL
   - Botón de cancelación
   - Cierre automático al completar pago

3. **`src/components/ConfirmacionScreen.tsx`** (Modificado)
   - Integra el componente PayPalModal
   - Botón "Pagar con PayPal" que abre el modal
   - Renderizado condicional según método de pago
   - Estado local para controlar apertura/cierre del modal

4. **`src/components/UnifiedInscriptionForm.tsx`** (Modificado)
   - Pasa el callback `onPayPalSuccess` a ConfirmacionScreen
   - Maneja el éxito del pago de PayPal
   - Redirige a pantalla de éxito tras pago completado

5. **`.env.example`** (Actualizado)
   - Documentación de variables de entorno necesarias

## 🧪 Testing en Sandbox

### Probar un pago:

1. Inicia la aplicación en modo desarrollo
2. Completa el formulario de inscripción
3. Selecciona **PayPal** como método de pago
4. Haz clic en el botón azul de PayPal
5. Inicia sesión con una **cuenta de prueba Personal/Buyer**
6. Confirma el pago
7. Verás el pago procesado y la inscripción completada

### Ver transacciones de prueba:

1. Ve a [PayPal Sandbox Dashboard](https://developer.paypal.com/dashboard/)
2. **Sandbox** > **Accounts**
3. Selecciona tu cuenta Business
4. Click en **"Login to Sandbox"** (se abre PayPal Sandbox)
5. Ve a **"Activity"** para ver las transacciones

## 🚀 Pasar a producción

### Cambios necesarios:

1. Obtén credenciales **Live** desde el Dashboard de PayPal (sección Live en lugar de Sandbox)
2. Actualiza `.env` o variables de entorno en Vercel:
   ```bash
   VITE_PAYPAL_CLIENT_ID=tu_client_id_LIVE_aqui
   ```
3. Asegúrate de que tu cuenta de PayPal Business esté verificada
4. Configura webhooks (opcional) para recibir notificaciones de pagos

## 🔐 Seguridad

- ✅ El Client ID es público y seguro exponerlo
- ✅ NO se requiere Secret Key en el frontend
- ✅ PayPal maneja todo el proceso de pago de forma segura
- ✅ La aplicación solo recibe confirmación del pago
- ✅ Los datos de tarjetas nunca pasan por nuestra aplicación

## 📊 Información adicional

### Moneda
- Por defecto: **EUR** (Euros)
- Se puede cambiar en `PayPalButton.tsx` si es necesario

### Comisiones de PayPal
- Sandbox: Sin comisiones reales
- Producción: Aplican comisiones de PayPal según tu cuenta
- Típicamente: 3.4% + 0.35€ por transacción en Europa

### Soporte
- [Documentación oficial de PayPal](https://developer.paypal.com/docs/)
- [SDK de JavaScript](https://developer.paypal.com/sdk/js/)
- [Guía de testing](https://developer.paypal.com/tools/sandbox/)

## ✅ Checklist de configuración

- [ ] Cuenta de PayPal Developer creada
- [ ] Aplicación Sandbox creada
- [ ] Client ID obtenido
- [ ] Variable de entorno `VITE_PAYPAL_CLIENT_ID` configurada
- [ ] Aplicación reiniciada tras agregar la variable
- [ ] Prueba de pago realizada con cuenta Sandbox
- [ ] Transacción visible en el Dashboard de PayPal
- [ ] Emails de confirmación funcionando
- [ ] Inscripción guardada en Supabase

## 🐛 Troubleshooting

### El botón de PayPal no aparece
- Verifica que `VITE_PAYPAL_CLIENT_ID` esté configurado
- Revisa la consola del navegador en busca de errores
- Asegúrate de haber reiniciado el servidor de desarrollo

### Error "Client ID is invalid"
- Verifica que hayas copiado el Client ID completo
- Asegúrate de usar el Client ID de Sandbox (no Live) para pruebas
- Revisa que no haya espacios extra al copiar

### El pago se cancela inmediatamente
- Verifica que estés usando una cuenta de prueba Personal/Buyer válida
- Revisa la consola para mensajes de error de PayPal

### No recibo emails de confirmación
- Verifica que `BREVO_API_KEY` esté configurado
- Revisa los logs de Vercel/servidor
- Chequea la carpeta de spam
