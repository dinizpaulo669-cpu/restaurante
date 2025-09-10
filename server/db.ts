import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Debug: Log available environment variables
console.log('Environment check:');
console.log('DATABASE_URL value length:', process.env.DATABASE_URL?.length || 0);
console.log('SUPABASE_URL value length:', process.env.SUPABASE_URL?.length || 0);

// Use DATABASE_URL (Replit secrets) or SUPABASE_URL as fallback
let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

// Check if the variable exists but is empty
if (connectionString !== undefined && connectionString.trim() === '') {
  console.log('DATABASE_URL or SUPABASE_URL exists but is empty - this may be a Replit secrets loading issue');
  
  // Try to access the secret directly
  const envKeys = Object.keys(process.env);
  console.log('All DATABASE/SUPABASE environment variables:');
  envKeys.filter(key => key.includes('DATABASE') || key.includes('SUPABASE'))
    .forEach(key => {
      console.log(`${key}: ${process.env[key] ? '[HIDDEN]' : '[EMPTY]'}`);
    });
}

if (!connectionString || connectionString.trim() === '') {
  throw new Error(`DATABASE_URL is required but not properly configured. Please check your Replit Secrets configuration.
  
Current status:
  - DATABASE_URL exists: ${process.env.DATABASE_URL !== undefined}
  - DATABASE_URL length: ${process.env.DATABASE_URL?.length || 0}
  
Please ensure you have:
1. Added DATABASE_URL to your Replit Secrets
2. The value contains your complete Supabase connection string
3. Restarted the application after adding the secret`);
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