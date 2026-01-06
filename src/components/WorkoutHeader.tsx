import Link from 'next/link';
import { Workout } from '@/data/routine';
import ThemeToggle from './ThemeToggle';

interface WorkoutHeaderProps {
  workout: Workout;
}

export default function WorkoutHeader({ workout }: WorkoutHeaderProps) {
  const handleReset = () => {
    if (confirm('Clear all progress for this session?')) {
      workout.exercises.forEach(e => {
        localStorage.removeItem(`completed-${e.id}`);
      });
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-card-border p-4">
      <div className="max-w-md mx-auto flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 text-text-muted hover:text-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black leading-tight tracking-tighter truncate uppercase italic">{workout.title}</h1>
          <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] truncate italic">{workout.focus}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={handleReset}
            className="bg-card-border/50 text-[9px] font-black text-text-muted uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-error/10 hover:text-error transition-all active:scale-90"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
