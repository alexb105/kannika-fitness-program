"use client"

import { useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dumbbell, ArrowLeft, Scale, Users, Menu, X, Languages, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { ProfileMenu } from "@/components/profile-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FriendsList } from "@/components/friends-list"
import { useLanguage } from "@/lib/contexts/language-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { useFriendRequests } from "@/lib/hooks/use-friend-requests"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const { t, language, setLanguage } = useLanguage()
  const { user } = useAuth()
  const { username } = useUserProfile()
  const { pendingRequests } = useFriendRequests()
  const router = useRouter()
  const pathname = usePathname()
  const [isFriendsOpen, setIsFriendsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  const handleWeightTracking = useCallback(() => {
    setIsMobileMenuOpen(false)
    router.push("/weight")
  }, [router])

  const handleOpenFriends = useCallback(() => {
    setIsMobileMenuOpen(false)
    setIsFriendsOpen(true)
  }, [])

  const showBackButton = pathname !== "/" && pathname !== "/login"
  const isWeightPage = pathname === "/weight"
  const hasNotifications = pendingRequests.length > 0

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

        {/* Right side - Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-1 md:gap-2 shrink-0">
          {user && pathname !== "/login" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFriendsOpen(true)}
                className="h-10 w-10"
                title="Friends"
              >
                <Users className="h-5 w-5" />
              </Button>
              
              {!isWeightPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWeightTracking}
                  className="h-10 w-10"
                  title={t("weightTracking")}
                >
                  <Scale className="h-5 w-5" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === "en" ? "th" : "en")}
                className="h-10 w-10"
                title="Change language"
              >
                <Languages className="h-5 w-5" />
              </Button>
              
              <NotificationBell />
              <ProfileMenu />
            </>
          )}
        </div>

        {/* Mobile - Notification + Profile + Hamburger */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          {user && pathname !== "/login" && (
            <>
              <NotificationBell />
              <ProfileMenu />
              
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 touch-target relative"
                    aria-label="Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left">Menu</SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex flex-col py-2">
                    {/* Friends */}
                    <button
                      onClick={handleOpenFriends}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent active:bg-accent transition-colors text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Friends</p>
                        <p className="text-xs text-muted-foreground">View and manage friends</p>
                      </div>
                    </button>
                    
                    {/* Weight Tracking */}
                    {!isWeightPage && (
                      <button
                        onClick={handleWeightTracking}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent active:bg-accent transition-colors text-left"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Scale className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t("weightTracking")}</p>
                          <p className="text-xs text-muted-foreground">Track your weight progress</p>
                        </div>
                      </button>
                    )}
                    
                    {/* Divider */}
                    <div className="h-px bg-border my-2 mx-4" />
                    
                    {/* Language */}
                    <div className="px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Language
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant={language === "en" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLanguage("en")}
                          className="flex-1 h-10"
                        >
                          🇬🇧 English
                        </Button>
                        <Button
                          variant={language === "th" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLanguage("th")}
                          className="flex-1 h-10"
                        >
                          🇹🇭 ไทย
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
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

