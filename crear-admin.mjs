#!/usr/bin/env node

/**
 * Script para crear usuario administrador en Supabase
 * 
 * Uso:
 *   node crear-admin.mjs email@ejemplo.com NombreCompleto
 * 
 * Requisitos:
 *   - Variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Uso: node crear-admin.mjs <email> <nombre>');
  console.error('   Ejemplo: node crear-admin.mjs admin@example.com "Juan Pérez"');
  process.exit(1);
}

const [email, nombre] = args;

// Validar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   SUPABASE_URL (o VITE_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nConfigúralas en .env.local:');
  console.error('   VITE_SUPABASE_URL=https://xxx.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  process.exit(1);
}

// Crear cliente con service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generar contraseña segura
const generarPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const password = Array.from(randomBytes(16))
    .map(b => chars[b % chars.length])
    .join('');
  return password;
};

async function crearAdmin() {
  console.log('🔧 Creando usuario administrador...\n');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Nombre: ${nombre}\n`);

  try {
    // 1. Crear usuario en Auth
    const password = generarPassword();
    console.log('🔐 Generando contraseña...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre: nombre,
        rol: 'Administrador'
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario en Auth:', authError.message);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Usuario creado en Auth (ID: ${userId})\n`);

    // 2. Insertar en tabla usuarios
    console.log('💾 Insertando en tabla usuarios...');
    
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        email: email,
        nombre: nombre,
        rol: 'Administrador'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error insertando en tabla usuarios:', userError.message);
      console.error('⚠️  El usuario en Auth fue creado pero no en la tabla.');
      console.error('   Ejecuta manualmente:');
      console.error(`   INSERT INTO usuarios (id, email, nombre, rol) VALUES ('${userId}', '${email}', '${nombre}', 'Administrador');`);
      process.exit(1);
    }

    console.log('✅ Usuario insertado en tabla usuarios\n');

    // 3. Mostrar credenciales
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ USUARIO ADMIN CREADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 CREDENCIALES (guárdalas de forma segura):\n');
    console.log(`   Email:     ${email}`);
    console.log(`   Password:  ${password}`);
    console.log(`   Rol:       Administrador`);
    console.log(`   ID:        ${userId}\n`);
    console.log('🔗 URL de acceso:');
    console.log('   https://www.internationalawardsvirtus.com/#admin\n');
    console.log('⚠️  IMPORTANTE: Copia la contraseña ahora, no se mostrará de nuevo.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

crearAdmin();
