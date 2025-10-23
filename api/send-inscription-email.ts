// Vercel Serverless Function (TypeScript)
// Ruta: /api/send-inscription-email
// Espera POST { empresa, muestras, precio, metodoPago }
// Variables de entorno (configurar en Vercel):
// - BREVO_API_KEY
// - SENDER_EMAIL
// - SENDER_NAME
// Force redeploy: 2025-10-22 17:30

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = req.body;
    if (typeof payload === 'string') payload = JSON.parse(payload);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { empresa, muestras, precio, metodoPago } = payload;
  
  if (!empresa || !empresa.email || !empresa.nombre_empresa) {
    return res.status(400).json({ error: 'Missing empresa data' });
  }

  // Debug: Verificar variables de entorno
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@internationalvirtus.es';
  const SENDER_NAME = process.env.SENDER_NAME || 'International Virtus La Rábida';
  const ADMIN_EMAIL = 'jrsepul2000@gmail.com'; // Email del administrador

  console.log('🔍 Debug variables de entorno:');
  console.log('BREVO_API_KEY existe:', !!BREVO_API_KEY);
  console.log('BREVO_API_KEY length:', BREVO_API_KEY ? BREVO_API_KEY.length : 0);
  console.log('BREVO_API_KEY preview:', BREVO_API_KEY ? `${BREVO_API_KEY.substring(0, 8)}...${BREVO_API_KEY.substring(-4)}` : 'undefined');
  console.log('SENDER_EMAIL:', SENDER_EMAIL);
  console.log('SENDER_NAME:', SENDER_NAME);
  console.log('Environment:', process.env.NODE_ENV || 'unknown');
  console.log('Vercel Region:', process.env.VERCEL_REGION || 'unknown');
  console.log('Variables disponibles:', Object.keys(process.env).filter(key => key.includes('BREVO') || key.includes('SENDER')));

  if (!BREVO_API_KEY) {
    return res.status(500).json({ 
      error: 'BREVO_API_KEY not configured',
      debug: {
        hasBrevoKey: !!BREVO_API_KEY,
        envKeys: Object.keys(process.env).filter(key => key.includes('BREVO') || key.includes('SENDER')),
        senderEmail: SENDER_EMAIL,
        senderName: SENDER_NAME
      }
    });
  }

  const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

  // Generar lista de muestras para los emails
  const muestrasHtml = muestras.map((muestra: any, index: number) => `
    <li>
      <strong>Muestra ${index + 1}:</strong> ${muestra.nombre_muestra || 'Sin nombre'}<br>
      ${muestra.categoria ? `<em>Categoría:</em> ${muestra.categoria}<br>` : ''}
      ${muestra.origen ? `<em>Origen:</em> ${muestra.origen}<br>` : ''}
      ${muestra.pais ? `<em>País:</em> ${muestra.pais}` : ''}
    </li>
  `).join('');

  // Email para la bodega/empresa
  const bodegaEmailBody = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: empresa.email, name: empresa.persona_contacto || empresa.nombre_empresa }],
    subject: '¡Inscripción confirmada - International Virtus La Rábida 2026!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B3A2A;">¡Gracias por tu inscripción!</h2>
        
        <p>Estimado/a ${empresa.persona_contacto || 'representante'},</p>
        
        <p>Hemos recibido correctamente la inscripción de <strong>${empresa.nombre_empresa}</strong> para el concurso International Virtus La Rábida 2026.</p>
        
        <h3 style="color: #8A754C;">Resumen de tu inscripción:</h3>
        <ul>
          <li><strong>Empresa:</strong> ${empresa.nombre_empresa}</li>
          <li><strong>NIF:</strong> ${empresa.nif}</li>
          <li><strong>Email:</strong> ${empresa.email}</li>
          <li><strong>Teléfono:</strong> ${empresa.telefono}</li>
          <li><strong>Número de muestras:</strong> ${empresa.num_muestras}</li>
          <li><strong>Muestras pagadas:</strong> ${precio.pagadas}</li>
          <li><strong>Muestras gratis:</strong> ${precio.gratis}</li>
          <li><strong>Total a pagar:</strong> ${precio.total}€</li>
          <li><strong>Método de pago:</strong> ${metodoPago === 'transferencia' ? 'Transferencia bancaria' : 'PayPal'}</li>
        </ul>
        
        <h3 style="color: #8A754C;">Muestras inscritas:</h3>
        <ol>
          ${muestrasHtml}
        </ol>
        
        ${metodoPago === 'transferencia' ? `
        <h3 style="color: #8A754C;">Datos para transferencia bancaria:</h3>
        <p><strong>Titular:</strong> Excelencias de Huelva S.L.<br>
        <strong>Banco:</strong> Caja Rural del Sur<br>
        <strong>IBAN:</strong> ES21 0237 0506 4091 7146 4247<br>
        <strong>BIC/SWIFT:</strong> CSURES2CXXX<br>
        <strong>Concepto:</strong> Inscripción concurso - ${empresa.nombre_empresa}</p>
        ` : ''}
        
        <p>En breve nos pondremos en contacto contigo para confirmar todos los detalles.</p>
        
        <p>¡Gracias por participar!</p>
        
        <p style="color: #8A754C;"><strong>International Virtus La Rábida 2026</strong></p>
      </div>
    `,
  };

  // Email para el administrador
  const adminEmailBody = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: ADMIN_EMAIL, name: 'Administrador' }],
    subject: `Nueva inscripción: ${empresa.nombre_empresa} - ${empresa.num_muestras} muestras`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B3A2A;">Nueva inscripción recibida</h2>
        
        <h3 style="color: #8A754C;">Datos de la empresa:</h3>
        <ul>
          <li><strong>Empresa:</strong> ${empresa.nombre_empresa}</li>
          <li><strong>NIF:</strong> ${empresa.nif}</li>
          <li><strong>Persona de contacto:</strong> ${empresa.persona_contacto}</li>
          <li><strong>Email:</strong> ${empresa.email}</li>
          <li><strong>Teléfono:</strong> ${empresa.telefono}</li>
          <li><strong>Móvil:</strong> ${empresa.movil}</li>
          <li><strong>Dirección:</strong> ${empresa.direccion}</li>
          <li><strong>Población:</strong> ${empresa.poblacion}</li>
          <li><strong>Código postal:</strong> ${empresa.codigo_postal}</li>
          <li><strong>Ciudad:</strong> ${empresa.ciudad}</li>
          <li><strong>País:</strong> ${empresa.pais}</li>
          <li><strong>Página web:</strong> ${empresa.pagina_web}</li>
          <li><strong>Medio conoció:</strong> ${empresa.medio_conocio}</li>
          <li><strong>Observaciones:</strong> ${empresa.observaciones}</li>
        </ul>
        
        <h3 style="color: #8A754C;">Resumen económico:</h3>
        <ul>
          <li><strong>Número de muestras:</strong> ${empresa.num_muestras}</li>
          <li><strong>Muestras pagadas:</strong> ${precio.pagadas}</li>
          <li><strong>Muestras gratis:</strong> ${precio.gratis}</li>
          <li><strong>Total a pagar:</strong> ${precio.total}€</li>
          <li><strong>Método de pago:</strong> ${metodoPago === 'transferencia' ? 'Transferencia bancaria' : 'PayPal'}</li>
        </ul>
        
        <h3 style="color: #8A754C;">Muestras inscritas:</h3>
        <ol>
          ${muestrasHtml}
        </ol>
        
        <hr>
        <h4>Datos completos (JSON):</h4>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">${JSON.stringify({ empresa, muestras, precio, metodoPago }, null, 2)}</pre>
      </div>
    `,
  };

  try {
    // Enviar email a la bodega
    const resBodega = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodegaEmailBody),
    });

    if (!resBodega.ok) {
      const txt = await resBodega.text();
      console.error('Brevo bodega email error:', resBodega.status, txt);
      console.error('Brevo headers:', Object.fromEntries(resBodega.headers.entries()));
      console.error('Request headers sent:', {
        'api-key': BREVO_API_KEY ? `${BREVO_API_KEY.substring(0, 8)}...` : 'undefined',
        'Content-Type': 'application/json'
      });
    }

    // Enviar email al administrador
    const resAdmin = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminEmailBody),
    });

    if (!resAdmin.ok) {
      const txt = await resAdmin.text();
      console.error('Brevo admin email error:', resAdmin.status, txt);
      console.error('Brevo headers:', Object.fromEntries(resAdmin.headers.entries()));
      console.error('Request headers sent:', {
        'api-key': BREVO_API_KEY ? `${BREVO_API_KEY.substring(0, 8)}...` : 'undefined',
        'Content-Type': 'application/json'
      });
      return res.status(502).json({ 
        error: 'Failed to send admin email', 
        details: txt,
        status: resAdmin.status,
        apiKeyPreview: BREVO_API_KEY ? `${BREVO_API_KEY.substring(0, 8)}...` : 'undefined',
        environment: process.env.NODE_ENV || 'unknown',
        vercelRegion: process.env.VERCEL_REGION || 'unknown'
      });
    }

    return res.status(200).json({ success: true, message: 'Emails enviados correctamente' });
  } catch (error: any) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ error: 'Internal error sending emails', details: String(error) });
  }
}