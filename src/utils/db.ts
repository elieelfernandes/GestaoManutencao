import { neon } from '@neondatabase/serverless';

// Safe lazy SQL query wrapper for serverless environments
const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('DATABASE_URL is missing. Database query skipped.');
    return Promise.resolve([]);
  }
  
  const client = neon(dbUrl);
  return client(strings, ...values) as Promise<any>;
};

export default sql;
