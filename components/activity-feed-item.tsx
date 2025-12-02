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
  Send,
  X,
  Pencil,
  Trash2
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/contexts/language-context"
import { translateExercises } from "@/lib/translations"
import type { Activity, ActivityType } from "@/lib/hooks/use-social-feed"

interface ActivityFeedItemProps {
  activity: Activity
  onToggleLike: (activityId: string, isLiked: boolean) => Promise<void>
  onAddComment: (activityId: string, comment: string) => Promise<void>
  onUpdateComment: (activityId: string, commentId: string, comment: string) => Promise<void>
  onDeleteComment: (activityId: string, commentId: string) => Promise<void>
  onToggleCommentLike?: (activityId: string, commentId: string, isLiked: boolean) => Promise<void>
  isNotification?: boolean // For notification-type activities (likes/comments on your posts)
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

export function ActivityFeedItem({ 
  activity, 
  onToggleLike, 
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onToggleCommentLike,
  isNotification = false 
}: ActivityFeedItemProps) {
  const { language, t } = useLanguage()
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)

  const handleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!onToggleCommentLike || likingCommentId) return
    setLikingCommentId(commentId)
    try {
      await onToggleCommentLike(activity.id, commentId, isLiked)
    } finally {
      setLikingCommentId(null)
    }
  }

  const config = activityConfig[activity.activityType]
  const Icon = config.icon

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

  // Get activity message
  const getActivityMessage = (): string => {
    const username = activity.username || t("unknownUser")
    
    switch (activity.activityType) {
      case "workout_completed":
        return language === "en"
          ? `${username} completed a workout`
          : `${username} ออกกำลังกายเสร็จแล้ว`
      case "workout_missed":
        return language === "en"
          ? `${username} missed a workout`
          : `${username} พลาดการออกกำลังกาย`
      case "workout_planned":
        return language === "en"
          ? `${username} planned a workout`
          : `${username} วางแผนการออกกำลังกาย`
      case "rest_day_planned":
        return language === "en"
          ? `${username} scheduled a rest day`
          : `${username} กำหนดวันพักผ่อน`
      case "weight_logged":
        return language === "en"
          ? `${username} logged their weight`
          : `${username} บันทึกน้ำหนัก`
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
      default:
        return username
    }
  }

  // Get exercises display
  const getExercisesDisplay = (): string[] => {
    const exercises = activity.metadata.exercises || []
    return translateExercises(exercises, language).slice(0, 3)
  }

  const handleLikeClick = async () => {
    setIsSubmitting(true)
    try {
      await onToggleLike(activity.id, activity.likedByMe)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return
    setIsSubmitting(true)
    try {
      await onAddComment(activity.id, commentText)
      setCommentText("")
      setShowCommentInput(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editText.trim() || !activity.myComment) return
    setIsSubmitting(true)
    try {
      await onUpdateComment(activity.id, activity.myComment.id, editText)
      setIsEditing(false)
      setEditText("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!activity.myComment) return
    setIsSubmitting(true)
    try {
      await onDeleteComment(activity.id, activity.myComment.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = () => {
    if (activity.myComment) {
      setEditText(activity.myComment.comment)
      setIsEditing(true)
    }
  }

  // Check if this is a notification activity (likes/comments on your own posts)
  const isNotificationActivity = activity.activityType === "activity_liked" || activity.activityType === "activity_commented"

  return (
    <Card className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0 relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.avatarUrl || undefined} alt={activity.username || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {activity.username?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {/* Activity type indicator */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bgClass} flex items-center justify-center border-2 border-background`}>
            <Icon className={`w-3 h-3 ${config.colorClass}`} />
          </div>
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
            <p className="text-sm text-muted-foreground mt-1 italic">
              "{activity.metadata.comment}"
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
            <p className="text-sm font-semibold mt-1 text-amber-600 dark:text-amber-400">
              {activity.metadata.weight} {t("kg")}
            </p>
          )}

          {/* Like and Comment buttons - only for non-notification activities */}
          {!isNotificationActivity && (
            <div className="flex items-center gap-4 mt-3">
              {/* Like button */}
              <button
                onClick={handleLikeClick}
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  activity.likedByMe 
                    ? "text-pink-500" 
                    : "text-muted-foreground hover:text-pink-500"
                }`}
              >
                <Heart 
                  className={`w-4 h-4 ${activity.likedByMe ? "fill-current" : ""}`} 
                />
                <span>
                  {activity.likes.length > 0 ? activity.likes.length : ""}
                  {" "}
                  {language === "en" ? "Like" : "ถูกใจ"}
                </span>
              </button>

              {/* Comment button */}
              <button
                onClick={() => {
                  if (activity.myComment) {
                    // Already commented, show edit options
                    startEditing()
                  } else {
                    setShowCommentInput(!showCommentInput)
                  }
                }}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  activity.myComment 
                    ? "text-cyan-500" 
                    : "text-muted-foreground hover:text-cyan-500"
                }`}
              >
                <MessageCircle 
                  className={`w-4 h-4 ${activity.myComment ? "fill-current" : ""}`} 
                />
                <span>
                  {activity.comments.length > 0 ? activity.comments.length : ""}
                  {" "}
                  {language === "en" ? "Comment" : "ความคิดเห็น"}
                </span>
              </button>
            </div>
          )}

          {/* Show existing comments */}
          {!isNotificationActivity && activity.comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {activity.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 text-sm">
                  <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-medium text-xs">
                          {comment.username || t("unknownUser")}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {comment.comment}
                        </p>
                      </div>
                      {/* Like comment button - for comments not by current user */}
                      {activity.myComment?.id !== comment.id && onToggleCommentLike && (
                        <button
                          onClick={() => handleCommentLike(comment.id, comment.likedByMe)}
                          disabled={likingCommentId === comment.id}
                          className={`flex items-center gap-1 text-xs transition-colors p-1 rounded hover:bg-muted ${
                            comment.likedByMe 
                              ? "text-pink-500" 
                              : "text-muted-foreground hover:text-pink-500"
                          }`}
                          title={language === "en" ? "Like comment" : "ถูกใจความคิดเห็น"}
                        >
                          <Heart 
                            className={`w-3 h-3 ${comment.likedByMe ? "fill-current" : ""}`} 
                          />
                          {comment.likes.length > 0 && (
                            <span className="text-[10px]">{comment.likes.length}</span>
                          )}
                        </button>
                      )}
                    </div>
                    {/* Show like indicator */}
                    {comment.likes.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-500">
                        <Heart className="w-2.5 h-2.5 fill-current" />
                        <span>{comment.likes.length}</span>
                      </div>
                    )}
                  </div>
                  {activity.myComment?.id === comment.id && !isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={startEditing}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleDeleteComment}
                        disabled={isSubmitting}
                        className="p-1 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment input for new comment */}
          {!isNotificationActivity && showCommentInput && !activity.myComment && (
            <div className="mt-3 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={language === "en" ? "Write a comment..." : "เขียนความคิดเห็น..."}
                className="text-sm h-8"
                maxLength={280}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCommentSubmit()
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={!commentText.trim() || isSubmitting}
                className="h-8 px-2"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCommentInput(false)
                  setCommentText("")
                }}
                className="h-8 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Edit comment input */}
          {!isNotificationActivity && isEditing && activity.myComment && (
            <div className="mt-3 flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={language === "en" ? "Edit your comment..." : "แก้ไขความคิดเห็น..."}
                className="text-sm h-8"
                maxLength={280}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleEditSubmit()
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleEditSubmit}
                disabled={!editText.trim() || isSubmitting}
                className="h-8 px-2"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  setEditText("")
                }}
                className="h-8 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
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
