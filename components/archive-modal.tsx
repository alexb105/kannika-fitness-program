"use client"

import { useEffect, useState } from "react"
import type { DayPlan } from "@/app/page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkoutModal } from "@/components/workout-modal"
import { useArchivedDays } from "@/lib/hooks/use-archived-days"
import { Archive, Calendar, Dumbbell, Moon, Clock, StickyNote, Check, Eye, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArchiveModalProps {
  isOpen: boolean
  onClose: () => void
  trainerName: string
  trainerId: string
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ArchiveModal({ isOpen, onClose, trainerName, trainerId }: ArchiveModalProps) {
  const { archivedDays, loading, fetchArchivedDays, deleteArchivedDay } = useArchivedDays({ trainerName })
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [dayToDelete, setDayToDelete] = useState<DayPlan | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchArchivedDays()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleViewDay = (day: DayPlan) => {
    setSelectedDay(day)
    setIsViewModalOpen(true)
  }

  const handleDeleteClick = (day: DayPlan, e: React.MouseEvent) => {
    e.stopPropagation()
    setDayToDelete(day)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (dayToDelete) {
      try {
        await deleteArchivedDay(dayToDelete.id)
        setIsDeleteDialogOpen(false)
        setDayToDelete(null)
      } catch (error) {
        console.error("Error deleting archived day:", error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-foreground">{trainerName}'s Archive</DialogTitle>
          </div>
          <DialogDescription>
            View all archived workout days. Archived days are automatically created when you add more than 7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading archived days...</p>
            </div>
          ) : archivedDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No archived days yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Days are automatically archived when you add more than 7 days
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                {archivedDays.length} archived day{archivedDays.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {archivedDays.map((day) => {
                  const isCompleted = day.completed === true
                  return (
                    <Card
                      key={day.id}
                      onClick={() => handleViewDay(day)}
                      className={cn(
                        "relative cursor-pointer overflow-hidden border-border/50 p-4 opacity-75 transition-all",
                        "hover:opacity-100 hover:scale-[1.01] hover:shadow-md",
                        day.type === "workout" && "bg-primary/5 border-primary/20",
                        day.type === "rest" && "bg-secondary/30 border-secondary",
                        isCompleted && "bg-muted/20",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl",
                              day.type === "workout" && "bg-primary/20 text-primary",
                              day.type === "rest" && "bg-muted text-muted-foreground",
                              day.type === "empty" && "bg-secondary text-secondary-foreground",
                              isCompleted && "bg-green-500/20 text-green-600 dark:text-green-400",
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
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
                              isCompleted && "line-through text-muted-foreground"
                            )}>
                              {formatDate(day.date)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {day.type === "workout" && (
                                <>
                                  <span>{day.exercises?.length || 0} exercises</span>
                                  {day.duration && (
                                    <>
                                      <span className="text-border">•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {day.duration} min
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                              {day.type === "rest" && "Rest Day"}
                              {day.type === "empty" && "Empty"}
                              {isCompleted && (
                                <>
                                  <span className="text-border">•</span>
                                  <span className="text-green-600 dark:text-green-400">Completed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDay(day)
                            }}
                            className="h-8 w-8"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleDeleteClick(day, e)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {day.type === "workout" && day.exercises && day.exercises.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {day.exercises.slice(0, 3).map((exercise, i) => (
                            <span key={i} className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                              {exercise}
                            </span>
                          ))}
                          {day.exercises.length > 3 && (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              +{day.exercises.length - 3} more
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
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* View Modal - Read Only */}
      <WorkoutModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedDay(null)
        }}
        day={selectedDay}
        onSave={() => {}} // Read-only, no save functionality
        readOnly={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Archived Day?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this archived day? This action cannot be undone.
              {dayToDelete && (
                <span className="block mt-2 font-medium">
                  {formatDate(dayToDelete.date)} - {dayToDelete.type === "workout" ? "Workout" : dayToDelete.type === "rest" ? "Rest Day" : "Empty"}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

