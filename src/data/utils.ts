import { routine, Workout, Exercise } from './routine';

export function getTodayWorkout(): Workout | undefined {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  
  return routine.find(w => w.day === todayName);
}

export function getWorkoutById(id: string): Workout | undefined {
  return routine.find(w => w.id === id);
}

export function getExerciseById(id: string): Exercise | undefined {
  for (const workout of routine) {
    const exercise = workout.exercises.find(e => e.id === id);
    if (exercise) return exercise;
  }
  return undefined;
}
