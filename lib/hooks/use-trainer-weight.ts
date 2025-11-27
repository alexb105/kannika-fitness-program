"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface WeightEntry {
  id: string
  trainerId: string
  weight: number
  date: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface UseTrainerWeightProps {
  trainerId: string
  trainerName: string
}

export function useTrainerWeight({ trainerId, trainerName }: UseTrainerWeightProps) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const normalizedTrainerName = useMemo(() => trainerName.toLowerCase(), [trainerName])

  const fetchTrainerId = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('id')
        .eq('name', normalizedTrainerName)
        .single()

      if (error) throw error
      return data?.id
    } catch (err) {
      console.error('Error fetching trainer ID:', err)
      return null
    }
  }, [normalizedTrainerName])

  const fetchWeightEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        const { data: newTrainer, error: trainerError } = await supabase
          .from('trainers')
          .insert({ name: normalizedTrainerName })
          .select()
          .single()

        if (trainerError) throw trainerError
        dbTrainerId = newTrainer.id
      }

      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('trainer_id', dbTrainerId)
        .order('date', { ascending: false })

      if (error) throw error

      const convertedEntries: WeightEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        trainerId: entry.trainer_id,
        weight: parseFloat(entry.weight),
        date: new Date(entry.date),
        notes: entry.notes || undefined,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }))

      setWeightEntries(convertedEntries)
    } catch (err) {
      console.error('Error fetching weight entries:', err)
      setError(err as Error)
      toast({
        title: "Error loading weight data",
        description: "Failed to fetch weight entries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [fetchTrainerId, normalizedTrainerName, toast])

  const addWeightEntry = useCallback(async (weight: number, date: Date, notes?: string) => {
    try {
      let dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        const { data: newTrainer, error: trainerError } = await supabase
          .from('trainers')
          .insert({ name: normalizedTrainerName })
          .select()
          .single()

        if (trainerError) throw trainerError
        dbTrainerId = newTrainer.id
      }

      const dateStr = date.toISOString().split('T')[0]

      // Check if entry already exists for this date
      const { data: existing, error: checkError } = await supabase
        .from('weight_entries')
        .select('id')
        .eq('trainer_id', dbTrainerId)
        .eq('date', dateStr)
        .maybeSingle()

      // If there's an error and it's not a "not found" error, throw it
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        // Update existing entry
        const { data: updatedEntry, error: updateError } = await supabase
          .from('weight_entries')
          .update({
            weight,
            notes: notes || null,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) throw updateError

        setWeightEntries((prev) => {
          const filtered = prev.filter((e) => e.id !== existing.id)
          return [
            {
              id: updatedEntry.id,
              trainerId: updatedEntry.trainer_id,
              weight: parseFloat(updatedEntry.weight),
              date: new Date(updatedEntry.date),
              notes: updatedEntry.notes || undefined,
              createdAt: new Date(updatedEntry.created_at),
              updatedAt: new Date(updatedEntry.updated_at),
            },
            ...filtered,
          ].sort((a, b) => b.date.getTime() - a.date.getTime())
        })

        toast({
          title: "Weight updated",
          description: `Weight entry for ${dateStr} has been updated.`,
        })
      } else {
        // Insert new entry
        const { data: newEntry, error: insertError } = await supabase
          .from('weight_entries')
          .insert({
            trainer_id: dbTrainerId,
            weight,
            date: dateStr,
            notes: notes || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        setWeightEntries((prev) => [
          {
            id: newEntry.id,
            trainerId: newEntry.trainer_id,
            weight: parseFloat(newEntry.weight),
            date: new Date(newEntry.date),
            notes: newEntry.notes || undefined,
            createdAt: new Date(newEntry.created_at),
            updatedAt: new Date(newEntry.updated_at),
          },
          ...prev,
        ])

        toast({
          title: "Weight logged",
          description: `Weight entry for ${dateStr} has been added.`,
        })
      }
    } catch (err) {
      console.error('Error adding weight entry:', err)
      setError(err as Error)
      toast({
        title: "Error logging weight",
        description: "Failed to save weight entry. Please try again.",
        variant: "destructive",
      })
      throw err
    }
  }, [fetchTrainerId, normalizedTrainerName, toast])

  const deleteWeightEntry = useCallback(async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      setWeightEntries((prev) => prev.filter((e) => e.id !== entryId))

      toast({
        title: "Weight entry deleted",
        description: "The weight entry has been removed.",
      })
    } catch (err) {
      console.error('Error deleting weight entry:', err)
      setError(err as Error)
      toast({
        title: "Error deleting entry",
        description: "Failed to delete weight entry. Please try again.",
        variant: "destructive",
      })
      throw err
    }
  }, [toast])

  useEffect(() => {
    fetchWeightEntries()
  }, [trainerId, fetchWeightEntries])

  // Get latest weight
  const latestWeight = useMemo(() => {
    if (weightEntries.length === 0) return null
    return weightEntries[0] // Already sorted by date DESC
  }, [weightEntries])

  // Get weight change (latest vs previous)
  const weightChange = useMemo(() => {
    if (weightEntries.length < 2) return null
    const latest = weightEntries[0]
    const previous = weightEntries[1]
    return {
      amount: latest.weight - previous.weight,
      percentage: ((latest.weight - previous.weight) / previous.weight) * 100,
    }
  }, [weightEntries])

  return {
    weightEntries,
    loading,
    error,
    addWeightEntry,
    deleteWeightEntry,
    refetch: fetchWeightEntries,
    latestWeight,
    weightChange,
  }
}

