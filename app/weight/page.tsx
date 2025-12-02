"use client"

import { WeightTracker } from "@/components/weight-tracker"
import { Navbar } from "@/components/navbar"
import { useLanguage } from "@/lib/contexts/language-context"

export default function WeightTrackingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen-ios flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-8 safe-bottom">
        <div className="mx-auto max-w-4xl safe-x">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            {t("weightTracking")}
          </h1>
          <WeightTracker />
        </div>
      </main>
    </div>
  )
}
