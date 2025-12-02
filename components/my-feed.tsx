"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import { RefreshCw, User, Loader2, Bell, Rss, Activity, Sparkles, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MyFeedItem } from "@/components/my-feed-item"
import { useMyFeed } from "@/lib/hooks/use-my-feed"
import { useLanguage } from "@/lib/contexts/language-context"

export function MyFeed() {
  const { 
    myPosts, 
    notifications, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh,
    toggleCommentLike,
  } = useMyFeed()
  const { language } = useLanguage()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("posts")

  // Group posts by date
  const groupedPosts = useMemo(() => {
    const groups: { label: string; activities: typeof myPosts }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    let todayActivities: typeof myPosts = []
    let yesterdayActivities: typeof myPosts = []
    let thisWeekActivities: typeof myPosts = []
    let olderActivities: typeof myPosts = []

    myPosts.forEach(activity => {
      const activityDate = new Date(activity.createdAt)
      activityDate.setHours(0, 0, 0, 0)

      if (activityDate.getTime() === today.getTime()) {
        todayActivities.push(activity)
      } else if (activityDate.getTime() === yesterday.getTime()) {
        yesterdayActivities.push(activity)
      } else if (activityDate >= thisWeekStart) {
        thisWeekActivities.push(activity)
      } else {
        olderActivities.push(activity)
      }
    })

    if (todayActivities.length > 0) {
      groups.push({
        label: language === "en" ? "Today" : "วันนี้",
        activities: todayActivities
      })
    }
    if (yesterdayActivities.length > 0) {
      groups.push({
        label: language === "en" ? "Yesterday" : "เมื่อวาน",
        activities: yesterdayActivities
      })
    }
    if (thisWeekActivities.length > 0) {
      groups.push({
        label: language === "en" ? "This Week" : "สัปดาห์นี้",
        activities: thisWeekActivities
      })
    }
    if (olderActivities.length > 0) {
      groups.push({
        label: language === "en" ? "Earlier" : "ก่อนหน้านี้",
        activities: olderActivities
      })
    }

    return groups
  }, [myPosts, language])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Loading skeleton
  if (loading && myPosts.length === 0 && notifications.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Rss className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === "en" ? "Couldn't load your feed" : "โหลดฟีดของคุณไม่สำเร็จ"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {language === "en"
              ? "We're having trouble loading your activities. Please try again."
              : "เรามีปัญหาในการโหลดกิจกรรมของคุณ กรุณาลองอีกครั้ง"}
          </p>
          <Button onClick={refresh} variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "en" ? "Try Again" : "ลองอีกครั้ง"}
          </Button>
        </div>
      </Card>
    )
  }

  // Empty state
  if (myPosts.length === 0 && notifications.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === "en" ? "Start your fitness journey" : "เริ่มต้นการออกกำลังกาย"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            {language === "en"
              ? "Complete workouts, log your weight, and track your progress. Your activities will appear here!"
              : "ออกกำลังกาย บันทึกน้ำหนัก และติดตามความก้าวหน้า กิจกรรมของคุณจะปรากฏที่นี่!"}
          </p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "en" ? "Refresh" : "รีเฟรช"}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">
            {language === "en" ? "Your Activity" : "กิจกรรมของคุณ"}
          </h2>
        </div>
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {language === "en" ? "Refresh" : "รีเฟรช"}
        </Button>
      </div>

      {/* Tabs for My Posts and Notifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
          <TabsTrigger 
            value="posts" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <User className="w-4 h-4" />
            <span>{language === "en" ? "My Posts" : "โพสต์ของฉัน"}</span>
            {myPosts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-medium">
                {myPosts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span>{language === "en" ? "Interactions" : "การโต้ตอบ"}</span>
            {notifications.length > 0 && (
              <Badge 
                variant="default" 
                className="ml-1 h-5 px-1.5 text-[10px] font-medium bg-pink-500 hover:bg-pink-500"
              >
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-6">
          {myPosts.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {language === "en"
                    ? "No activities yet. Complete a workout or log your weight to see it here!"
                    : "ยังไม่มีกิจกรรม ออกกำลังกายหรือบันทึกน้ำหนักเพื่อดูที่นี่!"}
                </p>
              </div>
            </Card>
          ) : (
            groupedPosts.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Group label */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                
                {/* Activities in group */}
                <div className="space-y-3">
                  {group.activities.map((activity) => (
                    <MyFeedItem 
                      key={activity.id} 
                      activity={activity} 
                      onToggleCommentLike={toggleCommentLike}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          {notifications.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {language === "en" ? "No interactions yet" : "ยังไม่มีการโต้ตอบ"}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {language === "en"
                    ? "When friends like or comment on your activities, you'll see them here!"
                    : "เมื่อเพื่อนถูกใจหรือแสดงความคิดเห็นในกิจกรรมของคุณ คุณจะเห็นที่นี่!"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Mark all as read hint */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs text-muted-foreground">
                  {notifications.length} {language === "en" ? "new interactions" : "การโต้ตอบใหม่"}
                </span>
              </div>
              
              {notifications.map((activity) => (
                <MyFeedItem 
                  key={activity.id} 
                  activity={activity} 
                  isNotification 
                  onToggleCommentLike={toggleCommentLike}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && (myPosts.length > 0 || notifications.length > 0) && (
          <div className="flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {language === "en" ? "Loading more..." : "กำลังโหลด..."}
            </span>
          </div>
        )}
        {!hasMore && (myPosts.length > 0 || notifications.length > 0) && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "You're all caught up! 🎉"
                : "คุณดูครบทุกอย่างแล้ว! 🎉"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
