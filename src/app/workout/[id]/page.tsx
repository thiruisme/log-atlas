'use client';

import { use, useEffect, useState } from 'react';
import { getWorkoutById } from '@/data/utils';
import { Workout } from '@/data/routine';
import ExerciseCard from '@/components/ExerciseCard';
import WorkoutHeader from '@/components/WorkoutHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workout, setWorkout] = useState<Workout | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = getWorkoutById(id);
    setWorkout(found);
    setLoading(false);
  }, [id]);

  if (loading) return null;
  if (!workout) return notFound();

  return (
    <main className="min-h-screen bg-background text-foreground pb-32">
      <WorkoutHeader workout={workout} />

      <div className="max-w-md mx-auto p-6 space-y-6">
        {workout.notes && workout.notes.length > 0 && (
          <div className="bg-card border border-card-border p-5 rounded-[2rem] shadow-sm mb-6">
            <h4 className="text-[14px] uppercase tracking-[0.3em] text-accent font-bold italic mb-3">Session Notes</h4>
            <ul className="space-y-1">
              {workout.notes.map((note, i) => (
                <li key={i} className="text-s text-text-secondary font-medium italic flex items-center gap-2">
                  <span className="text-accent font-black">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-black italic">Exercise List</h2>
          <span className="text-[14px] bg-accent/5 text-accent px-2 py-1 rounded-lg font-black italic">{workout.exercises.length} Exercises</span>
        </div>
        
        {workout.exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Link 
            href="/"
            className="block w-full bg-foreground text-background text-center py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all uppercase italic tracking-tighter"
          >
            Finish Workout
          </Link>
        </div>
      </div>
    </main>
  );
}
