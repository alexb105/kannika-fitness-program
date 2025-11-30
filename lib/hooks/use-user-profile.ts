"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"

export interface UserProfile {
  id: string
  username: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      setProfile(data || null)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const hasUsername = profile?.username !== null && profile?.username !== undefined && profile.username.trim() !== ""

  return {
    profile,
    username: profile?.username || null,
    loading,
    error,
    hasUsername,
    refetch: fetchProfile,
  }
}

