/**
 * Script de Diagnóstico y Reparación del Sistema de Acceso
 * 
 * Ejecutar con: node diagnostico-acceso.mjs
 * 
 * Este script:
 * 1. Verifica la existencia de las tablas
 * 2. Lista todos los dispositivos
 * 3. Lista todos los usuarios
 * 4. Ofrece opciones para reparar el acceso
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Necesitas VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.error('\nPara configurarlas temporalmente:');
  console.error('export VITE_SUPABASE_URL="tu-url"');
  console.error('export VITE_SUPABASE_ANON_KEY="tu-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 DIAGNÓSTICO DEL SISTEMA DE ACCESO\n');
console.log('Conectando a Supabase...\n');

async function diagnosticar() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  // 1. Verificar tabla dispositivos
  console.log('📋 Verificando tabla dispositivos...');
  const { data: dispositivos, error: dispError } = await supabase
    .from('dispositivos')
    .select('*');

  if (dispError) {
    console.error('❌ Error al acceder a dispositivos:', dispError.message);
    console.log('\n💡 SOLUCIÓN: Aplica las migraciones de la base de datos');
    console.log('   Archivos en: supabase/migrations/\n');
  } else {
    console.log(`✅ Tabla dispositivos OK - ${dispositivos.length} registros`);
    if (dispositivos.length > 0) {
      console.log('\nDispositivos registrados:');
      dispositivos.forEach((d, i) => {
        console.log(`  ${i + 1}. ID: ${d.id.slice(0, 8)}... | Activo: ${d.activo ? '✅' : '❌'} | Usuario: ${d.user_id?.slice(0, 8) || 'N/A'} | Nombre: ${d.nombre_asignado || 'Sin nombre'}`);
      });
    }
    console.log();
  }

  // 2. Verificar tabla usuarios
  console.log('👥 Verificando tabla usuarios...');
  const { data: usuarios, error: userError } = await supabase
    .from('usuarios')
    .select('id, email, nombre, rol, activo');

  if (userError) {
    console.error('❌ Error al acceder a usuarios:', userError.message);
  } else {
    console.log(`✅ Tabla usuarios OK - ${usuarios.length} registros`);
    if (usuarios.length > 0) {
      console.log('\nUsuarios registrados:');
      usuarios.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email || 'Sin email'} | Rol: ${u.rol} | Activo: ${u.activo ? '✅' : '❌'}`);
      });
    }
    console.log();
  }

  // 3. Verificar usuario autenticado
  console.log('🔐 Verificando sesión actual...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.log('❌ No hay sesión activa');
  } else if (user) {
    console.log(`✅ Usuario autenticado: ${user.email}`);
    console.log(`   ID: ${user.id}`);
  } else {
    console.log('ℹ️  No hay sesión activa');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  // Opciones de reparación
  console.log('🔧 OPCIONES DE REPARACIÓN:\n');
  console.log('1. Activar TODOS los dispositivos (bypass completo)');
  console.log('2. Eliminar todos los dispositivos (forzar primer admin)');
  console.log('3. Crear usuario admin manualmente');
  console.log('4. Mostrar RLS policies');
  console.log('5. Salir\n');

  const opcion = await question('Selecciona una opción (1-5): ');

  switch (opcion.trim()) {
    case '1':
      await activarTodosDispositivos();
      break;
    case '2':
      await eliminarDispositivos();
      break;
    case '3':
      await crearUsuarioAdmin();
      break;
    case '4':
      await mostrarPolicies();
      break;
    case '5':
      console.log('\n👋 Saliendo...\n');
      rl.close();
      return;
    default:
      console.log('\n❌ Opción no válida\n');
  }

  rl.close();
}

async function activarTodosDispositivos() {
  console.log('\n🔄 Activando todos los dispositivos...');
  
  const { data, error } = await supabase
    .from('dispositivos')
    .update({ activo: true })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`✅ ${data.length} dispositivos activados`);
    console.log('\n💡 Ahora deberías poder acceder con cualquier dispositivo\n');
  }
}

async function eliminarDispositivos() {
  const confirmar = await question('\n⚠️  ¿ELIMINAR todos los dispositivos? (sí/no): ');
  
  if (confirmar.toLowerCase() !== 'sí' && confirmar.toLowerCase() !== 'si') {
    console.log('❌ Operación cancelada\n');
    return;
  }

  console.log('\n🗑️  Eliminando dispositivos...');
  
  const { error } = await supabase
    .from('dispositivos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Dispositivos eliminados');
    console.log('\n💡 El próximo login activará el bypass del primer admin\n');
  }
}

async function crearUsuarioAdmin() {
  const email = await question('\n📧 Email del usuario admin: ');
  const userId = await question('🆔 ID del usuario (puedes obtenerlo de Supabase Auth): ');

  console.log('\n🔄 Creando/actualizando usuario admin...');

  const { data, error } = await supabase
    .from('usuarios')
    .upsert({
      id: userId.trim(),
      email: email.trim(),
      rol: 'Administrador',
      activo: true,
    })
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Usuario admin creado/actualizado');
    console.log('\n💡 Ahora activa el dispositivo del usuario manualmente o usa la opción 1\n');
  }
}

async function mostrarPolicies() {
  console.log('\n📜 Policies RLS en dispositivos:\n');
  console.log('Necesitas ejecutar esto en el SQL Editor de Supabase:\n');
  console.log('SELECT * FROM pg_policies WHERE tablename = \'dispositivos\';\n');
  console.log('Si no hay policies, ejecuta la migración:');
  console.log('supabase/migrations/20260121_add_user_id_to_dispositivos.sql\n');
}

// Ejecutar diagnóstico
diagnosticar().catch(console.error);
