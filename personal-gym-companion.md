# Personal Gym Companion Website – Minimal Interactive Specification

---

## Core Intent

This website is **NOT** a full fitness tracker.

It is a:
- Personal gym companion
- Interactive workout reference
- Lightweight checklist-based system

### Explicit Non-Goals
- No long-term data storage
- No analytics dashboards
- No progress graphs
- No body measurement tracking
- No photo uploads
- No authentication
- No backend database (for now)

The site should feel like:

> “A smart, always-open gym notebook with buttons.”

---

## Primary Use Case

- Open site on phone inside the gym
- See today’s workout
- Tick off completed exercises or sets
- Quickly check exercise form
- Close site

No history. No analysis. No overthinking.

---

## Site Structure

### 1. Home / Dashboard (Default Page)

**Purpose:** Immediate orientation

#### Elements
- Today’s workout name (e.g., “Pull A”)
- Large **Start Workout** button
- Weekly split overview:
  - Push
  - Pull
  - Legs
  - Accessories / Posture
- Highlight current day
- Optional static motivational line

No stats. No history. No inputs.

---

### 2. Workout Page (Main Usage Page)

**Purpose:** Execute today’s workout with minimal friction

#### Workout Layout
- Predefined workout template
- Exercises listed in fixed order

#### Exercise Card
Each exercise displays:
- Exercise name
- Sets × reps (static text)
- Rest time (static)
- Checkbox to mark exercise complete
- Expand button → opens exercise reference

#### Set-Level Completion (Optional)
- Small check circles per set (✓ ✓ ✓)
- No weight or rep inputs

Checkbox state:
- Can reset on refresh **OR**
- Persist via localStorage for the current session

---

### 3. Exercise Reference (Core Feature)

This is the **most important part of the site**.

#### Exercise Detail View (Modal or Page)

For each exercise:
- Exercise name
- Variants (text only)
- Step-by-step instructions
- Key cues (personal notes)
- Common mistakes

#### Visuals
- Embedded YouTube video
- 2–3 GIFs or images (optional)

This content is **read-only** inside the UI.

---

### 4. Weekly Split Page (Optional)

- List of all workouts:
  - Push A
  - Pull A
  - Legs
  - Accessories / Posture
- Tap a workout to open its template

---

## Interaction Model

- Checkboxes for completion
- Highlight active workout
- Expand / collapse exercise cards
- Optional simple rest timer (start / stop)

### State Handling
- Use **localStorage only**
- Purpose:
  - Remember checked exercises and sets during a session
- Data can be safely cleared anytime

---

## Data Model Approach

- All workouts and exercises are predefined
- Stored as:
  - Static JSON files, or
  - Hardcoded TypeScript objects

Example structure:
- `workouts.ts`
- `exercises.ts`

No backend. No APIs.

---

## Tech Stack (Lightweight)

- Framework: **Next.js**
- Styling: Tailwind CSS
- State: React state + localStorage
- Deployment: Vercel or Netlify

No authentication. No database.

---

## Design Philosophy

- Mobile-first
- One-hand usage
- Large tap targets
- Minimal UI
- Zero cognitive load
- Gym-lighting friendly (dark mode preferred)

---

## Future-Proofing (Do Not Build Now)

- Progress tracking
- Analytics
- Accounts
- Cloud sync
- Measurements
- Photos

Code should be clean and modular so these can be added later.

---

## One-Sentence Product Definition

> Build a mobile-first personal gym companion website that displays predefined workouts and exercise references, allows the user to tick off completed exercises and sets using checkboxes, and works entirely without a backend or long-term data tracking.
