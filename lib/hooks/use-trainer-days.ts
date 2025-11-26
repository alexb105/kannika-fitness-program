"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DayPlan } from '@/app/page'

interface UseTrainerDaysProps {
  trainerId: string
  trainerName: string
}

export function useTrainerDays({ trainerId, trainerName }: UseTrainerDaysProps) {
  const [days, setDays] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(true)
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

  // Fetch days from Supabase
  const fetchDays = async () => {
    try {
      setLoading(true)
      setError(null)

      let dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        // If trainer doesn't exist, create it
        const { data: newTrainer, error: trainerError } = await supabase
          .from('trainers')
          .insert({ name: trainerName.toLowerCase() })
          .select()
          .single()

        if (trainerError) throw trainerError
        dbTrainerId = newTrainer.id
      }

      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('trainer_id', dbTrainerId)
        .eq('archived', false)
        .order('date', { ascending: true })

      if (error) throw error

      // Convert database format to DayPlan format (only non-archived days)
      const convertedDays: DayPlan[] = (data || [])
        .filter((day) => !day.archived)
        .map((day) => ({
          id: day.id,
          date: new Date(day.date),
          type: day.type as 'workout' | 'rest' | 'empty',
          exercises: day.exercises as string[] | undefined,
          duration: day.duration || undefined,
          notes: day.notes || undefined,
          completed: day.completed || false,
        }))

      // If no days exist, create initial 7 days in the database
      if (convertedDays.length === 0) {
        const today = new Date()
        const daysToInsert = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          daysToInsert.push({
            trainer_id: dbTrainerId,
            date: date.toISOString().split('T')[0],
            type: 'empty',
            exercises: [],
            completed: false,
            archived: false,
          })
        }

        const { data: insertedDays, error: insertError } = await supabase
          .from('days')
          .insert(daysToInsert)
          .select()

        if (insertError) throw insertError

        const newDays: DayPlan[] = (insertedDays || [])
          .filter((day) => !day.archived)
          .map((day) => ({
            id: day.id,
            date: new Date(day.date),
            type: day.type as 'workout' | 'rest' | 'empty',
            exercises: day.exercises as string[] | undefined,
            duration: day.duration || undefined,
            notes: day.notes || undefined,
            completed: day.completed || false,
          }))

        setDays(newDays)
      } else {
        setDays(convertedDays)
      }
    } catch (err) {
      console.error('Error fetching days:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Save a day to Supabase
  const saveDay = async (day: DayPlan) => {
    try {
      let dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        // If trainer doesn't exist, create it
        const { data: newTrainer, error: trainerError } = await supabase
          .from('trainers')
          .insert({ name: trainerName.toLowerCase() })
          .select()
          .single()

        if (trainerError) throw trainerError
        dbTrainerId = newTrainer.id
      }

      // Upsert the day (use date + trainer_id as unique constraint)
      // Don't allow empty days to be marked as completed
      const canBeCompleted = day.type !== "empty"
      const dayData: any = {
        trainer_id: dbTrainerId,
        date: day.date.toISOString().split('T')[0],
        type: day.type,
        exercises: day.exercises || [],
        duration: day.duration || null,
        notes: day.notes || null,
        completed: canBeCompleted ? (day.completed || false) : false,
        archived: false, // Ensure new/updated days are not archived
      }

      // Only include id if it's a valid UUID (not a temporary local ID)
      if (day.id && !day.id.includes('-day-')) {
        dayData.id = day.id
      }

      const { data: upsertedDay, error: dayError } = await supabase
        .from('days')
        .upsert(dayData, {
          onConflict: 'trainer_id,date',
        })
        .select()
        .single()

      if (dayError) throw dayError

      // Update local state with the database ID
      // Ensure empty days are never marked as completed
      const updatedDay: DayPlan = {
        ...day,
        id: upsertedDay.id, // Use the database ID
        completed: day.type === "empty" ? false : (upsertedDay.completed || false),
      }

      setDays((prevDays) => {
        const existingIndex = prevDays.findIndex((d) => d.id === day.id)
        if (existingIndex >= 0) {
          const newDays = [...prevDays]
          newDays[existingIndex] = updatedDay
          return newDays
        }
        return [...prevDays, updatedDay]
      })
    } catch (err) {
      console.error('Error saving day:', err)
      setError(err as Error)
      throw err
    }
  }

  // Archive the oldest day
  const archiveOldestDay = async (dbTrainerId: string) => {
    try {
      // Find the oldest non-archived day
      const { data: oldestDays, error: fetchError } = await supabase
        .from('days')
        .select('id')
        .eq('trainer_id', dbTrainerId)
        .eq('archived', false)
        .order('date', { ascending: true })
        .limit(1)

      if (fetchError) throw fetchError

      if (oldestDays && oldestDays.length > 0) {
        // Archive the oldest day
        const { error: archiveError } = await supabase
          .from('days')
          .update({ archived: true })
          .eq('id', oldestDays[0].id)

        if (archiveError) throw archiveError

        // Remove from local state
        setDays((prevDays) => prevDays.filter((d) => d.id !== oldestDays[0].id))
      }
    } catch (err) {
      console.error('Error archiving oldest day:', err)
      // Don't throw - we still want to add the new day even if archiving fails
    }
  }

  // Add a new day
  const addDay = async () => {
    try {
      const lastDay = days[days.length - 1]
      const nextDate = new Date(lastDay.date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dbTrainerId = await fetchTrainerId()
      if (!dbTrainerId) {
        throw new Error('Trainer not found')
      }

      // If we have 7 or more active days, archive the oldest one
      if (days.length >= 7) {
        await archiveOldestDay(dbTrainerId)
      }

      // Insert the new day directly to get a proper UUID
      const { data: insertedDay, error: insertError } = await supabase
        .from('days')
        .insert({
          trainer_id: dbTrainerId,
          date: nextDate.toISOString().split('T')[0],
          type: 'empty',
          exercises: [],
          completed: false,
          archived: false,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newDay: DayPlan = {
        id: insertedDay.id,
        date: new Date(insertedDay.date),
        type: insertedDay.type as 'workout' | 'rest' | 'empty',
        exercises: insertedDay.exercises as string[] | undefined,
        duration: insertedDay.duration || undefined,
        notes: insertedDay.notes || undefined,
        completed: insertedDay.completed || false,
      }

      setDays((prevDays) => [...prevDays, newDay])
    } catch (err) {
      console.error('Error adding day:', err)
      setError(err as Error)
    }
  }

  // Toggle completion
  const toggleComplete = async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      if (!day) return

      // Don't allow empty days to be marked as completed
      if (day.type === "empty") {
        return
      }

      const updatedDay = { ...day, completed: !day.completed }
      await saveDay(updatedDay)
    } catch (err) {
      console.error('Error toggling completion:', err)
      setError(err as Error)
    }
  }

  useEffect(() => {
    fetchDays()
  }, [trainerId, trainerName])

  return {
    days,
    loading,
    error,
    saveDay,
    addDay,
    toggleComplete,
    refetch: fetchDays,
  }
}

