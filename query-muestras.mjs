import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfpawqoegitgtsjygbqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGF3cW9lZ2l0Z3RzanlnYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTkwNTEsImV4cCI6MjA3NTE3NTA1MX0.Ry3ufMVvFCaMafRrJpUkSafUuP-RnlSXAZ1z0wGdZNo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // Contar muestras
    const { count, error } = await supabase
      .from('muestras')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error:', error.message);
      process.exitCode = 1;
    } else {
      console.log('Total muestras:', count);
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  }
}

main();
