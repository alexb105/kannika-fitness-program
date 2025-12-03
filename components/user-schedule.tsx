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
      {/* Header - Compact on mobile */}
      <div className="mb-3 sm:mb-4 text-center">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">{t("mySchedule")}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          {completedWorkouts} {completedWorkouts !== 1 ? t("workoutsPlural") : t("workouts")} {t("completed")}
        </p>
        
        {/* Date Picker - Full width on mobile */}
        <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:justify-center">
          <DatePicker
            selectedDate={selectedDate || undefined}
            onSelect={(date) => {
              if (date) {
                handleJumpToDate(date)
              }
            }}
            placeholder={t("selectDate")}
            className="w-full sm:flex-1 sm:max-w-xs"
            availableDates={allDatesWithData}
            modifiers={{
              hasWorkout: days.filter(d => d.type === 'workout').map(d => d.date),
              hasRest: days.filter(d => d.type === 'rest').map(d => d.date),
            }}
          />
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              const today = new Date()
              handleJumpToDate(today)
            }}
            title={t("jumpToToday")}
            className="w-full sm:w-auto touch-target"
          >
            {t("today")}
          </Button>
        </div>
      </div>

      {/* Load Previous Week Button */}
      {hasMoreWeeks && (
        <div className="mb-3 sm:mb-4">
          <Button
            variant="outline"
            size="default"
            onClick={loadPreviousWeek}
            className="w-full touch-target"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            {t("loadPreviousWeek")}
          </Button>
        </div>
      )}

      {/* Day Cards */}
      <DayCardStack 
        days={days} 
        onDayClick={handleDayClick} 
        onAddDay={handleAddDay}
        onToggleComplete={handleToggleComplete}
        onToggleMissed={handleToggleMissed}
        trainerColor="blue"
        canAddDay={canAddDay}
      />

      {/* Load More Days Button */}
      {hasMoreDays && (
        <Button
          variant="outline"
          size="default"
          onClick={loadMoreDays}
          className="mt-3 sm:mt-4 w-full touch-target"
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

