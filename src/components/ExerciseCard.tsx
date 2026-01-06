'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exercise } from '@/data/routine';

interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else if (timer === 0) {
      setTimer(null);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const numSets = parseInt(exercise.sets) || 0;
    const saved = localStorage.getItem(`completed-${exercise.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setCompletedSets(parsed);
        setIsCompleted(parsed.every(s => s) && parsed.length > 0);
      }
    } else {
      setCompletedSets(new Array(numSets).fill(false));
    }
  }, [exercise.id, exercise.sets]);

  const toggleSet = (index: number) => {
    const newSets = [...completedSets];
    newSets[index] = !newSets[index];
    setCompletedSets(newSets);
    const allDone = newSets.every(s => s);
    setIsCompleted(allDone);
    localStorage.setItem(`completed-${exercise.id}`, JSON.stringify(newSets));
    
    if (newSets[index] && !allDone) {
      startTimer();
    }
  };

  const toggleFullExercise = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    const newSets = completedSets.map(() => newState);
    setCompletedSets(newSets);
    localStorage.setItem(`completed-${exercise.id}`, JSON.stringify(newSets));
  };

  const startTimer = () => {
    const restStr = exercise.rest.toLowerCase();
    let seconds = 60;
    if (restStr.includes('minute')) {
      seconds = 120;
    } else if (restStr.includes('60-90')) {
      seconds = 90;
    }
    setTimer(seconds);
  };

  const stopTimer = () => {
    setTimer(null);
  };

  return (
    <div className={`bg-card border transition-all duration-300 rounded-[2rem] overflow-hidden ${isCompleted ? 'border-accent/20 opacity-60 grayscale-[0.8]' : 'border-card-border shadow-sm hover:border-accent/30'}`}>
      <div className="p-6 flex items-start gap-5">
        <button 
          onClick={toggleFullExercise}
          className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-accent border-accent text-accent-foreground scale-90' : 'border-card-border hover:border-accent active:scale-90'}`}
        >
          {isCompleted && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className={`text-xl font-black leading-tight tracking-tighter uppercase italic ${isCompleted ? 'line-through text-text-muted' : ''}`}>
            {exercise.name}
          </h3>
          <div className="flex gap-4 mt-2">
             <span className="text-[10px] font-black text-accent uppercase tracking-widest italic">{exercise.sets} × {exercise.reps}</span>
             <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                timer !== null ? stopTimer() : startTimer(); 
              }}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${timer !== null ? 'text-error animate-pulse' : 'text-text-muted hover:text-accent'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {timer !== null ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {timer !== null ? `STOP ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : exercise.rest}
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 text-text-dim hover:text-accent transition-all ${isExpanded ? 'rotate-180 text-accent' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="px-6 pb-6 flex gap-2">
        {completedSets.map((done, i) => (
          <button
            key={i}
            onClick={() => toggleSet(i)}
            className={`flex-1 py-3 rounded-xl border-2 text-[20px] font-black transition-all active:scale-95 italic ${done ? 'bg-accent border-accent text-accent-foreground' : 'border-card-border text-text-muted hover:border-accent/30'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {isExpanded && (
        <div className="border-t border-card-border bg-card/30 p-6 animate-in slide-in-from-top duration-300">
          {exercise.notes && exercise.notes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-3">Target Cues</h4>
              <ul className="space-y-2">
                {exercise.notes.map((note, i) => (
                  <li key={i} className="text-sm text-text-secondary font-bold flex items-start gap-2 italic">
                    <span className="text-accent">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link 
            href={`/exercise/${exercise.id}`}
            className="group flex items-center justify-between w-full p-5 bg-background border border-card-border rounded-2xl hover:border-accent/50 transition-all"
          >
            <span className="text-[14px] font-bold uppercase text-text-muted group-hover:text-accent italic">View Reference</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-dim group-hover:text-accent group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
