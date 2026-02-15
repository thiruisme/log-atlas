'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Exercise, Workout, WorkoutLog, ExerciseLog } from '@/types/db';
import { getBootstrapData, addLogAction, logoutAction, saveExerciseAction, deleteExerciseAction, saveWorkoutAction, deleteWorkoutAction } from '@/actions';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface StorageContextType {
  data: AppData;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addLog: (log: WorkoutLog) => void;
  getHistoryForExercise: (exerciseId: string) => { date: string; log: ExerciseLog }[];
  logout: () => void;
  // CRUD
  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ exercises: [], workouts: [], logs: [] });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const serverData = await getBootstrapData();
      if (serverData) {
          setData(serverData);
      } else {
          setData({ exercises: [], workouts: [], logs: [] });
      }
    } catch {
      // Silent fail — data will be empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
      await load(true); // Silent refresh
  };

  const addLog = async (log: WorkoutLog) => {
    // 1. Snapshot previous state for rollback
    const previousData = data;
    
    // 2. Optimistic Update
    setData(prev => ({ ...prev, logs: [log, ...prev.logs] }));
    
    try { 
        await addLogAction(log); 
    } catch (e) {
        setData(previousData);
        throw e;
    }
  };

  const addExercise = async (exercise: Exercise) => {
    const prev = data;
    setData(d => ({ ...d, exercises: [...d.exercises, exercise] }));
    try { await saveExerciseAction(exercise); } catch { setData(prev); }
  };

  const updateExercise = async (exercise: Exercise) => {
    const prev = data;
    setData(d => ({ ...d, exercises: d.exercises.map(e => e.id === exercise.id ? exercise : e) }));
    try { await saveExerciseAction(exercise); } catch { setData(prev); }
  };

  const deleteExercise = async (id: string) => {
    const prev = data;
    setData(d => ({ ...d, exercises: d.exercises.filter(e => e.id !== id) }));
    try { await deleteExerciseAction(id); } catch { setData(prev); }
  };

  const addWorkout = async (workout: Workout) => {
    const prev = data;
    setData(d => ({ ...d, workouts: [...d.workouts, workout] }));
    try { await saveWorkoutAction(workout); } catch { setData(prev); }
  };

  const updateWorkout = async (workout: Workout) => {
    const prev = data;
    setData(d => ({ ...d, workouts: d.workouts.map(w => w.id === workout.id ? workout : w) }));
    try { await saveWorkoutAction(workout); } catch { setData(prev); }
  };

  const deleteWorkout = async (id: string) => {
    const prev = data;
    setData(d => ({ ...d, workouts: d.workouts.filter(w => w.id !== id) }));
    try { await deleteWorkoutAction(id); } catch { setData(prev); }
  };

  const getHistoryForExercise = (exerciseId: string) => {
    const history: { date: string; log: ExerciseLog }[] = [];
    data.logs.forEach(workoutLog => {
      const exLog = workoutLog.exercises.find(e => e.exerciseId === exerciseId);
      if (exLog) {
        history.push({ date: workoutLog.date, log: exLog });
      }
    });
    return history;
  };

  const logout = async () => {
      setData({ exercises: [], workouts: [], logs: [] });
      // Clear all app-related localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('workout_draft_') || key.startsWith('exercise_editor_draft_') ||
            key.startsWith('workout_editor_draft_') || key.startsWith('rest_timer_') ||
            key.startsWith('completed-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      await signOut({ callbackUrl: '/login' });
  };

  return (
    <StorageContext.Provider value={{
      data,
      isLoading,
      refresh,
      addLog,
      getHistoryForExercise,
      logout,
      addExercise,
      updateExercise,
      deleteExercise,
      addWorkout,
      updateWorkout,
      deleteWorkout
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

