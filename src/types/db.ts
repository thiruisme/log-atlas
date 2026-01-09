export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core' | 'Cardio' | 'Other';
export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Other';

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: MuscleGroup;
  equipment?: EquipmentType;
  defaultSets: number;
  defaultReps: string;
  defaultRest: string; // e.g., "90s", "2-3 min"
  notes?: string;
  videoUrl?: string;
  instructions?: string[];
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number; // Override default if needed
  reps: string;
  rest: string;
  order: number;
}

export interface Workout {
  id: string;
  title: string;
  day: string; // 'Monday', 'Tuesday', etc. or 'Flexible'
  focus: string; // e.g., "Push A"
  exercises: WorkoutExercise[];
  lastPerformed?: string; // ISO Date
}

export interface ExerciseLog {
  exerciseId: string;
  sets: {
    weight: number;
    reps: number;
    rpe?: number; // Rate of Perceived Exertion (1-10)
    completed: boolean;
  }[];
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  date: string; // ISO Date
  durationMinutes: number;
  exercises: ExerciseLog[];
}

export interface AppData {
  exercises: Exercise[];
  workouts: Workout[];
  logs: WorkoutLog[];
}
