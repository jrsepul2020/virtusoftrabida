#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfpawqoegitgtsjygbqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGF3cW9lZ2l0Z3RzanlnYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTkwNTEsImV4cCI6MjA3NTE3NTA1MX0.Ry3ufMVvFCaMafRrJpUkSafUuP-RnlSXAZ1z0wGdZNo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔐 Probando login con localadmin@test.com...\n');

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'localadmin@test.com',
  password: 'Admin123456'
});

if (error) {
  console.log('❌ Error de login:', error.message);
  console.log('   Código:', error.status);
  console.log('   Detalles:', JSON.stringify(error, null, 2));
} else {
  console.log('✅ Login exitoso!');
  console.log('   User ID:', data.user?.id);
  console.log('   Email:', data.user?.email);
  
  // Probar consulta a usuarios
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', data.user?.id)
    .single();
    
  if (userError) {
    console.log('\n❌ Error obteniendo rol:', userError.message);
  } else {
    console.log('   Rol:', userData?.rol);
  }
}
