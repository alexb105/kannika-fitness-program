"use client"

import { Button } from "@/components/ui/button"
import { useFriendRequests } from "@/lib/hooks/use-friend-requests"
import { Check, X, User } from "lucide-react"
import { useState } from "react"

interface FriendRequestNotificationProps {
  request: {
    id: string
    sender_username: string | null
    created_at: string
  }
  onAction?: () => void
  onAccept?: () => void
}

export function FriendRequestNotification({
  request,
  onAction,
  onAccept,
}: FriendRequestNotificationProps) {
  const { acceptRequest, declineRequest } = useFriendRequests()
  const [processing, setProcessing] = useState(false)

  const handleAccept = async () => {
    setProcessing(true)
    try {
      await acceptRequest(request.id)
      onAction?.()
      onAccept?.() // Trigger friends list refresh
    } catch (err) {
      // Error handled in hook
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    setProcessing(true)
    try {
      await declineRequest(request.id)
      onAction?.()
    } catch (err) {
      // Error handled in hook
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-4 hover:bg-accent transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {request.sender_username || "Unknown User"}
          </p>
          <p className="text-xs text-muted-foreground">
            sent you a friend request
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleAccept}
          disabled={processing}
        >
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleDecline}
          disabled={processing}
        >
          <X className="h-3 w-3 mr-1" />
          Decline
        </Button>
      </div>
    </div>
  )
}

