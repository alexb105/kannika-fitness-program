"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { DayPlan } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Dumbbell, Moon, Plus, X, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { DURATION_PRESETS, STORAGE_KEYS } from "@/lib/constants"
import { useLanguage } from "@/lib/contexts/language-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { getExerciseSuggestions } from "@/lib/translations"

interface WorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  day: DayPlan | null
  onSave: (day: DayPlan) => void
  readOnly?: boolean
  trainerId?: string
}

const loadCustomExercises = (userId?: string): string[] => {
  if (!userId || typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES(userId))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveCustomExercise = (userId: string | undefined, exercise: string) => {
  if (!userId || typeof window === "undefined") return
  try {
    const customExercises = loadCustomExercises(userId)
    const exerciseLower = exercise.trim().toLowerCase()
    
    // Check if exercise already exists (case-insensitive)
    const exists = customExercises.some(
      (e) => e.toLowerCase() === exerciseLower
    )
    
    if (!exists) {
      const updated = [...customExercises, exercise.trim()]
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_EXERCISES(userId),
        JSON.stringify(updated)
      )
    }
  } catch (error) {
    console.error("Error saving custom exercise:", error)
  }
}

export function WorkoutModal({ isOpen, onClose, day, onSave, readOnly = false }: WorkoutModalProps) {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [type, setType] = useState<"workout" | "rest">("workout")
  const [exercises, setExercises] = useState<string[]>([])
  const [newExercise, setNewExercise] = useState("")
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState("")
  const [customExercises, setCustomExercises] = useState<string[]>([])
  
  // Get exercise suggestions based on current language
  const exerciseSuggestions = useMemo(() => getExerciseSuggestions(language), [language])

  useEffect(() => {
    if (day) {
      setType(day.type === "rest" ? "rest" : "workout")
      setExercises(day.exercises || [])
      setDuration(day.duration)
      setNotes(day.notes || "")
    }
  }, [day])

  useEffect(() => {
    // Load custom exercises for this user when modal opens
    if (isOpen && user?.id) {
      const custom = loadCustomExercises(user.id)
      setCustomExercises(custom)
    }
  }, [isOpen, user?.id])

  const handleAddExercise = useCallback(() => {
    const trimmedExercise = newExercise.trim()
    if (trimmedExercise && !exercises.includes(trimmedExercise)) {
      setExercises((prev) => [...prev, trimmedExercise])
      
      // Save to custom exercises for this user
      if (user?.id) {
        saveCustomExercise(user.id, trimmedExercise)
        // Update local state to include in suggestions
        const custom = loadCustomExercises(user.id)
        setCustomExercises(custom)
      }
      
      setNewExercise("")
    }
  }, [newExercise, exercises, user?.id])

  const handleRemoveExercise = useCallback((exercise: string) => {
    setExercises((prev) => prev.filter((e) => e !== exercise))
  }, [])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (!exercises.includes(suggestion)) {
      setExercises((prev) => [...prev, suggestion])
      
      // Save to custom exercises if it's a custom one (not in default suggestions)
      if (user?.id && !exerciseSuggestions.includes(suggestion)) {
        saveCustomExercise(user.id, suggestion)
        const custom = loadCustomExercises(user.id)
        setCustomExercises(custom)
      }
    }
  }, [exercises, user?.id, exerciseSuggestions])

  const handleSave = useCallback(() => {
    if (day) {
      // Don't allow empty days to be marked as completed
      const shouldBeCompleted = type !== "empty" && day.completed
      
      // Save all custom exercises (not in default suggestions) to user's custom list
      if (user?.id && type === "workout" && exercises.length > 0) {
        exercises.forEach((exercise) => {
          if (!exerciseSuggestions.includes(exercise)) {
            saveCustomExercise(user.id, exercise)
          }
        })
        // Refresh custom exercises list
        const custom = loadCustomExercises(user.id)
        setCustomExercises(custom)
      }
      
      onSave({
        ...day,
        type,
        exercises: type === "workout" ? exercises : undefined,
        duration: type === "workout" ? duration : undefined,
        notes: notes.trim() || undefined,
        completed: shouldBeCompleted,
      })
    }
  }, [day, type, exercises, duration, notes, user?.id, onSave, exerciseSuggestions])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !readOnly) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleEscape)
      return () => window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, readOnly])

  const dateStr = useMemo(() => {
    if (!day) return ""
    return day.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }, [day])

  if (!day) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{readOnly ? t("viewDay") : t("planYourDay")}</DialogTitle>
          <DialogDescription>{dateStr}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => !readOnly && setType("workout")}
              disabled={readOnly}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                type === "workout"
                  ? "border-primary text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50",
                readOnly && "cursor-default opacity-75",
              )}
            >
              <Dumbbell className="h-6 w-6" />
              <span className="text-sm font-medium">{t("workout")}</span>
            </button>
            <button
              onClick={() => !readOnly && setType("rest")}
              disabled={readOnly}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                type === "rest"
                  ? "border-primary text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50",
                readOnly && "cursor-default opacity-75",
              )}
            >
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">{t("rest")}</span>
            </button>
          </div>

          {type === "workout" && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("sessionDuration")}
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => !readOnly && setDuration(preset)}
                      disabled={readOnly}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        duration === preset
                          ? "border-primary text-primary"
                          : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
                        readOnly && "opacity-50 cursor-default",
                      )}
                    >
                      {preset} min
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    value={duration || ""}
                    onChange={(e) => setDuration(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                    placeholder={t("sessionDuration")}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    min={1}
                    disabled={readOnly}
                  />
                  <span className="text-sm text-muted-foreground">{t("minutes")}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="exercise" className="text-foreground">
                  {t("addExercise")}
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="exercise"
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !readOnly && handleAddExercise()}
                    placeholder="e.g., Push-ups"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={readOnly}
                  />
                  <Button onClick={handleAddExercise} size="icon" className="shrink-0" disabled={readOnly}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {exercises.length > 0 && (
                <div>
                  <Label className="text-foreground">{t("yourExercises")}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exercises.map((exercise) => (
                      <span
                        key={exercise}
                        className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {exercise}
                        {!readOnly && (
                          <button
                            onClick={() => handleRemoveExercise(exercise)}
                            className="rounded-full p-0.5 hover:border-primary/50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Exercises (Previously Used) */}
              {customExercises.length > 0 && (
                <div>
                  <Label className="text-foreground">{t("yourPreviousExercises")}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customExercises
                      .filter((s) => !exercises.includes(s))
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => !readOnly && handleSuggestionClick(suggestion)}
                          disabled={readOnly}
                          className="rounded-full border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Default Exercise Suggestions */}
              <div>
                <Label className="text-foreground">{t("quickAdd")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {exerciseSuggestions
                    .filter((s) => !exercises.includes(s) && !customExercises.includes(s))
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => !readOnly && handleSuggestionClick(suggestion)}
                        disabled={readOnly}
                        className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {type === "rest" && (
            <div className="rounded-xl bg-secondary/50 p-4 text-center">
              <Moon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t("rest")}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-foreground">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === "workout" ? "e.g., Focus on form, increase weight..." : "e.g., Active recovery, stretching..."
              }
              className="mt-2 min-h-[80px] resize-none bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              disabled={readOnly}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              {readOnly ? t("close") : t("cancel")}
            </Button>
            {!readOnly && (
              <Button onClick={handleSave} className="flex-1">
                {t("savePlan")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
