#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        display_name VARCHAR(60) NOT NULL,
        pin_digest CHAR(64) NOT NULL UNIQUE,
        role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        avatar_data BYTEA,
        avatar_content_type VARCHAR(32),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE app_users
        ADD COLUMN IF NOT EXISTS avatar_data BYTEA;
      ALTER TABLE app_users
        ADD COLUMN IF NOT EXISTS avatar_content_type VARCHAR(32);

      CREATE TABLE IF NOT EXISTS app_sessions (
        token_digest CHAR(64) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);

      CREATE TABLE IF NOT EXISTS auth_login_attempts (
        attempt_key CHAR(64) PRIMARY KEY,
        window_started_at TIMESTAMPTZ NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        blocked_until TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS training_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        exercise VARCHAR(100) NOT NULL,
        duration INTEGER NOT NULL,
        distance DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date
        ON training_sessions(user_id, date DESC);

      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        date DATE NOT NULL,
        source VARCHAR(10) NOT NULL CHECK (source IN ('own', 'plan')),
        sets JSONB NOT NULL CHECK (jsonb_typeof(sets) = 'array'),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_user_date
        ON workouts(user_id, date DESC);

      CREATE TABLE IF NOT EXISTS workout_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        sets JSONB NOT NULL CHECK (jsonb_typeof(sets) = 'array'),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_workout_plans_user_updated_at
        ON workout_plans(user_id, updated_at DESC);
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
