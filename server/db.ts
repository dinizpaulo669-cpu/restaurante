import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use the built-in Replit PostgreSQL database
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. The built-in PostgreSQL database should provide this automatically.");
}

const connectionString = process.env.DATABASE_URL;

console.log('Connecting to PostgreSQL database...');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
export const db = drizzle({ client: pool, schema });