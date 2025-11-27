"use client"

import { useState } from "react"
import type { DayPlan } from "@/app/page"
import { DayCardStack } from "@/components/day-card-stack"
import { WorkoutModal } from "@/components/workout-modal"
import { ArchiveModal } from "@/components/archive-modal"
import { Button } from "@/components/ui/button"
import { Archive } from "lucide-react"
import { useTrainerDays } from "@/lib/hooks/use-trainer-days"

interface TrainerScheduleProps {
  trainerName: string
  trainerId: string
  onWorkoutCompleted?: () => void
}

export function TrainerSchedule({ trainerName, trainerId, onWorkoutCompleted }: TrainerScheduleProps) {
  const { days, loading, saveDay, addDay, toggleComplete } = useTrainerDays({
    trainerId,
    trainerName,
  })
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const handleDayClick = (day: DayPlan) => {
    setSelectedDay(day)
    setIsModalOpen(true)
  }

  const handleSavePlan = async (updatedDay: DayPlan) => {
    try {
      const wasWorkout = updatedDay.type === "workout"
      const previousDay = days.find((d) => d.id === updatedDay.id)
      const wasCompleted = previousDay?.completed
      const isNowCompleted = updatedDay.completed
      
      await saveDay(updatedDay)
      setIsModalOpen(false)
      
      // If this is a workout and completion status changed, update stats
      if (wasWorkout && wasCompleted !== isNowCompleted && onWorkoutCompleted) {
        setTimeout(() => {
          onWorkoutCompleted()
        }, 100)
      }
    } catch (error) {
      console.error("Error saving day:", error)
    }
  }

  const handleAddDay = async () => {
    try {
      await addDay()
    } catch (error) {
      console.error("Error adding day:", error)
    }
  }

  const handleToggleComplete = async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      
      // Don't allow toggling completion for empty days
      if (!day || day.type === "empty") {
        return
      }
      
      const wasWorkout = day.type === "workout"
      
      await toggleComplete(dayId)
      
      // If this was a workout day, update the competition stats
      if (wasWorkout && onWorkoutCompleted) {
        // Small delay to ensure database update is complete
        setTimeout(() => {
          onWorkoutCompleted()
        }, 100)
      }
    } catch (error) {
      console.error("Error toggling completion:", error)
    }
  }

  const completedWorkouts = days.filter(
    (d) => d.completed && d.type === "workout"
  ).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading schedule...</p>
      </div>
    )
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
        trainerColor={trainerName.toLowerCase() === "kannika" ? "purple" : "blue"}
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

