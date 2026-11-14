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
