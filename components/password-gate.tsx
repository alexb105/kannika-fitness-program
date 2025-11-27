"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import { STORAGE_KEYS, AUTH_EXPIRY_DAYS } from "@/lib/constants"

export function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
      const checkAuth = () => {
      const authStatus = localStorage.getItem(STORAGE_KEYS.AUTH)
      const authTimestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP)

      if (authStatus === "true" && authTimestamp) {
        const timestamp = parseInt(authTimestamp, 10)
        const now = Date.now()
        const daysSinceAuth = (now - timestamp) / (1000 * 60 * 60 * 24)

        // Check if authentication is still valid (within expiry period)
        if (daysSinceAuth < AUTH_EXPIRY_DAYS) {
          setIsAuthenticated(true)
          setLoading(false)
          return
        } else {
          // Expired, clear auth
          localStorage.removeItem(STORAGE_KEYS.AUTH)
          localStorage.removeItem(STORAGE_KEYS.AUTH_TIMESTAMP)
        }
      }

      // Check for password in URL parameters
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const urlPassword = urlParams.get("password")
        
        if (urlPassword) {
          // Auto-fill password from URL
          setPassword(urlPassword)
          
          // Auto-submit if password is correct
          const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD
          if (urlPassword === correctPassword) {
            localStorage.setItem(STORAGE_KEYS.AUTH, "true")
            localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString())
            setIsAuthenticated(true)
            
            // Clean up URL by removing password parameter
            urlParams.delete("password")
            const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "")
            window.history.replaceState({}, "", newUrl)
          }
        }
      }

      setLoading(false)
    }

    checkAuth()
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
      // Store authentication with timestamp
      localStorage.setItem(STORAGE_KEYS.AUTH, "true")
      localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString())
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me (auto-sign in for 1 year)
              </Label>
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

