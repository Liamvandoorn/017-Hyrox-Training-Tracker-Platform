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
