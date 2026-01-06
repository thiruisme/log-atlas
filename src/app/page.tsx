import Link from 'next/link';
import { routine } from '@/data/routine';
import { getTodayWorkout } from '@/data/utils';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const todayWorkout = getTodayWorkout();
  
  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-background text-foreground">
      <header className="mb-12 mt-8 flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-black mb-1 tracking-tighter italic uppercase leading-none">LOG</h1>
          <h1 className="text-4xl font-black mb-3 tracking-tighter text-accent uppercase leading-none italic">ATLAS</h1>
          <div className="h-1.5 w-12 bg-accent rounded-full mb-6"></div>
        </div>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Today's Workout Section */}
      <section className="mb-12">
        <h2 className="text-[14px] uppercase tracking-[0.3em] text-text-muted mb-6 font-black italic">Next Session</h2>
        {todayWorkout ? (
          <div className="bg-card border border-card-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black mb-1 tracking-tighter italic uppercase">{todayWorkout.title}</h3>
              <p className="text-text-secondary mb-8 font-black text-xs uppercase italic">{todayWorkout.focus}</p>
              <Link 
                href={`/workout/${todayWorkout.id}`}
                className="flex items-center justify-center w-full bg-accent text-accent-foreground text-center py-5 rounded-2xl font-black text-xl shadow-lg hover:translate-y-[-2px] active:translate-y-[0px] transition-all uppercase italic tracking-tighter"
              >
                START WORKOUT
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border-2 border-dashed border-card-border rounded-[2.5rem] p-12 text-center">
            <p className="font-black text-3xl mb-1 italic uppercase tracking-tighter">Rest Day</p>
            <p className="text-[10px] text-text-muted font-black tracking-[0.2em] uppercase italic">Recovery Mode Active</p>
          </div>
        )}
      </section>

      {/* Weekly Split Section */}
      <section>
        <h2 className="text-[14px] uppercase tracking-[0.3em] text-text-muted mb-6 font-black italic">Weekly Routine</h2>
        <div className="grid gap-4">
          {routine.map((workout) => (
            <Link 
              key={workout.id}
              href={`/workout/${workout.id}`}
              className="group flex items-center justify-between bg-card border border-card-border p-6 rounded-2xl hover:border-accent/50 hover:shadow-md transition-all"
            >
              <div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1 italic">{workout.day}</span>
                <span className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-accent transition-colors">{workout.title}</span>
              </div>
              <div className="bg-background w-12 h-12 rounded-xl flex items-center justify-center border border-card-border group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
