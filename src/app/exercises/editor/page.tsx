'use client';

import { useStorage } from '@/context/StorageContext';
import { Exercise, MuscleGroup } from '@/types/db';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Cardio', 'Other'];
const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'];

function ExerciseEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, addExercise, updateExercise } = useStorage();
  
  const editId = searchParams.get('id');
  const isEditing = !!editId;

  const [form, setForm] = useState<Exercise>({
    id: crypto.randomUUID(),
    name: '',
    targetMuscle: 'Other',
    equipment: 'Other',
    defaultSets: 3,
    defaultReps: '10',
    defaultRest: '90s',
    notes: '',
    videoUrl: ''
  });

  useEffect(() => {
    if (isEditing && data.exercises.length > 0) {
      const existing = data.exercises.find(e => e.id === editId);
      if (existing) {
        setForm(existing);
      }
    }
  }, [editId, data.exercises, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isEditing) {
      updateExercise(form);
    } else {
      addExercise({ ...form, id: crypto.randomUUID() });
    }
    router.back();
  };

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-background text-foreground">
      <header className="mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-text-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-black tracking-tighter italic uppercase">{isEditing ? 'Edit Exercise' : 'New Exercise'}</h1>
        <div className="w-6"></div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Exercise Name</label>
          <input 
            type="text" 
            required
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full bg-card border border-card-border p-4 rounded-xl text-lg font-bold uppercase tracking-wide focus:outline-none focus:border-accent"
            placeholder="E.G. BENCH PRESS"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Equipment (Determines Weight Presets)</label>
          <div className="grid grid-cols-3 gap-2">
            {EQUIPMENT_TYPES.map(eq => (
              <button
                key={eq}
                type="button"
                onClick={() => setForm({...form, equipment: eq as any})}
                className={`p-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${form.equipment === eq ? 'bg-accent border-accent text-accent-foreground' : 'bg-card border-card-border text-text-muted hover:border-accent/50'}`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Target Muscle</label>
          <div className="grid grid-cols-2 gap-2">
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({...form, targetMuscle: m})}
                className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${form.targetMuscle === m ? 'bg-accent border-accent text-accent-foreground' : 'bg-card border-card-border text-text-muted hover:border-accent/50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Default Sets</label>
            <input 
              type="number" 
              value={form.defaultSets}
              onChange={e => setForm({...form, defaultSets: parseInt(e.target.value) || 0})}
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Default Reps</label>
            <input 
              type="text" 
              value={form.defaultReps}
              onChange={e => setForm({...form, defaultReps: e.target.value})}
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold focus:outline-none focus:border-accent"
              placeholder="e.g. 8-12"
            />
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Default Rest Time</label>
           <input 
              type="text" 
              value={form.defaultRest}
              onChange={e => setForm({...form, defaultRest: e.target.value})}
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold focus:outline-none focus:border-accent"
              placeholder="e.g. 90s or 2 min"
            />
        </div>

        <div>
           <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Cues / Notes</label>
           <textarea 
              value={form.notes || ''}
              onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full bg-card border border-card-border p-4 rounded-xl font-medium focus:outline-none focus:border-accent min-h-[100px]"
              placeholder="Keep back straight, drive through heels..."
            />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-black text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase italic tracking-tighter"
          >
            {isEditing ? 'Save Changes' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function ExerciseEditor() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading Editor...</div>}>
      <ExerciseEditorContent />
    </Suspense>
  );
}
