"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  sender_username: string | null
  receiver_username: string | null
  status: "pending" | "accepted" | "declined"
  created_at: string
}

export function useFriendRequests() {
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchPendingRequests = useCallback(async () => {
    if (!user) {
      setPendingRequests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch pending requests where user is the receiver
      const { data: requestsData, error: fetchError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status, created_at")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Fetch usernames for senders
      const senderIds = (requestsData || []).map((r) => r.sender_id)
      let profilesMap: Record<string, string | null> = {}

      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", senderIds)

        if (profiles) {
          profiles.forEach((profile) => {
            profilesMap[profile.id] = profile.username
          })
        }
      }

      // Map requests with usernames
      const requestsList: FriendRequest[] = (requestsData || []).map((request) => ({
        id: request.id,
        sender_id: request.sender_id,
        receiver_id: request.receiver_id,
        sender_username: profilesMap[request.sender_id] || null,
        receiver_username: null, // Not needed for received requests
        status: request.status as "pending" | "accepted" | "declined",
        created_at: request.created_at,
      }))

      setPendingRequests(requestsList)
    } catch (err) {
      console.error("Error fetching friend requests:", err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const sendFriendRequest = useCallback(
    async (username: string) => {
      if (!user) {
        throw new Error("User not authenticated")
      }

      try {
        // Find user by username
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.trim().toLowerCase())
          .maybeSingle()

        // Check for specific error cases
        if (profileError) {
          // PGRST116 means no rows returned (username doesn't exist)
          if (profileError.code === "PGRST116" || profileError.message?.includes("No rows")) {
            throw new Error(`Username "${username.trim()}" does not exist`)
          }
          throw profileError
        }

        if (!profile) {
          throw new Error(`Username "${username.trim()}" does not exist`)
        }

        if (profile.id === user.id) {
          throw new Error("You cannot send a friend request to yourself")
        }

        // Check if already friends
        const { data: existingFriend, error: friendCheckError } = await supabase
          .from("friends")
          .select("id")
          .eq("user_id", user.id)
          .eq("friend_id", profile.id)
          .maybeSingle()

        if (friendCheckError && friendCheckError.code !== "PGRST116") {
          throw friendCheckError
        }

        if (existingFriend) {
          throw new Error("This user is already in your friends list")
        }

        // Check if request already exists (either direction)
        const { data: existingRequests, error: requestCheckError } = await supabase
          .from("friend_requests")
          .select("id, status, sender_id, receiver_id")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
          .limit(1)
        
        const existingRequest = existingRequests?.[0]

        if (requestCheckError && requestCheckError.code !== "PGRST116") {
          throw requestCheckError
        }

        if (existingRequest) {
          if (existingRequest.status === "pending") {
            if (existingRequest.sender_id === user.id) {
              throw new Error("You have already sent a friend request to this user")
            } else {
              throw new Error("This user has already sent you a friend request")
            }
          }
        }

        // Send friend request
        const { error: insertError } = await supabase
          .from("friend_requests")
          .insert({
            sender_id: user.id,
            receiver_id: profile.id,
            status: "pending",
          })

        if (insertError) {
          // Handle duplicate key constraint violation (friend request already exists)
          if (insertError.code === "23505" || insertError.message?.includes("duplicate key") || insertError.message?.includes("friend_requests_sender_receiver_unique")) {
            // Double-check the existing request to provide a better message
            const { data: checkRequest } = await supabase
              .from("friend_requests")
              .select("id, status, sender_id, receiver_id")
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
              .limit(1)
              .maybeSingle()
            
            if (checkRequest) {
              if (checkRequest.status === "pending") {
                if (checkRequest.sender_id === user.id) {
                  throw new Error("You have already sent a friend request to this user")
                } else {
                  throw new Error("This user has already sent you a friend request")
                }
              } else if (checkRequest.status === "accepted") {
                throw new Error("This user is already in your friends list")
              }
            }
            // Fallback message if we can't determine the exact state
            throw new Error("A friend request already exists between you and this user")
          }
          throw insertError
        }

        toast({
          title: "Friend request sent!",
          description: `Friend request sent to ${username}`,
        })
      } catch (err: any) {
        // Extract error message from various error types
        let errorMessage = "Failed to send friend request"
        
        // Try multiple ways to extract the error message
        if (err instanceof Error && err.message) {
          errorMessage = err.message
        } else if (err?.message && typeof err.message === "string" && err.message.trim()) {
          errorMessage = err.message
        } else if (typeof err === "string" && err.trim()) {
          errorMessage = err
        } else if (err) {
          // Try to extract meaningful error from Supabase error
          if (err.code) {
            // Handle specific Supabase error codes
            if (err.code === "23505") {
              errorMessage = "A friend request already exists between you and this user"
            } else if (err.code === "PGRST116") {
              errorMessage = `Username does not exist`
            } else {
              errorMessage = err.message || `Error ${err.code}: Unknown error`
            }
          } else if (err.details) {
            errorMessage = err.details
          } else if (err.hint) {
            errorMessage = err.hint
          } else {
            // Last resort: try to stringify, but provide fallback
            try {
              const errorStr = JSON.stringify(err)
              if (errorStr && errorStr !== "{}" && errorStr !== "null") {
                errorMessage = errorStr
              }
            } catch {
              // If stringify fails, use default message
              errorMessage = "Failed to send friend request. Please try again."
            }
          }
        }
        
        // Log detailed error information for debugging
        console.error("Error sending friend request:", {
          message: errorMessage,
          error: err,
          errorType: err?.constructor?.name,
          errorCode: err?.code,
          errorDetails: err?.details,
          errorHint: err?.hint,
          errorString: typeof err === "string" ? err : undefined,
          errorKeys: err && typeof err === "object" ? Object.keys(err) : undefined,
        })
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      }
    },
    [user, toast]
  )

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!user) {
        throw new Error("User not authenticated")
      }

      try {
        // Debug: Check the request details before updating
        const { data: requestData, error: fetchError } = await supabase
          .from("friend_requests")
          .select("id, sender_id, receiver_id, status")
          .eq("id", requestId)
          .single()

        if (fetchError) {
          console.error("Error fetching request details:", fetchError)
        } else {
          console.log("Request details:", {
            requestId,
            sender_id: requestData?.sender_id,
            receiver_id: requestData?.receiver_id,
            your_user_id: user.id,
            status: requestData?.status,
            is_receiver: requestData?.receiver_id === user.id,
          })

          if (requestData?.receiver_id !== user.id) {
            throw new Error(
              `Permission denied: You are not the receiver of this request. ` +
              `Your ID: ${user.id}, Receiver ID: ${requestData?.receiver_id}`
            )
          }
        }

        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "accepted" })
          .eq("id", requestId)
          .eq("receiver_id", user.id)
          .eq("status", "pending")

        if (error) {
          // Log the full error details for debugging
          console.error("Supabase error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            status: error.status,
          })
          
          // Extract error message
          const errorMsg = error.message || String(error) || 'Unknown error'
          
          // Check for specific error types
          if (errorMsg.includes('column') && errorMsg.includes('friend_requests')) {
            throw new Error(
              'Database migration required: The friend_requests table does not exist. ' +
              'Please run the migration file: supabase/migration_add_friend_requests.sql'
            )
          }
          
          // For RLS errors, include the actual Supabase error details
          if (errorMsg.includes('permission') || errorMsg.includes('policy') || errorMsg.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
            const detailedMsg = 
              'Database permission error: Row Level Security policies may not be set up correctly.\n' +
              `Error Code: ${error.code || 'unknown'}\n` +
              `Details: ${error.details || 'none'}\n` +
              `Hint: ${error.hint || 'none'}\n` +
              'Please ensure you have run the complete schema migration.'
            throw new Error(detailedMsg)
          }
          
          // Create a proper error with message
          const supabaseError = new Error(errorMsg)
          ;(supabaseError as any).code = error.code
          ;(supabaseError as any).details = error.details
          ;(supabaseError as any).hint = error.hint
          throw supabaseError
        }

        toast({
          title: "Friend request accepted!",
          description: "You are now friends",
        })

        // The database trigger will automatically:
        // 1. Create the bidirectional friendship
        // 2. Clean up other friend requests between these users
        
        // Clean up the accepted request (we can't delete it in the trigger)
        // This removes redundant accepted requests where friendship exists
        try {
          await supabase.rpc("cleanup_accepted_friend_requests")
        } catch (cleanupError) {
          // Non-fatal: cleanup is optional, the request will be filtered out anyway
          console.warn("Failed to cleanup accepted requests:", cleanupError)
        }
        
        // Refresh requests
        await fetchPendingRequests()
      } catch (err: any) {
        // Extract error message from various error types
        let errorMessage = 'Failed to accept friend request'
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (err?.message) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        } else if (err) {
          errorMessage = JSON.stringify(err)
        }
        
        // Log detailed error information
        console.error("Error accepting friend request:", {
          message: errorMessage,
          error: err,
          errorType: err?.constructor?.name,
          errorCode: err?.code,
          errorDetails: err?.details,
          errorHint: err?.hint,
          requestId,
          userId: user?.id,
        })
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      }
    },
    [user, toast, fetchPendingRequests]
  )

  const declineRequest = useCallback(
    async (requestId: string) => {
      if (!user) {
        throw new Error("User not authenticated")
      }

      try {
        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "declined" })
          .eq("id", requestId)
          .eq("receiver_id", user.id)
          .eq("status", "pending")

        if (error) throw error

        toast({
          title: "Friend request declined",
          description: "The request has been declined",
        })

        // Refresh requests
        await fetchPendingRequests()
      } catch (err: any) {
        // Extract error message from various error types
        let errorMessage = 'Failed to decline friend request'
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (err?.message) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        } else if (err) {
          errorMessage = JSON.stringify(err)
        }
        
        console.error("Error declining friend request:", {
          message: errorMessage,
          error: err,
          errorType: err?.constructor?.name,
          errorCode: err?.code,
          requestId,
          userId: user?.id,
        })
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw err
      }
    },
    [user, toast, fetchPendingRequests]
  )

  useEffect(() => {
    fetchPendingRequests()

    // Subscribe to real-time updates
    if (user) {
      const channel = supabase
        .channel("friend_requests")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "friend_requests",
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            fetchPendingRequests()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchPendingRequests])

  return {
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    refetch: fetchPendingRequests,
  }
}

