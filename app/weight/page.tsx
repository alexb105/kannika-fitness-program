"use client"

import { WeightTracker } from "@/components/weight-tracker"
import { Navbar } from "@/components/navbar"
import { useLanguage } from "@/lib/contexts/language-context"

export default function WeightTrackingPage() {
  const { t } = useLanguage()

  return (
    <>
      <Navbar />
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            {t("weightTracking")}
          </h1>

          <WeightTracker />
      </div>
    </main>
    </>
  )
}
