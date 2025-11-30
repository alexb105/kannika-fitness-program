"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  selectedDate?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  availableDates?: Date[] // Dates that have data (only these can be selected)
  modifiers?: {
    hasWorkout?: Date[]
    hasRest?: Date[]
  }
}

export function DatePicker({ 
  selectedDate, 
  onSelect, 
  placeholder,
  className,
  availableDates = [],
  modifiers
}: DatePickerProps) {
  // Create a function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (availableDates.length === 0) return true // If no dates provided, allow all
    
    const dateStr = date.toISOString().split('T')[0]
    return availableDates.some(availableDate => {
      const availableStr = availableDate.toISOString().split('T')[0]
      return availableStr === dateStr
    })
  }

  // Disable dates that don't have data
  const disabled = (date: Date): boolean => {
    return !isDateAvailable(date)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP")
          ) : (
            <span>{placeholder || "Pick a date"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          initialFocus
          disabled={disabled}
          modifiers={modifiers}
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_disabled: "opacity-50 cursor-not-allowed",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

