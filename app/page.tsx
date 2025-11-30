"use client"

import { UserSchedule } from "@/components/user-schedule"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

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
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 py-8 md:px-8">
        {/* Elite Fitness User Schedule and Social Feed */}
        <div className="mx-auto max-w-4xl">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="social">Social Feed</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <UserSchedule />
            </div>
          </TabsContent>
          <TabsContent value="social" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <Card className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Social Feed</h3>
                  <p className="text-sm text-muted-foreground">
                    Coming soon - See what your friends are up to!
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </>
  )
}
