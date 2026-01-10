'use client';

import Link from 'next/link';
import { useStorage } from '@/context/StorageContext';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useEffect, useState } from 'react';
import { Workout } from '@/types/db';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data, isLoading, logout } = useStorage();
  const { data: session } = useSession();
  const [todayWorkout, setTodayWorkout] = useState<Workout | undefined>(undefined);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (data.workouts.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      // Find workout matching today's day name
      const match = data.workouts.find(w => w.day === todayName);
      setTodayWorkout(match);
    }
  }, [data.workouts]);

  if (isLoading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-pulse text-xl font-black italic uppercase">Loading Atlas...</div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-background text-foreground pb-24">
      <header className="mb-12 mt-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-5xl font-black mb-1 tracking-tighter italic uppercase leading-none">LOG</h1>
            <h1 className="text-4xl font-black mb-3 tracking-tighter text-accent uppercase leading-none italic">ATLAS</h1>
            <div className="h-1.5 w-12 bg-accent rounded-full"></div>
          </div>
          <div className="mt-2">
            <ThemeToggle />
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
             <p className="text-[14px] uppercase text-text-muted font-black italic">Commander Active</p>
             <h2 className="text-2xl font-black italic uppercase leading-none">
                Welcome, <span className="text-accent">{session?.user?.name || 'Recruit'}</span>!
             </h2>
          </div>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-3 bg-card border border-card-border rounded-xl text-text-muted hover:text-error hover:border-error/30 transition-all shadow-sm"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <ConfirmationModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Logout?"
        message="You will need to sign in again to access your atlas."
        confirmText="Logout"
        variant="danger"
      />

      {/* Today's Workout Section */}
      <section className="mb-12">
        <h2 className="text-[14px] uppercase tracking-[0.3em] text-text-muted mb-6 font-black italic">Today's Session</h2>
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
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-[14px] uppercase tracking-[0.3em] text-text-muted font-black italic">Weekly Routine</h2>
           <Link href="/workouts" className="text-xs font-bold text-accent uppercase tracking-wider hover:underline">Manage</Link>
        </div>
        <div className="grid gap-4">
          {data.workouts.map((workout) => (
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

       {/* Management Section */}
       <section>
        <h2 className="text-[14px] uppercase tracking-[0.3em] text-text-muted mb-6 font-black italic">Database</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/exercises" className="bg-card border border-card-border p-6 rounded-2xl text-center hover:border-accent/50 transition-all">
             <div className="mb-3 flex justify-center text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
             <span className="text-sm font-black uppercase tracking-tighter block">Exercise Library</span>
          </Link>
          <Link href="/workouts" className="bg-card border border-card-border p-6 rounded-2xl text-center hover:border-accent/50 transition-all">
             <div className="mb-3 flex justify-center text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
             </div>
             <span className="text-sm font-black uppercase tracking-tighter block">Routine Manager</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
