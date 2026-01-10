'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Exercise, Workout, WorkoutLog, ExerciseLog } from '@/types/db';
import { getBootstrapData, addLogAction, logoutAction, saveExerciseAction, deleteExerciseAction, saveWorkoutAction, deleteWorkoutAction } from '@/actions';
import { useRouter } from 'next/navigation';

interface StorageContextType {
  data: AppData;
  isLoading: boolean;
  addLog: (log: WorkoutLog) => void;
  getHistoryForExercise: (exerciseId: string) => ExerciseLog[];
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

  useEffect(() => {
    async function load() {
      try {
        const serverData = await getBootstrapData();
        setData(serverData);
      } catch (e) {
        console.error("Failed to load user data", e);
        // If unauthorized, middleware usually catches it, but if API fails:
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addLog = async (log: WorkoutLog) => {
    // Optimistic
    setData(prev => ({ ...prev, logs: [log, ...prev.logs] }));
    try { await addLogAction(log); } catch (e) { console.error(e); }
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
    const history: ExerciseLog[] = [];
    data.logs.forEach(workoutLog => {
      const exLog = workoutLog.exercises.find(e => e.exerciseId === exerciseId);
      if (exLog) {
        history.push(exLog);
      }
    });
    return history;
  };

  const logout = async () => {
      await logoutAction();
      router.push('/login'); 
  };

  return (
    <StorageContext.Provider value={{
      data,
      isLoading,
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

