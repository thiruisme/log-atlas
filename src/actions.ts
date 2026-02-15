'use server';

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { auth, signIn, signOut } from '@/auth';
import { routine } from '@/data/routine';
import { revalidatePath, unstable_noStore } from 'next/cache';
import { headers } from 'next/headers';
import { AppData, Exercise, Workout, WorkoutLog, WorkoutExercise, ExerciseLog } from '@/types/db';
import { z } from 'zod';

// --- Rate Limiting ---

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

// --- Validation Schemas ---

const MuscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Cardio', 'Other'] as const;
const EquipmentTypes = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'] as const;

const exerciseSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  targetMuscle: z.enum(MuscleGroups),
  equipment: z.enum(EquipmentTypes).optional(),
  defaultSets: z.number().int().min(1).max(100),
  defaultReps: z.string().max(50),
  defaultRest: z.string().max(50),
  notes: z.string().max(2000).optional(),
  photoUrl: z.string().url().max(500).optional().or(z.literal('')),
  instructions: z.array(z.string().max(500)).max(20).optional(),
});

const setSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(1000),
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean(),
});

const exerciseLogSchema = z.object({
  exerciseId: z.string().min(1).max(50),
  sets: z.array(setSchema).min(1).max(100),
});

const workoutLogSchema = z.object({
  id: z.string().min(1).max(50),
  workoutId: z.string().min(1).max(50),
  date: z.string().min(1).max(50),
  durationMinutes: z.number().min(0).max(1440),
  exercises: z.array(exerciseLogSchema).max(50),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1).max(50),
  sets: z.number().int().min(1).max(100),
  reps: z.string().max(50),
  rest: z.string().max(50),
  order: z.number().int().min(0).max(100),
});

const workoutSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  day: z.string().min(1).max(20),
  focus: z.string().max(200),
  exercises: z.array(workoutExerciseSchema).max(50),
  lastPerformed: z.string().optional(),
});

// --- Auth Actions ---

export async function registerUser(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 1000)) {
    return { error: 'Too many attempts. Please wait a minute.' };
  }

  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password) {
    return { error: 'Missing fields' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Invalid email format' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await hash(password, 12);

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
    }, {
        maxWait: 5000,
        timeout: 30000
    });

    // Login immediately after register?
    // We can't easily sign them in inside a server action called from a form without redirecting.
    // We will let the client handle the redirect to login or auto-login via next-auth's signIn
  } catch (e: any) {
      if (e.code === 'P2002') {
          return { error: 'User already exists' };
      }
      return { error: 'Failed to create account' };
  }
  
  return { success: true };
}

export async function loginAction(formData: FormData) {
    const ip = await getClientIp();
    if (!checkRateLimit(`login:${ip}`, 10, 60 * 1000)) {
        return { error: 'Too many login attempts. Please wait a minute.' };
    }

    try {
        await signIn("credentials", formData);
    } catch (error) {
        const err = error as Error;
        // Auth.js v5 uses specific error codes or message patterns
        if (err.message.includes("CredentialsSignin") || err.name === "CredentialsSignin") {
            return { error: "Invalid email or password. Please try again." };
        }
        // NextAuth throws a redirect error on success, we must rethrow it
        if (err.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        return { error: "An unexpected error occurred. Please check your connection." };
    }
}

export async function logoutAction() {
    return await signOut();
}

// --- Data Actions ---

export async function getBootstrapData(): Promise<AppData | null> {
    unstable_noStore();
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
            take: 50,
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
    const parsed = workoutLogSchema.safeParse(log);
    if (!parsed.success) throw new Error("Invalid input");
    log = parsed.data as WorkoutLog;

    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    // Verify the workout belongs to this user
    const workout = await prisma.workout.findUnique({ where: { id: log.workoutId } });
    if (!workout || workout.userId !== userId) throw new Error("Unauthorized");

    // Verify all exercises belong to this user
    const exerciseIds = log.exercises.map(e => e.exerciseId);
    if (exerciseIds.length > 0) {
        const exercises = await prisma.exercise.findMany({
            where: { id: { in: exerciseIds }, userId },
            select: { id: true },
        });
        if (exercises.length !== exerciseIds.length) throw new Error("Unauthorized");
    }

    await prisma.$transaction([
        prisma.workoutLog.create({
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
        }),
        prisma.workout.update({
            where: { id: log.workoutId },
            data: { lastPerformed: new Date(log.date) }
        })
    ]);

    revalidatePath('/');
}

// --- CRUD Actions ---

export async function saveExerciseAction(exercise: Exercise) {
    const parsed = exerciseSchema.safeParse(exercise);
    if (!parsed.success) throw new Error("Invalid input");
    exercise = parsed.data as Exercise;

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
                photoUrl: exercise.photoUrl
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
                photoUrl: exercise.photoUrl
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
    const parsed = workoutSchema.safeParse(workout);
    if (!parsed.success) throw new Error("Invalid input");
    workout = parsed.data as Workout;

    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const exerciseData = workout.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest
    }));

    const existing = await prisma.workout.findUnique({ where: { id: workout.id } });

    if (existing) {
        if(existing.userId !== session.user.id) throw new Error("Unauthorized access");

        await prisma.$transaction([
            prisma.workout.update({
                where: { id: workout.id },
                data: {
                    title: workout.title,
                    day: workout.day,
                    focus: workout.focus,
                }
            }),
            prisma.workoutExercise.deleteMany({ where: { workoutId: workout.id } }),
            ...exerciseData.map(ex =>
                prisma.workoutExercise.create({
                    data: { workoutId: workout.id, ...ex }
                })
            )
        ]);
    } else {
        await prisma.workout.create({
            data: {
                id: workout.id,
                userId: session.user.id,
                title: workout.title,
                day: workout.day,
                focus: workout.focus,
                exercises: {
                    create: exerciseData
                }
            }
        });
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

