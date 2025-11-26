"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DayPlan } from '@/app/page'

interface UseArchivedDaysProps {
  trainerName: string
}

export function useArchivedDays({ trainerName }: UseArchivedDaysProps) {
  const [archivedDays, setArchivedDays] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch trainer ID from database
  const fetchTrainerId = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('id')
        .eq('name', trainerName.toLowerCase())
        .single()

      if (error) throw error
      return data?.id
    } catch (err) {
      console.error('Error fetching trainer ID:', err)
      return null
    }
  }

  // Fetch archived days from Supabase
  const fetchArchivedDays = async () => {
    try {
      setLoading(true)
      setError(null)

      const dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        setArchivedDays([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('trainer_id', dbTrainerId)
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
      }))

      setArchivedDays(convertedDays)
    } catch (err) {
      console.error('Error fetching archived days:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Delete an archived day
  const deleteArchivedDay = async (dayId: string) => {
    try {
      const { error } = await supabase
        .from('days')
        .delete()
        .eq('id', dayId)

      if (error) throw error

      // Remove from local state
      setArchivedDays((prevDays) => prevDays.filter((d) => d.id !== dayId))
    } catch (err) {
      console.error('Error deleting archived day:', err)
      setError(err as Error)
      throw err
    }
  }

  useEffect(() => {
    // Don't fetch automatically - only when explicitly called
  }, [trainerName])

  return {
    archivedDays,
    loading,
    error,
    fetchArchivedDays,
    deleteArchivedDay,
  }
}

