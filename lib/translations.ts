export type Language = "en" | "th"

export const translations = {
  en: {
    // Header
    fitnessChallenge: "Fitness Challenge",
    logout: "Logout",
    
    // Progress bars
    alexander: "Alexander",
    kannika: "Kannika",
    workouts: "workout",
    workoutsPlural: "workouts",
    itsATie: "It's a tie! Both trainers are working hard 💪",
    
    // Trainer schedule
    completed: "completed",
    addDay: "Add Day",
    viewArchive: "View Archive",
    
    // Day card
    today: "Today",
    tapToPlan: "Tap to plan",
    restDay: "Rest Day",
    completedLabel: "Completed",
    missedLabel: "Missed",
    exercises: "exercises",
    min: "min",
    
    // Workout modal
    planYourDay: "Plan Your Day",
    viewDay: "View Day",
    workout: "Workout",
    rest: "Rest Day",
    sessionDuration: "Session Duration",
    minutes: "minutes",
    addExercise: "Add Exercise",
    yourExercises: "Your Exercises",
    yourPreviousExercises: "Your Previous Exercises",
    quickAdd: "Quick Add",
    notes: "Notes",
    savePlan: "Save Plan",
    cancel: "Cancel",
    close: "Close",
    
    // Toast messages
    daySaved: "Day saved",
    dayAdded: "Day added",
    workoutCompleted: "Workout completed!",
    workoutUnmarked: "Workout unmarked",
    sessionMarkedMissed: "Session marked as missed",
    sessionUnmarked: "Session unmarked",
    error: "Error",
    failedToSave: "Failed to save day. Please try again.",
    failedToAdd: "Failed to add day. Please try again.",
    failedToUpdate: "Failed to update completion status. Please try again.",
    failedToUpdateMissed: "Failed to update missed status. Please try again.",
    
    // Archive modal
    archive: "Archive",
    noArchivedDays: "No archived days",
    delete: "Delete",
    view: "View",
    
    // Password gate
    passwordRequired: "Password Required",
    enterPassword: "Please enter the password to access this application",
    rememberMe: "Remember me (auto-sign in for 1 year)",
    accessApplication: "Access Application",
    incorrectPassword: "Incorrect password. Please try again.",
    
    // Weight tracking
    weightTracking: "Weight Tracking",
    logWeight: "Log Weight",
    back: "Back",
    weight: "Weight",
    kg: "kg",
    lastLogged: "Last logged",
    noWeightEntries: "No weight entries yet",
    logFirstWeight: "Log your first weight to start tracking",
    weightProgress: "Weight Progress",
    recentEntries: "Recent Entries",
    logWeightDescription: "Log your weight to track your progress over time",
    date: "Date",
    optionalNotes: "Optional notes",
    save: "Save",
    deleteWeightEntry: "Delete Weight Entry",
    deleteWeightEntryDescription: "Are you sure you want to delete this weight entry? This action cannot be undone.",
    
    // Exercise suggestions
    pushUps: "Push-ups",
    squats: "Squats",
    plank: "Plank",
    lunges: "Lunges",
    burpees: "Burpees",
    deadlifts: "Deadlifts",
    benchPress: "Bench Press",
    pullUps: "Pull-ups",
    running: "Running",
    cycling: "Cycling",
  },
  th: {
    // Header
    fitnessChallenge: "ท้าทายฟิตเนส",
    logout: "ออกจากระบบ",
    
    // Progress bars
    alexander: "อเล็กซานเดอร์",
    kannika: "กันนิกา",
    workouts: "การออกกำลังกาย",
    workoutsPlural: "การออกกำลังกาย",
    itsATie: "เสมอกัน! ทั้งสองคนทำงานหนักมาก 💪",
    
    // Trainer schedule
    completed: "เสร็จแล้ว",
    addDay: "เพิ่มวัน",
    viewArchive: "ดูที่เก็บถาวร",
    
    // Day card
    today: "วันนี้",
    tapToPlan: "แตะเพื่อวางแผน",
    restDay: "วันพักผ่อน",
    completedLabel: "เสร็จแล้ว",
    missedLabel: "พลาด",
    exercises: "การออกกำลังกาย",
    min: "นาที",
    
    // Workout modal
    planYourDay: "วางแผนวันของคุณ",
    viewDay: "ดูวัน",
    workout: "ออกกำลังกาย",
    rest: "วันพักผ่อน",
    sessionDuration: "ระยะเวลาการออกกำลังกาย",
    minutes: "นาที",
    addExercise: "เพิ่มการออกกำลังกาย",
    yourExercises: "การออกกำลังกายของคุณ",
    yourPreviousExercises: "การออกกำลังกายก่อนหน้าของคุณ",
    quickAdd: "เพิ่มด่วน",
    notes: "หมายเหตุ",
    savePlan: "บันทึกแผน",
    cancel: "ยกเลิก",
    close: "ปิด",
    
    // Toast messages
    daySaved: "บันทึกวันแล้ว",
    dayAdded: "เพิ่มวันแล้ว",
    workoutCompleted: "ออกกำลังกายเสร็จแล้ว!",
    workoutUnmarked: "ยกเลิกการทำเครื่องหมายการออกกำลังกาย",
    sessionMarkedMissed: "ทำเครื่องหมายว่าพลาด",
    sessionUnmarked: "ยกเลิกการทำเครื่องหมาย",
    error: "ข้อผิดพลาด",
    failedToSave: "บันทึกวันไม่สำเร็จ กรุณาลองอีกครั้ง",
    failedToAdd: "เพิ่มวันไม่สำเร็จ กรุณาลองอีกครั้ง",
    failedToUpdate: "อัปเดตสถานะไม่สำเร็จ กรุณาลองอีกครั้ง",
    failedToUpdateMissed: "อัปเดตสถานะพลาดไม่สำเร็จ กรุณาลองอีกครั้ง",
    
    // Archive modal
    archive: "ที่เก็บถาวร",
    noArchivedDays: "ไม่มีวันที่เก็บถาวร",
    delete: "ลบ",
    view: "ดู",
    
    // Password gate
    passwordRequired: "ต้องใช้รหัสผ่าน",
    enterPassword: "กรุณาใส่รหัสผ่านเพื่อเข้าถึงแอปพลิเคชัน",
    rememberMe: "จำฉันไว้ (เข้าสู่ระบบอัตโนมัติ 1 ปี)",
    accessApplication: "เข้าถึงแอปพลิเคชัน",
    incorrectPassword: "รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง",
    
    // Weight tracking
    weightTracking: "ติดตามน้ำหนัก",
    logWeight: "บันทึกน้ำหนัก",
    back: "กลับ",
    weight: "น้ำหนัก",
    kg: "กก.",
    lastLogged: "บันทึกล่าสุด",
    noWeightEntries: "ยังไม่มีบันทึกน้ำหนัก",
    logFirstWeight: "บันทึกน้ำหนักครั้งแรกเพื่อเริ่มติดตาม",
    weightProgress: "ความคืบหน้าน้ำหนัก",
    recentEntries: "รายการล่าสุด",
    logWeightDescription: "บันทึกน้ำหนักเพื่อติดตามความคืบหน้า",
    date: "วันที่",
    optionalNotes: "หมายเหตุ (ไม่บังคับ)",
    save: "บันทึก",
    deleteWeightEntry: "ลบบันทึกน้ำหนัก",
    deleteWeightEntryDescription: "คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกน้ำหนักนี้? การกระทำนี้ไม่สามารถยกเลิกได้",
    
    // Exercise suggestions
    pushUps: "วิดพื้น",
    squats: "สควอท",
    plank: "แพลงก์",
    lunges: "ลันจ์",
    burpees: "เบอร์พี",
    deadlifts: "เดดลิฟต์",
    benchPress: "เบนช์เพรส",
    pullUps: "ดึงข้อ",
    running: "วิ่ง",
    cycling: "ปั่นจักรยาน",
  },
} as const

export function getTranslation(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || translations.en[key]
}

// Exercise suggestions mapped by language
export const EXERCISE_SUGGESTIONS_BY_LANG: Record<Language, string[]> = {
  en: [
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
  ],
  th: [
    "วิดพื้น",
    "สควอท",
    "แพลงก์",
    "ลันจ์",
    "เบอร์พี",
    "เดดลิฟต์",
    "เบนช์เพรส",
    "ดึงข้อ",
    "วิ่ง",
    "ปั่นจักรยาน",
  ],
}

export function getExerciseSuggestions(lang: Language): string[] {
  return EXERCISE_SUGGESTIONS_BY_LANG[lang] || EXERCISE_SUGGESTIONS_BY_LANG.en
}

// Exercise translation mapping (English <-> Thai)
const EXERCISE_TRANSLATION_MAP: Record<string, { en: string; th: string }> = {
  "Push-ups": { en: "Push-ups", th: "วิดพื้น" },
  "Squats": { en: "Squats", th: "สควอท" },
  "Plank": { en: "Plank", th: "แพลงก์" },
  "Lunges": { en: "Lunges", th: "ลันจ์" },
  "Burpees": { en: "Burpees", th: "เบอร์พี" },
  "Deadlifts": { en: "Deadlifts", th: "เดดลิฟต์" },
  "Bench Press": { en: "Bench Press", th: "เบนช์เพรส" },
  "Pull-ups": { en: "Pull-ups", th: "ดึงข้อ" },
  "Running": { en: "Running", th: "วิ่ง" },
  "Cycling": { en: "Cycling", th: "ปั่นจักรยาน" },
  // Reverse mappings
  "วิดพื้น": { en: "Push-ups", th: "วิดพื้น" },
  "สควอท": { en: "Squats", th: "สควอท" },
  "แพลงก์": { en: "Plank", th: "แพลงก์" },
  "ลันจ์": { en: "Lunges", th: "ลันจ์" },
  "เบอร์พี": { en: "Burpees", th: "เบอร์พี" },
  "เดดลิฟต์": { en: "Deadlifts", th: "เดดลิฟต์" },
  "เบนช์เพรส": { en: "Bench Press", th: "เบนช์เพรส" },
  "ดึงข้อ": { en: "Pull-ups", th: "ดึงข้อ" },
  "วิ่ง": { en: "Running", th: "วิ่ง" },
  "ปั่นจักรยาน": { en: "Cycling", th: "ปั่นจักรยาน" },
}

/**
 * Translates an exercise name to the target language
 * If the exercise is not in the translation map, returns the original name
 */
export function translateExercise(exercise: string, targetLang: Language): string {
  const translation = EXERCISE_TRANSLATION_MAP[exercise]
  if (translation) {
    return translation[targetLang]
  }
  // If not found, return original (for custom exercises)
  return exercise
}

/**
 * Translates an array of exercise names to the target language
 */
export function translateExercises(exercises: string[], targetLang: Language): string[] {
  return exercises.map((exercise) => translateExercise(exercise, targetLang))
}

