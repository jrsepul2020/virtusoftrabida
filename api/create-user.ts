import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Endpoint serverless para crear usuarios
 * Requiere autenticación admin (token en header o sesión)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Validar variables de entorno
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    // Validar que la petición viene de un admin autenticado
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado: falta token de autenticación' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token con supabase cliente normal (anon key)
    const supabaseClient = createClient(
      SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Verificar que el usuario sea admin
    const { data: usuarioData, error: rolError } = await supabaseClient
      .from('usuarios')
      .select('rol')
      .eq('user_id', userData.user.id)
      .single();

    if (rolError || !usuarioData) {
      return res.status(403).json({ error: 'No se pudo verificar el rol del usuario' });
    }

    // Solo SuperAdmin y Administrador pueden crear usuarios
    if (!['SuperAdmin', 'Administrador'].includes(usuarioData.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios' });
    }

    // Extraer datos del body
    const {
      email,
      password,
      nombre,
      rol = 'Catador',
      mesa,
      puesto,
      tablet,
      pais,
      codigocatador,
      codigo,
    } = req.body;

    // Validar campos requeridos
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, password, nombre' });
    }

    // Crear cliente con service role para operaciones admin
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        rol,
      },
    });

    if (authError) {
      console.error('Error creando usuario en Auth:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // 2. Insertar en tabla usuarios
    const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
      user_id: authData.user.id,
      email,
      nombre,
      rol,
      mesa: mesa || null,
      puesto: puesto || null,
      tablet: tablet || null,
      pais: pais || null,
      codigocatador: codigocatador || null,
      codigo: codigo || null,
      activo: true,
    });

    if (insertError) {
      console.error('Error insertando en tabla usuarios:', insertError);
      
      // Intentar limpiar el usuario de Auth si falla la inserción
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Error limpiando usuario de Auth:', cleanupError);
      }
      
      return res.status(400).json({ error: insertError.message });
    }

    // Éxito
    return res.status(200).json({
      success: true,
      userId: authData.user.id,
      message: 'Usuario creado correctamente',
    });

  } catch (error: any) {
    console.error('Error inesperado en create-user:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
