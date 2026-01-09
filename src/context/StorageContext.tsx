'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Exercise, Workout, WorkoutLog, WorkoutExercise, ExerciseLog } from '@/types/db';
import { routine } from '@/data/routine';

// --- Initial Seed Data Transformation ---
// We transform the old 'routine.ts' structure into our new relational DB structure
const seedExercises: Exercise[] = [];
const seedWorkouts: Workout[] = [];

// Helper to dedup exercises by name during seed
const exerciseMap = new Map<string, Exercise>();

routine.forEach((legacyWorkout) => {
  const workoutExercises: WorkoutExercise[] = [];

  legacyWorkout.exercises.forEach((legacyEx, index) => {
    // Check if we already have this exercise (by ID or Name to avoid dupes)
    let exId = legacyEx.id;
    if (!exerciseMap.has(legacyEx.id)) {
      const nameLower = legacyEx.name.toLowerCase();
      const notesLower = legacyEx.notes?.join(' ').toLowerCase() || '';
      let equipment: any = 'Other';

      if (nameLower.includes('dumbbell') || notesLower.includes('dumbbell') || nameLower.includes(' db ')) {
        equipment = 'Dumbbell';
      } else if (nameLower.includes('cable') || notesLower.includes('cable')) {
        equipment = 'Cable';
      } else if (nameLower.includes('machine')) {
        equipment = 'Machine';
      } else if (nameLower.includes('bodyweight') || nameLower.includes('pull-up') || nameLower.includes('dip') || nameLower.includes('chin-up')) {
        equipment = 'Bodyweight';
      } else if (nameLower.includes('barbell') || nameLower.includes('bench press') || nameLower.includes('squat') || nameLower.includes('deadlift') || nameLower.includes('overhead press')) {
        equipment = 'Barbell';
      }

      const newExercise: Exercise = {
        id: legacyEx.id,
        name: legacyEx.name,
        targetMuscle: 'Other', // Default, user can update
        equipment: equipment,
        defaultSets: parseInt(legacyEx.sets) || 3,
        defaultReps: legacyEx.reps,
        defaultRest: legacyEx.rest,
        notes: legacyEx.notes?.join('. '),
        videoUrl: legacyEx.videoUrl,
      };
      exerciseMap.set(legacyEx.id, newExercise);
      seedExercises.push(newExercise);
    }

    workoutExercises.push({
      exerciseId: exId,
      sets: parseInt(legacyEx.sets) || 3,
      reps: legacyEx.reps,
      rest: legacyEx.rest,
      order: index,
    });
  });

  seedWorkouts.push({
    id: legacyWorkout.id,
    title: legacyWorkout.title,
    day: legacyWorkout.day,
    focus: legacyWorkout.focus,
    exercises: workoutExercises,
  });
});

const defaultData: AppData = {
  exercises: seedExercises,
  workouts: seedWorkouts,
  logs: [],
};

// --- Context Definition ---

interface StorageContextType {
  data: AppData;
  isLoading: boolean;
  // Exercise Actions
  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;
  // Workout Actions
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  // Log Actions
  addLog: (log: WorkoutLog) => void;
  getHistoryForExercise: (exerciseId: string) => ExerciseLog[];
  resetData: () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('log-atlas-db');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Simple migration check: ensure keys exist
        if (parsed.exercises && parsed.workouts) {
            setData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('log-atlas-db', JSON.stringify(data));
    }
  }, [data, isLoading]);

  const addExercise = (exercise: Exercise) => {
    setData(prev => ({ ...prev, exercises: [...prev.exercises, exercise] }));
  };

  const updateExercise = (exercise: Exercise) => {
    setData(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id === exercise.id ? exercise : e)
    }));
  };

  const deleteExercise = (id: string) => {
    setData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== id),
      // Optional: Remove from workouts or warn? For now, we leave broken refs or handle in UI
    }));
  };

  const addWorkout = (workout: Workout) => {
    setData(prev => ({ ...prev, workouts: [...prev.workouts, workout] }));
  };

  const updateWorkout = (workout: Workout) => {
    setData(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => w.id === workout.id ? workout : w)
    }));
  };

  const deleteWorkout = (id: string) => {
    setData(prev => ({
      ...prev,
      workouts: prev.workouts.filter(w => w.id !== id)
    }));
  };

  const addLog = (log: WorkoutLog) => {
    setData(prev => ({ ...prev, logs: [log, ...prev.logs] }));
  };

  const getHistoryForExercise = (exerciseId: string) => {
    // Extract all logs for this specific exercise, flattened
    // This is expensive if logs grow huge, but fine for local-first < 1000 logs
    const history: ExerciseLog[] = [];
    data.logs.forEach(workoutLog => {
      const exLog = workoutLog.exercises.find(e => e.exerciseId === exerciseId);
      if (exLog) {
        history.push(exLog);
      }
    });
    return history; // Most recent logs are at the top if logs are sorted desc
  };

  const resetData = () => {
      if(confirm("Are you sure? This will wipe all custom data.")) {
          setData(defaultData);
      }
  }

  return (
    <StorageContext.Provider value={{
      data,
      isLoading,
      addExercise,
      updateExercise,
      deleteExercise,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      addLog,
      getHistoryForExercise,
      resetData
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
