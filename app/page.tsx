"use client"

import { UserSchedule } from "@/components/user-schedule"
import { Navbar } from "@/components/navbar"
import { SocialFeed } from "@/components/social-feed"
import { MyFeed } from "@/components/my-feed"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/contexts/language-context"
import { Calendar, Users, User } from "lucide-react"

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
  const { t } = useLanguage()

  return (
    <div className="min-h-screen-ios flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-8 safe-bottom">
        {/* Elite Fitness User Schedule and Social Feed */}
        <div className="mx-auto max-w-4xl safe-x">
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
              <TabsTrigger value="schedule" className="flex items-center gap-1.5 touch-target text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{t("mySchedule")}</span>
                <span className="sm:hidden">{t("mySchedule").split(" ")[0]}</span>
              </TabsTrigger>
              <TabsTrigger value="myfeed" className="flex items-center gap-1.5 touch-target text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t("myFeed")}</span>
                <span className="sm:hidden">{t("myFeed").split(" ")[0]}</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-1.5 touch-target text-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">{t("socialFeed")}</span>
                <span className="sm:hidden">{t("socialFeed").split(" ")[0]}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="schedule" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <UserSchedule />
              </div>
            </TabsContent>
            <TabsContent value="myfeed" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <MyFeed />
              </div>
            </TabsContent>
            <TabsContent value="social" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <SocialFeed />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
