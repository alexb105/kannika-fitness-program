"use client"

import { memo, useCallback, useMemo } from "react"
import type { DayPlan } from "@/app/page"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, Dumbbell, Moon, Clock, StickyNote, Check, X } from "lucide-react"
import { isToday, formatDate } from "@/lib/date-utils"
import { useLanguage } from "@/lib/contexts/language-context"
import { translateExercises } from "@/lib/translations"

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
  
  // Translate exercises for display
  const translatedExercises = useMemo(() => {
    if (!day.exercises || day.exercises.length === 0) return []
    return translateExercises(day.exercises, language)
  }, [day.exercises, language])

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
        "relative cursor-pointer overflow-hidden border-border/50 p-4 transition-all duration-200",
        "hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg",
        isPurple ? "hover:shadow-purple-500/10" : "hover:shadow-primary/10",
        "active:scale-[0.98]",
        today && (isPurple ? "border-purple-500/50 ring-1 ring-purple-500/30" : "border-primary/50 ring-1 ring-primary/30"),
        day.type === "workout" && (isPurple ? "bg-purple-500/10 border-purple-500/30" : "bg-primary/10 border-primary/30"),
        day.type === "rest" && "bg-secondary/50 border-secondary",
        isCompleted && "opacity-60 bg-muted/30",
        isMissed && "opacity-50 bg-destructive/5 border-destructive/30",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
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
          <div>
            <p className={cn(
              "font-semibold text-card-foreground", 
              today && (isPurple ? "text-purple-600 dark:text-purple-400" : "text-primary"),
              isCompleted && "line-through text-muted-foreground",
              isMissed && "line-through text-destructive"
            )}>
              {today ? t("today") : formatDate(day.date)}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {day.type === "workout" && (
                <>
                  <span>{day.exercises?.length || 0} {t("exercises")}</span>
                  {day.duration && (
                    <>
                      <span className="text-border">•</span>
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
                  <span className={isPurple ? "text-purple-600 dark:text-purple-400" : "text-green-600 dark:text-green-400"}>{t("completedLabel")}</span>
                </>
              )}
              {isMissed && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-destructive">{t("missedLabel")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {day.type !== "empty" && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleMissed}
              variant={isMissed ? "default" : "outline"}
              size="icon-sm"
              aria-label={isMissed ? t("sessionUnmarked") : t("sessionMarkedMissed")}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                isMissed && "bg-destructive hover:bg-destructive/90 text-white border-destructive",
              )}
            >
              <X className={cn("h-4 w-4", !isMissed && "opacity-50")} />
            </Button>
            <Button
              onClick={handleToggleComplete}
              variant={isCompleted ? "default" : "outline"}
              size="icon-sm"
              aria-label={isCompleted ? t("workoutUnmarked") : t("workoutCompleted")}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                isCompleted && (isPurple 
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  : "bg-green-500 hover:bg-green-600 text-white border-green-500"
                ),
              )}
            >
              <Check className={cn("h-4 w-4", !isCompleted && "opacity-50")} />
            </Button>
          </div>
        )}
      </div>

      {day.type === "workout" && translatedExercises && translatedExercises.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {translatedExercises.slice(0, 3).map((exercise, i) => (
            <span 
              key={i} 
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isPurple ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-primary/20 text-primary"
              )}
            >
              {exercise}
            </span>
          ))}
          {translatedExercises.length > 3 && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              +{translatedExercises.length - 3} more
            </span>
          )}
        </div>
      )}

      {day.notes && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/50 p-2">
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <p className="line-clamp-2 text-xs text-muted-foreground">{day.notes}</p>
        </div>
      )}
    </Card>
  )
})
