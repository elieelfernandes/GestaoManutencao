import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database features will be unavailable.');
}

const connectionString = process.env.DATABASE_URL || '';
const sql = neon(connectionString);

export default sql;
