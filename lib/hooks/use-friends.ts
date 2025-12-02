"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export interface Friend {
  id: string
  friend_id: string
  username: string | null
  avatar_url: string | null
  email: string
  created_at: string
}

export function useFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch friends
      const { data: friendsData, error: fetchError } = await supabase
        .from("friends")
        .select("id, friend_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Fetch profiles for friends (username and avatar)
      const friendIds = (friendsData || []).map((f) => f.friend_id)
      let profilesMap: Record<string, { username: string | null; avatar_url: string | null }> = {}

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", friendIds)

        if (profiles) {
          profiles.forEach((profile) => {
            profilesMap[profile.id] = {
              username: profile.username,
              avatar_url: profile.avatar_url,
            }
          })
        }
      }

      // Map friends with profile data
      const friendsList: Friend[] = (friendsData || []).map((friend) => ({
        id: friend.id,
        friend_id: friend.friend_id,
        username: profilesMap[friend.friend_id]?.username || null,
        avatar_url: profilesMap[friend.friend_id]?.avatar_url || null,
        email: "", // Email not needed for now
        created_at: friend.created_at,
      }))

      setFriends(friendsList)
    } catch (err) {
      console.error("Error fetching friends:", err)
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Note: addFriendByUsername is now handled by useFriendRequests.sendFriendRequest
  // This function is kept for backward compatibility but should use friend requests instead
  const addFriendByUsername = useCallback(
    async (username: string) => {
      // This should now send a friend request instead of directly adding
      // Import and use useFriendRequests hook in components instead
      throw new Error("Please use friend requests to add friends")
    },
    []
  )

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!user) {
        throw new Error("User not authenticated")
      }

      try {
        // Use database function to remove bidirectional friendship
        // This ensures both directions are removed regardless of RLS
        const { error: deleteError } = await supabase.rpc(
          "remove_bidirectional_friendship",
          {
            p_user_id: user.id,
            p_friend_id: friendId,
          }
        )

        if (deleteError) {
          console.error("Error removing friendship:", deleteError)
          throw deleteError
        }

        toast({
          title: "Friend removed",
          description: "Friend has been removed from your list",
        })

        // Refresh friends list
        await fetchFriends()
      } catch (err: any) {
        console.error("Error removing friend:", err)
        toast({
          title: "Error",
          description: "Failed to remove friend",
          variant: "destructive",
        })
        throw err
      }
    },
    [user, toast, fetchFriends]
  )

  useEffect(() => {
    fetchFriends()

    // Subscribe to real-time updates for friends
    if (user) {
      const channel = supabase
        .channel("friends_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "friends",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchFriends()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchFriends])

  return {
    friends,
    loading,
    error,
    addFriendByUsername,
    removeFriend,
    refetch: fetchFriends,
  }
}

