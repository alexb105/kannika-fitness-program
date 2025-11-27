"use client"

import { useMemo } from "react"
import { TrainerSchedule } from "@/components/trainer-schedule"
import { Dumbbell, Trophy, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useCompetitionStats } from "@/lib/hooks/use-competition-stats"
import { cn } from "@/lib/utils"

export interface DayPlan {
  id: string
  date: Date
  type: "workout" | "rest" | "empty"
  exercises?: string[]
  duration?: number
  notes?: string
  completed?: boolean
}

export default function FitnessSchedule() {
  const { alexander, kannika, loading: statsLoading, refetch: refetchStats } = useCompetitionStats()

  const winner = useMemo(() => {
    if (alexander > kannika) return "trainer1"
    if (kannika > alexander) return "trainer2"
    return "tie"
  }, [alexander, kannika])

  // Calculate progress percentages for the dual progress bar
  const maxWorkouts = useMemo(() => {
    return Math.max(alexander, kannika, 1) // At least 1 to avoid division by zero
  }, [alexander, kannika])

  const alexanderProgress = useMemo(() => {
    return (alexander / maxWorkouts) * 100
  }, [alexander, maxWorkouts])

  const kannikaProgress = useMemo(() => {
    return (kannika / maxWorkouts) * 100
  }, [kannika, maxWorkouts])

  const handleLogout = () => {
    localStorage.removeItem("app_authenticated")
    localStorage.removeItem("app_auth_timestamp")
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <header className="relative mb-8 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="absolute right-0 top-0"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Dumbbell className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Fitness Challenge</h1>
      </header>

      {/* Dual Competing Progress Bars */}
      {!statsLoading && (
        <div className="mx-auto mb-8 max-w-4xl">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Alexander's Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Alexander</span>
                  <span className="text-muted-foreground">{alexander} workout{alexander !== 1 ? "s" : ""}</span>
                </div>
                <div className="relative h-8 rounded-full overflow-hidden bg-secondary border border-border">
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full flex items-center justify-end pr-3 transition-all duration-500 ease-out",
                      winner === "trainer1" ? "bg-green-500" : "bg-blue-600"
                    )}
                    style={{ width: `${alexanderProgress}%` }}
                  >
                    {alexander > 0 && alexanderProgress > 20 && (
                      <span className="text-xs font-bold text-white">
                        {alexander}
                      </span>
                    )}
                  </div>
                  {alexander > 0 && alexanderProgress <= 20 && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                      <span className="text-xs font-bold text-foreground bg-background/90 px-1.5 py-0.5 rounded">
                        {alexander}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Kannika's Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Kannika</span>
                  <span className="text-muted-foreground">{kannika} workout{kannika !== 1 ? "s" : ""}</span>
                </div>
                <div className="relative h-8 rounded-full overflow-hidden bg-secondary border border-border">
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full flex items-center justify-end pr-3 transition-all duration-500 ease-out",
                      winner === "trainer2" ? "bg-green-500" : "bg-purple-600"
                    )}
                    style={{ width: `${kannikaProgress}%` }}
                  >
                    {kannika > 0 && kannikaProgress > 20 && (
                      <span className="text-xs font-bold text-white">
                        {kannika}
                      </span>
                    )}
                  </div>
                  {kannika > 0 && kannikaProgress <= 20 && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                      <span className="text-xs font-bold text-foreground bg-background/90 px-1.5 py-0.5 rounded">
                        {kannika}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {winner === "tie" && (alexander > 0 || kannika > 0) && !statsLoading && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                It's a tie! Both trainers are working hard 💪
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Two Trainer Schedules in Tabs */}
      <div className="mx-auto max-w-md">
        <Tabs defaultValue="alexander" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="alexander"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Alexander
            </TabsTrigger>
            <TabsTrigger 
              value="kannika"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Kannika
            </TabsTrigger>
          </TabsList>
          <TabsContent value="alexander" className="mt-6">
            <TrainerSchedule 
              trainerName="Alexander" 
              trainerId="trainer1"
              onWorkoutCompleted={refetchStats}
            />
          </TabsContent>
          <TabsContent value="kannika" className="mt-6">
            <TrainerSchedule 
              trainerName="Kannika" 
              trainerId="trainer2"
              onWorkoutCompleted={refetchStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
