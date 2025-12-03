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
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8 safe-x">
        {/* Left side - Back button (if not on home) and Logo/Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 sm:h-10 sm:w-10 touch-target shrink-0"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary shrink-0">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
                {t("fitnessSchedule")}
              </h1>
              {username && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">@{username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Navigation and actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0">
          {user && pathname !== "/login" && (
            <>
              {/* Friends Button - Icon only on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFriendsOpen(true)}
                className="h-9 w-9 sm:h-10 sm:w-10 touch-target"
                title="Friends"
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Weight Tracking Button - Icon only on mobile */}
              {!isWeightPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWeightTracking}
                  className="h-9 w-9 sm:h-10 sm:w-10 touch-target"
                  title={t("weightTracking")}
                >
                  <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Profile Menu */}
              <ProfileMenu />
            </>
          )}
        </div>

        {/* Friends Dialog */}
        <Dialog open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Friends</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <FriendsList />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  )
}

