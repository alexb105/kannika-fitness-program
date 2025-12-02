"use client"

import { useState } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Moon, 
  Scale, 
  Dumbbell, 
  Heart, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/contexts/language-context"
import { translateExercises } from "@/lib/translations"
import type { Activity, ActivityType } from "@/lib/hooks/use-social-feed"

interface MyFeedItemProps {
  activity: Activity
  isNotification?: boolean
  onToggleCommentLike?: (activityId: string, commentId: string, isLiked: boolean) => Promise<void>
}

const activityConfig: Record<
  ActivityType,
  {
    icon: typeof CheckCircle2
    colorClass: string
    bgClass: string
    borderClass: string
    lightBg: string
  }
> = {
  workout_completed: {
    icon: CheckCircle2,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-l-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  workout_missed: {
    icon: XCircle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-l-red-500",
    lightBg: "bg-red-50 dark:bg-red-950/30",
  },
  workout_planned: {
    icon: Dumbbell,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
    borderClass: "border-l-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  rest_day_planned: {
    icon: Moon,
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10",
    borderClass: "border-l-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-950/30",
  },
  weight_logged: {
    icon: Scale,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-l-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/30",
  },
  activity_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
    borderClass: "border-l-pink-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
  },
  activity_commented: {
    icon: MessageCircle,
    colorClass: "text-cyan-500",
    bgClass: "bg-cyan-500/10",
    borderClass: "border-l-cyan-500",
    lightBg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  comment_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
    borderClass: "border-l-pink-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
  },
}

export function MyFeedItem({ activity, isNotification = false, onToggleCommentLike }: MyFeedItemProps) {
  const { language, t } = useLanguage()
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)
  const [showAllComments, setShowAllComments] = useState(false)

  const config = activityConfig[activity.activityType]
  const Icon = config.icon

  const handleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!onToggleCommentLike || likingCommentId) return
    setLikingCommentId(commentId)
    try {
      await onToggleCommentLike(activity.id, commentId, isLiked)
    } finally {
      setLikingCommentId(null)
    }
  }

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return language === "en" ? "Just now" : "เมื่อกี้"
    if (diffMins < 60) return language === "en" ? `${diffMins}m` : `${diffMins}น.`
    if (diffHours < 24) return language === "en" ? `${diffHours}h` : `${diffHours}ชม.`
    if (diffDays < 7) return language === "en" ? `${diffDays}d` : `${diffDays}ว.`
    
    return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
      month: "short",
      day: "numeric",
    })
  }

  // Format the reference date
  const formatReferenceDate = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const refDate = new Date(date)
    refDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return t("today")
    if (diffDays === 1) return language === "en" ? "yesterday" : "เมื่อวาน"
    if (diffDays === -1) return language === "en" ? "tomorrow" : "พรุ่งนี้"
    
    return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Get activity message for my posts
  const getActivityMessage = (): { title: string; subtitle?: string } => {
    switch (activity.activityType) {
      case "workout_completed":
        return {
          title: language === "en" ? "Workout completed!" : "ออกกำลังกายเสร็จแล้ว!",
          subtitle: language === "en" ? "Great job staying consistent" : "ทำได้ดีมาก"
        }
      case "workout_missed":
        return {
          title: language === "en" ? "Missed workout" : "พลาดการออกกำลังกาย",
          subtitle: language === "en" ? "Tomorrow is a new day" : "พรุ่งนี้เป็นวันใหม่"
        }
      case "workout_planned":
        return {
          title: language === "en" ? "Workout planned" : "วางแผนการออกกำลังกาย",
        }
      case "rest_day_planned":
        return {
          title: language === "en" ? "Rest day scheduled" : "กำหนดวันพักผ่อน",
          subtitle: language === "en" ? "Recovery is important too" : "การพักผ่อนก็สำคัญ"
        }
      case "weight_logged":
        return {
          title: language === "en" ? "Weight logged" : "บันทึกน้ำหนักแล้ว",
          subtitle: language === "en" ? "Tracking your progress" : "ติดตามความก้าวหน้า"
        }
      case "activity_liked":
        const likerName = activity.metadata.liker_username || t("unknownUser")
        return {
          title: language === "en" 
            ? `${likerName} liked your activity` 
            : `${likerName} ถูกใจกิจกรรมของคุณ`
        }
      case "activity_commented":
        const commenterName = activity.metadata.commenter_username || t("unknownUser")
        return {
          title: language === "en" 
            ? `${commenterName} commented` 
            : `${commenterName} แสดงความคิดเห็น`
        }
      case "comment_liked":
        const commentLikerName = activity.metadata.liker_username || t("unknownUser")
        return {
          title: language === "en" 
            ? `${commentLikerName} liked your comment` 
            : `${commentLikerName} ถูกใจความคิดเห็นของคุณ`
        }
      default:
        return { title: "" }
    }
  }

  // Get exercises display
  const getExercisesDisplay = (): string[] => {
    const exercises = activity.metadata.exercises || []
    return translateExercises(exercises, language).slice(0, 3)
  }

  const isNotificationActivity = activity.activityType === "activity_liked" || activity.activityType === "activity_commented" || activity.activityType === "comment_liked"
  const message = getActivityMessage()
  const visibleComments = showAllComments ? activity.comments : activity.comments.slice(0, 2)
  const hasMoreComments = activity.comments.length > 2

  // Notification card style
  if (isNotificationActivity) {
    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${config.lightBg}`}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.colorClass}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{message.title}</p>
              
              {/* Comment preview */}
              {activity.activityType === "activity_commented" && activity.metadata.comment && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  "{activity.metadata.comment}"
                </p>
              )}
              
              {/* Comment preview for comment_liked */}
              {activity.activityType === "comment_liked" && activity.metadata.comment_preview && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  "{activity.metadata.comment_preview}"
                </p>
              )}
            </div>

            {/* Time and action */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(activity.createdAt)}
              </span>
              {activity.activityType === "activity_commented" && onToggleCommentLike && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    // Find the comment and like it
                    const comment = activity.comments[0]
                    if (comment) {
                      handleCommentLike(comment.id, comment.likedByMe)
                    }
                  }}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  {language === "en" ? "Like" : "ถูกใจ"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Regular activity card
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 ${config.borderClass}`}>
      <div className="p-4">
        <div className="flex gap-3">
          {/* Activity Icon */}
          <div className={`flex-shrink-0 w-11 h-11 rounded-full ${config.bgClass} flex items-center justify-center ring-2 ring-background shadow-sm`}>
            <Icon className={`w-5 h-5 ${config.colorClass}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{message.title}</p>
                {message.subtitle && (
                  <p className="text-xs text-muted-foreground">{message.subtitle}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>

            {/* Reference date */}
            {activity.referenceDate && (
              <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatReferenceDate(activity.referenceDate)}</span>
              </div>
            )}

            {/* Workout details */}
            {(activity.activityType === "workout_completed" ||
              activity.activityType === "workout_planned") &&
              activity.metadata.exercises &&
              activity.metadata.exercises.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {getExercisesDisplay().map((exercise, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {exercise}
                      </Badge>
                    ))}
                    {activity.metadata.exercises.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{activity.metadata.exercises.length - 3}
                      </Badge>
                    )}
                  </div>
                  {activity.metadata.duration && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {activity.metadata.duration} {t("min")}
                    </p>
                  )}
                </div>
              )}

            {/* Weight value */}
            {activity.activityType === "weight_logged" && activity.metadata.weight && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10">
                <Scale className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {activity.metadata.weight}
                </span>
                <span className="text-sm text-amber-600/80 dark:text-amber-400/80">
                  {t("kg")}
                </span>
              </div>
            )}

            {/* Engagement summary */}
            {(activity.likes.length > 0 || activity.comments.length > 0) && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                {activity.likes.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Heart className="w-3 h-3 text-pink-500 fill-current" />
                      </div>
                    </div>
                    <span>
                      {activity.likes.length} {language === "en" ? (activity.likes.length === 1 ? "like" : "likes") : "ถูกใจ"}
                    </span>
                  </div>
                )}
                {activity.comments.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4 text-cyan-500" />
                    <span>
                      {activity.comments.length} {language === "en" ? (activity.comments.length === 1 ? "comment" : "comments") : "ความคิดเห็น"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Comments section */}
            {activity.comments.length > 0 && (
              <div className="mt-3 space-y-2">
                {visibleComments.map((comment) => (
                  <div key={comment.id} className="group flex items-start gap-2">
                    <div className="flex-1 px-3 py-2 rounded-2xl bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-xs">
                            {comment.username || t("unknownUser")}
                          </span>
                          <p className="text-sm mt-0.5 break-words">
                            {comment.comment}
                          </p>
                        </div>
                        {/* Like comment button */}
                        {comment.userId !== activity.userId && onToggleCommentLike && (
                          <button
                            onClick={() => handleCommentLike(comment.id, comment.likedByMe)}
                            disabled={likingCommentId === comment.id}
                            className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs transition-all p-1.5 rounded-full hover:bg-background ${
                              comment.likedByMe 
                                ? "!opacity-100 text-pink-500" 
                                : "text-muted-foreground hover:text-pink-500"
                            }`}
                          >
                            <Heart 
                              className={`w-3.5 h-3.5 ${comment.likedByMe ? "fill-current" : ""}`} 
                            />
                            {comment.likes.length > 0 && (
                              <span>{comment.likes.length}</span>
                            )}
                          </button>
                        )}
                      </div>
                      {/* Liked indicator */}
                      {comment.likes.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-500/80">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>
                            {comment.likedByMe 
                              ? (language === "en" ? "You acknowledged this" : "คุณตอบรับแล้ว")
                              : `${comment.likes.length} ${language === "en" ? "like" : "ถูกใจ"}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show more/less */}
                {hasMoreComments && (
                  <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-3"
                  >
                    {showAllComments ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        {language === "en" ? "Show less" : "แสดงน้อยลง"}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        {language === "en" 
                          ? `View ${activity.comments.length - 2} more` 
                          : `ดูอีก ${activity.comments.length - 2}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
