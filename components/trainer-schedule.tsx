"use client"

import { useState, useMemo, useCallback } from "react"
import type { DayPlan } from "@/app/page"
import { DayCardStack } from "@/components/day-card-stack"
import { WorkoutModal } from "@/components/workout-modal"
import { ArchiveModal } from "@/components/archive-modal"
import { Button } from "@/components/ui/button"
import { Archive } from "lucide-react"
import { useTrainerDays } from "@/lib/hooks/use-trainer-days"
import { useToast } from "@/hooks/use-toast"
import { TrainerScheduleSkeleton } from "@/components/loading-skeleton"

interface TrainerScheduleProps {
  trainerName: string
  trainerId: string
  onWorkoutCompleted?: () => void
}

export function TrainerSchedule({ trainerName, trainerId, onWorkoutCompleted }: TrainerScheduleProps) {
  const { days, loading, saveDay, addDay, toggleComplete, toggleMissed } = useTrainerDays({
    trainerId,
    trainerName,
  })
  const { toast } = useToast()
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const handleDayClick = useCallback((day: DayPlan) => {
    setSelectedDay(day)
    setIsModalOpen(true)
  }, [])

  const handleSavePlan = useCallback(async (updatedDay: DayPlan) => {
    try {
      const wasWorkout = updatedDay.type === "workout"
      const previousDay = days.find((d) => d.id === updatedDay.id)
      const wasCompleted = previousDay?.completed
      const isNowCompleted = updatedDay.completed
      
      // Optimistic update
      await saveDay(updatedDay)
      setIsModalOpen(false)
      
      toast({
        title: "Day saved",
        description: `Your ${updatedDay.type === "workout" ? "workout" : "rest day"} has been saved.`,
      })
      
      // If this is a workout and completion status changed, update stats
      if (wasWorkout && wasCompleted !== isNowCompleted && onWorkoutCompleted) {
        setTimeout(() => {
          onWorkoutCompleted()
        }, 100)
      }
    } catch (error) {
      console.error("Error saving day:", error)
      toast({
        title: "Error",
        description: "Failed to save day. Please try again.",
        variant: "destructive",
      })
    }
  }, [days, saveDay, toast, onWorkoutCompleted])

  const handleAddDay = useCallback(async () => {
    try {
      await addDay()
      toast({
        title: "Day added",
        description: "A new day has been added to your schedule.",
      })
    } catch (error) {
      console.error("Error adding day:", error)
      toast({
        title: "Error",
        description: "Failed to add day. Please try again.",
        variant: "destructive",
      })
    }
  }, [addDay, toast])

  const handleToggleComplete = useCallback(async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      
      // Don't allow toggling completion for empty days
      if (!day || day.type === "empty") {
        return
      }
      
      const wasWorkout = day.type === "workout"
      const wasCompleted = day.completed
      
      // Optimistic update
      await toggleComplete(dayId)
      
      toast({
        title: wasCompleted ? "Workout unmarked" : "Workout completed!",
        description: wasCompleted 
          ? "The workout has been unmarked as complete."
          : "Great job! Keep up the momentum! 💪",
      })
      
      // If this was a workout day, update the competition stats
      if (wasWorkout && onWorkoutCompleted) {
        setTimeout(() => {
          onWorkoutCompleted()
        }, 100)
      }
    } catch (error) {
      console.error("Error toggling completion:", error)
      toast({
        title: "Error",
        description: "Failed to update completion status. Please try again.",
        variant: "destructive",
      })
    }
  }, [days, toggleComplete, toast, onWorkoutCompleted])

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
        title: wasMissed ? "Session unmarked" : "Session marked as missed",
        description: wasMissed 
          ? "The session has been unmarked as missed."
          : "The session has been marked as missed.",
      })
    } catch (error) {
      console.error("Error toggling missed status:", error)
      toast({
        title: "Error",
        description: "Failed to update missed status. Please try again.",
        variant: "destructive",
      })
    }
  }, [days, toggleMissed, toast])

  const completedWorkouts = useMemo(() => 
    days.filter((d) => d.completed && d.type === "workout").length,
    [days]
  )

  const trainerColor = useMemo(() => 
    trainerName.toLowerCase() === "kannika" ? "purple" : "blue",
    [trainerName]
  )

  if (loading) {
    return <TrainerScheduleSkeleton />
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-foreground">{trainerName}</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsArchiveOpen(true)}
            className="h-8 w-8"
            title="View Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {completedWorkouts} workout{completedWorkouts !== 1 ? "s" : ""} completed
        </p>
      </div>

      <DayCardStack 
        days={days} 
        onDayClick={handleDayClick} 
        onAddDay={handleAddDay}
        onToggleComplete={handleToggleComplete}
        onToggleMissed={handleToggleMissed}
        trainerColor={trainerColor}
      />

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={selectedDay}
        onSave={handleSavePlan}
        trainerId={trainerId}
      />

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        trainerName={trainerName}
        trainerId={trainerId}
      />
    </div>
  )
}

