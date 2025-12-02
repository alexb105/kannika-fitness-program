"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Activity, ActivityType, ActivityLike, ActivityComment, CommentLike } from "./use-social-feed"

export function useMyFeed() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Fetch user's own activities and notifications (likes/comments on their posts)
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

        // Fetch all activities for the current user (their own posts + notifications)
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
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

        // Get activity IDs for fetching likes and comments
        const activityIds = activitiesData.map((a) => a.id)

        // Fetch likes for all activities
        let likesMap: Record<string, ActivityLike[]> = {}
        let myLikesSet = new Set<string>()
        
        if (activityIds.length > 0) {
          const { data: likesData } = await supabase
            .from("activity_likes")
            .select("id, activity_id, user_id, created_at")
            .in("activity_id", activityIds)

          if (likesData) {
            // Get usernames for likers
            const likerIds = [...new Set(likesData.map((l) => l.user_id))]
            let likerUsernamesMap: Record<string, string | null> = {}
            
            if (likerIds.length > 0) {
              const { data: likerProfiles } = await supabase
                .from("profiles")
                .select("id, username")
                .in("id", likerIds)
              
              if (likerProfiles) {
                likerProfiles.forEach((p) => {
                  likerUsernamesMap[p.id] = p.username
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
            // Get usernames for commenters
            const commenterIds = [...new Set(commentsData.map((c) => c.user_id))]
            let commenterUsernamesMap: Record<string, string | null> = {}
            
            if (commenterIds.length > 0) {
              const { data: commenterProfiles } = await supabase
                .from("profiles")
                .select("id, username")
                .in("id", commenterIds)
              
              if (commenterProfiles) {
                commenterProfiles.forEach((p) => {
                  commenterUsernamesMap[p.id] = p.username
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
              // Get usernames for comment likers
              const commentLikerIds = [...new Set(commentLikesData.map((l) => l.user_id))]
              let commentLikerUsernamesMap: Record<string, string | null> = {}

              if (commentLikerIds.length > 0) {
                const { data: likerProfiles } = await supabase
                  .from("profiles")
                  .select("id, username")
                  .in("id", commentLikerIds)

                if (likerProfiles) {
                  likerProfiles.forEach((p) => {
                    commentLikerUsernamesMap[p.id] = p.username
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

        // Get user's username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single()

        const myUsername = profile?.username || null

        // Convert to Activity format
        const convertedActivities: Activity[] = activitiesData.map(
          (activity) => ({
            id: activity.id,
            userId: activity.user_id,
            username: myUsername,
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
        console.error("Error fetching my feed:", err)
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

  // Like a comment (to acknowledge friend's comment)
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

    // Subscribe to real-time updates for user's activities
    if (user) {
      const channel = supabase
        .channel("my_feed_updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activities",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refresh to get the new activity
            refresh()
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_likes",
          },
          () => {
            // Refresh to get the new like
            refresh()
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_comments",
          },
          () => {
            // Refresh to get the new comment
            refresh()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

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

  // Separate notifications from regular activities
  const { myPosts, notifications } = useMemo(() => {
    const posts: Activity[] = []
    const notifs: Activity[] = []

    activities.forEach((activity) => {
      if (
        activity.activityType === "activity_liked" || 
        activity.activityType === "activity_commented" ||
        activity.activityType === "comment_liked"
      ) {
        notifs.push(activity)
      } else {
        posts.push(activity)
      }
    })

    return { myPosts: posts, notifications: notifs }
  }, [activities])

  return {
    activities,
    myPosts,
    notifications,
    activitiesByDate,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    toggleCommentLike,
  }
}

