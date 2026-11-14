export interface TrainingSession {
  id: number;
  date: string;
  exercise: string;
  duration: number;
  distance?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type WorkoutSource = "own" | "plan";
export type WorkoutSetUnit = "m" | "kg" | "reps";

export const WORKOUT_CATEGORIES = [
  "Running",
  "SkiErg",
  "Rowing",
  "Sled push",
  "Sled pull",
  "Burpee broad jumps",
  "Sandbag lunges",
  "Wall balls",
] as const;

const distanceCategories = new Set<string>([
  "Running",
  "SkiErg",
  "Rowing",
  "Sled push",
  "Sled pull",
  "Burpee broad jumps",
  "Sandbag lunges",
]);

export function getWorkoutSetUnit(category: string): WorkoutSetUnit {
  return distanceCategories.has(category) ? "m" : "reps";
}

const exercisesWithDistanceAndWeight = new Set([
  "Sled push",
  "Sled pull",
  "Sandbag lunges",
]);

export function requiresWeightAndDistance(category: string): boolean {
  return exercisesWithDistanceAndWeight.has(category);
}

export interface WorkoutSet {
  id: string;
  category: string;
  amount: number;
  unit: WorkoutSetUnit;
  weightKg?: number;
  timeSeconds: number;
  restSeconds: number;
  completed: boolean;
}

export interface WorkoutRecord {
  id: number;
  name: string;
  date: string;
  source: WorkoutSource;
  sets: WorkoutSet[];
  created_at: string;
}
