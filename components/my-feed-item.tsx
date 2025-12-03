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
  ThumbsUp
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  }
> = {
  workout_completed: {
    icon: CheckCircle2,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
  },
  workout_missed: {
    icon: XCircle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
  },
  workout_planned: {
    icon: Dumbbell,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
  rest_day_planned: {
    icon: Moon,
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10",
  },
  weight_logged: {
    icon: Scale,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
  activity_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
  },
  activity_commented: {
    icon: MessageCircle,
    colorClass: "text-cyan-500",
    bgClass: "bg-cyan-500/10",
  },
  comment_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
  },
}

export function MyFeedItem({ activity, isNotification = false, onToggleCommentLike }: MyFeedItemProps) {
  const { language, t } = useLanguage()
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)

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
    if (diffMins < 60) return language === "en" ? `${diffMins}m ago` : `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return language === "en" ? `${diffHours}h ago` : `${diffHours} ชั่วโมงที่แล้ว`
    if (diffDays < 7) return language === "en" ? `${diffDays}d ago` : `${diffDays} วันที่แล้ว`
    
    return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
      month: "short",
      day: "numeric",
    })
  }

  // Format the reference date (workout/rest day date)
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
  const getActivityMessage = (): string => {
    switch (activity.activityType) {
      case "workout_completed":
        return language === "en"
          ? "You completed a workout"
          : "คุณออกกำลังกายเสร็จแล้ว"
      case "workout_missed":
        return language === "en"
          ? "You missed a workout"
          : "คุณพลาดการออกกำลังกาย"
      case "workout_planned":
        return language === "en"
          ? "You planned a workout"
          : "คุณวางแผนการออกกำลังกาย"
      case "rest_day_planned":
        return language === "en"
          ? "You scheduled a rest day"
          : "คุณกำหนดวันพักผ่อน"
      case "weight_logged":
        return language === "en"
          ? "You logged your weight"
          : "คุณบันทึกน้ำหนัก"
      case "activity_liked":
        const likerName = activity.metadata.liker_username || t("unknownUser")
        return language === "en"
          ? `${likerName} liked your activity`
          : `${likerName} ถูกใจกิจกรรมของคุณ`
      case "activity_commented":
        const commenterName = activity.metadata.commenter_username || t("unknownUser")
        return language === "en"
          ? `${commenterName} commented on your activity`
          : `${commenterName} แสดงความคิดเห็นในกิจกรรมของคุณ`
      case "comment_liked":
        const commentLikerName = activity.metadata.liker_username || t("unknownUser")
        return language === "en"
          ? `${commentLikerName} liked your comment`
          : `${commentLikerName} ถูกใจความคิดเห็นของคุณ`
      default:
        return ""
    }
  }

  // Get exercises display
  const getExercisesDisplay = (): string[] => {
    const exercises = activity.metadata.exercises || []
    return translateExercises(exercises, language).slice(0, 3)
  }

  const isNotificationActivity = activity.activityType === "activity_liked" || activity.activityType === "activity_commented" || activity.activityType === "comment_liked"

  return (
    <Card className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3">
        {/* Activity Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Main message */}
          <p className="font-medium text-sm">
            {getActivityMessage()}
          </p>

          {/* Reference date */}
          {activity.referenceDate && !isNotificationActivity && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatReferenceDate(activity.referenceDate)}</span>
            </div>
          )}

          {/* Comment preview for notification activities */}
          {activity.activityType === "activity_commented" && activity.metadata.comment && (
            <p className="text-sm text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
              "{activity.metadata.comment}"
            </p>
          )}

          {/* Comment preview for comment_liked notifications */}
          {activity.activityType === "comment_liked" && activity.metadata.comment_preview && (
            <p className="text-sm text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
              "{activity.metadata.comment_preview}"
            </p>
          )}

          {/* Workout details */}
          {(activity.activityType === "workout_completed" ||
            activity.activityType === "workout_planned") &&
            activity.metadata.exercises &&
            activity.metadata.exercises.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
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
            )}

          {/* Duration */}
          {activity.metadata.duration && (
            <p className="text-xs text-muted-foreground mt-1">
              {activity.metadata.duration} {t("min")}
            </p>
          )}

          {/* Weight value */}
          {activity.activityType === "weight_logged" && activity.metadata.weight && (
            <div className="mt-1">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {activity.metadata.weight} {t("kg")}
              </p>
              {activity.metadata.previous_weight && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {language === "en" ? "Previous:" : "ก่อนหน้า:"} {activity.metadata.previous_weight} {t("kg")}
                  {typeof activity.metadata.weight_change === "number" && (
                    <span className={`font-medium ${
                      activity.metadata.weight_change < 0 
                        ? "text-green-500" 
                        : activity.metadata.weight_change > 0 
                          ? "text-red-500" 
                          : "text-muted-foreground"
                    }`}>
                      ({activity.metadata.weight_change > 0 ? "+" : ""}{Number(activity.metadata.weight_change).toFixed(1)} {t("kg")})
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Engagement stats for my posts */}
          {!isNotificationActivity && (activity.likes.length > 0 || activity.comments.length > 0) && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {activity.likes.length > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-pink-500" />
                  <span>
                    {activity.likes.length} {language === "en" ? (activity.likes.length === 1 ? "like" : "likes") : "ถูกใจ"}
                  </span>
                </div>
              )}
              {activity.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-cyan-500" />
                  <span>
                    {activity.comments.length} {language === "en" ? (activity.comments.length === 1 ? "comment" : "comments") : "ความคิดเห็น"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Show comments on my posts */}
          {!isNotificationActivity && activity.comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {activity.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="font-medium text-xs">
                        {comment.username || t("unknownUser")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {comment.comment}
                      </p>
                    </div>
                    {/* Like comment button - only show if not user's own comment */}
                    {comment.userId !== activity.userId && onToggleCommentLike && (
                      <button
                        onClick={() => handleCommentLike(comment.id, comment.likedByMe)}
                        disabled={likingCommentId === comment.id}
                        className={`flex items-center gap-1 text-xs transition-colors p-1 rounded hover:bg-muted ${
                          comment.likedByMe 
                            ? "text-pink-500" 
                            : "text-muted-foreground hover:text-pink-500"
                        }`}
                        title={language === "en" ? "Like to acknowledge" : "ถูกใจเพื่อตอบรับ"}
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 ${comment.likedByMe ? "fill-current" : ""}`} 
                        />
                        {comment.likes.length > 0 && (
                          <span className="text-[10px]">{comment.likes.length}</span>
                        )}
                      </button>
                    )}
                  </div>
                  {/* Show if comment is liked */}
                  {comment.likes.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-500">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                      <span>
                        {comment.likedByMe 
                          ? (language === "en" ? "You acknowledged" : "คุณตอบรับแล้ว")
                          : `${comment.likes.length} ${language === "en" ? "like" : "ถูกใจ"}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {activity.comments.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{activity.comments.length - 3} {language === "en" ? "more comments" : "ความคิดเห็นเพิ่มเติม"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Time ago */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {formatTimeAgo(activity.createdAt)}
        </div>
      </div>
    </Card>
  )
}

