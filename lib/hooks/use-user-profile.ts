"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/contexts/auth-context"

export interface UserProfile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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

  // Update username
  const updateUsername = useCallback(async (newUsername: string) => {
    if (!user) throw new Error("Not authenticated")

    setUpdating(true)
    setError(null)

    try {
      const trimmedUsername = newUsername.trim()
      
      // Validate username format
      if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        throw new Error("Username must be between 3 and 20 characters")
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        throw new Error("Username can only contain letters, numbers, underscores, and hyphens")
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: trimmedUsername,
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("This username is already taken")
        }
        throw updateError
      }

      // Update local state
      setProfile((prev) => prev ? { ...prev, username: trimmedUsername } : null)
    } catch (err) {
      console.error("Error updating username:", err)
      setError(err as Error)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [user])

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) throw new Error("Not authenticated")

    setUpdating(true)
    setError(null)

    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file")
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image must be less than 2MB")
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })

      if (updateError) throw updateError

      // Update local state
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null)

      return avatarUrl
    } catch (err) {
      console.error("Error uploading avatar:", err)
      setError(err as Error)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [user])

  // Remove avatar
  const removeAvatar = useCallback(async () => {
    if (!user) throw new Error("Not authenticated")

    setUpdating(true)
    setError(null)

    try {
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile((prev) => prev ? { ...prev, avatar_url: null } : null)
    } catch (err) {
      console.error("Error removing avatar:", err)
      setError(err as Error)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [user])

  const hasUsername = profile?.username !== null && profile?.username !== undefined && profile.username.trim() !== ""

  return {
    profile,
    username: profile?.username || null,
    avatarUrl: profile?.avatar_url || null,
    loading,
    updating,
    error,
    hasUsername,
    refetch: fetchProfile,
    updateUsername,
    uploadAvatar,
    removeAvatar,
  }
}

