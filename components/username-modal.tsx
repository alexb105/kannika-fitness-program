"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User } from "lucide-react"

interface UsernameModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function UsernameModal({ isOpen, onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setUsername("")
      setError("")
    }
  }, [isOpen])

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return "Username is required"
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters"
    }
    if (value.length > 20) {
      return "Username must be less than 20 characters"
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Username can only contain letters, numbers, underscores, and hyphens"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Check if username is already taken
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingProfile) {
        setError("This username is already taken. Please choose another one.")
        setLoading(false)
        return
      }

      // Create or update profile with username
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username: username.trim().toLowerCase(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        )

      if (upsertError) {
        throw upsertError
      }

      toast({
        title: "Username created!",
        description: `Welcome, ${username}!`,
      })

      onComplete()
    } catch (err: any) {
      console.error("Error creating username:", err)
      setError(err.message || "Failed to create username. Please try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to create username. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center">Create Your Username</DialogTitle>
          <DialogDescription className="text-center">
            Choose a unique username to personalize your Elite Fitness experience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError("")
              }}
              placeholder="johndoe"
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
              autoFocus
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters. Letters, numbers, underscores, and hyphens only.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !username.trim()}>
            {loading ? "Creating..." : "Create Username"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

