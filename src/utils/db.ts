import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';

// Singleton Pool connection for Supabase & Postgres
let globalPool: Pool | null = null;

function getPool(dbUrl: string): Pool {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return globalPool;
}

// Universal template string SQL query executor
const sql = async (strings: TemplateStringsArray, ...values: any[]): Promise<any> => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('DATABASE_URL is missing. Database query skipped.');
    return [];
  }

  // If using Neon URL, use Neon driver
  if (dbUrl.includes('neon.tech')) {
    const client = neon(dbUrl);
    return client(strings, ...values);
  }

  // Construct parameterized SQL query ($1, $2, ...) for pg driver
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }

  try {
    const pool = getPool(dbUrl);
    const result = await pool.query(text, values);
    return result.rows;
  } catch (err) {
    console.error('Postgres Query Error:', err);
    throw err;
  }
};

export default sql;
