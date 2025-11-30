"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/contexts/auth-context'
import type { DayPlan } from '@/app/page'

export function useArchivedDays() {
  const { user } = useAuth()
  const [archivedDays, setArchivedDays] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch archived days from Supabase
  const fetchArchivedDays = useCallback(async () => {
    if (!user) {
      setArchivedDays([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', true)
        .order('date', { ascending: false })

      if (error) throw error

      // Convert database format to DayPlan format
      const convertedDays: DayPlan[] = (data || []).map((day) => ({
        id: day.id,
        date: new Date(day.date),
        type: day.type as 'workout' | 'rest' | 'empty',
        exercises: day.exercises as string[] | undefined,
        duration: day.duration || undefined,
        notes: day.notes || undefined,
        completed: day.completed || false,
        missed: day.missed || false,
      }))

      setArchivedDays(convertedDays)
    } catch (err) {
      console.error('Error fetching archived days:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Delete an archived day
  const deleteArchivedDay = async (dayId: string) => {
    try {
      const { error } = await supabase
        .from('days')
        .delete()
        .eq('id', dayId)

      if (error) throw error

      setArchivedDays((prev) => prev.filter((day) => day.id !== dayId))
    } catch (err) {
      console.error('Error deleting archived day:', err)
      setError(err as Error)
      throw err
    }
  }

  useEffect(() => {
    fetchArchivedDays()
  }, [fetchArchivedDays])

  return {
    archivedDays,
    loading,
    error,
    refetch: fetchArchivedDays,
    deleteArchivedDay,
  }
}
