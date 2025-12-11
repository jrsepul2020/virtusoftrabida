import type { VercelRequest, VercelResponse } from '@vercel/node';

// Endpoint minimalista para desbloquear acceso admin en el frontend.
// Requiere que en el entorno de despliegue esté definida la variable
// ADMIN_ACCESS_SECRET. El cliente puede enviar { admin_secret } en el body
// o la cabecera `x-admin-secret`.

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const provided = (req.headers['x-admin-secret'] as string) || req.body?.admin_secret;
  if (!provided) return res.status(400).json({ error: 'Missing admin secret' });

  const secret = process.env.ADMIN_ACCESS_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server not configured' });

  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });

  // Success: return minimal payload. The frontend will set a local flag.
  return res.status(200).json({ unlocked: true });
}
