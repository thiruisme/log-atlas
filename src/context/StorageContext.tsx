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
    } catch (e) {
      console.error("Failed to load user data", e);
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
        console.error("Add Log Failed", e);
        // 3. Rollback on failure
        setData(previousData);
        throw e; // Re-throw to let the UI know
    }
  };

  const addExercise = async (exercise: Exercise) => {
    // Optimistic
    setData(prev => ({ ...prev, exercises: [...prev.exercises, exercise] }));
    try { await saveExerciseAction(exercise); } catch (e) { console.error(e); }
  };

  const updateExercise = async (exercise: Exercise) => {
    // Optimistic
    setData(prev => ({ ...prev, exercises: prev.exercises.map(e => e.id === exercise.id ? exercise : e) }));
    try { await saveExerciseAction(exercise); } catch (e) { console.error(e); }
  };

  const deleteExercise = async (id: string) => {
    // Optimistic
    setData(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== id) }));
    try { await deleteExerciseAction(id); } catch (e) { console.error(e); }
  };

  const addWorkout = async (workout: Workout) => {
    // Optimistic
    setData(prev => ({ ...prev, workouts: [...prev.workouts, workout] }));
    try { await saveWorkoutAction(workout); } catch (e) { console.error(e); }
  };

  const updateWorkout = async (workout: Workout) => {
    // Optimistic
    setData(prev => ({ ...prev, workouts: prev.workouts.map(w => w.id === workout.id ? workout : w) }));
    try { await saveWorkoutAction(workout); } catch (e) { console.error(e); }
  };

  const deleteWorkout = async (id: string) => {
    // Optimistic
    setData(prev => ({ ...prev, workouts: prev.workouts.filter(w => w.id !== id) }));
    try { await deleteWorkoutAction(id); } catch (e) { console.error(e); }
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

