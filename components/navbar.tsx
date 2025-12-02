"use client"

import { useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dumbbell, ArrowLeft, Scale, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationBell } from "@/components/notification-bell"
import { ProfileMenu } from "@/components/profile-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FriendsList } from "@/components/friends-list"
import { useLanguage } from "@/lib/contexts/language-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserProfile } from "@/lib/hooks/use-user-profile"

export function Navbar() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { username } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const [isFriendsOpen, setIsFriendsOpen] = useState(false)

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  const handleWeightTracking = useCallback(() => {
    router.push("/weight")
  }, [router])

  const showBackButton = pathname !== "/" && pathname !== "/login"
  const isWeightPage = pathname === "/weight"

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ios-blur safe-top">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 md:px-8 safe-x">
        {/* Left side - Back button (if not on home) and Logo/Title */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 touch-target"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5" />
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
                className="h-10 w-10 sm:w-auto sm:px-3 gap-2 touch-target"
                title="Friends"
              >
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">Friends</span>
              </Button>
              {/* Weight Tracking Button */}
              {!isWeightPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWeightTracking}
                  className="h-10 w-10 sm:w-auto sm:px-3 gap-2 touch-target"
                  title={t("weightTracking")}
                >
                  <Scale className="h-5 w-5" />
                  <span className="hidden sm:inline">{t("weightTracking")}</span>
                </Button>
              )}
              <LanguageSwitcher />
              <NotificationBell />
              <ProfileMenu />
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

