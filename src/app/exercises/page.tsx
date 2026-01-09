'use client';

import Link from 'next/link';
import { useStorage } from '@/context/StorageContext';
import { useState } from 'react';

export default function ExercisesPage() {
  const { data, deleteExercise } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = data.exercises.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.targetMuscle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-background text-foreground pb-24">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 text-text-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black tracking-tighter italic uppercase">Exercise Library</h1>
        <div className="w-6"></div> {/* Spacer */}
      </header>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="SEARCH EXERCISES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-card-border p-4 rounded-xl text-lg font-bold uppercase tracking-wide focus:outline-none focus:border-accent placeholder:text-text-muted/50"
        />
      </div>

      <div className="space-y-4 mb-20">
        {filteredExercises.map(exercise => (
           <div key={exercise.id} className="bg-card border border-card-border p-5 rounded-2xl flex items-center justify-between group">
              <div>
                <h3 className="font-black italic text-lg uppercase leading-none mb-1">{exercise.name}</h3>
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded-md">
                  {exercise.targetMuscle}
                </span>
              </div>
              <div className="flex items-center gap-3">
                 <Link href={`/exercises/editor?id=${exercise.id}`} className="p-2 text-text-muted hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                 </Link>
                 <button 
                  onClick={() => {
                      if(confirm('Delete this exercise?')) deleteExercise(exercise.id);
                  }}
                  className="p-2 text-text-muted hover:text-error transition-colors"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                 </button>
              </div>
           </div>
        ))}
        
        {filteredExercises.length === 0 && (
            <div className="text-center py-12 text-text-muted font-bold italic">
                No exercises found.
            </div>
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto pointer-events-none">
        <Link 
          href="/exercises/editor" 
          className="pointer-events-auto block w-full bg-accent text-accent-foreground text-center py-5 rounded-2xl font-black text-xl shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all uppercase italic tracking-tighter"
        >
          + Add New Exercise
        </Link>
      </div>
    </main>
  );
}
