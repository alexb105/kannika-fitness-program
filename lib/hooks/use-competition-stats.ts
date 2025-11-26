"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CompetitionStats {
  alexander: number
  kannika: number
  loading: boolean
  error: Error | null
}

export function useCompetitionStats() {
  const [stats, setStats] = useState<CompetitionStats>({
    alexander: 0,
    kannika: 0,
    loading: true,
    error: null,
  })

  const fetchStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }))

      // Fetch trainer IDs
      const { data: trainers, error: trainersError } = await supabase
        .from('trainers')
        .select('id, name')
        .in('name', ['alexander', 'kannika'])

      if (trainersError) throw trainersError

      if (!trainers || trainers.length === 0) {
        setStats({ alexander: 0, kannika: 0, loading: false, error: null })
        return
      }

      const alexanderId = trainers.find((t) => t.name === 'alexander')?.id
      const kannikaId = trainers.find((t) => t.name === 'kannika')?.id

      // Fetch completed workouts for each trainer (only non-archived)
      const [alexanderCount, kannikaCount] = await Promise.all([
        alexanderId
          ? supabase
              .from('days')
              .select('id', { count: 'exact', head: true })
              .eq('trainer_id', alexanderId)
              .eq('type', 'workout')
              .eq('completed', true)
              .eq('archived', false)
          : Promise.resolve({ count: 0, error: null }),
        kannikaId
          ? supabase
              .from('days')
              .select('id', { count: 'exact', head: true })
              .eq('trainer_id', kannikaId)
              .eq('type', 'workout')
              .eq('completed', true)
              .eq('archived', false)
          : Promise.resolve({ count: 0, error: null }),
      ])

      setStats({
        alexander: alexanderCount.count || 0,
        kannika: kannikaCount.count || 0,
        loading: false,
        error: null,
      })
    } catch (err) {
      console.error('Error fetching competition stats:', err)
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: err as Error,
      }))
    }
  }

  useEffect(() => {
    fetchStats()

    // Subscribe to changes in the days table (only updates that might affect stats)
    const channel = supabase
      .channel('competition-stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'days',
          filter: 'type=eq.workout',
        },
        (payload) => {
          // Only refetch if completed status changed
          if (payload.new.completed !== payload.old?.completed) {
            fetchStats()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'days',
          filter: 'type=eq.workout',
        },
        () => {
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'days',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { ...stats, refetch: fetchStats }
}

