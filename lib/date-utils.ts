// Optimized date utilities to avoid unnecessary Date object creation

let todayCache: Date | null = null
let todayCacheDate: number | null = null

export function getToday(): Date {
  const now = Date.now()
  const todayDate = new Date(now).setHours(0, 0, 0, 0)
  
  if (todayCacheDate !== todayDate) {
    todayCache = new Date(todayDate)
    todayCacheDate = todayDate
  }
  
  return todayCache!
}

export function isToday(date: Date): boolean {
  const today = getToday()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

