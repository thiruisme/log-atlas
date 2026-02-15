'use client';

import { use, useEffect, useState } from 'react';
import { useStorage } from '@/context/StorageContext';
import { ExerciseLog, WorkoutLog } from '@/types/db';
import ExerciseCard from '@/components/ExerciseCard';
import WorkoutHeader from '@/components/WorkoutHeader';
import ConfirmationModal from '@/components/ConfirmationModal';
import { notFound, useRouter } from 'next/navigation';

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, addLog, getHistoryForExercise, isLoading } = useStorage();
  
  const workout = data.workouts.find(w => w.id === id);
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [draftLog, setDraftLog] = useState<WorkoutLog | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workout) {
      // Initialize default log
      const initialLog: WorkoutLog = {
        id: crypto.randomUUID(),
        workoutId: workout.id,
        date: new Date().toISOString(),
        durationMinutes: 0,
        exercises: workout.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: Array(ex.sets).fill({ weight: 0, reps: 0, completed: false })
        }))
      };

      // Check for saved draft
      const saved = localStorage.getItem(`workout_draft_${id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDraftLog(parsed);
          setLog(initialLog); // Show default in background
          setIsRestoreModalOpen(true);
        } catch (e) {
          setLog(initialLog);
        }
      } else {
        setLog(initialLog);
      }
    }
  }, [workout, id]);

  // Autosave effect
  useEffect(() => {
    if (log && !isRestoreModalOpen) {
      localStorage.setItem(`workout_draft_${id}`, JSON.stringify(log));
    }
  }, [log, isRestoreModalOpen, id]);

  if (isLoading) return <div className="p-6 text-center animate-pulse font-black italic text-text-muted">LOADING SESSION...</div>;
  
  if (!workout) {
      return (
        <main className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-black italic uppercase mb-4">Workout Not Found</h1>
            <p className="text-text-muted mb-8">This session template may have been deleted.</p>
            <button onClick={() => router.push('/')} className="bg-accent text-accent-foreground px-8 py-4 rounded-2xl font-black uppercase italic shadow-lg">
                Return to Base
            </button>
        </main>
      );
  }

  if (!log) return <div className="p-6 text-center font-black italic text-text-muted">PREPARING SESSION...</div>;

  const handleUpdateExerciseLog = (exerciseId: string, updatedExLog: ExerciseLog) => {
    setLog(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(e => e.exerciseId === exerciseId ? updatedExLog : e)
      };
    });
  };

  const handleRestore = () => {
    if (draftLog) {
      setLog(draftLog);
      setIsRestoreModalOpen(false);
    }
  };

  const handleDiscardRestore = () => {
    // Keep draftLog in memory so user can recover it later
    setIsRestoreModalOpen(false);
  };

  const confirmRecover = () => {
    if (draftLog) {
      setLog(draftLog);
      setDraftLog(null);
      setIsRecoverModalOpen(false);
    }
  };

  const handleFinish = () => {
    setIsFinishModalOpen(true);
  };

  const confirmFinish = async () => {
    if (log) {
      setIsSaving(true);
      try {
          await addLog(log);
          // Only clear draft if server save was successful
          localStorage.removeItem(`workout_draft_${id}`);
          router.push('/');
      } catch (error) {
          alert("Failed to save workout. Please check your internet connection and try again.");
          setIsSaving(false); // Re-enable button
      }
    }
  };
  
  const confirmCancel = () => {
      localStorage.removeItem(`workout_draft_${id}`);
      router.push('/');
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-40">
      {/* We can re-use WorkoutHeader or just inline a simple one given the new data structure 
          The old WorkoutHeader expects a different type, so let's simplify here for now or adapt it.
          For speed, I'll inline the header style matching the dashboard.
      */}
      <div className="bg-card pt-8 pb-12 px-6 rounded-b-[3rem] border-b border-card-border mb-8 shadow-xl">
           <div className="max-w-md mx-auto relative">
               <button
                onClick={() => router.push('/')}
                className="absolute -top-2 -left-2 p-2 text-text-muted hover:text-foreground transition-colors"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
               </button>
               <div className="pl-8">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent block mb-2">{workout.day}</span>
                 <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">{workout.title}</h1>
                 <p className="text-text-secondary font-bold uppercase italic text-sm">{workout.focus}</p>
               </div>
           </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-black italic">Exercise List</h2>
          <span className="text-[14px] bg-accent/5 text-accent px-2 py-1 rounded-lg font-black italic">{workout.exercises.length} Exercises</span>
        </div>
        
        {workout.exercises.map((target) => {
          const exerciseDef = data.exercises.find(e => e.id === target.exerciseId);
          const currentExLog = log.exercises.find(e => e.exerciseId === target.exerciseId);
          const history = getHistoryForExercise(target.exerciseId);
          const previousLog = history.length > 0 ? history[0].log : undefined;

          if (!exerciseDef || !currentExLog) return null;

          return (
            <ExerciseCard
              key={target.exerciseId}
              workoutId={id}
              exerciseDef={exerciseDef}
              target={target}
              log={currentExLog}
              previousLog={previousLog}
              history={history}
              onUpdateLog={(updated) => handleUpdateExerciseLog(target.exerciseId, updated)}
            />
          );
        })}

        {draftLog && (
          <button
            onClick={() => setIsRecoverModalOpen(true)}
            className="w-full text-center py-4 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
          >
            Recover Previous Session
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-30 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto space-y-3">
          <button
            onClick={handleFinish}
            className="block w-full bg-foreground text-background text-center py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all uppercase italic tracking-tighter"
          >
            Finish Workout
          </button>
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="block w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-error transition-colors"
          >
            Discard Workout
          </button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Discard Workout?"
        message="All progress for this session will be lost permanently."
        confirmText="Yes, Discard"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isFinishModalOpen}
        onClose={() => !isSaving && setIsFinishModalOpen(false)}
        onConfirm={confirmFinish}
        title="Finish Session?"
        message="Save your results to your atlas history."
        confirmText={isSaving ? "Saving..." : "Finish & Save"}
        disabled={isSaving}
      />

      <ConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={handleDiscardRestore}
        onConfirm={handleRestore}
        title="Resume Session?"
        message="We found an unsaved session. Do you want to pick up where you left off?"
        confirmText="Resume"
        cancelText="Start New"
      />

      <ConfirmationModal
        isOpen={isRecoverModalOpen}
        onClose={() => setIsRecoverModalOpen(false)}
        onConfirm={confirmRecover}
        title="Recover Session?"
        message="Your current workout will be discarded and the previous session will be restored."
        confirmText="Recover"
        variant="danger"
      />
    </main>
  );
}
