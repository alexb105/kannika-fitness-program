// Exercise suggestions
export const EXERCISE_SUGGESTIONS = [
  "Push-ups",
  "Squats",
  "Plank",
  "Lunges",
  "Burpees",
  "Deadlifts",
  "Bench Press",
  "Pull-ups",
  "Running",
  "Cycling",
] as const

// Duration presets (in minutes)
export const DURATION_PRESETS = [15, 30, 45, 60, 90] as const

// Trainer IDs
export const TRAINER_IDS = {
  ALEXANDER: "trainer1",
  KANNIKA: "trainer2",
} as const

// Trainer names
export const TRAINER_NAMES = {
  ALEXANDER: "Alexander",
  KANNIKA: "Kannika",
} as const

// LocalStorage keys
export const STORAGE_KEYS = {
  AUTH: "app_authenticated",
  AUTH_TIMESTAMP: "app_auth_timestamp",
  CUSTOM_EXERCISES: (trainerId: string) => `trainer_exercises_${trainerId}`,
  LANGUAGE: "app_language",
} as const

// Auth expiry (days)
export const AUTH_EXPIRY_DAYS = 365

// Maximum active days before archiving
export const MAX_ACTIVE_DAYS = 7

