"use client"

import { useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dumbbell, LogOut, ArrowLeft, Scale, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationBell } from "@/components/notification-bell"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FriendsList } from "@/components/friends-list"
import { useLanguage } from "@/lib/contexts/language-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserProfile } from "@/lib/hooks/use-user-profile"

export function Navbar() {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const { username } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const [isFriendsOpen, setIsFriendsOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await signOut()
    router.push("/login")
  }, [signOut, router])

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  const handleWeightTracking = useCallback(() => {
    router.push("/weight")
  }, [router])

  const showBackButton = pathname !== "/" && pathname !== "/login"
  const isWeightPage = pathname === "/weight"

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left side - Back button (if not on home) and Logo/Title */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {t("fitnessSchedule")}
              </h1>
              {username && (
                <p className="text-xs text-muted-foreground">@{username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Navigation and actions */}
        <div className="flex items-center gap-2">
          {user && pathname !== "/login" && (
            <>
              {/* Friends Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFriendsOpen(true)}
                className="h-8 gap-2"
                title="Friends"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Friends</span>
              </Button>
              {/* Weight Tracking Button */}
              {!isWeightPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWeightTracking}
                  className="h-8 gap-2"
                  title={t("weightTracking")}
                >
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("weightTracking")}</span>
                </Button>
              )}
              <LanguageSwitcher />
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title={t("logout")}
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Friends Dialog */}
        <Dialog open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Friends</DialogTitle>
            </DialogHeader>
            <FriendsList />
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  )
}

