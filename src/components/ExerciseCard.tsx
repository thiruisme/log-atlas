'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Exercise, WorkoutExercise, ExerciseLog, EquipmentType } from '@/types/db';
import ScrollPicker from './ScrollPicker';

interface ExerciseCardProps {
  exerciseDef: Exercise;
  target: WorkoutExercise;
  log: ExerciseLog;
  previousLog?: ExerciseLog;
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

export default function ExerciseCard({ exerciseDef, target, log, previousLog, onUpdateLog }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  // Generate options once based on equipment
  const weightOptions = useMemo(() => getWeightOptions(exerciseDef.equipment), [exerciseDef.equipment]);
  const repsOptions = useMemo(() => getRepsOptions(), []);

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
    const restStr = target.rest?.toLowerCase() || exerciseDef.defaultRest?.toLowerCase() || '60s';
    let seconds = 60;
    
    if (restStr.includes('min')) {
      const match = restStr.match(/(\d+)/);
      if (match) seconds = parseInt(match[0]) * 60;
    } else {
      const match = restStr.match(/(\d+)/);
      if (match) seconds = parseInt(match[0]);
    }
    setTimer(seconds);
  };

  const stopTimer = () => {
    setTimer(null);
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
                timer !== null ? stopTimer() : startTimer(); 
              }}
              className={`relative z-10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${timer !== null ? 'text-error animate-pulse' : 'text-text-muted hover:text-accent'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {timer !== null ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {timer !== null ? `STOP ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : exerciseDef.defaultRest || target.rest}
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

           {/* Reference Link */}
           <div className="mt-4 pt-4 border-t border-card-border flex justify-end">
               <Link href={`/exercise/${exerciseDef.id}`} className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-accent flex items-center gap-1">
                   Info / Edit
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
               </Link>
           </div>
        </div>
      )}
    </div>
  );
}