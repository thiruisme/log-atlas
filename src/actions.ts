'use server';

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { auth, signIn, signOut } from '@/auth';
import { routine } from '@/data/routine';
import { revalidatePath } from 'next/cache';
import { AppData, Exercise, Workout, WorkoutLog, WorkoutExercise, ExerciseLog } from '@/types/db';

// --- Auth Actions ---

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password) {
    return { error: 'Missing fields' };
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await hash(password, 10);

  // Transaction: Create User -> Seed Exercises -> Seed Workouts
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      // --- Seed Data Logic (Adapted from StorageContext) ---
      
      const exerciseMap = new Map<string, string>(); // LegacyID -> NewDB_ID

      // 1. Seed Exercises
      for (const legacyWorkout of routine) {
        for (const legacyEx of legacyWorkout.exercises) {
            if (!exerciseMap.has(legacyEx.id)) {
                const nameLower = legacyEx.name.toLowerCase();
                const notesLower = legacyEx.notes?.join(' ').toLowerCase() || '';
                let equipment = 'Other';
                
                if (nameLower.includes('dumbbell') || notesLower.includes('dumbbell') || nameLower.includes(' db ')) {
                    equipment = 'Dumbbell';
                } else if (nameLower.includes('cable') || notesLower.includes('cable')) {
                    equipment = 'Cable';
                } else if (nameLower.includes('machine')) {
                    equipment = 'Machine';
                } else if (nameLower.includes('bodyweight') || nameLower.includes('pull-up') || nameLower.includes('dip') || nameLower.includes('chin-up')) {
                    equipment = 'Bodyweight';
                } else if (nameLower.includes('barbell') || nameLower.includes('bench press') || nameLower.includes('squat') || nameLower.includes('deadlift') || nameLower.includes('overhead press')) {
                    equipment = 'Barbell';
                }

                const createdEx = await tx.exercise.create({
                    data: {
                        userId: user.id,
                        name: legacyEx.name,
                        targetMuscle: 'Other', // Placeholder logic
                        equipment,
                        defaultSets: parseInt(legacyEx.sets) || 3,
                        defaultReps: legacyEx.reps,
                        defaultRest: legacyEx.rest,
                        notes: legacyEx.notes?.join('. '),
                    }
                });
                exerciseMap.set(legacyEx.id, createdEx.id);
            }
        }
      }

      // 2. Seed Workouts
      for (const legacyWorkout of routine) {
          const workout = await tx.workout.create({
              data: {
                  userId: user.id,
                  title: legacyWorkout.title,
                  day: legacyWorkout.day,
                  focus: legacyWorkout.focus,
              }
          });

          // Create WorkoutExercises
          for (let i = 0; i < legacyWorkout.exercises.length; i++) {
              const legacyEx = legacyWorkout.exercises[i];
              const dbExId = exerciseMap.get(legacyEx.id);
              if (dbExId) {
                  await tx.workoutExercise.create({
                      data: {
                          workoutId: workout.id,
                          exerciseId: dbExId,
                          order: i,
                          sets: parseInt(legacyEx.sets) || 3,
                          reps: legacyEx.reps,
                          rest: legacyEx.rest
                      }
                  });
              }
          }
      }
    });

    // Login immediately after register?
    // We can't easily sign them in inside a server action called from a form without redirecting.
    // We will let the client handle the redirect to login or auto-login via next-auth's signIn
  } catch (e) {
      console.error(e);
      return { error: 'Failed to create account' };
  }
  
  return { success: true };
}

export async function loginAction(formData: FormData) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if ((error as Error).message.includes("CredentialsSignin")) {
            return { error: "Invalid credentials." };
        }
        throw error;
    }
}

export async function logoutAction() {
    await signOut();
}

// --- Data Actions ---

export async function getBootstrapData(): Promise<AppData | null> {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }
    const userId = session.user.id;

    const [exercises, workouts, logs] = await Promise.all([
        prisma.exercise.findMany({ where: { userId } }),
        prisma.workout.findMany({ 
            where: { userId },
            include: { exercises: true }
        }),
        prisma.workoutLog.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                exercises: {
                    include: { sets: true }
                }
            }
        })
    ]);

    return {
        exercises: exercises as unknown as Exercise[],
        workouts: workouts as unknown as Workout[], // Type casting due to Prisma vs App type diffs
        logs: logs as unknown as WorkoutLog[]
    };
}

export async function addLogAction(log: WorkoutLog) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    // Transform App Type to Prisma Create Input
    // We need to create the WorkoutLog, ExerciseLogs, and SetLogs
    
    await prisma.workoutLog.create({
        data: {
            userId: session.user.id,
            workoutId: log.workoutId,
            date: new Date(log.date),
            durationMinutes: log.durationMinutes,
            exercises: {
                create: log.exercises.map(exLog => ({
                    exerciseId: exLog.exerciseId,
                    sets: {
                        create: exLog.sets.map(s => ({
                            weight: s.weight,
                            reps: s.reps,
                            completed: s.completed,
                            rpe: s.rpe
                        }))
                    }
                }))
            }
        }
    });
    
    // Update "Last Performed" on workout
    await prisma.workout.update({
        where: { id: log.workoutId },
        data: { lastPerformed: new Date(log.date) }
    });

    revalidatePath('/');
}

// --- CRUD Actions ---

export async function saveExerciseAction(exercise: Exercise) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    // Check if ID exists (update vs create)
    // Note: The UI generates UUIDs for new items, so we check if it exists in DB.
    // However, Prisma Create vs Update is distinct. 
    // We can use upsert or just check. 
    // For simplicity with client-generated IDs, we'll try to find it first or use upsert.
    
    // We need to handle the "user" connection for new items.
    
    const existing = await prisma.exercise.findUnique({ 
        where: { id: exercise.id } 
    });

    if (existing) {
        if(existing.userId !== session.user.id) throw new Error("Unauthorized access");
        await prisma.exercise.update({
            where: { id: exercise.id },
            data: {
                name: exercise.name,
                targetMuscle: exercise.targetMuscle || 'Other',
                equipment: exercise.equipment || 'Other',
                defaultSets: exercise.defaultSets,
                defaultReps: exercise.defaultReps,
                defaultRest: exercise.defaultRest,
                notes: exercise.notes,
                videoUrl: exercise.videoUrl
            }
        });
    } else {
        await prisma.exercise.create({
            data: {
                id: exercise.id,
                userId: session.user.id,
                name: exercise.name,
                targetMuscle: exercise.targetMuscle || 'Other',
                equipment: exercise.equipment || 'Other',
                defaultSets: exercise.defaultSets,
                defaultReps: exercise.defaultReps,
                defaultRest: exercise.defaultRest,
                notes: exercise.notes,
                videoUrl: exercise.videoUrl
            }
        });
    }
    revalidatePath('/');
}

export async function deleteExerciseAction(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    // Ensure ownership
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if(existing && existing.userId === session.user.id) {
        await prisma.exercise.delete({ where: { id } });
    }
    revalidatePath('/');
}

export async function saveWorkoutAction(workout: Workout) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.workout.findUnique({ where: { id: workout.id } });

    if (existing) {
        if(existing.userId !== session.user.id) throw new Error("Unauthorized access");
        
        // Update basic info
        await prisma.workout.update({
            where: { id: workout.id },
            data: {
                title: workout.title,
                day: workout.day,
                focus: workout.focus,
            }
        });
        
        // Re-create exercises (simplest way to handle reordering/changes)
        await prisma.workoutExercise.deleteMany({ where: { workoutId: workout.id } });
        
        for (const ex of workout.exercises) {
            await prisma.workoutExercise.create({
                data: {
                    workoutId: workout.id,
                    exerciseId: ex.exerciseId,
                    order: ex.order,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest: ex.rest
                }
            });
        }
        
    } else {
        const created = await prisma.workout.create({
            data: {
                id: workout.id,
                userId: session.user.id,
                title: workout.title,
                day: workout.day,
                focus: workout.focus,
            }
        });
        
        for (const ex of workout.exercises) {
            await prisma.workoutExercise.create({
                data: {
                    workoutId: created.id,
                    exerciseId: ex.exerciseId,
                    order: ex.order,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest: ex.rest
                }
            });
        }
    }
    revalidatePath('/');
}

export async function deleteWorkoutAction(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    const existing = await prisma.workout.findUnique({ where: { id } });
    if(existing && existing.userId === session.user.id) {
        await prisma.workout.delete({ where: { id } });
    }
    revalidatePath('/');
}

