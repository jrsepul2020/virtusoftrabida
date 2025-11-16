import { Client } from 'pg';

// Conexión directa (puerto 5432) sin pooler
const connectionString = 'postgresql://postgres.cfpawqoegitgtsjygbqp:5A8wwBQY$_E-SiV@db.cfpawqoegitgtsjygbqp.supabase.co:5432/postgres';

async function main() {
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
