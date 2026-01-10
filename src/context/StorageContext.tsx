'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Exercise, Workout, WorkoutLog, ExerciseLog } from '@/types/db';
import { getBootstrapData, addLogAction, logoutAction } from '@/actions';
import { useRouter } from 'next/navigation';

interface StorageContextType {
  data: AppData;
  isLoading: boolean;
  addLog: (log: WorkoutLog) => void;
  getHistoryForExercise: (exerciseId: string) => ExerciseLog[];
  logout: () => void;
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
    // Optimistic update
    setData(prev => ({ ...prev, logs: [log, ...prev.logs] }));
    
    try {
        await addLogAction(log);
    } catch (e) {
        console.error("Failed to save log", e);
        alert("Failed to save workout to server.");
    }
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
      router.push('/login'); // Should be handled by middleware mostly
  };

  return (
    <StorageContext.Provider value={{
      data,
      isLoading,
      addLog,
      getHistoryForExercise,
      logout
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

