#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfpawqoegitgtsjygbqp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGF3cW9lZ2l0Z3RzanlnYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5OTA1MSwiZXhwIjoyMDc1MTc1MDUxfQ.K1CbCr9A2KJOlqLpWUTu99345pNVfmdH3Oaewtn_Xik';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Actualizar contraseña del admin
const { data, error } = await supabase.auth.admin.updateUserById(
  'fb3c8c2f-e974-41d4-82d3-1db03480696f',
  { password: 'Admin123456' }
);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Contraseña actualizada para:', data.user?.email);
  console.log('\n📋 Nuevas credenciales:');
  console.log('   Email: localadmin@test.com');
  console.log('   Password: Admin123456');
}
