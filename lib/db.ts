import { Pool } from "pg";

// Use pooled connection for regular queries (recommended for serverless)
const pooledConnectionString = process.env.DATABASE_URL;
// Use unpooled connection for schema operations (if available)
const unpooledConnectionString = process.env.DATABASE_URL_UNPOOLED;

if (!pooledConnectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: pooledConnectionString,
});

// Separate pool for schema operations that need direct connections
const schemaPool = new Pool({
  connectionString: unpooledConnectionString || pooledConnectionString,
});

export async function query(
  text: string,
  params: any[] = []
): Promise<any> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
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
  `;

  // Use schema pool for CREATE TABLE operations
  await schemaPool.query(createTableQuery);
  console.log("Database initialized successfully");
}
