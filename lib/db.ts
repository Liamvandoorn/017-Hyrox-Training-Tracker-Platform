import { Pool } from "pg";
import type { WorkoutSet, WorkoutSource } from "@/lib/types";

let pool: Pool | undefined;
let schemaPool: Pool | undefined;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

function getSchemaPool() {
  if (!schemaPool) {
    const connectionString =
      process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    schemaPool = new Pool({ connectionString });
  }
  return schemaPool;
}

export async function query(
  text: string,
  params: any[] = []
): Promise<any> {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error", { text, error });
    throw error;
  }
}

export async function getTrainingSessions() {
  const result = await query(
    "SELECT * FROM training_sessions ORDER BY date DESC"
  );
  return result.rows;
}

export async function addTrainingSession(
  date: string,
  exercise: string,
  duration: number,
  distance?: number,
  notes?: string
) {
  const result = await query(
    `INSERT INTO training_sessions (date, exercise, duration, distance, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [date, exercise, duration, distance || null, notes || null]
  );
  return result.rows[0];
}

export async function deleteTrainingSession(id: number) {
  const result = await query("DELETE FROM training_sessions WHERE id = $1", [
    id,
  ]);
  return result.rowCount;
}

export async function addWorkout(
  name: string,
  date: string,
  source: WorkoutSource,
  sets: WorkoutSet[]
) {
  const result = await query(
    `INSERT INTO workouts (name, date, source, sets)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, name, date::text AS date, source, sets, created_at`,
    [name, date, source, JSON.stringify(sets)]
  );
  return result.rows[0];
}

export async function getWorkouts() {
  const result = await query(
    "SELECT id, name, date::text AS date, source, sets, created_at FROM workouts ORDER BY date DESC, created_at DESC LIMIT 50"
  );
  return result.rows;
}

export async function initializeDatabase() {
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

    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      source VARCHAR(10) NOT NULL CHECK (source IN ('own', 'plan')),
      sets JSONB NOT NULL CHECK (jsonb_typeof(sets) = 'array'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
  `;

  // Use schema pool for CREATE TABLE operations
  await getSchemaPool().query(createTableQuery);
  console.log("Database initialized successfully");
}
