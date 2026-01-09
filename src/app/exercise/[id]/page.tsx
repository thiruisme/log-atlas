'use client';

import { use, useEffect, useState } from 'react';
import { useStorage } from '@/context/StorageContext';
import { Exercise } from '@/types/db';
import { notFound, useRouter } from 'next/navigation';

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useStorage();
  const [exercise, setExercise] = useState<Exercise | undefined>(undefined);

  useEffect(() => {
    if (!isLoading) {
      const found = data.exercises.find(e => e.id === id);
      setExercise(found);
    }
  }, [id, data.exercises, isLoading]);

  if (isLoading) return null;
  if (!exercise) return notFound();

  return (
    <main className="min-h-screen bg-background text-foreground pb-12">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-card-border p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-text-muted hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight uppercase tracking-widest text-[10px] text-text-muted font-black">Reference Guide</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        <h2 className="text-4xl font-black mb-2 tracking-tighter italic uppercase leading-tight">{exercise.name}</h2>
        <div className="flex gap-8 mb-10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-black">Sets</span>
            <span className="text-xl font-black text-accent italic">{exercise.defaultSets}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-black">Reps</span>
            <span className="text-xl font-black text-accent italic">{exercise.defaultReps}</span>
          </div>
        </div>

        {/* Image Placeholder */}
        <div className="aspect-[4/3] bg-card border-2 border-card-border rounded-[2.5rem] flex flex-col items-center justify-center mb-10 overflow-hidden shadow-xl relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
          <div className="text-center p-8 relative z-10">
            <div className="w-20 h-20 bg-card border-2 border-card-border text-accent rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-1">Visual Reference</p>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Image Coming Soon</p>
          </div>
        </div>

        <section className="space-y-12">
          <div>
            <h3 className="text-[14px] uppercase tracking-[0.3em] text-text-dim font-black mb-6 flex items-center gap-4 italic">
              Step-by-Step
              <div className="h-px flex-1 bg-card-border"></div>
            </h3>
            <div className="space-y-6">
              {(exercise.instructions || [
                "Set up with proper form as described in the cues.",
                "Execute the movement with control, focusing on the target muscle.",
                "Maintain full range of motion throughout each rep.",
                "Squeeze at the peak of the contraction."
              ]).map((step, i) => (
                <div key={i} className="flex gap-5">
                  <span className="flex-shrink-0 w-8 h-8 bg-accent text-accent-foreground rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-accent/20">{i+1}</span>
                  <p className="text-text-secondary font-regular text-s">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[14px] uppercase tracking-[0.3em] text-text-dim font-black mb-6 flex items-center gap-4 italic">
              Personal Cues
              <div className="h-px flex-1 bg-card-border"></div>
            </h3>
            <ul className="space-y-4">
              {exercise.notes ? (
                <li className="flex items-start gap-4 text-text-secondary font-bold text-sm">
                  <span className="text-accent mt-1 text-lg leading-none">•</span>
                  <span>{exercise.notes}</span>
                </li>
              ) : (
                <li className="flex items-start gap-4 text-text-secondary font-regular text-s">
                  <span className="text-accent mt-1 text-lg leading-none">•</span>
                  <span>Focus on mind-muscle connection.</span>
                </li>
              )}
            </ul>
          </div>

          <div className="p-6 bg-error-bg border border-error-border rounded-3xl">
            <h3 className="text-[14px] uppercase tracking-[0.3em] text-error font-bold mb-4 italic">Form Warnings</h3>
            <ul className="space-y-3 text-s text-error font-regular opacity-80">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                No Momentum
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                Full Range Only
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                Control Eccentric
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
