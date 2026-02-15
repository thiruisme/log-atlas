'use client';

import Link from 'next/link';
import { useStorage } from '@/context/StorageContext';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from '@/components/Toast';
import { useEffect, useRef, useState } from 'react';
import { AppData, Exercise, ExerciseLog, Workout, WorkoutLog } from '@/types/db';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data, isLoading, logout, addLog, addExercise, addWorkout } = useStorage();
  const { data: session } = useSession();
  const [todayWorkout, setTodayWorkout] = useState<Workout | undefined>(undefined);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeDrafts, setActiveDrafts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModal, setImportModal] = useState<{
    logs: WorkoutLog[];
    matched: number;
    skipped: number;
    skippedExercises: string[];
    duplicates: number;
    invalidDates: number;
  } | null>(null);
  const [jsonImportModal, setJsonImportModal] = useState<{
    data: AppData;
    newExercises: Exercise[];
    newWorkouts: Workout[];
    newLogs: WorkoutLog[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (data.workouts.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      const match = data.workouts.find(w => w.day === todayName);
      setTodayWorkout(match);

      // Detect active drafts in localStorage
      const drafts = new Set<string>();
      for (const w of data.workouts) {
        if (localStorage.getItem(`workout_draft_${w.id}`)) {
          drafts.add(w.id);
        }
      }
      setActiveDrafts(drafts);
    }
  }, [data.workouts]);

  const handleExport = () => {
    const rows: string[] = ['date,workout,exercise,set,weight_kg,reps,rpe,completed'];
    let setCount = 0;
    for (const log of data.logs) {
      const workout = data.workouts.find(w => w.id === log.workoutId);
      const workoutName = workout?.title || 'Unknown Workout';
      const date = new Date(log.date).toISOString().split('T')[0];
      for (const exLog of log.exercises) {
        const exercise = data.exercises.find(e => e.id === exLog.exerciseId);
        const exerciseName = exercise?.name || 'Unknown Exercise';
        exLog.sets.forEach((set, i) => {
          const rpe = set.rpe != null ? String(set.rpe) : '';
          rows.push([date, csvEscape(workoutName), csvEscape(exerciseName), i + 1, set.weight, set.reps, rpe, set.completed].join(','));
          setCount++;
        });
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `log-atlas-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast(`Exported ${setCount} sets`);
  };

  const handleExportJSON = () => {
    const backup = { exercises: data.exercises, workouts: data.workouts, logs: data.logs };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `log-atlas-backup-${new Date().toISOString().split('T')[0]}.json`);
    toast(`Backed up ${data.exercises.length} exercises, ${data.workouts.length} workouts, ${data.logs.length} logs`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        parseImportJSON(text);
      } else {
        setImportModal(parseImportCSV(text));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const parseImportJSON = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.workouts) || !Array.isArray(parsed.logs)) {
        toast('Invalid backup file — missing exercises, workouts, or logs', 'error');
        return;
      }

      // Validate individual item shapes — skip malformed entries
      const isValidExercise = (e: any): e is Exercise =>
        typeof e?.id === 'string' && typeof e?.name === 'string' && typeof e?.defaultSets === 'number';
      const isValidWorkout = (w: any): w is Workout =>
        typeof w?.id === 'string' && typeof w?.title === 'string' && typeof w?.day === 'string' && Array.isArray(w?.exercises);
      const isValidLog = (l: any): l is WorkoutLog =>
        typeof l?.id === 'string' && typeof l?.workoutId === 'string' && typeof l?.date === 'string' && Array.isArray(l?.exercises);

      const exercises = parsed.exercises.filter(isValidExercise);
      const workouts = parsed.workouts.filter(isValidWorkout);
      const logs = parsed.logs.filter(isValidLog);
      const backup: AppData = { exercises, workouts, logs };

      const skipped = (parsed.exercises.length - exercises.length) + (parsed.workouts.length - workouts.length) + (parsed.logs.length - logs.length);
      if (skipped > 0) toast(`${skipped} malformed items skipped`, 'error');

      const existingExNames = new Set(data.exercises.map(e => e.name.toLowerCase()));
      const existingWkNames = new Set(data.workouts.map(w => w.title.toLowerCase()));
      const existingLogKeys = new Set(data.logs.map(l => `${new Date(l.date).toISOString().split('T')[0]}|${l.workoutId}`));

      const newExercises = backup.exercises.filter(e => !existingExNames.has(e.name.toLowerCase()));
      const newWorkouts = backup.workouts.filter(w => !existingWkNames.has(w.title.toLowerCase()));
      const newLogs = backup.logs.filter(l => !existingLogKeys.has(`${new Date(l.date).toISOString().split('T')[0]}|${l.workoutId}`));

      setJsonImportModal({ data: backup, newExercises, newWorkouts, newLogs });
    } catch {
      toast('Failed to parse JSON file', 'error');
    }
  };

  const parseImportCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const dataLines = lines.slice(1); // skip header

    const exerciseLookup = new Map<string, string>();
    for (const ex of data.exercises) exerciseLookup.set(ex.name.toLowerCase(), ex.id);

    const workoutLookup = new Map<string, string>();
    for (const w of data.workouts) workoutLookup.set(w.title.toLowerCase(), w.id);

    // Build set of existing log keys for duplicate detection
    const existingLogKeys = new Set(
      data.logs.map(l => `${new Date(l.date).toISOString().split('T')[0]}|${l.workoutId}`)
    );

    const logGroups = new Map<string, { date: string; workoutId: string; exercises: Map<string, { weight: number; reps: number; rpe?: number; completed: boolean }[]> }>();
    let matched = 0;
    let skipped = 0;
    let invalidDates = 0;
    const skippedExercises = new Set<string>();

    for (const line of dataLines) {
      if (!line.trim()) continue;
      const cols = parseCSVLine(line);
      const [date, workout, exercise, , weight, reps, rpe, completed] = cols;

      // Date validation
      if (isNaN(Date.parse(date))) {
        invalidDates++;
        continue;
      }

      const exerciseId = exerciseLookup.get(exercise.toLowerCase());
      if (!exerciseId) {
        skipped++;
        skippedExercises.add(exercise);
        continue;
      }
      const workoutId = workoutLookup.get(workout.toLowerCase()) || 'imported';
      const key = `${date}|${workout}`;
      if (!logGroups.has(key)) logGroups.set(key, { date, workoutId, exercises: new Map() });
      const group = logGroups.get(key)!;
      if (!group.exercises.has(exerciseId)) group.exercises.set(exerciseId, []);
      group.exercises.get(exerciseId)!.push({
        weight: parseFloat(weight) || 0,
        reps: parseInt(reps) || 0,
        rpe: rpe ? parseFloat(rpe) : undefined,
        completed: completed?.toLowerCase() === 'true',
      });
      matched++;
    }

    // Build logs and detect duplicates
    const logs: WorkoutLog[] = [];
    let duplicates = 0;
    for (const [, group] of logGroups) {
      const dateKey = new Date(group.date).toISOString().split('T')[0];
      if (existingLogKeys.has(`${dateKey}|${group.workoutId}`)) {
        duplicates++;
        continue;
      }
      const exercises: ExerciseLog[] = [];
      for (const [exerciseId, sets] of group.exercises) exercises.push({ exerciseId, sets });
      logs.push({
        id: crypto.randomUUID(),
        workoutId: group.workoutId,
        date: new Date(group.date).toISOString(),
        durationMinutes: 0,
        exercises,
      });
    }
    return { logs, matched, skipped, skippedExercises: Array.from(skippedExercises), duplicates, invalidDates };
  };

  const confirmImport = async () => {
    if (!importModal) return;
    setIsImporting(true);
    try {
      for (const log of importModal.logs) await addLog(log);
      toast(`Imported ${importModal.logs.length} sessions`);
    } finally {
      setIsImporting(false);
      setImportModal(null);
    }
  };

  const confirmJsonImport = async () => {
    if (!jsonImportModal) return;
    setIsImporting(true);
    try {
      for (const ex of jsonImportModal.newExercises) await addExercise(ex);
      for (const wk of jsonImportModal.newWorkouts) await addWorkout(wk);
      for (const log of jsonImportModal.newLogs) await addLog(log);
      const parts: string[] = [];
      if (jsonImportModal.newExercises.length) parts.push(`${jsonImportModal.newExercises.length} exercises`);
      if (jsonImportModal.newWorkouts.length) parts.push(`${jsonImportModal.newWorkouts.length} workouts`);
      if (jsonImportModal.newLogs.length) parts.push(`${jsonImportModal.newLogs.length} logs`);
      toast(parts.length ? `Imported ${parts.join(', ')}` : 'Nothing new to import');
    } finally {
      setIsImporting(false);
      setJsonImportModal(null);
    }
  };

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
                {activeDrafts.has(todayWorkout.id) ? 'RESUME WORKOUT' : 'START WORKOUT'}
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
              className={`group flex items-center justify-between bg-card border p-6 rounded-2xl hover:border-accent/50 hover:shadow-md transition-all ${activeDrafts.has(workout.id) ? 'border-accent/30' : 'border-card-border'}`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">{workout.day}</span>
                  {activeDrafts.has(workout.id) && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">In Progress</span>
                  )}
                </div>
                <span className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-accent transition-colors">{workout.title}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${activeDrafts.has(workout.id) ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-card-border group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent'}`}>
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
          <button onClick={handleExport} className="bg-card border border-card-border p-6 rounded-2xl text-center hover:border-accent/50 transition-all">
             <div className="mb-3 flex justify-center text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
                </svg>
             </div>
             <span className="text-sm font-black uppercase tracking-tighter block">Export CSV</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-card border border-card-border p-6 rounded-2xl text-center hover:border-accent/50 transition-all">
             <div className="mb-3 flex justify-center text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13" />
                </svg>
             </div>
             <span className="text-sm font-black uppercase tracking-tighter block">Import</span>
          </button>
          <button onClick={handleExportJSON} className="col-span-2 bg-card border border-card-border p-6 rounded-2xl text-center hover:border-accent/50 transition-all">
             <div className="mb-3 flex justify-center text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
                </svg>
             </div>
             <span className="text-sm font-black uppercase tracking-tighter block">Backup All (JSON)</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.json" onChange={handleImportFile} className="hidden" />
        </div>
      </section>

      {/* CSV Import Confirmation Modal */}
      {importModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border-2 border-card-border p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L13 8m4-4v12" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none text-foreground">Import CSV</h2>
            <div className="text-text-secondary font-medium italic text-[14px] mb-6 px-4 text-left space-y-2">
              <p>{importModal.matched} sets across {importModal.logs.length} workout sessions found.</p>
              {importModal.duplicates > 0 && (
                <p className="text-text-muted">{importModal.duplicates} sessions already exist and will be skipped.</p>
              )}
              {importModal.invalidDates > 0 && (
                <p className="text-error">{importModal.invalidDates} rows skipped (invalid date).</p>
              )}
              {importModal.skipped > 0 && (
                <p className="text-error">{importModal.skipped} rows skipped — unrecognized exercises: {importModal.skippedExercises.join(', ')}</p>
              )}
              {importModal.logs.length === 0 && (
                <p className="text-error">No valid data to import.</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {importModal.logs.length > 0 && (
                <button
                  onClick={confirmImport}
                  disabled={isImporting}
                  className={`w-full py-4 rounded-xl font-black text-lg uppercase italic tracking-tighter bg-accent text-accent-foreground shadow-lg shadow-accent/20 transition-all ${isImporting ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {isImporting ? 'Importing...' : `Import ${importModal.logs.length} Sessions`}
                </button>
              )}
              <button
                onClick={() => setImportModal(null)}
                className="w-full py-4 rounded-xl font-black text-sm uppercase italic tracking-tighter text-text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Confirmation Modal */}
      {jsonImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border-2 border-card-border p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none text-foreground">Restore Backup</h2>
            <div className="text-text-secondary font-medium italic text-[14px] mb-6 px-4 text-left space-y-2">
              <p>Backup contains {jsonImportModal.data.exercises.length} exercises, {jsonImportModal.data.workouts.length} workouts, {jsonImportModal.data.logs.length} logs.</p>
              {(jsonImportModal.data.exercises.length - jsonImportModal.newExercises.length > 0 ||
                jsonImportModal.data.workouts.length - jsonImportModal.newWorkouts.length > 0 ||
                jsonImportModal.data.logs.length - jsonImportModal.newLogs.length > 0) && (
                <p className="text-text-muted">
                  Existing items will be skipped: {jsonImportModal.data.exercises.length - jsonImportModal.newExercises.length} exercises, {jsonImportModal.data.workouts.length - jsonImportModal.newWorkouts.length} workouts, {jsonImportModal.data.logs.length - jsonImportModal.newLogs.length} logs.
                </p>
              )}
              <p className="font-black text-foreground">{jsonImportModal.newExercises.length} new exercises, {jsonImportModal.newWorkouts.length} new workouts, {jsonImportModal.newLogs.length} new logs will be imported.</p>
              {jsonImportModal.newExercises.length === 0 && jsonImportModal.newWorkouts.length === 0 && jsonImportModal.newLogs.length === 0 && (
                <p className="text-error">Nothing new to import.</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {(jsonImportModal.newExercises.length > 0 || jsonImportModal.newWorkouts.length > 0 || jsonImportModal.newLogs.length > 0) && (
                <button
                  onClick={confirmJsonImport}
                  disabled={isImporting}
                  className={`w-full py-4 rounded-xl font-black text-lg uppercase italic tracking-tighter bg-accent text-accent-foreground shadow-lg shadow-accent/20 transition-all ${isImporting ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {isImporting ? 'Restoring...' : 'Restore Backup'}
                </button>
              )}
              <button
                onClick={() => setJsonImportModal(null)}
                className="w-full py-4 rounded-xl font-black text-sm uppercase italic tracking-tighter text-text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else current += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { result.push(current); current = ''; }
      else current += char;
    }
  }
  result.push(current);
  return result;
}
