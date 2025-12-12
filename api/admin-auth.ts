import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint de autenticación simplificada para administradores
 * 
 * Valida token secreto y devuelve sesión de Supabase directamente.
 * El frontend usa esta sesión para acceder al panel admin sin login manual.
 * 
 * Uso:
 *   GET /api/admin-auth?token=SECRET
 *   
 * Respuesta:
 *   200: { session: {...}, user: {...} }
 *   401: { error: 'Invalid token' }
 *   500: { error: 'Server error' }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.query.token as string;
  
  if (!token) {
    return res.status(400).json({ error: 'Missing token parameter' });
  }

  // Validar contra secret configurado
  const validToken = process.env.ADMIN_ACCESS_TOKEN;
  
  if (!validToken) {
    console.error('❌ ADMIN_ACCESS_TOKEN no configurado en el servidor');
    return res.status(500).json({ error: 'Server not configured' });
  }

  if (token !== validToken) {
    console.warn('⚠️ Intento de acceso con token inválido');
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Token válido - crear sesión admin
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obtener el primer usuario admin de la base de datos
    const { data: adminUsers, error: queryError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol')
      .in('rol', ['Administrador', 'Presidente'])
      .limit(1);

    if (queryError || !adminUsers || adminUsers.length === 0) {
      console.error('❌ No se encontró usuario admin:', queryError);
      return res.status(500).json({ 
        error: 'No admin user configured',
        hint: 'Use crear-admin.mjs to create an admin user'
      });
    }

    const adminUser = adminUsers[0];

    // Generar sesión para este usuario usando Service Role
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
      email: adminUser.email,
      email_confirm: true,
      user_metadata: {
        nombre: adminUser.nombre,
        rol: adminUser.rol
      }
    });

    if (sessionError) {
      console.error('❌ Error creando sesión:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Generar access token de larga duración (7 días)
    const expiresIn = 7 * 24 * 60 * 60; // 7 días en segundos
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email,
      options: {
        redirectTo: process.env.VITE_APP_URL || 'https://www.internationalawardsvirtus.com'
      }
    });

    if (linkError || !linkData) {
      console.error('❌ Error generando link:', linkError);
      return res.status(500).json({ error: 'Failed to generate auth link' });
    }

    // Extraer access_token y refresh_token de la URL generada
    const url = new URL(linkData.properties.action_link);
    const access_token = url.searchParams.get('access_token');
    const refresh_token = url.searchParams.get('refresh_token');

    if (!access_token || !refresh_token) {
      console.error('❌ No se obtuvieron tokens del magic link');
      return res.status(500).json({ error: 'Token generation failed' });
    }

    console.log('✅ Sesión admin creada para:', adminUser.email);

    // Devolver tokens para que el frontend los use
    return res.status(200).json({
      access_token,
      refresh_token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        nombre: adminUser.nombre,
        rol: adminUser.rol
      },
      expires_in: expiresIn
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
