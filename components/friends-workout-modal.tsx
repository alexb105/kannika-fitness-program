"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Check, X, Clock, Users, Dumbbell } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { formatDate } from "@/lib/date-utils"
import { translateExercises } from "@/lib/translations"
import type { FriendWorkout } from "@/lib/hooks/use-friends-workouts"
import { cn } from "@/lib/utils"

interface FriendsWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  friendWorkouts: FriendWorkout[]
  loading?: boolean
}

export function FriendsWorkoutModal({
  isOpen,
  onClose,
  date,
  friendWorkouts,
  loading = false,
}: FriendsWorkoutModalProps) {
  const { t, language } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("friendsTraining")} - {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            {t("loading")}...
          </div>
        ) : friendWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("noFriendsTraining")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friendWorkouts.map((workout) => {
              const translatedExercises = workout.exercises
                ? translateExercises(workout.exercises, language)
                : []

              return (
                <Card
                  key={workout.friend_id}
                  className={cn(
                    "p-3",
                    workout.completed && "opacity-60 bg-muted/30",
                    workout.missed && "opacity-50 bg-destructive/5 border-destructive/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Dumbbell className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {workout.username || t("unknownUser")}
                        </p>
                        {workout.completed && (
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                        )}
                        {workout.missed && (
                          <X className="h-3 w-3 text-destructive shrink-0" />
                        )}
                      </div>
                    </div>
                    {workout.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {workout.duration} {t("min")}
                      </div>
                    )}
                  </div>

                  {translatedExercises.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {translatedExercises.map((exercise, i) => (
                        <span
                          key={i}
                          className="rounded-full px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary"
                        >
                          {exercise}
                        </span>
                      ))}
                    </div>
                  )}

                  {workout.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                      {workout.notes}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

