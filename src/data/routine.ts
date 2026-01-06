export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes?: string[];
  videoUrl?: string;
  variants?: string[];
  instructions?: string[];
  commonMistakes?: string[];
}

export interface Workout {
  id: string;
  day: string;
  title: string;
  focus: string;
  exercises: Exercise[];
}

export const routine: Workout[] = [
  {
    id: 'push-a',
    day: 'Monday',
    title: 'Push A',
    focus: 'Shoulders + Upper Chest + Triceps',
    exercises: [
      {
        id: 'ohp',
        name: 'Overhead Press (barbell or seated dumbbell)',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
        instructions: ['Maintain a tight core', 'Press the weight straight up', 'Full range of motion'],
      },
      {
        id: 'incline-press',
        name: 'Incline Barbell or Dumbbell Press',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
      },
      {
        id: 'lateral-raises',
        name: 'Lateral Raises (dumbbell or cable)',
        sets: '3',
        reps: '10–15',
        rest: '60-90 seconds',
      },
      {
        id: 'cable-flyes',
        name: 'High-to-Low Cable Flyes or Incline Dumbbell Flyes',
        sets: '3',
        reps: '12–15',
        rest: '60-90 seconds',
      },
      {
        id: 'close-grip-bench',
        name: 'Close-Grip Bench Press or Overhead Tricep Extension',
        sets: '3',
        reps: '10–12',
        rest: '60-90 seconds',
      },
      {
        id: 'shrugs',
        name: 'Shrugs (dumbbell or barbell)',
        sets: '3',
        reps: '10–15',
        rest: '60-90 seconds',
      },
    ],
  },
  {
    id: 'pull',
    day: 'Tuesday',
    title: 'Pull',
    focus: 'Back + Rear Delts + Posture + Tummy',
    exercises: [
      {
        id: 'pull-ups',
        name: 'Pull-Ups or Wide-Grip Lat Pulldown',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
      },
      {
        id: 'rows',
        name: 'Chest-Supported Row or Seal Row',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
      },
      {
        id: 'face-pulls',
        name: 'Face Pulls (cable or band)',
        sets: '4',
        reps: '12–20',
        rest: '60-90 seconds',
      },
      {
        id: 'rear-delt-flyes',
        name: 'Rear Delt Flyes (dumbbell or reverse pec deck)',
        sets: '3',
        reps: '12–15',
        rest: '60-90 seconds',
      },
      {
        id: 'bicep-curl',
        name: 'Barbell or EZ-Bar Biceps Curl',
        sets: '3',
        reps: '10–12',
        rest: '60-90 seconds',
      },
      {
        id: 'hammer-curls',
        name: 'Hammer Curls',
        sets: '3',
        reps: '12–15',
        rest: '60-90 seconds',
      },
      {
        id: 'vacuums',
        name: 'Stomach Vacuums',
        sets: '3–4',
        reps: '20–30 sec holds',
        rest: '60-90 seconds',
        notes: ['Exhale fully and pull the belly button toward the spine to tighten the deep core.'],
      },
    ],
  },
  {
    id: 'push-b',
    day: 'Thursday',
    title: 'Push B',
    focus: 'Shoulders/Chest Variation + Triceps + Neck + Tummy',
    exercises: [
      {
        id: 'db-shoulder-press',
        name: 'Dumbbell Shoulder Press (seated or standing)',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
      },
      {
        id: 'flat-db-press',
        name: 'Flat or Slight Incline Dumbbell Press',
        sets: '4',
        reps: '8–12',
        rest: '2-3 minutes',
      },
      {
        id: 'upright-rows',
        name: 'Upright Rows or Extra Lateral Raises',
        sets: '3',
        reps: '10–15',
        rest: '60-90 seconds',
      },
      {
        id: 'overhead-tricep',
        name: 'Overhead Tricep Extension (cable or dumbbell)',
        sets: '3',
        reps: '10–12',
        rest: '60-90 seconds',
      },
      {
        id: 'dips',
        name: 'Dips (chest-forward lean) or Close-Grip Push-Ups',
        sets: '3',
        reps: 'max reps',
        rest: '60-90 seconds',
      },
      {
        id: 'neck-work',
        name: 'Neck Flexion / Extension (plate, harness, or manual)',
        sets: '3',
        reps: '15–20',
        rest: '60-90 seconds',
      },
      {
        id: 'ab-wheel',
        name: 'Ab Wheel Rollouts or Kneeling Cable Crunches',
        sets: '3',
        reps: '12–15',
        rest: '60-90 seconds',
        notes: ['Anti-extension work for a tighter-looking midsection.'],
      },
    ],
  },
  {
    id: 'legs',
    day: 'Friday',
    title: 'Legs + Light Pull/Posture + Hips',
    focus: 'Legs, Posture, and Hips',
    exercises: [
      {
        id: 'rdl',
        name: 'Romanian Deadlift or Trap-Bar Deadlift',
        sets: '3–4',
        reps: '8–10',
        rest: '2-3 minutes',
        notes: ['Improves posture and fills out pants seat.'],
      },
      {
        id: 'hip-thrusts',
        name: 'Hip Thrusts or Glute Bridges (barbell or elevated bodyweight)',
        sets: '3–4',
        reps: '10–15',
        rest: '2-3 minutes',
        notes: ['Improves posture and fills out pants seat.'],
      },
      {
        id: 'squats',
        name: 'Squats (back squat or goblet) or Leg Press',
        sets: '3',
        reps: '10–12',
        rest: '2-3 minutes',
        notes: ['Drive through heels for glute tie-in.'],
      },
      {
        id: 'leg-curls',
        name: 'Leg Curls or Glute-Ham Raises',
        sets: '3',
        reps: '10–15',
        rest: '60-90 seconds',
      },
      {
        id: 'face-pulls-2',
        name: 'Face Pulls or Banded Pull-Aparts',
        sets: '3',
        reps: '15–20',
        rest: '60-90 seconds',
      },
      {
        id: 'farmers-carries',
        name: 'Farmer’s Carries',
        sets: '3–4',
        reps: '30–40 m (heavy)',
        rest: '60-90 seconds',
        notes: ['Forced upright posture, traps, and core stability.'],
      },
    ],
  },
];
