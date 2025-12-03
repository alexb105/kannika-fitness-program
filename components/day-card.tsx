"use client"

import { memo, useCallback, useMemo, useState, useEffect } from "react"
import type { DayPlan } from "@/app/page"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, Dumbbell, Moon, Clock, StickyNote, Check, X, Users } from "lucide-react"
import { isToday, formatDate } from "@/lib/date-utils"
import { useLanguage } from "@/lib/contexts/language-context"
import { translateExercises } from "@/lib/translations"
import { useFriendsWorkouts } from "@/lib/hooks/use-friends-workouts"
import { FriendsWorkoutModal } from "@/components/friends-workout-modal"

interface DayCardProps {
  day: DayPlan
  index: number
  onClick: () => void
  onToggleComplete: () => void
  onToggleMissed: () => void
  trainerColor?: "blue" | "purple"
}

export const DayCard = memo(function DayCard({ day, index, onClick, onToggleComplete, onToggleMissed, trainerColor = "blue" }: DayCardProps) {
  const { t, language } = useLanguage()
  const today = isToday(day.date)
  const isCompleted = day.completed === true
  const isMissed = day.missed === true
  const isPurple = trainerColor === "purple"
  const { fetchFriendsWorkoutsForDate, loading: loadingFriendsWorkouts } = useFriendsWorkouts()
  const [friendWorkouts, setFriendWorkouts] = useState<any[]>([])
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false)
  const [hasFriendsWorkouts, setHasFriendsWorkouts] = useState(false)
  
  // Translate exercises for display
  const translatedExercises = useMemo(() => {
    if (!day.exercises || day.exercises.length === 0) return []
    return translateExercises(day.exercises, language)
  }, [day.exercises, language])

  // Check if friends have workouts on this date
  useEffect(() => {
    let mounted = true
    
    const checkFriendsWorkouts = async () => {
      try {
        const workouts = await fetchFriendsWorkoutsForDate(day.date)
        console.log(`Day card ${formatDate(day.date)}: Found ${workouts.length} friend workouts`, workouts)
        if (mounted) {
          setFriendWorkouts(workouts)
          setHasFriendsWorkouts(workouts.length > 0)
        }
      } catch (error) {
        console.error("Error checking friends workouts:", error)
        if (mounted) {
          setHasFriendsWorkouts(false)
        }
      }
    }
    
    // Small delay to ensure friends are loaded
    const timeoutId = setTimeout(() => {
      checkFriendsWorkouts()
    }, 500)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [day.date, fetchFriendsWorkoutsForDate])

  const handleFriendsWorkoutClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    const workouts = await fetchFriendsWorkoutsForDate(day.date)
    setFriendWorkouts(workouts)
    setIsFriendsModalOpen(true)
  }, [day.date, fetchFriendsWorkoutsForDate])

  const handleToggleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleComplete()
  }, [onToggleComplete])

  const handleToggleMissed = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleMissed()
  }, [onToggleMissed])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    }
  }, [onClick])

  return (
    <Card
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${today ? t("today") : formatDate(day.date)} - ${day.type === "workout" ? t("workout") : day.type === "rest" ? t("restDay") : t("tapToPlan")}`}
      className={cn(
        "relative cursor-pointer overflow-hidden border-border/50 p-3 sm:p-4 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg",
        "sm:hover:scale-[1.02]",
        isPurple ? "hover:shadow-purple-500/10" : "hover:shadow-primary/10",
        "active:scale-[0.98] active:bg-accent/50",
        today && (isPurple ? "border-purple-500/50 ring-2 ring-purple-500/30" : "border-primary/50 ring-2 ring-primary/30"),
        day.type === "workout" && (isPurple ? "bg-purple-500/10 border-purple-500/30" : "bg-primary/10 border-primary/30"),
        day.type === "rest" && "bg-secondary/50 border-secondary",
        isCompleted && "opacity-60 bg-muted/30",
        isMissed && "opacity-50 bg-destructive/5 border-destructive/30",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl shrink-0",
              day.type === "workout" && (isPurple ? "bg-purple-600 text-white" : "bg-primary text-primary-foreground"),
              day.type === "rest" && "bg-muted text-muted-foreground",
              day.type === "empty" && "bg-secondary text-secondary-foreground",
              isCompleted && (isPurple ? "bg-purple-600 text-white" : "bg-green-500 text-white"),
              isMissed && "bg-destructive text-white",
            )}
          >
            {isCompleted ? (
              <Check className="h-5 w-5" />
            ) : isMissed ? (
              <X className="h-5 w-5" />
            ) : (
              <>
                {day.type === "workout" && <Dumbbell className="h-5 w-5" />}
                {day.type === "rest" && <Moon className="h-5 w-5" />}
                {day.type === "empty" && <Calendar className="h-5 w-5" />}
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(
              "font-semibold text-card-foreground text-sm sm:text-base truncate", 
              today && (isPurple ? "text-purple-600 dark:text-purple-400" : "text-primary"),
              isCompleted && "line-through text-muted-foreground",
              isMissed && "line-through text-destructive"
            )}>
              {today ? t("today") : formatDate(day.date)}
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              {day.type === "workout" && (
                <>
                  <span>{day.exercises?.length || 0} {t("exercises")}</span>
                  {day.duration && (
                    <>
                      <span className="text-border hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {day.duration} {t("min")}
                      </span>
                    </>
                  )}
                </>
              )}
              {day.type === "rest" && t("restDay")}
              {day.type === "empty" && t("tapToPlan")}
              {isCompleted && (
                <>
                  <span className="text-border">•</span>
                  <span className={cn("text-xs", isPurple ? "text-purple-600 dark:text-purple-400" : "text-green-600 dark:text-green-400")}>{t("completedLabel")}</span>
                </>
              )}
              {isMissed && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-destructive text-xs">{t("missedLabel")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Friends workout indicator */}
          {hasFriendsWorkouts && (
            <Button
              onClick={handleFriendsWorkoutClick}
              variant="outline"
              size="icon-sm"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full relative touch-target"
              title={t("viewFriendsTraining")}
            >
              <Users className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {friendWorkouts.length}
              </span>
            </Button>
          )}
          
          {day.type !== "empty" && (
            <>
            <Button
              onClick={handleToggleMissed}
              variant={isMissed ? "default" : "outline"}
              size="icon-sm"
              aria-label={isMissed ? t("sessionUnmarked") : t("sessionMarkedMissed")}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all touch-target",
                isMissed && "bg-destructive hover:bg-destructive/90 text-white border-destructive",
              )}
            >
              <X className={cn("h-4 w-4 sm:h-5 sm:w-5", !isMissed && "opacity-50")} />
            </Button>
            <Button
              onClick={handleToggleComplete}
              variant={isCompleted ? "default" : "outline"}
              size="icon-sm"
              aria-label={isCompleted ? t("workoutUnmarked") : t("workoutCompleted")}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all touch-target",
                isCompleted && (isPurple 
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  : "bg-green-500 hover:bg-green-600 text-white border-green-500"
                ),
              )}
            >
              <Check className={cn("h-4 w-4 sm:h-5 sm:w-5", !isCompleted && "opacity-50")} />
            </Button>
            </>
          )}
        </div>
      </div>

      {day.type === "workout" && translatedExercises && translatedExercises.length > 0 && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {translatedExercises.slice(0, 3).map((exercise, i) => (
            <span 
              key={i} 
              className={cn(
                "rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium",
                isPurple ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-primary/20 text-primary"
              )}
            >
              {exercise}
            </span>
          ))}
          {translatedExercises.length > 3 && (
            <span className="rounded-full bg-secondary px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-muted-foreground">
              +{translatedExercises.length - 3}
            </span>
          )}
        </div>
      )}

      {day.notes && (
        <div className="mt-2 sm:mt-3 flex items-start gap-2 rounded-lg bg-secondary/50 p-2">
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <p className="line-clamp-2 text-[11px] sm:text-xs text-muted-foreground">{day.notes}</p>
        </div>
      )}

      <FriendsWorkoutModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        date={day.date}
        friendWorkouts={friendWorkouts}
        loading={loadingFriendsWorkouts}
      />
    </Card>
  )
})
