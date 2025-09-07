import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use Supabase PostgreSQL database
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL must be set. Please configure your Supabase connection string.");
}

const connectionString = process.env.SUPABASE_URL;

// Set DATABASE_URL for drizzle.config.ts compatibility
process.env.DATABASE_URL = connectionString;

console.log('Connecting to Supabase PostgreSQL database...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });