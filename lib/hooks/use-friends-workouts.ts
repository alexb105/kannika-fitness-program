"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"
import { useFriends } from "./use-friends"

export interface FriendWorkout {
  friend_id: string
  username: string | null
  avatar_url: string | null
  date: string
  type: "workout" | "rest" | "empty"
  exercises?: string[]
  duration?: number
  notes?: string
  completed?: boolean
  missed?: boolean
}

export function useFriendsWorkouts() {
  const { user } = useAuth()
  const { friends, loading: friendsLoading } = useFriends()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchFriendsWorkoutsForDate = useCallback(
    async (date: Date): Promise<FriendWorkout[]> => {
      if (!user) {
        return []
      }

      // Wait for friends to load
      if (friendsLoading || friends.length === 0) {
        return []
      }

      try {
        setLoading(true)
        setError(null)

        // Ensure date is properly formatted
        const dateObj = new Date(date)
        dateObj.setHours(0, 0, 0, 0)
        const dateString = dateObj.toISOString().split('T')[0]
        
        const friendIds = friends.map((f) => f.friend_id)

        if (friendIds.length === 0) {
          return []
        }

        // Fetch days for all friends on this date
        const { data: daysData, error: fetchError } = await supabase
          .from("days")
          .select("user_id, date, type, exercises, duration, notes, completed, missed")
          .in("user_id", friendIds)
          .eq("date", dateString)
          .eq("type", "workout") // Only show workouts, not rest days or empty days

        if (fetchError) {
          console.error("Error fetching friends workouts:", fetchError)
          throw fetchError
        }

        // Create maps for friend_id to username and avatar
        const usernameMap: Record<string, string | null> = {}
        const avatarMap: Record<string, string | null> = {}
        friends.forEach((friend) => {
          usernameMap[friend.friend_id] = friend.username
          avatarMap[friend.friend_id] = friend.avatar_url
        })

        // Map the data to include usernames and avatars
        const friendWorkouts: FriendWorkout[] = (daysData || [])
          .map((day) => ({
            friend_id: day.user_id,
            username: usernameMap[day.user_id] || null,
            avatar_url: avatarMap[day.user_id] || null,
            date: day.date,
            type: day.type as "workout" | "rest" | "empty",
            exercises: day.exercises || [],
            duration: day.duration || undefined,
            notes: day.notes || undefined,
            completed: day.completed || false,
            missed: day.missed || false,
          }))
          .filter((workout) => workout.type === "workout") // Ensure only workouts

        console.log(`Found ${friendWorkouts.length} friend workouts for ${dateString}`, friendWorkouts)
        return friendWorkouts
      } catch (err) {
        console.error("Error fetching friends workouts:", err)
        setError(err as Error)
        return []
      } finally {
        setLoading(false)
      }
    },
    [user, friends, friendsLoading]
  )

  return {
    fetchFriendsWorkoutsForDate,
    loading,
    error,
  }
}

