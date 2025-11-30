import { supabase } from './lib/supabase';

async function diagnostico() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE SUPABASE...\n');

  // Verificar conexión
  try {
    const { error: healthError } = await supabase
      .from('empresas')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ ERROR DE CONEXIÓN:', healthError);
      return;
    }
    console.log('✅ Conexión a Supabase exitosa\n');
  } catch (e) {
    console.error('💥 Error crítico de conexión:', e);
    return;
  }

  // Verificar tabla usuarios
  try {
    console.log('📋 Verificando tabla USUARIOS...');
    const { data: usuarios, error: usuariosErr } = await supabase
      .from('usuarios')
      .select('id, nombre, mesa, tablet')
      .limit(5);
    
    if (usuariosErr) {
      console.error('❌ Error en usuarios:', usuariosErr);
    } else {
      console.log(`✅ Usuarios encontrados: ${usuarios?.length || 0}`);
      console.log('📊 Muestra:', usuarios);
    }
  } catch (e) {
    console.error('💥 Error en usuarios:', e);
  }

  // Verificar tabla muestras
  try {
    console.log('\n📋 Verificando tabla MUESTRAS...');
    const { data: muestras, error: muestrasErr } = await supabase
      .from('muestras')
      .select('id, nombre, categoria')
      .limit(5);
    
    if (muestrasErr) {
      console.error('❌ Error en muestras:', muestrasErr);
    } else {
      console.log(`✅ Muestras encontradas: ${muestras?.length || 0}`);
      console.log('📊 Muestra:', muestras);
    }
  } catch (e) {
    console.error('💥 Error en muestras:', e);
  }

  // Verificar tabla dispositivos
  try {
    console.log('\n📋 Verificando tabla DISPOSITIVOS...');
    const { data: dispositivos, error: dispositivosErr } = await supabase
      .from('dispositivos')
      .select('id, tablet_number, nombre_asignado')
      .limit(5);
    
    if (dispositivosErr) {
      console.error('❌ Error en dispositivos:', dispositivosErr);
      console.error('Detalles:', {
        message: dispositivosErr.message,
        code: dispositivosErr.code,
        details: dispositivosErr.details,
        hint: dispositivosErr.hint
      });
    } else {
      console.log(`✅ Dispositivos encontrados: ${dispositivos?.length || 0}`);
      console.log('📊 Muestra:', dispositivos);
    }
  } catch (e) {
    console.error('💥 Error en dispositivos:', e);
  }

  // Verificar tabla empresas
  try {
    console.log('\n📋 Verificando tabla EMPRESAS...');
    const { data: empresas, error: empresasErr } = await supabase
      .from('empresas')
      .select('id, name')
      .limit(5);
    
    if (empresasErr) {
      console.error('❌ Error en empresas:', empresasErr);
    } else {
      console.log(`✅ Empresas encontradas: ${empresas?.length || 0}`);
      console.log('📊 Muestra:', empresas);
    }
  } catch (e) {
    console.error('💥 Error en empresas:', e);
  }

  console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
}

diagnostico();
