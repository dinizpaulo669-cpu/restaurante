import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Verifica se a string de conexão do Supabase está configurada
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL must be set. Please configure your Supabase connection string.");
}

// Usa diretamente a string de conexão do PostgreSQL do Supabase
const connectionString = process.env.SUPABASE_URL;

// Define DATABASE_URL para compatibilidade com drizzle.config.ts
process.env.DATABASE_URL = connectionString;

console.log('Connecting to Supabase PostgreSQL...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });