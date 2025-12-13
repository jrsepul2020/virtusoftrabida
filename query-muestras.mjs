import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables SUPABASE_URL y SUPABASE_ANON_KEY (o VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  process.exit(1);
}

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
