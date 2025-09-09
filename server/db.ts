import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use DATABASE_URL (Replit built-in PostgreSQL) or SUPABASE_URL as fallback
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or SUPABASE_URL must be set. Please configure your database connection string.");
}

// Ensure DATABASE_URL is set for drizzle.config.ts compatibility
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString;
}

console.log('Connecting to PostgreSQL database...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });