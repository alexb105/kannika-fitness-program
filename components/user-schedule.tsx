"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import type { DayPlan } from "@/app/page"
import { DayCardStack } from "@/components/day-card-stack"
import { WorkoutModal } from "@/components/workout-modal"
import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import { useUserDays } from "@/lib/hooks/use-user-days"
import { useToast } from "@/hooks/use-toast"
import { TrainerScheduleSkeleton } from "@/components/loading-skeleton"
import { useLanguage } from "@/lib/contexts/language-context"
import { useRouter } from "next/navigation"

export function UserSchedule() {
  const { days, loading, saveDay, addDay, toggleComplete, toggleMissed, loadPreviousWeek, jumpToDate, loadMoreDays, selectedDate, allDatesWithData, hasMoreWeeks, hasMoreDays, canAddDay, totalCompletedWorkouts } = useUserDays()
  const { toast } = useToast()
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDayClick = useCallback((day: DayPlan) => {
    setSelectedDay(day)
    setIsModalOpen(true)
  }, [])

  const handleSavePlan = useCallback(async (updatedDay: DayPlan) => {
    try {
      await saveDay(updatedDay)
      setIsModalOpen(false)
      
      toast({
        title: t("daySaved"),
        description: `${updatedDay.type === "workout" ? t("workout") : t("rest")} ${t("daySaved").toLowerCase()}`,
      })
    } catch (error) {
      console.error("Error saving day:", error)
      toast({
        title: t("error"),
        description: t("failedToSave"),
        variant: "destructive",
      })
    }
  }, [saveDay, toast, t])

  const handleAddDay = useCallback(async () => {
    try {
      await addDay()
      toast({
        title: t("dayAdded"),
        description: t("dayAdded"),
      })
    } catch (error) {
      console.error("Error adding day:", error)
      toast({
        title: t("error"),
        description: t("failedToAdd"),
        variant: "destructive",
      })
    }
  }, [addDay, toast, t])

  const handleJumpToDate = useCallback((date: Date) => {
    jumpToDate(date)
    // Scroll to top to show the selected date
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }, [jumpToDate])

  const handleToggleComplete = useCallback(async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      
      // Don't allow toggling completion for empty days
      if (!day || day.type === "empty") {
        return
      }
      
      const wasCompleted = day.completed
      
      // Optimistic update
      await toggleComplete(dayId)
      
      toast({
        title: wasCompleted ? t("workoutUnmarked") : t("workoutCompleted"),
        description: wasCompleted 
          ? t("workoutUnmarked")
          : t("workoutCompleted"),
      })
    } catch (error) {
      console.error("Error toggling completion:", error)
      toast({
        title: t("error"),
        description: t("failedToUpdate"),
        variant: "destructive",
      })
    }
  }, [days, toggleComplete, toast, t])

  const handleToggleMissed = useCallback(async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      
      // Don't allow toggling missed status for empty days
      if (!day || day.type === "empty") {
        return
      }
      
      const wasMissed = day.missed
      
      // Optimistic update
      await toggleMissed(dayId)
      
      toast({
        title: wasMissed ? t("sessionUnmarked") : t("sessionMarkedMissed"),
        description: wasMissed 
          ? t("sessionUnmarked")
          : t("sessionMarkedMissed"),
      })
    } catch (error) {
      console.error("Error toggling missed status:", error)
      toast({
        title: t("error"),
        description: t("failedToUpdateMissed"),
        variant: "destructive",
      })
    }
  }, [days, toggleMissed, toast, t])

  // Use totalCompletedWorkouts from hook which counts all loaded days, not just displayed
  const completedWorkouts = totalCompletedWorkouts

  if (loading) {
    return <TrainerScheduleSkeleton />
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">{t("mySchedule")}</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-3">
          {completedWorkouts} {completedWorkouts !== 1 ? t("workoutsPlural") : t("workouts")} {t("completed")}
        </p>
        
        {/* Date Picker */}
        <div className="mb-3 flex gap-2 items-center justify-center">
          <DatePicker
            selectedDate={selectedDate || undefined}
            onSelect={(date) => {
              if (date) {
                handleJumpToDate(date)
              }
            }}
            placeholder={t("selectDate")}
            className="flex-1 max-w-xs"
            availableDates={allDatesWithData}
            modifiers={{
              hasWorkout: days.filter(d => d.type === 'workout').map(d => d.date),
              hasRest: days.filter(d => d.type === 'rest').map(d => d.date),
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              handleJumpToDate(today)
            }}
            title={t("jumpToToday")}
          >
            {t("today")}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {hasMoreWeeks && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadPreviousWeek}
            className="w-full"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            {t("loadPreviousWeek")}
          </Button>
        )}
      </div>

      <DayCardStack 
        days={days} 
        onDayClick={handleDayClick} 
        onAddDay={handleAddDay}
        onToggleComplete={handleToggleComplete}
        onToggleMissed={handleToggleMissed}
        trainerColor="blue"
        canAddDay={canAddDay}
      />

      {hasMoreDays && (
        <Button
          variant="outline"
          size="sm"
          onClick={loadMoreDays}
          className="mt-4 w-full"
        >
          {t("loadMoreDays")}
        </Button>
      )}

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={selectedDay}
        onSave={handleSavePlan}
      />
    </div>
  )
}

