import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use PostgreSQL database (Replit's built-in database or Supabase)
const connectionString = process.env.SUPABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or SUPABASE_URL must be set. Please configure your database connection string.");
}

// Set DATABASE_URL for drizzle.config.ts compatibility
process.env.DATABASE_URL = connectionString;

console.log('Connecting to PostgreSQL database...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });