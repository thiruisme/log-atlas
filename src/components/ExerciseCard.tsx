'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Exercise, WorkoutExercise, ExerciseLog, EquipmentType } from '@/types/db';
import ScrollPicker from './ScrollPicker';
import ProgressModal from './ProgressModal';

interface ExerciseCardProps {
  workoutId: string;
  exerciseDef: Exercise;
  target: WorkoutExercise;
  log: ExerciseLog;
  previousLog?: ExerciseLog;
  history: { date: string; log: ExerciseLog }[];
  onUpdateLog: (log: ExerciseLog) => void;
}

function getWeightOptions(equipment: EquipmentType = 'Other'): number[] {
  const options: number[] = [];
  // Standardized increments of 2.5kg for all equipment as requested
  for (let i = 0; i <= 300; i += 2.5) {
      options.push(i);
  }
  return options;
}

function getRepsOptions(): number[] {
    // 0 for empty/-
    const opts = [0];
    for(let i=1; i<=100; i++) opts.push(i);
    return opts;
}

export default function ExerciseCard({ workoutId, exerciseDef, target, log, previousLog, history, onUpdateLog }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const timerKey = `rest_timer_${workoutId}_${target.exerciseId}`;

  // Generate options once based on equipment
  const weightOptions = useMemo(() => getWeightOptions(exerciseDef.equipment), [exerciseDef.equipment]);
  const repsOptions = useMemo(() => getRepsOptions(), []);

  // Restore persisted timer on mount
  useEffect(() => {
    const saved = localStorage.getItem(timerKey);
    if (saved) {
      const end = parseInt(saved, 10);
      if (end > Date.now()) {
        endTimeRef.current = end;
        setRemaining(Math.round((end - Date.now()) / 1000));
      } else {
        localStorage.removeItem(timerKey);
      }
    }
  }, [timerKey]);

  // Timestamp-based timer: survives tab backgrounding and screen-off
  useEffect(() => {
    if (endTimeRef.current === null) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const left = Math.round((endTimeRef.current! - Date.now()) / 1000);
      if (left <= 0) {
        endTimeRef.current = null;
        setRemaining(null);
        localStorage.removeItem(timerKey);
      } else {
        setRemaining(left);
      }
    };

    tick(); // immediate sync on focus/resume
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [endTimeRef.current, timerKey]);

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    const newSets = [...log.sets];
    // Ensure set exists
    if (!newSets[index]) {
       newSets[index] = { weight: 0, reps: 0, completed: false };
    }
    newSets[index] = { ...newSets[index], [field]: value };
    onUpdateLog({ ...log, sets: newSets });
  };

  const toggleSetComplete = (index: number) => {
    const newSets = [...log.sets];
    if (!newSets[index]) {
       newSets[index] = { weight: 0, reps: 0, completed: false };
    }
    
    const isNowComplete = !newSets[index].completed;
    newSets[index] = { ...newSets[index], completed: isNowComplete };
    onUpdateLog({ ...log, sets: newSets });

    if (isNowComplete) {
        startTimer();
    }
  };

  const startTimer = () => {
    const seconds = parseRestSeconds(target.rest || exerciseDef.defaultRest || '60');
    const end = Date.now() + seconds * 1000;
    endTimeRef.current = end;
    localStorage.setItem(timerKey, end.toString());
    setRemaining(seconds);
  };

  const stopTimer = () => {
    endTimeRef.current = null;
    setRemaining(null);
    localStorage.removeItem(timerKey);
  };

  const isExerciseComplete = log.sets.length >= target.sets && log.sets.every(s => s.completed);

  return (
    <div className={`bg-card border transition-all duration-300 rounded-[2rem] overflow-hidden ${isExerciseComplete ? 'border-accent/40 opacity-80' : 'border-card-border shadow-sm'}`}>
      {/* Header */}
      <div className="p-6 flex items-start gap-5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isExerciseComplete ? 'bg-accent border-accent text-accent-foreground' : 'border-card-border text-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-xl font-black leading-tight tracking-tighter uppercase italic ${isExerciseComplete ? 'line-through text-text-muted' : ''}`}>
            {exerciseDef.name}
          </h3>
          <div className="flex gap-4 mt-2">
             <span className="text-[10px] font-black text-accent uppercase tracking-widest italic">{target.sets} Sets × {target.reps} Reps</span>
             <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                remaining !== null ? stopTimer() : startTimer();
              }}
              className={`relative z-10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${remaining !== null ? 'text-error animate-pulse' : 'text-text-muted hover:text-accent'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {remaining !== null ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {remaining !== null ? `STOP ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}` : formatRestDisplay(target.rest || exerciseDef.defaultRest || '60')}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {(isExpanded || !isExerciseComplete) && (
        <div className="px-6 pb-6 animate-in slide-in-from-top duration-200">
           
           {/* Sets Input */}
           <div className="space-y-2">
               {Array.from({ length: target.sets }).map((_, i) => {
                   const setLog = log.sets[i] || { weight: 0, reps: 0, completed: false };
                   const prevSet = previousLog?.sets[i];
                   
                   // Ensure current weight is in options
                   let currentWeightOptions = weightOptions;
                   if (setLog.weight > 0 && !weightOptions.includes(setLog.weight)) {
                       currentWeightOptions = [...weightOptions, setLog.weight].sort((a, b) => a - b);
                   }
                   
                   return (
                       <div key={i} className={`grid grid-cols-[48px_1fr_1fr_48px] gap-2 items-center ${setLog.completed ? 'opacity-50' : ''}`}>
                           
                           {/* History Pill (Outside Left) */}
                           <div className="w-full aspect-square flex items-center justify-center">
                               {prevSet ? (
                                   <div className="w-full h-full rounded-xl bg-accent/10 flex items-center justify-center text-accent text-[10px] font-mono font-bold tracking-tighter">
                                       {prevSet.weight}/{prevSet.reps}
                                   </div>
                               ) : (
                                   <div className="w-full"></div>
                               )}
                           </div>
                           
                           {/* Weight Picker */}
                           <div className="relative w-full">
                               <ScrollPicker 
                                  value={setLog.weight || 0} 
                                  options={currentWeightOptions} 
                                  onChange={(val) => updateSet(i, 'weight', val)}
                                  suffix="KG"
                                  disabled={setLog.completed}
                                  title="Select Weight"
                                  precision={1}
                               />
                           </div>

                           {/* Reps Picker */}
                           <div className="relative w-full">
                               <ScrollPicker 
                                  value={setLog.reps || 0} 
                                  options={repsOptions} 
                                  onChange={(val) => updateSet(i, 'reps', val)}
                                  disabled={setLog.completed}
                                  title="Select Reps"
                               />
                           </div>

                           {/* Square Checkbox Button */}
                           <button 
                              onClick={() => toggleSetComplete(i)}
                              className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${setLog.completed ? 'bg-accent border-accent text-accent-foreground' : 'border-card-border hover:border-accent'}`}
                           >
                               {setLog.completed && (
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                   </svg>
                               )}
                           </button>
                       </div>
                   );
               })}
           </div>

           {/* Footer Links */}
           <div className="mt-4 pt-4 border-t border-card-border flex justify-between items-center">
               <button
                 onClick={() => setShowProgress(true)}
                 className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-accent flex items-center gap-1"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                   </svg>
                   Progress
               </button>
               <Link href={`/exercise/${exerciseDef.id}`} className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-accent flex items-center gap-1">
                   Info / Edit
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
               </Link>
           </div>
        </div>
      )}

      <ProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        exerciseName={exerciseDef.name}
        history={history}
      />
    </div>
  );
}

/** Parse any rest time string into seconds. Handles "90", "90s", "2 min", "2-3 min", "60-90 sec". Uses upper bound for ranges. */
function parseRestSeconds(value: string): number {
  const str = value.toLowerCase().trim();
  // Extract all numbers
  const nums = str.match(/\d+/g)?.map(Number);
  if (!nums || nums.length === 0) return 60;
  // Use last (upper bound) number
  const n = nums[nums.length - 1];
  if (str.includes('min')) return n * 60;
  return n;
}

function formatRestDisplay(value: string): string {
  const secs = parseRestSeconds(value);
  return `${secs}s`;
}