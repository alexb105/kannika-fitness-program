"use client"

import type { DayPlan } from "@/app/page"
import { DayCard } from "./day-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface DayCardStackProps {
  days: DayPlan[]
  onDayClick: (day: DayPlan) => void
  onAddDay: () => void
  onToggleComplete: (dayId: string) => void
  onToggleMissed: (dayId: string) => void
  trainerColor?: "blue" | "purple"
}

export function DayCardStack({ days, onDayClick, onAddDay, onToggleComplete, onToggleMissed, trainerColor }: DayCardStackProps) {
  return (
    <div className="mx-auto w-full">
      <div className="relative flex flex-col gap-3">
        {days.map((day, index) => (
          <DayCard 
            key={day.id} 
            day={day} 
            index={index} 
            onClick={() => onDayClick(day)}
            onToggleComplete={() => onToggleComplete(day.id)}
            onToggleMissed={() => onToggleMissed(day.id)}
            trainerColor={trainerColor}
          />
        ))}
        <Button
          onClick={onAddDay}
          variant="outline"
          className="mt-2 w-full border-dashed hover:border-primary/50 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Add Day
        </Button>
      </div>
    </div>
  )
}
