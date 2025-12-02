"use client"

import { useState, useRef } from "react"
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
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  isNotification?: boolean
}

const activityConfig: Record<
  ActivityType,
  {
    icon: typeof CheckCircle2
    colorClass: string
    bgClass: string
    borderClass: string
    emoji: string
  }
> = {
  workout_completed: {
    icon: CheckCircle2,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-l-emerald-500",
    emoji: "💪",
  },
  workout_missed: {
    icon: XCircle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-l-red-500",
    emoji: "😔",
  },
  workout_planned: {
    icon: Dumbbell,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
    borderClass: "border-l-blue-500",
    emoji: "📋",
  },
  rest_day_planned: {
    icon: Moon,
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10",
    borderClass: "border-l-purple-500",
    emoji: "😴",
  },
  weight_logged: {
    icon: Scale,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-l-amber-500",
    emoji: "⚖️",
  },
  activity_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
    borderClass: "border-l-pink-500",
    emoji: "❤️",
  },
  activity_commented: {
    icon: MessageCircle,
    colorClass: "text-cyan-500",
    bgClass: "bg-cyan-500/10",
    borderClass: "border-l-cyan-500",
    emoji: "💬",
  },
  comment_liked: {
    icon: Heart,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
    borderClass: "border-l-pink-500",
    emoji: "💕",
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
  const [showAllComments, setShowAllComments] = useState(false)
  const [likeAnimation, setLikeAnimation] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

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
    if (diffMins < 60) return language === "en" ? `${diffMins}m` : `${diffMins}น.`
    if (diffHours < 24) return language === "en" ? `${diffHours}h` : `${diffHours}ชม.`
    if (diffDays < 7) return language === "en" ? `${diffDays}d` : `${diffDays}ว.`
    
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
  const getActivityMessage = (): { username: string; action: string } => {
    const username = activity.username || t("unknownUser")
    
    switch (activity.activityType) {
      case "workout_completed":
        return {
          username,
          action: language === "en" ? "completed a workout" : "ออกกำลังกายเสร็จแล้ว"
        }
      case "workout_missed":
        return {
          username,
          action: language === "en" ? "missed a workout" : "พลาดการออกกำลังกาย"
        }
      case "workout_planned":
        return {
          username,
          action: language === "en" ? "planned a workout" : "วางแผนการออกกำลังกาย"
        }
      case "rest_day_planned":
        return {
          username,
          action: language === "en" ? "is taking a rest day" : "กำหนดวันพักผ่อน"
        }
      case "weight_logged":
        return {
          username,
          action: language === "en" ? "logged their weight" : "บันทึกน้ำหนัก"
        }
      case "activity_liked":
        return {
          username: activity.metadata.liker_username || t("unknownUser"),
          action: language === "en" ? "liked your activity" : "ถูกใจกิจกรรมของคุณ"
        }
      case "activity_commented":
        return {
          username: activity.metadata.commenter_username || t("unknownUser"),
          action: language === "en" ? "commented on your activity" : "แสดงความคิดเห็นในกิจกรรมของคุณ"
        }
      default:
        return { username, action: "" }
    }
  }

  // Get exercises display
  const getExercisesDisplay = (): string[] => {
    const exercises = activity.metadata.exercises || []
    return translateExercises(exercises, language).slice(0, 3)
  }

  const handleLikeClick = async () => {
    setLikeAnimation(true)
    setIsSubmitting(true)
    try {
      await onToggleLike(activity.id, activity.likedByMe)
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setLikeAnimation(false), 300)
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

  const openCommentInput = () => {
    setShowCommentInput(true)
    setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  // Check if this is a notification activity
  const isNotificationActivity = activity.activityType === "activity_liked" || activity.activityType === "activity_commented"

  const message = getActivityMessage()
  const visibleComments = showAllComments ? activity.comments : activity.comments.slice(0, 2)
  const hasMoreComments = activity.comments.length > 2

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 ${config.borderClass}`}>
      <div className="p-4">
        <div className="flex gap-3">
          {/* Activity Icon with Avatar-like styling */}
          <div className={`flex-shrink-0 w-11 h-11 rounded-full ${config.bgClass} flex items-center justify-center ring-2 ring-background shadow-sm`}>
            <Icon className={`w-5 h-5 ${config.colorClass}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with username and time */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{message.username}</span>
                  <span className="text-muted-foreground"> {message.action}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>

            {/* Reference date chip */}
            {activity.referenceDate && !isNotificationActivity && (
              <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatReferenceDate(activity.referenceDate)}</span>
              </div>
            )}

            {/* Comment preview for notification activities */}
            {activity.activityType === "activity_commented" && activity.metadata.comment && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border-l-2 border-cyan-500/50">
                <p className="text-sm text-muted-foreground italic">
                  "{activity.metadata.comment}"
                </p>
              </div>
            )}

            {/* Workout details card */}
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
                        +{activity.metadata.exercises.length - 3} {language === "en" ? "more" : "เพิ่มเติม"}
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

            {/* Weight value - prominent display */}
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

            {/* Interaction bar - Like and Comment buttons */}
            {!isNotificationActivity && (
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                {/* Like button */}
                <button
                  onClick={handleLikeClick}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    activity.likedByMe 
                      ? "bg-pink-500/10 text-pink-500" 
                      : "hover:bg-muted text-muted-foreground hover:text-pink-500"
                  } ${likeAnimation ? "scale-110" : ""}`}
                >
                  <Heart 
                    className={`w-4 h-4 transition-transform ${activity.likedByMe ? "fill-current scale-110" : ""}`} 
                  />
                  <span className="font-medium">
                    {activity.likes.length > 0 && activity.likes.length}
                  </span>
                </button>

                {/* Comment button */}
                <button
                  onClick={() => {
                    if (activity.myComment) {
                      startEditing()
                    } else {
                      openCommentInput()
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    activity.myComment 
                      ? "bg-cyan-500/10 text-cyan-500" 
                      : "hover:bg-muted text-muted-foreground hover:text-cyan-500"
                  }`}
                >
                  <MessageCircle 
                    className={`w-4 h-4 ${activity.myComment ? "fill-current" : ""}`} 
                  />
                  <span className="font-medium">
                    {activity.comments.length > 0 && activity.comments.length}
                  </span>
                </button>

                {/* Like names preview */}
                {activity.likes.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                    {activity.likes.slice(0, 2).map(l => l.username || t("unknownUser")).join(", ")}
                    {activity.likes.length > 2 && ` +${activity.likes.length - 2}`}
                  </span>
                )}
              </div>
            )}

            {/* Comments section */}
            {!isNotificationActivity && activity.comments.length > 0 && (
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
                        {activity.myComment?.id !== comment.id && onToggleCommentLike && (
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
                      {/* Comment liked indicator */}
                      {comment.likes.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-500/80">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>
                            {comment.likedByMe 
                              ? (language === "en" ? "Liked" : "ถูกใจแล้ว")
                              : comment.likes.length
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Edit/Delete for own comment */}
                    {activity.myComment?.id === comment.id && !isEditing && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={startEditing}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteComment}
                          disabled={isSubmitting}
                          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-full hover:bg-muted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Show more/less comments */}
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
                          ? `View ${activity.comments.length - 2} more comments` 
                          : `ดูอีก ${activity.comments.length - 2} ความคิดเห็น`}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Comment input for new comment */}
            {!isNotificationActivity && showCommentInput && !activity.myComment && (
              <div className="mt-3 flex gap-2 items-center">
                <Input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === "en" ? "Write a comment..." : "เขียนความคิดเห็น..."}
                  className="text-sm h-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                  maxLength={280}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleCommentSubmit()
                    }
                    if (e.key === "Escape") {
                      setShowCommentInput(false)
                      setCommentText("")
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                  className="h-9 w-9 rounded-full p-0"
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
                  className="h-9 w-9 rounded-full p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Edit comment input */}
            {!isNotificationActivity && isEditing && activity.myComment && (
              <div className="mt-3 flex gap-2 items-center">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder={language === "en" ? "Edit your comment..." : "แก้ไขความคิดเห็น..."}
                  className="text-sm h-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                  maxLength={280}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleEditSubmit()
                    }
                    if (e.key === "Escape") {
                      setIsEditing(false)
                      setEditText("")
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleEditSubmit}
                  disabled={!editText.trim() || isSubmitting}
                  className="h-9 w-9 rounded-full p-0"
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
                  className="h-9 w-9 rounded-full p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
