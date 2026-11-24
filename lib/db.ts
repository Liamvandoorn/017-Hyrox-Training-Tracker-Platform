import { Pool } from "pg";
import type { WorkoutPlan, WorkoutSet, WorkoutSource } from "@/lib/types";

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
  params: unknown[] = []
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

export interface AppUser {
  id: number;
  displayName: string;
  role: "admin" | "user";
  active: boolean;
}

export async function countUsers(): Promise<number> {
  const result = await query("SELECT COUNT(*)::int AS count FROM app_users");
  return result.rows[0].count;
}

export async function getUserByPinDigest(pinDigest: string): Promise<AppUser | null> {
  const result = await query(
    `SELECT id, display_name AS "displayName", role, active
     FROM app_users
     WHERE pin_digest = $1 AND active = TRUE`,
    [pinDigest]
  );
  return result.rows[0] ?? null;
}

export async function createFirstAdmin(
  displayName: string,
  pinDigest: string
): Promise<AppUser | null> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(74021861)");
    const countResult = await client.query("SELECT COUNT(*)::int AS count FROM app_users");
    if (countResult.rows[0].count !== 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const result = await client.query(
      `INSERT INTO app_users (display_name, pin_digest, role)
       VALUES ($1, $2, 'admin')
       RETURNING id, display_name AS "displayName", role, active`,
      [displayName, pinDigest]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(
  displayName: string,
  pinDigest: string
): Promise<AppUser> {
  const result = await query(
    `INSERT INTO app_users (display_name, pin_digest)
     VALUES ($1, $2)
     RETURNING id, display_name AS "displayName", role, active`,
    [displayName, pinDigest]
  );
  return result.rows[0];
}

export async function getUsers() {
  const result = await query(
    `SELECT id, display_name AS "displayName", role, active,
            created_at::text AS "createdAt"
     FROM app_users
     ORDER BY role DESC, display_name ASC`
  );
  return result.rows;
}

export async function setUserActive(id: number, active: boolean): Promise<boolean> {
  const result = await query(
    `UPDATE app_users
     SET active = $2
     WHERE id = $1
     RETURNING id`,
    [id, active]
  );
  if (result.rowCount && !active) {
    await query("DELETE FROM app_sessions WHERE user_id = $1", [id]);
  }
  return Boolean(result.rowCount);
}

export async function createSession(
  userId: number,
  tokenDigest: string,
  expiresAt: Date
): Promise<void> {
  await query(
    "INSERT INTO app_sessions (token_digest, user_id, expires_at) VALUES ($1, $2, $3)",
    [tokenDigest, userId, expiresAt]
  );
}

export async function getUserBySession(tokenDigest: string): Promise<AppUser | null> {
  const result = await query(
    `SELECT u.id, u.display_name AS "displayName", u.role, u.active
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token_digest = $1
       AND s.expires_at > NOW()
       AND u.active = TRUE`,
    [tokenDigest]
  );
  return result.rows[0] ?? null;
}

export async function deleteSession(tokenDigest: string): Promise<void> {
  await query("DELETE FROM app_sessions WHERE token_digest = $1", [tokenDigest]);
}

export async function isLoginBlocked(key: string): Promise<number | null> {
  const result = await query(
    `SELECT GREATEST(1, CEIL(EXTRACT(EPOCH FROM (blocked_until - NOW()))))::int AS seconds
     FROM auth_login_attempts
     WHERE attempt_key = $1 AND blocked_until > NOW()`,
    [key]
  );
  return result.rows[0]?.seconds ?? null;
}

export async function recordFailedLogin(key: string): Promise<void> {
  await query(
    `INSERT INTO auth_login_attempts (attempt_key, window_started_at, failed_attempts)
     VALUES ($1, NOW(), 1)
     ON CONFLICT (attempt_key) DO UPDATE
     SET failed_attempts = CASE
           WHEN auth_login_attempts.window_started_at <= NOW() - INTERVAL '15 minutes'
             THEN 1
           ELSE auth_login_attempts.failed_attempts + 1
         END,
         blocked_until = CASE
           WHEN auth_login_attempts.window_started_at <= NOW() - INTERVAL '15 minutes'
             THEN NULL
           WHEN auth_login_attempts.failed_attempts + 1 >= 5
             THEN NOW() + INTERVAL '15 minutes'
           ELSE auth_login_attempts.blocked_until
         END,
         window_started_at = CASE
           WHEN auth_login_attempts.window_started_at <= NOW() - INTERVAL '15 minutes'
             THEN NOW()
           ELSE auth_login_attempts.window_started_at
         END`,
    [key]
  );
  await query(
    "DELETE FROM auth_login_attempts WHERE window_started_at < NOW() - INTERVAL '1 day'"
  );
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await query("DELETE FROM auth_login_attempts WHERE attempt_key = $1", [key]);
}

export async function getTrainingSessions(userId: number) {
  const result = await query(
    "SELECT * FROM training_sessions WHERE user_id = $1 ORDER BY date DESC",
    [userId]
  );
  return result.rows;
}

export async function addTrainingSession(
  userId: number,
  date: string,
  exercise: string,
  duration: number,
  distance?: number,
  notes?: string
) {
  const result = await query(
    `INSERT INTO training_sessions (user_id, date, exercise, duration, distance, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [userId, date, exercise, duration, distance || null, notes || null]
  );
  return result.rows[0];
}

export async function deleteTrainingSession(userId: number, id: number) {
  const result = await query(
    "DELETE FROM training_sessions WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rowCount;
}

export async function addWorkout(
  userId: number,
  name: string,
  date: string,
  source: WorkoutSource,
  sets: WorkoutSet[]
) {
  const result = await query(
    `INSERT INTO workouts (user_id, name, date, source, sets)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, name, date::text AS date, source, sets, created_at`,
    [userId, name, date, source, JSON.stringify(sets)]
  );
  return result.rows[0];
}

export async function updateWorkout(
  userId: number,
  id: number,
  name: string,
  date: string,
  source: WorkoutSource,
  sets: WorkoutSet[]
) {
  const result = await query(
    `UPDATE workouts
     SET name = $3, date = $4, source = $5, sets = $6::jsonb
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, date::text AS date, source, sets, created_at`,
    [id, userId, name, date, source, JSON.stringify(sets)]
  );
  return result.rows[0] ?? null;
}

export async function deleteWorkout(userId: number, id: number) {
  const result = await query(
    "DELETE FROM workouts WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rowCount ?? 0;
}

export async function getWorkouts(userId: number) {
  const result = await query(
    `SELECT id, name, date::text AS date, source, sets, created_at
     FROM workouts
     WHERE user_id = $1
     ORDER BY date DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addWorkoutPlan(
  userId: number,
  name: string,
  sets: WorkoutSet[]
) {
  const result = await query(
    `INSERT INTO workout_plans (user_id, name, sets)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id, name, sets, created_at, updated_at`,
    [userId, name, JSON.stringify(sets)]
  );
  return result.rows[0];
}

export async function updateWorkoutPlan(
  userId: number,
  id: number,
  name: string,
  sets: WorkoutSet[]
) {
  const result = await query(
    `UPDATE workout_plans
     SET name = $3, sets = $4::jsonb, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, sets, created_at, updated_at`,
    [id, userId, name, JSON.stringify(sets)]
  );
  return result.rows[0] ?? null;
}

export async function deleteWorkoutPlan(userId: number, id: number) {
  const result = await query(
    "DELETE FROM workout_plans WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rowCount ?? 0;
}

export async function getWorkoutPlans(userId: number): Promise<WorkoutPlan[]> {
  const result = await query(
    `SELECT id, name, sets, created_at, updated_at
     FROM workout_plans
     WHERE user_id = $1
     ORDER BY updated_at DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS app_users (
      id SERIAL PRIMARY KEY,
      display_name VARCHAR(60) NOT NULL,
      pin_digest CHAR(64) NOT NULL UNIQUE,
      role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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

  await getSchemaPool().query(createTableQuery);
  console.log("Database initialized successfully");
}
