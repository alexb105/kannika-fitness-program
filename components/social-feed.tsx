"use client"

import { useEffect, useRef } from "react"
import { RefreshCw, Users, Loader2, Rss } from "lucide-react"
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
            {language === "en" ? "Failed to load feed" : "โหลดฟีดไม่สำเร็จ"}
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

  // Empty state - no friends or no activities
  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === "en" ? "No activity yet" : "ยังไม่มีกิจกรรม"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {language === "en"
              ? "When your friends complete workouts, log their weight, or plan their sessions, you'll see their activity here."
              : "เมื่อเพื่อนของคุณออกกำลังกายเสร็จ บันทึกน้ำหนัก หรือวางแผนการฝึก คุณจะเห็นกิจกรรมของพวกเขาที่นี่"}
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

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((activity) => (
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

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && activities.length > 0 && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && activities.length > 0 && (
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

