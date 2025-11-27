"use client"

import { useMemo, useCallback, useState, useEffect } from "react"
import { TrainerSchedule } from "@/components/trainer-schedule"
import { Dumbbell, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useCompetitionStats } from "@/lib/hooks/use-competition-stats"
import { ProgressBarSkeleton } from "@/components/loading-skeleton"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/contexts/language-context"
import { cn } from "@/lib/utils"
import { TRAINER_IDS, TRAINER_NAMES, STORAGE_KEYS } from "@/lib/constants"

const ACTIVE_TAB_STORAGE_KEY = "active_trainer_tab"

export interface DayPlan {
  id: string
  date: Date
  type: "workout" | "rest" | "empty"
  exercises?: string[]
  duration?: number
  notes?: string
  completed?: boolean
  missed?: boolean
}

export default function FitnessSchedule() {
  const { alexander, kannika, loading: statsLoading, refetch: refetchStats } = useCompetitionStats()
  const { t } = useLanguage()
  
  // Load saved tab from localStorage or default to "alexander"
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
      return saved === "kannika" ? "kannika" : "alexander"
    }
    return "alexander"
  })

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab)
    }
  }, [activeTab])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TIMESTAMP)
    window.location.reload()
  }, [])

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <header className="relative mb-8 text-center">
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title={t("logout")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Dumbbell className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("fitnessChallenge")}</h1>
      </header>

      {/* Dual Competing Progress Bars */}
      {statsLoading ? (
        <div className="mx-auto mb-8 max-w-4xl">
          <Card className="p-6">
            <div className="space-y-4">
              <ProgressBarSkeleton />
              <ProgressBarSkeleton />
            </div>
          </Card>
        </div>
      ) : (
        <div className="mx-auto mb-8 max-w-4xl">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Alexander's Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{t("alexander")}</span>
                  <span className="text-muted-foreground">{alexander} {alexander !== 1 ? t("workoutsPlural") : t("workouts")}</span>
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
                  <span className="font-medium text-foreground">{t("kannika")}</span>
                  <span className="text-muted-foreground">{kannika} {kannika !== 1 ? t("workoutsPlural") : t("workouts")}</span>
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
                {t("itsATie")}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Two Trainer Schedules in Tabs */}
      <div className="mx-auto max-w-2xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="alexander"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              {t("alexander")}
            </TabsTrigger>
            <TabsTrigger 
              value="kannika"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              {t("kannika")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="alexander" className="mt-6">
            <TrainerSchedule 
              trainerName={TRAINER_NAMES.ALEXANDER} 
              trainerId={TRAINER_IDS.ALEXANDER}
              onWorkoutCompleted={refetchStats}
            />
          </TabsContent>
          <TabsContent value="kannika" className="mt-6">
            <TrainerSchedule 
              trainerName={TRAINER_NAMES.KANNIKA} 
              trainerId={TRAINER_IDS.KANNIKA}
              onWorkoutCompleted={refetchStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
