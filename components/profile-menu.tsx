"use client"

import { useState, useRef, useCallback } from "react"
import { 
  User, 
  Camera, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  Trash2,
  LogOut
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { useLanguage } from "@/lib/contexts/language-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"

export function ProfileMenu() {
  const { username, avatarUrl, updating, updateUsername, uploadAvatar, removeAvatar } = useUserProfile()
  const { signOut, user } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenProfile = useCallback(() => {
    setIsProfileOpen(true)
    setNewUsername(username || "")
    setUsernameError(null)
    setAvatarError(null)
    setIsEditingUsername(false)
  }, [username])

  const handleCloseProfile = useCallback(() => {
    setIsProfileOpen(false)
    setIsEditingUsername(false)
    setUsernameError(null)
    setAvatarError(null)
  }, [])

  const handleStartEditUsername = useCallback(() => {
    setNewUsername(username || "")
    setIsEditingUsername(true)
    setUsernameError(null)
  }, [username])

  const handleCancelEditUsername = useCallback(() => {
    setIsEditingUsername(false)
    setNewUsername(username || "")
    setUsernameError(null)
  }, [username])

  const handleSaveUsername = useCallback(async () => {
    try {
      setUsernameError(null)
      await updateUsername(newUsername)
      setIsEditingUsername(false)
    } catch (err) {
      setUsernameError((err as Error).message)
    }
  }, [newUsername, updateUsername])

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setAvatarError(null)
      await uploadAvatar(file)
    } catch (err) {
      setAvatarError((err as Error).message)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [uploadAvatar])

  const handleRemoveAvatar = useCallback(async () => {
    try {
      setAvatarError(null)
      await removeAvatar()
    } catch (err) {
      setAvatarError((err as Error).message)
    }
  }, [removeAvatar])

  const handleLogout = useCallback(async () => {
    await signOut()
    router.push("/login")
  }, [signOut, router])

  // Get initials for avatar fallback
  const getInitials = () => {
    if (username) {
      return username.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <AvatarImage src={avatarUrl || undefined} alt={username || "Profile"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {username || (language === "en" ? "No username" : "ไม่มีชื่อผู้ใช้")}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>{language === "en" ? "Edit Profile" : "แก้ไขโปรไฟล์"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{language === "en" ? "Log out" : "ออกจากระบบ"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Edit Profile" : "แก้ไขโปรไฟล์"}
            </DialogTitle>
            <DialogDescription>
              {language === "en" 
                ? "Update your profile picture and username" 
                : "อัปเดตรูปโปรไฟล์และชื่อผู้ใช้ของคุณ"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={avatarUrl || undefined} alt={username || "Profile"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={updating}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {updating ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  disabled={updating}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {language === "en" ? "Upload Photo" : "อัปโหลดรูป"}
                </Button>
                {avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={updating}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === "en" ? "Remove" : "ลบ"}
                  </Button>
                )}
              </div>

              {avatarError && (
                <p className="text-sm text-red-500">{avatarError}</p>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                {language === "en" 
                  ? "JPG, PNG or GIF. Max 2MB." 
                  : "JPG, PNG หรือ GIF ขนาดไม่เกิน 2MB"}
              </p>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username">
                {language === "en" ? "Username" : "ชื่อผู้ใช้"}
              </Label>
              
              {isEditingUsername ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder={language === "en" ? "Enter username" : "ป้อนชื่อผู้ใช้"}
                      className="flex-1"
                      disabled={updating}
                    />
                    <Button
                      size="icon"
                      onClick={handleSaveUsername}
                      disabled={updating || !newUsername.trim()}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCancelEditUsername}
                      disabled={updating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {usernameError && (
                    <p className="text-sm text-red-500">{usernameError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === "en" 
                      ? "3-20 characters. Letters, numbers, underscores, and hyphens only." 
                      : "3-20 ตัวอักษร ใช้ได้เฉพาะตัวอักษร ตัวเลข ขีดล่าง และขีดกลาง"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md">
                    <span className="text-sm">
                      {username ? `@${username}` : (language === "en" ? "No username set" : "ยังไม่ได้ตั้งชื่อผู้ใช้")}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleStartEditUsername}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCloseProfile}>
              {language === "en" ? "Done" : "เสร็จสิ้น"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

