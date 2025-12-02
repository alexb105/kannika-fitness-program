"use client"

import { useEffect, useRef, useMemo } from "react"
import { RefreshCw, Users, Loader2, Rss, UserPlus, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityFeedItem } from "@/components/activity-feed-item"
import { useSocialFeed } from "@/lib/hooks/use-social-feed"
import { useLanguage } from "@/lib/contexts/language-context"

export function SocialFeed() {
  const { 
    activities, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh,
    toggleLike,
    addComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
  } = useSocialFeed()
  const { t, language } = useLanguage()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { label: string; activities: typeof activities }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    let todayActivities: typeof activities = []
    let yesterdayActivities: typeof activities = []
    let thisWeekActivities: typeof activities = []
    let olderActivities: typeof activities = []

    activities.forEach(activity => {
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
  }, [activities, language])

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
  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-1 pt-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
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
            {language === "en" ? "Couldn't load feed" : "โหลดฟีดไม่สำเร็จ"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {language === "en"
              ? "We're having trouble loading your friends' activities. Please try again."
              : "เรามีปัญหาในการโหลดกิจกรรมของเพื่อน กรุณาลองอีกครั้ง"}
          </p>
          <Button onClick={refresh} variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "en" ? "Try Again" : "ลองอีกครั้ง"}
          </Button>
        </div>
      </Card>
    )
  }

  // Empty state - no friends or no activities
  if (activities.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === "en" ? "Your feed is empty" : "ฟีดของคุณว่างเปล่า"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            {language === "en"
              ? "Add friends to see their workouts, weight logs, and progress here. Stay motivated together!"
              : "เพิ่มเพื่อนเพื่อดูการออกกำลังกาย บันทึกน้ำหนัก และความก้าวหน้าของพวกเขาที่นี่ สร้างแรงบันดาลใจด้วยกัน!"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="default" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              {language === "en" ? "Add Friends" : "เพิ่มเพื่อน"}
            </Button>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === "en" ? "Refresh" : "รีเฟรช"}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">
            {language === "en" ? "Friends Activity" : "กิจกรรมของเพื่อน"}
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

      {/* Grouped activity list */}
      {groupedActivities.map((group, groupIndex) => (
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
              <ActivityFeedItem 
                key={activity.id} 
                activity={activity}
                onToggleLike={toggleLike}
                onAddComment={addComment}
                onUpdateComment={updateComment}
                onDeleteComment={deleteComment}
                onToggleCommentLike={toggleCommentLike}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && activities.length > 0 && (
          <div className="flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {language === "en" ? "Loading more..." : "กำลังโหลด..."}
            </span>
          </div>
        )}
        {!hasMore && activities.length > 0 && (
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
