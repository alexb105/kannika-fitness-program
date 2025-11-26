"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("app_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD

    if (!correctPassword) {
      setError("Password protection is not configured. Please contact the administrator.")
      return
    }

    if (password === correctPassword) {
      localStorage.setItem("app_authenticated", "true")
      setIsAuthenticated(true)
    } else {
      setError("Incorrect password. Please try again.")
      setPassword("")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Password Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter the password to access this application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Access Application
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

