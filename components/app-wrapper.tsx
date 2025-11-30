"use client"

import { useRouter, usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"
import { LanguageProvider } from "@/lib/contexts/language-context"
import { UsernameModal } from "@/components/username-modal"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { useEffect, useState } from "react"

interface AppWrapperProps {
  children: React.ReactNode
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { hasUsername, loading: profileLoading, refetch } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const [showUsernameModal, setShowUsernameModal] = useState(false)

  const loading = authLoading || profileLoading

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/")
      }
    }
  }, [user, loading, router, pathname])

  useEffect(() => {
    if (!loading && user && pathname !== "/login") {
      if (!hasUsername) {
        setShowUsernameModal(true)
      } else {
        setShowUsernameModal(false)
      }
    }
  }, [loading, user, hasUsername, pathname])

  const handleUsernameComplete = async () => {
    await refetch()
    setShowUsernameModal(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null
  }

  return (
    <>
      {children}
      <UsernameModal isOpen={showUsernameModal} onComplete={handleUsernameComplete} />
    </>
  )
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGuard>{children}</AuthGuard>
      </AuthProvider>
    </LanguageProvider>
  )
}

