"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useFriends, type Friend } from "@/lib/hooks/use-friends"
import { useFriendRequests } from "@/lib/hooks/use-friend-requests"
import { UserPlus, Users, X, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/contexts/language-context"

export function FriendsList() {
  const { friends, loading, removeFriend, refetch: refetchFriends } = useFriends()
  const { sendFriendRequest } = useFriendRequests()
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setAdding(true)
    try {
      await sendFriendRequest(username.trim())
      setUsername("")
      setIsAddFriendOpen(false)
      // Refresh friends list in case request was auto-accepted
      await refetchFriends()
    } catch (err) {
      // Error is already handled in the hook
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId)
    } catch (err) {
      // Error is already handled in the hook
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Friends</h2>
          <span className="text-sm text-muted-foreground">({friends.length})</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddFriendOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading friends...</div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No friends yet. Add friends by username to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatar_url || undefined} alt={friend.username || "Friend"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {friend.username?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {friend.username || "Unknown User"}
                  </p>
                  {friend.username && (
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveFriend(friend.friend_id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Friend Dialog */}
      <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
            <DialogDescription>
              Enter a username to add them to your friends list
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFriend} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-9"
                  autoFocus
                  disabled={adding}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search for users by their username
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddFriendOpen(false)
                  setUsername("")
                }}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding || !username.trim()}>
                {adding ? "Adding..." : "Add Friend"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

