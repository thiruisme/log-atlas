'use client';

import { useStorage } from '@/context/StorageContext';
import { Workout, WorkoutExercise } from '@/types/db';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'];

export default function WorkoutEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, addWorkout, updateWorkout } = useStorage();
  
  const editId = searchParams.get('id');
  const isEditing = !!editId;

  // Local state for the workout being edited
  const [form, setForm] = useState<Workout>({
    id: crypto.randomUUID(),
    title: '',
    day: 'Monday',
    focus: '',
    exercises: []
  });

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  useEffect(() => {
    if (isEditing && data.workouts.length > 0) {
      const existing = data.workouts.find(w => w.id === editId);
      if (existing) {
        setForm(existing);
      }
    }
  }, [editId, data.workouts, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (isEditing) {
      updateWorkout(form);
    } else {
      addWorkout({ ...form, id: crypto.randomUUID() });
    }
    router.back();
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    const exerciseDef = data.exercises.find(e => e.id === exerciseId);
    if (!exerciseDef) return;

    const newEx: WorkoutExercise = {
      exerciseId,
      sets: exerciseDef.defaultSets,
      reps: exerciseDef.defaultReps,
      rest: exerciseDef.defaultRest,
      order: form.exercises.length
    };
    
    setForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, newEx]
    }));
    setIsAddingExercise(false);
    setExerciseSearch('');
  };

  const removeExercise = (index: number) => {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === form.exercises.length - 1) return;

    const newExercises = [...form.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];
    
    // Update order prop just in case
    newExercises.forEach((e, i) => e.order = i);
    
    setForm(prev => ({ ...prev, exercises: newExercises }));
  };

  const updateExerciseDetail = (index: number, field: keyof WorkoutExercise, value: string | number) => {
     const newExercises = [...form.exercises];
     newExercises[index] = { ...newExercises[index], [field]: value };
     setForm(prev => ({ ...prev, exercises: newExercises }));
  };

  // Filter exercises for the picker
  const availableExercises = data.exercises.filter(e => 
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-background text-foreground pb-32">
       {/* Header */}
      <header className="mb-6 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-2">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-text-muted hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-black tracking-tighter italic uppercase">{isEditing ? 'Edit Session' : 'New Session'}</h1>
        <button onClick={handleSubmit} className="text-sm font-bold text-accent uppercase tracking-wider">Save</button>
      </header>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Title</label>
                <input 
                    type="text" 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-card border border-card-border p-3 rounded-xl font-bold uppercase focus:outline-none focus:border-accent text-sm"
                    placeholder="PUSH A"
                />
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Day</label>
                <select 
                    value={form.day}
                    onChange={e => setForm({...form, day: e.target.value})}
                    className="w-full bg-card border border-card-border p-3 rounded-xl font-bold uppercase focus:outline-none focus:border-accent text-sm"
                >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
        </div>
        <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Focus / Notes</label>
            <input 
                type="text" 
                value={form.focus}
                onChange={e => setForm({...form, focus: e.target.value})}
                className="w-full bg-card border border-card-border p-3 rounded-xl font-bold focus:outline-none focus:border-accent text-sm"
                placeholder="Chest & Triceps..."
            />
        </div>

        <hr className="border-card-border" />

        {/* Exercise List */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] uppercase tracking-[0.2em] text-text-muted font-black italic">Exercises ({form.exercises.length})</h2>
                <button 
                    onClick={() => setIsAddingExercise(true)}
                    className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-lg font-black uppercase tracking-wider"
                >
                    + Add
                </button>
            </div>

            <div className="space-y-3">
                {form.exercises.map((ex, index) => {
                    const original = data.exercises.find(e => e.id === ex.exerciseId);
                    return (
                        <div key={index} className="bg-card border border-card-border p-4 rounded-xl">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-black italic uppercase text-sm">{original?.name || 'Unknown'}</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => moveExercise(index, 'up')} className="p-1 text-text-muted hover:text-foreground disabled:opacity-30" disabled={index === 0}>↑</button>
                                    <button onClick={() => moveExercise(index, 'down')} className="p-1 text-text-muted hover:text-foreground disabled:opacity-30" disabled={index === form.exercises.length - 1}>↓</button>
                                    <button onClick={() => removeExercise(index)} className="p-1 text-error hover:opacity-80 ml-2">×</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[8px] uppercase tracking-widest text-text-muted block mb-1">Sets</label>
                                    <input type="number" value={ex.sets} onChange={(e) => updateExerciseDetail(index, 'sets', parseInt(e.target.value))} className="w-full bg-background border border-card-border rounded p-1 text-center font-bold text-xs" />
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase tracking-widest text-text-muted block mb-1">Reps</label>
                                    <input type="text" value={ex.reps} onChange={(e) => updateExerciseDetail(index, 'reps', e.target.value)} className="w-full bg-background border border-card-border rounded p-1 text-center font-bold text-xs" />
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase tracking-widest text-text-muted block mb-1">Rest</label>
                                    <input type="text" value={ex.rest} onChange={(e) => updateExerciseDetail(index, 'rest', e.target.value)} className="w-full bg-background border border-card-border rounded p-1 text-center font-bold text-xs" />
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {form.exercises.length === 0 && (
                    <div className="text-center py-8 text-text-muted text-sm italic border-2 border-dashed border-card-border rounded-xl">
                        No exercises added yet.
                    </div>
                 )}
            </div>
        </div>
      </div>

      {/* Add Exercise Modal / Overlay */}
      {isAddingExercise && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur z-50 p-6 animate-in slide-in-from-bottom duration-300">
               <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black italic uppercase">Add Exercise</h2>
                    <button onClick={() => setIsAddingExercise(false)} className="p-2 text-text-muted hover:text-foreground">Close</button>
               </div>
               
               <input 
                  type="text" 
                  autoFocus
                  placeholder="SEARCH LIBRARY..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full bg-card border border-card-border p-4 rounded-xl text-lg font-bold uppercase tracking-wide focus:outline-none focus:border-accent mb-4"
               />

               <div className="overflow-y-auto h-[60vh] space-y-2 pb-20">
                   {availableExercises.map(ex => (
                       <button 
                         key={ex.id}
                         onClick={() => addExerciseToWorkout(ex.id)}
                         className="w-full text-left bg-card border border-card-border p-4 rounded-xl hover:border-accent flex justify-between items-center group"
                       >
                           <span className="font-bold uppercase text-sm italic">{ex.name}</span>
                           <span className="text-[10px] text-text-muted font-bold group-hover:text-accent">+ ADD</span>
                       </button>
                   ))}
                   {availableExercises.length === 0 && (
                       <p className="text-center text-text-muted mt-8 text-sm">No exercises found.</p>
                   )}
               </div>
          </div>
      )}
    </main>
  );
}
