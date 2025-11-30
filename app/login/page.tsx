"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Dumbbell } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        if (isSignUp) {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account.",
          })
        } else {
          router.push("/")
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Sign up to start tracking your fitness journey with Elite Fitness"
              : "Sign in to access your Elite Fitness schedule"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Loading..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
            disabled={loading}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  )
}

