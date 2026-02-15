export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes?: string[];
  photoUrl?: string;
  variants?: string[];
  instructions?: string[];
  commonMistakes?: string[];
}

export interface Workout {
  id: string;
  day: string;
  title: string;
  focus: string;
  notes?: string[];
  exercises: Exercise[];
}

export const routine: Workout[] = [
  {
    id: 'push-a',
    day: 'Monday',
    title: 'PUSH A',
    focus: 'Shoulders, Chest & Triceps',
    notes: ['Focus on heavy compounds', 'Keep rest under 180s'],
    exercises: [
      {
        id: 'ohp',
        name: 'Overhead Press',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Barbell or seated dumbbell', 'Tight core, no leg drive'],
      },
      {
        id: 'incline-press',
        name: 'Incline Press',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Dumbbell or barbell', '45-degree angle'],
      },
      {
        id: 'lateral-raises',
        name: 'Lateral Raises',
        sets: '3',
        reps: '10–15',
        rest: '90',
        notes: ['Dumbbell or cable', 'Lead with elbows'],
      },
      {
        id: 'cable-flyes',
        name: 'Cable Flyes',
        sets: '3',
        reps: '12–15',
        rest: '90',
        notes: ['High-to-low', 'Squeeze at center'],
      },
      {
        id: 'tricep-ext',
        name: 'Tricep Extension',
        sets: '3',
        reps: '10–12',
        rest: '90',
        notes: ['Close-grip bench or overhead'],
      },
      {
        id: 'shrugs',
        name: 'Shrugs',
        sets: '3',
        reps: '10–15',
        rest: '90',
        notes: ['Dumbbell or barbell', 'No rolling shoulders'],
      },
    ],
  },
  {
    id: 'pull-a',
    day: 'Tuesday',
    title: 'PULL A',
    focus: 'Back, Rear Delts & Biceps',
    notes: ['Drive with elbows on rows', 'Full extension on curls'],
    exercises: [
      {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Pull-ups or wide-grip pulldown'],
      },
      {
        id: 'rows',
        name: 'Supported Row',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Chest-supported or seal row'],
      },
      {
        id: 'face-pulls',
        name: 'Face Pulls',
        sets: '4',
        reps: '12–20',
        rest: '90',
        notes: ['Cable or band', 'Pull to forehead'],
      },
      {
        id: 'rear-delt-flyes',
        name: 'Rear Delt Flyes',
        sets: '3',
        reps: '12–15',
        rest: '90',
        notes: ['Dumbbell or reverse pec deck'],
      },
      {
        id: 'bicep-curls',
        name: 'Bicep Curls',
        sets: '3',
        reps: '10–12',
        rest: '90',
        notes: ['Barbell or EZ-bar', 'No swinging'],
      },
      {
        id: 'hammer-curls',
        name: 'Hammer Curls',
        sets: '3',
        reps: '12–15',
        rest: '90',
        notes: ['Neutral grip'],
      },
      {
        id: 'vacuums',
        name: 'Stomach Vacuums',
        sets: '3–4',
        reps: '20–30s',
        rest: '90',
        notes: ['Empty lungs, pull navel to spine'],
      },
    ],
  },
  {
    id: 'push-b',
    day: 'Thursday',
    title: 'PUSH B',
    focus: 'Shoulders, Triceps & Core',
    exercises: [
      {
        id: 'shoulder-press',
        name: 'Shoulder Press',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Dumbbell seated or standing'],
      },
      {
        id: 'db-press',
        name: 'Dumbbell Press',
        sets: '4',
        reps: '8–12',
        rest: '180',
        notes: ['Flat or slight incline'],
      },
      {
        id: 'upright-rows',
        name: 'Upright Rows',
        sets: '3',
        reps: '10–15',
        rest: '90',
        notes: ['Wide grip to avoid impingement'],
      },
      {
        id: 'overhead-ext',
        name: 'Overhead Tricep',
        sets: '3',
        reps: '10–12',
        rest: '90',
        notes: ['Cable or dumbbell'],
      },
      {
        id: 'dips',
        name: 'Dips',
        sets: '3',
        reps: 'MAX',
        rest: '90',
        notes: ['Leaning forward for chest'],
      },
      {
        id: 'neck-work',
        name: 'Neck Work',
        sets: '3',
        reps: '15–20',
        rest: '90',
        notes: ['Flexion and extension'],
      },
      {
        id: 'core-rollouts',
        name: 'Core Rollouts',
        sets: '3',
        reps: '12–15',
        rest: '90',
        notes: ['Ab wheel or kneeling cable crunch'],
      },
    ],
  },
  {
    id: 'legs-a',
    day: 'Friday',
    title: 'LEGS A',
    focus: 'Hips, Quads & Posture',
    exercises: [
      {
        id: 'deadlifts',
        name: 'Deadlifts',
        sets: '3–4',
        reps: '8–10',
        rest: '180',
        notes: ['Romanian or trap-bar'],
      },
      {
        id: 'hip-thrusts',
        name: 'Hip Thrusts',
        sets: '3–4',
        reps: '10–15',
        rest: '180',
        notes: ['Focus on glute squeeze'],
      },
      {
        id: 'squats',
        name: 'Squats',
        sets: '3',
        reps: '10–12',
        rest: '180',
        notes: ['High bar, goblet, or leg press'],
      },
      {
        id: 'leg-curls',
        name: 'Leg Curls',
        sets: '3',
        reps: '10–15',
        rest: '90',
      },
      {
        id: 'posture-work',
        name: 'Posture Work',
        sets: '3',
        reps: '15–20',
        rest: '90',
        notes: ['Face pulls or banded pull-aparts'],
      },
      {
        id: 'farmers-carries',
        name: 'Farmer’s Carries',
        sets: '3–4',
        reps: '30–40m',
        rest: '90',
        notes: ['Heavy walks, upright chest'],
      },
    ],
  },
];