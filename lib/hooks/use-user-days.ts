"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/contexts/auth-context'
import type { DayPlan } from '@/app/page'

export function useUserDays() {
  const { user } = useAuth()
  const [days, setDays] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [earliestDate, setEarliestDate] = useState<Date | null>(null) // Track the earliest date loaded
  const [selectedDate, setSelectedDate] = useState<Date | null>(null) // Track the date user wants to view
  const [allDatesWithData, setAllDatesWithData] = useState<Date[]>([]) // Track all dates that have data
  const [displayLimit, setDisplayLimit] = useState<number>(7) // Show only 7 cards at a time

  // Fetch all dates that have data (for calendar disabling)
  const fetchAllDatesWithData = useCallback(async () => {
    if (!user) return

    try {
      // Fetch just the dates (not full data) to know which dates are available
      const { data, error } = await supabase
        .from('days')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching dates:', error)
        return
      }

      if (data) {
        const dates = data.map(d => new Date(d.date))
        setAllDatesWithData(dates)
      }
    } catch (err) {
      console.error('Error fetching all dates:', err)
    }
  }, [user])

  // Fetch days from Supabase (loads around selected date or current date)
  const fetchDays = useCallback(async (loadPreviousWeek: boolean = false, targetDate?: Date) => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Use target date if provided, otherwise use selected date or today
      const centerDate = targetDate || selectedDate || today
      centerDate.setHours(0, 0, 0, 0)
      
      // Calculate date range
      let startDate: Date
      if (loadPreviousWeek && earliestDate) {
        // Load one week before the earliest date we have
        startDate = new Date(earliestDate)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
      } else if (targetDate || selectedDate) {
        // Jump to specific date: show 1 week before and 2 weeks after
        startDate = new Date(centerDate)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
      } else {
        // Initial load: start from 1 week ago to show some history
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
      }

      // Always load up to 2 weeks after the center date
      const endDate = new Date(centerDate)
      endDate.setDate(endDate.getDate() + 14)

      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        // Check if error is due to missing column (migration not run)
        const errorMsg = error.message || String(error) || 'Unknown error'
        if (errorMsg.includes('column') && errorMsg.includes('user_id')) {
          throw new Error(
            'Database migration required: The user_id column does not exist. ' +
            'Please run the migration file: supabase/complete_schema.sql or supabase/migration_to_user_auth.sql'
          )
        }
        // Check for RLS policy errors
        if (errorMsg.includes('permission') || errorMsg.includes('policy') || errorMsg.includes('RLS')) {
          throw new Error(
            'Database permission error: Row Level Security policies may not be set up correctly. ' +
            'Please ensure you have run the complete schema migration.'
          )
        }
        // Create a proper error with message
        const supabaseError = new Error(errorMsg)
        ;(supabaseError as any).code = error.code
        ;(supabaseError as any).details = error.details
        ;(supabaseError as any).hint = error.hint
        throw supabaseError
      }

      // Convert database format to DayPlan format
      let convertedDays: DayPlan[] = (data || []).map((day) => ({
        id: day.id,
        date: new Date(day.date),
        type: day.type as 'workout' | 'rest' | 'empty',
        exercises: day.exercises as string[] | undefined,
        duration: day.duration || undefined,
        notes: day.notes || undefined,
        completed: day.completed || false,
        missed: day.missed || false,
      }))

      // If jumping to a specific date, ensure that date is first in the list
      if (targetDate || selectedDate) {
        const target = targetDate || selectedDate
        target.setHours(0, 0, 0, 0)
        
        // Find the day that matches the target date
        const targetDay = convertedDays.find(d => {
          const dayDate = new Date(d.date)
          dayDate.setHours(0, 0, 0, 0)
          return dayDate.getTime() === target.getTime()
        })
        
        // If target date exists, reorder to start from that date
        if (targetDay) {
          const targetIndex = convertedDays.indexOf(targetDay)
          // Reorder: put target date first, then all days after it, then all days before it
          const daysBefore = convertedDays.slice(0, targetIndex)
          const daysFromTarget = convertedDays.slice(targetIndex)
          convertedDays = [...daysFromTarget, ...daysBefore]
        }
        // If target date doesn't exist in the loaded range, just show what we have
        // (it will be disabled in the calendar anyway)
      }

      // If no days exist, create initial week of days
      if (convertedDays.length === 0 && !loadPreviousWeek) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const daysToInsert = []
        
        // Create 7 days starting from today
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          daysToInsert.push({
            user_id: user.id,
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

        const newDays: DayPlan[] = (insertedDays || []).map((day) => ({
          id: day.id,
          date: new Date(day.date),
          type: day.type as 'workout' | 'rest' | 'empty',
          exercises: day.exercises as string[] | undefined,
          duration: day.duration || undefined,
          notes: day.notes || undefined,
          completed: day.completed || false,
          missed: day.missed || false,
        }))

        setDays(newDays)
        if (newDays.length > 0) {
          setEarliestDate(new Date(newDays[0].date))
        }
      } else {
        // Merge with existing days (avoid duplicates)
        if (loadPreviousWeek) {
          setDays((prevDays) => {
            const merged = [...convertedDays, ...prevDays]
            // Remove duplicates and sort by date
            const unique = merged.filter((day, index, self) =>
              index === self.findIndex((d) => d.id === day.id)
            )
            unique.sort((a, b) => a.date.getTime() - b.date.getTime())
            if (unique.length > 0) {
              setEarliestDate(new Date(unique[0].date))
            }
            return unique
          })
        } else {
          // When jumping to a specific date, the convertedDays is already reordered
          // to start from the target date (done above)
          setDays(convertedDays)
          
          if (convertedDays.length > 0) {
            // Set earliest date to the first day in the list (which is the selected date if jumping)
            setEarliestDate(new Date(convertedDays[0].date))
          }
          
          // Update all dates with data
          await fetchAllDatesWithData()
        }
      }
    } catch (err: any) {
      // Extract error message from various error types
      let errorMessage = 'Failed to fetch days'
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
      console.error('Error fetching days:', {
        message: errorMessage,
        error: err,
        errorType: err?.constructor?.name,
        errorCode: err?.code,
        errorDetails: err?.details,
        errorHint: err?.hint,
        userId: user?.id,
      })
      
      // Set a proper error object
      const errorObj = err instanceof Error ? err : new Error(errorMessage)
      setError(errorObj)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Save a day to Supabase
  const saveDay = async (day: DayPlan) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // Upsert the day (use date + user_id as unique constraint)
      // Don't allow empty days to be marked as completed or missed
      const canBeCompleted = day.type !== "empty"
      const dayData: any = {
        user_id: user.id,
        date: day.date.toISOString().split('T')[0],
        type: day.type,
        exercises: day.exercises || [],
        duration: day.duration || null,
        notes: day.notes || null,
        completed: canBeCompleted ? (day.completed || false) : false,
        missed: canBeCompleted ? (day.missed || false) : false,
        archived: false, // Keep days unarchived
      }

      // Only include id if it's a valid UUID (not a temporary local ID)
      if (day.id && !day.id.includes('-day-')) {
        dayData.id = day.id
      }

      const { data: upsertedDay, error: dayError } = await supabase
        .from('days')
        .upsert(dayData, {
          onConflict: 'user_id,date',
        })
        .select()
        .single()

      if (dayError) throw dayError

      // Update local state with the database ID
      // Ensure empty days are never marked as completed or missed
      const updatedDay: DayPlan = {
        ...day,
        id: upsertedDay.id, // Use the database ID
        completed: day.type === "empty" ? false : (upsertedDay.completed || false),
        missed: day.type === "empty" ? false : (upsertedDay.missed || false),
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
      
      // Update available dates when a day is saved
      await fetchAllDatesWithData()
    } catch (err) {
      console.error('Error saving day:', err)
      setError(err as Error)
      throw err
    }
  }

  // Add a new day
  const addDay = async () => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // Use the full days array to get the actual last day
      if (days.length === 0) {
        throw new Error('No days available to add a new day after')
      }
      
      const lastDay = days[days.length - 1]
      const nextDate = new Date(lastDay.date)
      nextDate.setDate(nextDate.getDate() + 1)
      nextDate.setHours(0, 0, 0, 0)

      // Use upsert to handle case where day already exists
      const { data: upsertedDay, error: upsertError } = await supabase
        .from('days')
        .upsert({
          user_id: user.id,
          date: nextDate.toISOString().split('T')[0],
          type: 'empty',
          exercises: [],
          completed: false,
          archived: false,
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      const newDay: DayPlan = {
        id: upsertedDay.id,
        date: new Date(upsertedDay.date),
        type: upsertedDay.type as 'workout' | 'rest' | 'empty',
        exercises: upsertedDay.exercises as string[] | undefined,
        duration: upsertedDay.duration || undefined,
        notes: upsertedDay.notes || undefined,
        completed: upsertedDay.completed || false,
        missed: upsertedDay.missed || false,
      }

      // Calculate the updated array first
      const existingIndex = days.findIndex((d) => {
        const dayDate = new Date(d.date)
        dayDate.setHours(0, 0, 0, 0)
        return dayDate.getTime() === nextDate.getTime()
      })
      
      let updatedDays: DayPlan[]
      if (existingIndex >= 0) {
        // Update existing day
        updatedDays = [...days]
        updatedDays[existingIndex] = newDay
        updatedDays.sort((a, b) => a.date.getTime() - b.date.getTime())
      } else {
        // Add new day
        updatedDays = [...days, newDay]
        updatedDays.sort((a, b) => a.date.getTime() - b.date.getTime())
      }
      
      // Update state
      setDays(updatedDays)
      
      // If the new day is beyond the current display limit, increase it to show the new day
      const newDayIndex = updatedDays.findIndex((d) => d.id === newDay.id)
      if (newDayIndex >= 0 && newDayIndex >= displayLimit) {
        // Show at least enough to display the new day
        setDisplayLimit(newDayIndex + 1)
      }
      
      // Update available dates
      await fetchAllDatesWithData()
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

      // If marking as completed, unmark as missed (mutually exclusive)
      const updatedDay = { 
        ...day, 
        completed: !day.completed,
        missed: !day.completed ? false : day.missed, // Unmark missed if completing
      }
      await saveDay(updatedDay)
    } catch (err) {
      console.error('Error toggling completion:', err)
      setError(err as Error)
    }
  }

  // Toggle missed status
  const toggleMissed = async (dayId: string) => {
    try {
      const day = days.find((d) => d.id === dayId)
      if (!day) return

      // Don't allow empty days to be marked as missed
      if (day.type === "empty") {
        return
      }

      // If marking as missed, unmark as completed (mutually exclusive)
      const updatedDay = { 
        ...day, 
        missed: !day.missed,
        completed: !day.missed ? false : day.completed, // Unmark completed if missing
      }
      await saveDay(updatedDay)
    } catch (err) {
      console.error('Error toggling missed status:', err)
      setError(err as Error)
    }
  }

  useEffect(() => {
    fetchDays()
    fetchAllDatesWithData()
  }, [fetchDays, fetchAllDatesWithData])

  const loadPreviousWeek = useCallback(async () => {
    await fetchDays(true)
  }, [fetchDays])

  const jumpToDate = useCallback(async (date: Date) => {
    setSelectedDate(date)
    setDisplayLimit(7) // Reset to 7 when jumping to a new date
    await fetchDays(false, date)
  }, [fetchDays])

  const loadMoreDays = useCallback(() => {
    setDisplayLimit((prev) => prev + 7)
  }, [])

  // Check if there are more weeks to load (if earliest date is more than a week old)
  const hasMoreWeeks = useMemo(() => {
    if (!earliestDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Show button if earliest date is less than 30 days ago (reasonable limit)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return earliestDate.getTime() > thirtyDaysAgo.getTime()
  }, [earliestDate])

  // Get only the days to display (limited to displayLimit)
  const displayedDays = useMemo(() => {
    return days.slice(0, displayLimit)
  }, [days, displayLimit])

  // Check if there are more days to load
  const hasMoreDays = useMemo(() => {
    return days.length > displayLimit
  }, [days.length, displayLimit])

  // Check if user is viewing the last day (can add new day)
  const canAddDay = useMemo(() => {
    if (days.length === 0) return true // Allow adding if no days exist
    if (displayedDays.length === 0) return false
    
    const lastDisplayedDay = displayedDays[displayedDays.length - 1]
    const lastDayInFullArray = days[days.length - 1]
    
    // Can add if the last displayed day is the last day in the full array
    return lastDisplayedDay.id === lastDayInFullArray.id
  }, [displayedDays, days])

  // Count all completed workouts across all loaded days
  const totalCompletedWorkouts = useMemo(() => {
    return days.filter((d) => d.completed && d.type === "workout").length
  }, [days])

  return {
    days: displayedDays,
    allDays: days, // Keep full days array for other operations
    loading,
    error,
    saveDay,
    addDay,
    toggleComplete,
    toggleMissed,
    loadPreviousWeek,
    jumpToDate,
    loadMoreDays,
    selectedDate,
    allDatesWithData,
    hasMoreWeeks,
    hasMoreDays,
    canAddDay,
    totalCompletedWorkouts,
    refetch: () => fetchDays(false),
  }
}

