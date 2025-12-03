"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell } from "lucide-react"
import { useFriendRequests } from "@/lib/hooks/use-friend-requests"
import { FriendRequestNotification } from "./friend-request-notification"

export function NotificationBell() {
  const { pendingRequests, loading } = useFriendRequests()
  const [open, setOpen] = useState(false)

  const hasNotifications = pendingRequests.length > 0

  const handleAccept = () => {
    // Friends list will auto-refresh via real-time subscription
    // No need to reload the page
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 sm:h-10 sm:w-10 touch-target"
          title="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-2 w-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-24px)] sm:w-80 p-0 max-h-[70vh] overflow-hidden" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-sm sm:text-base">Friend Requests</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((request) => (
                <FriendRequestNotification
                  key={request.id}
                  request={request}
                  onAction={() => setOpen(false)}
                  onAccept={handleAccept}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

