#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS training_sessions (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        exercise VARCHAR(100) NOT NULL,
        duration INTEGER NOT NULL,
        distance DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(date);
    `;

    await pool.query(createTableQuery);
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
