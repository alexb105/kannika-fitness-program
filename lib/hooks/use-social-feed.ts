"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"

export type ActivityType =
  | "workout_completed"
  | "workout_missed"
  | "workout_planned"
  | "rest_day_planned"
  | "weight_logged"
  | "activity_liked"
  | "activity_commented"
  | "comment_liked"

export interface ActivityLike {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  createdAt: Date
}

export interface CommentLike {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  createdAt: Date
}

export interface ActivityComment {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  comment: string
  createdAt: Date
  likes: CommentLike[]
  likedByMe: boolean
}

export interface Activity {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  activityType: ActivityType
  referenceId: string | null
  referenceDate: Date | null
  metadata: {
    exercises?: string[]
    duration?: number
    notes?: string
    weight?: number
    previous_weight?: number
    previous_date?: string
    weight_change?: number
    // For notification activities
    liker_id?: string
    liker_username?: string
    liker_avatar_url?: string
    commenter_id?: string
    commenter_username?: string
    commenter_avatar_url?: string
    comment?: string
    comment_preview?: string
  }
  createdAt: Date
  // Engagement data
  likes: ActivityLike[]
  comments: ActivityComment[]
  likedByMe: boolean
  myComment: ActivityComment | null
}

export function useSocialFeed() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Fetch activities from friends
  const fetchActivities = useCallback(
    async (loadMore: boolean = false) => {
      if (!user) {
        setActivities([])
        setLoading(false)
        return
      }

      try {
        if (!loadMore) {
          setLoading(true)
        }
        setError(null)

        const currentPage = loadMore ? page + 1 : 0
        const offset = currentPage * pageSize

        // First, get friend IDs
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id)

        if (friendsError) throw friendsError

        const friendIds = (friendsData || []).map((f) => f.friend_id)

        if (friendIds.length === 0) {
          setActivities([])
          setHasMore(false)
          setLoading(false)
          return
        }

        // Fetch activities from friends (excluding notification types - those go to My Feed)
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .in("user_id", friendIds)
          .not("activity_type", "in", '("activity_liked","activity_commented")')
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1)

        if (activitiesError) throw activitiesError

        if (!activitiesData || activitiesData.length === 0) {
          if (!loadMore) {
            setActivities([])
          }
          setHasMore(false)
          setLoading(false)
          return
        }

        // Get usernames and avatars for activity users
        const userIds = [...new Set((activitiesData || []).map((a) => a.user_id))]
        let usernamesMap: Record<string, string | null> = {}
        let avatarsMap: Record<string, string | null> = {}

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds)

          if (profiles) {
            profiles.forEach((profile) => {
              usernamesMap[profile.id] = profile.username
              avatarsMap[profile.id] = profile.avatar_url
            })
          }
        }

        // Get activity IDs for fetching likes and comments
        const activityIds = (activitiesData || []).map((a) => a.id)

        // Fetch likes for all activities
        let likesMap: Record<string, ActivityLike[]> = {}
        let myLikesSet = new Set<string>()
        
        if (activityIds.length > 0) {
          const { data: likesData } = await supabase
            .from("activity_likes")
            .select("id, activity_id, user_id, created_at")
            .in("activity_id", activityIds)

          if (likesData) {
            // Get usernames and avatars for likers
            const likerIds = [...new Set(likesData.map((l) => l.user_id))]
            let likerUsernamesMap: Record<string, string | null> = {}
            let likerAvatarsMap: Record<string, string | null> = {}
            
            if (likerIds.length > 0) {
              const { data: likerProfiles } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", likerIds)
              
              if (likerProfiles) {
                likerProfiles.forEach((p) => {
                  likerUsernamesMap[p.id] = p.username
                  likerAvatarsMap[p.id] = p.avatar_url
                })
              }
            }

            likesData.forEach((like) => {
              if (!likesMap[like.activity_id]) {
                likesMap[like.activity_id] = []
              }
              likesMap[like.activity_id].push({
                id: like.id,
                userId: like.user_id,
                username: likerUsernamesMap[like.user_id] || null,
                avatarUrl: likerAvatarsMap[like.user_id] || null,
                createdAt: new Date(like.created_at),
              })
              if (like.user_id === user.id) {
                myLikesSet.add(like.activity_id)
              }
            })
          }
        }

        // Fetch comments for all activities
        let commentsMap: Record<string, ActivityComment[]> = {}
        let myCommentsMap: Record<string, ActivityComment> = {}
        
        if (activityIds.length > 0) {
          const { data: commentsData } = await supabase
            .from("activity_comments")
            .select("id, activity_id, user_id, comment, created_at")
            .in("activity_id", activityIds)

          if (commentsData && commentsData.length > 0) {
            // Get usernames and avatars for commenters
            const commenterIds = [...new Set(commentsData.map((c) => c.user_id))]
            let commenterUsernamesMap: Record<string, string | null> = {}
            let commenterAvatarsMap: Record<string, string | null> = {}
            
            if (commenterIds.length > 0) {
              const { data: commenterProfiles } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", commenterIds)
              
              if (commenterProfiles) {
                commenterProfiles.forEach((p) => {
                  commenterUsernamesMap[p.id] = p.username
                  commenterAvatarsMap[p.id] = p.avatar_url
                })
              }
            }

            // Fetch comment likes
            const commentIds = commentsData.map((c) => c.id)
            let commentLikesMap: Record<string, CommentLike[]> = {}
            let myCommentLikesSet = new Set<string>()

            const { data: commentLikesData } = await supabase
              .from("comment_likes")
              .select("id, comment_id, user_id, created_at")
              .in("comment_id", commentIds)

            if (commentLikesData) {
              // Get usernames and avatars for comment likers
              const commentLikerIds = [...new Set(commentLikesData.map((l) => l.user_id))]
              let commentLikerUsernamesMap: Record<string, string | null> = {}
              let commentLikerAvatarsMap: Record<string, string | null> = {}

              if (commentLikerIds.length > 0) {
                const { data: likerProfiles } = await supabase
                  .from("profiles")
                  .select("id, username, avatar_url")
                  .in("id", commentLikerIds)

                if (likerProfiles) {
                  likerProfiles.forEach((p) => {
                    commentLikerUsernamesMap[p.id] = p.username
                    commentLikerAvatarsMap[p.id] = p.avatar_url
                  })
                }
              }

              commentLikesData.forEach((like) => {
                if (!commentLikesMap[like.comment_id]) {
                  commentLikesMap[like.comment_id] = []
                }
                commentLikesMap[like.comment_id].push({
                  id: like.id,
                  userId: like.user_id,
                  username: commentLikerUsernamesMap[like.user_id] || null,
                  avatarUrl: commentLikerAvatarsMap[like.user_id] || null,
                  createdAt: new Date(like.created_at),
                })
                if (like.user_id === user.id) {
                  myCommentLikesSet.add(like.comment_id)
                }
              })
            }

            commentsData.forEach((comment) => {
              const activityComment: ActivityComment = {
                id: comment.id,
                userId: comment.user_id,
                username: commenterUsernamesMap[comment.user_id] || null,
                avatarUrl: commenterAvatarsMap[comment.user_id] || null,
                comment: comment.comment,
                createdAt: new Date(comment.created_at),
                likes: commentLikesMap[comment.id] || [],
                likedByMe: myCommentLikesSet.has(comment.id),
              }
              
              if (!commentsMap[comment.activity_id]) {
                commentsMap[comment.activity_id] = []
              }
              commentsMap[comment.activity_id].push(activityComment)
              
              if (comment.user_id === user.id) {
                myCommentsMap[comment.activity_id] = activityComment
              }
            })
          }
        }

        // Convert to Activity format
        const convertedActivities: Activity[] = (activitiesData || []).map(
          (activity) => ({
            id: activity.id,
            userId: activity.user_id,
            username: usernamesMap[activity.user_id] || null,
            avatarUrl: avatarsMap[activity.user_id] || null,
            activityType: activity.activity_type as ActivityType,
            referenceId: activity.reference_id,
            referenceDate: activity.reference_date
              ? new Date(activity.reference_date)
              : null,
            metadata: activity.metadata || {},
            createdAt: new Date(activity.created_at),
            likes: likesMap[activity.id] || [],
            comments: commentsMap[activity.id] || [],
            likedByMe: myLikesSet.has(activity.id),
            myComment: myCommentsMap[activity.id] || null,
          })
        )

        if (loadMore) {
          setActivities((prev) => [...prev, ...convertedActivities])
          setPage(currentPage)
        } else {
          setActivities(convertedActivities)
          setPage(0)
        }

        setHasMore(convertedActivities.length === pageSize)
      } catch (err) {
        console.error("Error fetching social feed:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    },
    [user, page, pageSize]
  )

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(true)
    }
  }, [fetchActivities, loading, hasMore])

  const refresh = useCallback(() => {
    setPage(0)
    setHasMore(true)
    fetchActivities(false)
  }, [fetchActivities])

  // Like an activity
  const likeActivity = useCallback(
    async (activityId: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("activity_likes")
          .insert({
            activity_id: activityId,
            user_id: user.id,
          })

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                likedByMe: true,
                likes: [
                  ...activity.likes,
                  {
                    id: "temp-" + Date.now(),
                    userId: user.id,
                    username: null, // Will be updated on refresh
                    createdAt: new Date(),
                  },
                ],
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error liking activity:", err)
        throw err
      }
    },
    [user]
  )

  // Unlike an activity
  const unlikeActivity = useCallback(
    async (activityId: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("activity_likes")
          .delete()
          .eq("activity_id", activityId)
          .eq("user_id", user.id)

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                likedByMe: false,
                likes: activity.likes.filter((like) => like.userId !== user.id),
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error unliking activity:", err)
        throw err
      }
    },
    [user]
  )

  // Toggle like
  const toggleLike = useCallback(
    async (activityId: string, isLiked: boolean) => {
      if (isLiked) {
        await unlikeActivity(activityId)
      } else {
        await likeActivity(activityId)
      }
    },
    [likeActivity, unlikeActivity]
  )

  // Add a comment to an activity
  const addComment = useCallback(
    async (activityId: string, comment: string) => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("activity_comments")
          .insert({
            activity_id: activityId,
            user_id: user.id,
            comment: comment.trim(),
          })
          .select()
          .single()

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              const newComment: ActivityComment = {
                id: data.id,
                userId: user.id,
                username: null, // Will be updated on refresh
                comment: comment.trim(),
                createdAt: new Date(),
              }
              return {
                ...activity,
                myComment: newComment,
                comments: [...activity.comments, newComment],
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error adding comment:", err)
        throw err
      }
    },
    [user]
  )

  // Update a comment
  const updateComment = useCallback(
    async (activityId: string, commentId: string, newComment: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("activity_comments")
          .update({ comment: newComment.trim() })
          .eq("id", commentId)
          .eq("user_id", user.id)

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              const updatedComments = activity.comments.map((c) =>
                c.id === commentId ? { ...c, comment: newComment.trim() } : c
              )
              const myUpdatedComment = activity.myComment?.id === commentId
                ? { ...activity.myComment, comment: newComment.trim() }
                : activity.myComment
              return {
                ...activity,
                comments: updatedComments,
                myComment: myUpdatedComment,
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error updating comment:", err)
        throw err
      }
    },
    [user]
  )

  // Delete a comment
  const deleteComment = useCallback(
    async (activityId: string, commentId: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("activity_comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", user.id)

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                myComment: null,
                comments: activity.comments.filter((c) => c.id !== commentId),
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error deleting comment:", err)
        throw err
      }
    },
    [user]
  )

  // Like a comment
  const likeComment = useCallback(
    async (activityId: string, commentId: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id,
          })

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                comments: activity.comments.map((c) => {
                  if (c.id === commentId) {
                    return {
                      ...c,
                      likedByMe: true,
                      likes: [
                        ...c.likes,
                        {
                          id: "temp-" + Date.now(),
                          userId: user.id,
                          username: null,
                          createdAt: new Date(),
                        },
                      ],
                    }
                  }
                  return c
                }),
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error liking comment:", err)
        throw err
      }
    },
    [user]
  )

  // Unlike a comment
  const unlikeComment = useCallback(
    async (activityId: string, commentId: string) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)

        if (error) throw error

        // Optimistically update the UI
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                comments: activity.comments.map((c) => {
                  if (c.id === commentId) {
                    return {
                      ...c,
                      likedByMe: false,
                      likes: c.likes.filter((l) => l.userId !== user.id),
                    }
                  }
                  return c
                }),
              }
            }
            return activity
          })
        )
      } catch (err) {
        console.error("Error unliking comment:", err)
        throw err
      }
    },
    [user]
  )

  // Toggle comment like
  const toggleCommentLike = useCallback(
    async (activityId: string, commentId: string, isLiked: boolean) => {
      if (isLiked) {
        await unlikeComment(activityId, commentId)
      } else {
        await likeComment(activityId, commentId)
      }
    },
    [likeComment, unlikeComment]
  )

  useEffect(() => {
    fetchActivities()

    // Subscribe to real-time updates for activities
    if (user) {
      // First get friend IDs for the subscription filter
      supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", user.id)
        .then(({ data: friendsData }) => {
          if (friendsData && friendsData.length > 0) {
            const friendIds = friendsData.map((f) => f.friend_id)

            // Subscribe to activities from friends
            const channel = supabase
              .channel("social_feed_updates")
              .on(
                "postgres_changes",
                {
                  event: "INSERT",
                  schema: "public",
                  table: "activities",
                },
                (payload) => {
                  // Check if the activity is from a friend
                  if (friendIds.includes(payload.new.user_id)) {
                    // Refresh to get the new activity with username
                    refresh()
                  }
                }
              )
              .subscribe()

            return () => {
              supabase.removeChannel(channel)
            }
          }
        })
    }
  }, [user]) // Only re-run when user changes

  // Group activities by date for display
  const activitiesByDate = useMemo(() => {
    const grouped: Record<string, Activity[]> = {}

    activities.forEach((activity) => {
      const dateKey = activity.createdAt.toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(activity)
    })

    return grouped
  }, [activities])

  return {
    activities,
    activitiesByDate,
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
  }
}

