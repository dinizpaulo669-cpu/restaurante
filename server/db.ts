import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use DATABASE_URL (Replit secrets) for Supabase connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.trim() === '') {
  throw new Error("DATABASE_URL is required. Please configure your Supabase connection string in Replit Secrets.");
}

// Ensure DATABASE_URL is set for drizzle.config.ts compatibility
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString;
}

console.log('Connecting to Supabase PostgreSQL database...');
console.log('Connection string starts with:', connectionString.substring(0, 20) + '...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });