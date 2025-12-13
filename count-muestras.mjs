import { Client } from 'pg';

// Conexión directa (puerto 5432) sin pooler
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function main() {
  if (!connectionString) {
    console.error('Falta DATABASE_URL (o SUPABASE_DB_URL) en el entorno.');
    console.error('Ejemplo: DATABASE_URL="postgresql://user:pass@host:5432/postgres"');
    process.exitCode = 1;
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT COUNT(*)::int AS total FROM muestras;');
    console.log('Total muestras:', res.rows[0].total);
  } catch (err) {
    console.error('Error al consultar la BD:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
