"use client"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 touch-target"
          aria-label="Change language"
        >
          <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`h-11 sm:h-10 ${language === "en" ? "bg-primary/10 text-primary" : ""}`}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("th")}
          className={`h-11 sm:h-10 ${language === "th" ? "bg-primary/10 text-primary" : ""}`}
        >
          🇹🇭 ไทย (Thai)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

