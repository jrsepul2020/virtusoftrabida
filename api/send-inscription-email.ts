// api/send-inscription-email.ts
// Vercel Serverless Function (TypeScript)
// Route: /api/send-inscription-email
// Expects POST { name, email, phone?, ... }
// Environment variables required in Vercel:
// - BREVO_API_KEY
// - SENDER_EMAIL
// - SENDER_NAME
// - ADMIN_EMAIL
// - ADMIN_NAME (optional)

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface InscriptionPayload {
  name: string;
  email: string;
  phone?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload: InscriptionPayload;
  try {
    payload = req.body;
    if (typeof payload === 'string') payload = JSON.parse(payload);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const name = payload.name || 'Usuario';
  const email = payload.email;
  const phone = payload.phone || '';
  if (!email) return res.status(400).json({ error: 'Missing email in payload' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const SENDER_EMAIL = process.env.SENDER_EMAIL;
  const SENDER_NAME = process.env.SENDER_NAME || 'Virtus La Rábida';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';

  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  if (!SENDER_EMAIL) return res.status(500).json({ error: 'SENDER_EMAIL not configured' });
  if (!ADMIN_EMAIL) return res.status(500).json({ error: 'ADMIN_EMAIL not configured' });

  const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

  const userEmailBody = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email, name }],
    subject: 'Tu inscripción se ha completado',
    htmlContent: `
      <p>Hola ${name},</p>
      <p>Hemos recibido correctamente tu inscripción. Gracias por registrarte.</p>
      ${phone ? `<p>Teléfono: ${phone}</p>` : ''}
      <p>Si necesitas ayuda, responde a este correo.</p>
      <hr />
      <p>Virtus La Rábida</p>
    `,
  };

  const adminEmailBody = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
    subject: `Nueva inscripción: ${name} (${email})`,
    htmlContent: `
      <p>Se ha recibido una nueva inscripción:</p>
      <ul>
        <li><strong>Nombre:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        ${phone ? `<li><strong>Teléfono:</strong> ${phone}</li>` : ''}
      </ul>
      <p>Datos completos (JSON):</p>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
    `,
  };

  try {
    // Send email to user
    const resUser = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        Authorization: `api-key ${BREVO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userEmailBody),
    });

    if (!resUser.ok) {
      const txt = await resUser.text();
      console.error('Brevo user email error:', resUser.status, txt);
      // continue to attempt admin email
    }

    // Send email to admin
    const resAdmin = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        Authorization: `api-key ${BREVO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminEmailBody),
    });

    if (!resAdmin.ok) {
      const txt = await resAdmin.text();
      console.error('Brevo admin email error:', resAdmin.status, txt);
      return res.status(502).json({ error: 'Failed to send admin email', details: txt });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ error: 'Internal error sending emails', details: String(error) });
  }
}
