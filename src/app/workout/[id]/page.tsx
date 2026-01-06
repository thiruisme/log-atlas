import { getWorkoutById } from '@/data/utils';
import ExerciseCard from '@/components/ExerciseCard';
import WorkoutHeader from '@/components/WorkoutHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = getWorkoutById(id);

  if (!workout) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-32">
      <WorkoutHeader workout={workout} />

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-black">Exercise List</h2>
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