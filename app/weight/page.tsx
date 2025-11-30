"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { WeightTracker } from "@/components/weight-tracker"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { TRAINER_IDS, TRAINER_NAMES } from "@/lib/constants"

const ACTIVE_TAB_STORAGE_KEY = "active_trainer_tab" // Use same key as main page
const ACTIVE_WEIGHT_TAB_STORAGE_KEY = "active_weight_tab"

export default function WeightTrackingPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Priority: URL param > main page tab > weight page tab > default
  const trainerParam = searchParams.get("trainer")
  const getInitialTrainer = () => {
    if (typeof window === "undefined") {
      return TRAINER_IDS.ALEXANDER
    }
    
    // First check URL parameter
    if (trainerParam === "kannika") return TRAINER_IDS.KANNIKA
    if (trainerParam === "alexander") return TRAINER_IDS.ALEXANDER
    
    // Then check main page's active tab (main page uses "alexander"/"kannika" strings)
    const mainPageTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
    if (mainPageTab === "kannika") return TRAINER_IDS.KANNIKA
    if (mainPageTab === "alexander") return TRAINER_IDS.ALEXANDER
    
    // Then check weight page's own storage
    const weightPageTab = localStorage.getItem(ACTIVE_WEIGHT_TAB_STORAGE_KEY)
    if (weightPageTab === TRAINER_IDS.KANNIKA || weightPageTab === TRAINER_IDS.ALEXANDER) {
      return weightPageTab
    }
    
    // Default to alexander
    return TRAINER_IDS.ALEXANDER
  }

  const [activeTab, setActiveTab] = useState<string>(getInitialTrainer)
  const hasAppliedUrlParam = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Save to both main page tab (for consistency) and weight page tab
      // Convert TRAINER_IDS back to main page format for consistency
      const mainPageTabValue = activeTab === TRAINER_IDS.KANNIKA ? "kannika" : "alexander"
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, mainPageTabValue)
      localStorage.setItem(ACTIVE_WEIGHT_TAB_STORAGE_KEY, activeTab)
    }
  }, [activeTab])
  
  // Apply URL parameter only on initial mount, then allow manual tab switching
  useEffect(() => {
    if (trainerParam && !hasAppliedUrlParam.current) {
      const targetTab = trainerParam === "kannika" ? TRAINER_IDS.KANNIKA : TRAINER_IDS.ALEXANDER
      setActiveTab(targetTab)
      hasAppliedUrlParam.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("weightTracking")}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value={TRAINER_IDS.ALEXANDER}
              className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              {t("alexander")}
            </TabsTrigger>
            <TabsTrigger
              value={TRAINER_IDS.KANNIKA}
              className="data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              {t("kannika")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={TRAINER_IDS.ALEXANDER} className="mt-6">
            <WeightTracker
              trainerId={TRAINER_IDS.ALEXANDER}
              trainerName={TRAINER_NAMES.ALEXANDER}
            />
          </TabsContent>
          <TabsContent value={TRAINER_IDS.KANNIKA} className="mt-6">
            <WeightTracker
              trainerId={TRAINER_IDS.KANNIKA}
              trainerName={TRAINER_NAMES.KANNIKA}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

