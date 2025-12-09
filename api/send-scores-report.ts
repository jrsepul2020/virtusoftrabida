// Ruta: /api/send-scores-report
// Envía el PDF de resultados preliminares a una lista de usuarios usando Brevo (Sendinblue)

interface SendReportPayload {
  recipients: string[];
  message?: string;
  resumen?: {
    totalRegistradas?: number;
    totalEvaluadas?: number;
    promedio?: number;
    fecha?: string;
  };
  pdf: {
    filename: string;
    base64: string;
  };
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@internationalvirtus.es';
  const SENDER_NAME = process.env.SENDER_NAME || 'International Virtus La Rábida';

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  }

  let payload: SendReportPayload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recipients = Array.isArray(payload.recipients)
    ? Array.from(new Set(payload.recipients.filter(email => emailRegex.test(email))))
    : [];

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'La lista de destinatarios es obligatoria' });
  }

  if (!payload.pdf?.filename || !payload.pdf?.base64) {
    return res.status(400).json({ error: 'El PDF adjunto es obligatorio' });
  }

  const resumen = payload.resumen || {};
  const fechaTexto = resumen.fecha
    ? new Date(resumen.fecha).toLocaleString('es-ES')
    : new Date().toLocaleString('es-ES');
  const promedioTexto = resumen.totalEvaluadas ? Number(resumen.promedio ?? 0).toFixed(2) : 'N/D';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="color: #b45309;">Informe preliminar Virtus</h2>
      <p>Adjuntamos el PDF con el estado actual de las puntuaciones.</p>
      <ul>
        <li><strong>Total registradas:</strong> ${resumen.totalRegistradas ?? 'N/D'}</li>
        <li><strong>Total evaluadas:</strong> ${resumen.totalEvaluadas ?? 'N/D'}</li>
        <li><strong>Promedio general:</strong> ${promedioTexto}</li>
        <li><strong>Generado:</strong> ${fechaTexto}</li>
      </ul>
      ${payload.message ? `<p style="margin-top: 16px;">${payload.message}</p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Enviado automáticamente desde el panel de puntuaciones.</p>
    </div>
  `;

  try {
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: recipients.map(email => ({ email })),
        subject: `Informe preliminar Virtus - ${fechaTexto}`,
        htmlContent,
        attachment: [
          {
            content: payload.pdf.base64,
            name: payload.pdf.filename
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Brevo send-scores error:', response.status, details);
      return res.status(502).json({ error: 'Failed to send email', details });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error enviando informe:', error);
    return res.status(500).json({ error: 'Internal error sending email', details: String(error) });
  }
}
