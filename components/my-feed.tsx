"use client"

import { useEffect, useRef } from "react"
import { RefreshCw, User, Loader2, Bell, Rss } from "lucide-react"
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
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Rss className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === "en" ? "Failed to load your feed" : "โหลดฟีดของคุณไม่สำเร็จ"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "en"
              ? "Something went wrong. Please try again."
              : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"}
          </p>
          <Button onClick={refresh} variant="outline" size="sm">
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
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === "en" ? "No activity yet" : "ยังไม่มีกิจกรรม"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {language === "en"
              ? "Your workouts, weight logs, and interactions from friends will appear here."
              : "การออกกำลังกาย บันทึกน้ำหนัก และการโต้ตอบจากเพื่อนของคุณจะปรากฏที่นี่"}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Refresh button */}
      <div className="flex justify-end mb-2">
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
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {language === "en" ? "My Posts" : "โพสต์ของฉัน"}
            {myPosts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {myPosts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {language === "en" ? "Interactions" : "การโต้ตอบ"}
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {myPosts.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "You haven't posted any activities yet. Complete a workout or log your weight to see it here!"
                    : "คุณยังไม่ได้โพสต์กิจกรรมใดๆ ออกกำลังกายหรือบันทึกน้ำหนักเพื่อดูที่นี่!"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {myPosts.map((activity) => (
                <MyFeedItem 
                  key={activity.id} 
                  activity={activity} 
                  onToggleCommentLike={toggleCommentLike}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          {notifications.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "No interactions yet. When friends like or comment on your activities, you'll see them here!"
                    : "ยังไม่มีการโต้ตอบ เมื่อเพื่อนถูกใจหรือแสดงความคิดเห็นในกิจกรรมของคุณ คุณจะเห็นที่นี่!"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((activity) => (
                <MyFeedItem key={activity.id} activity={activity} isNotification />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && (myPosts.length > 0 || notifications.length > 0) && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && (myPosts.length > 0 || notifications.length > 0) && (
          <p className="text-center text-sm text-muted-foreground">
            {language === "en"
              ? "You've reached the end"
              : "คุณถึงจุดสิ้นสุดแล้ว"}
          </p>
        )}
      </div>
    </div>
  )
}

