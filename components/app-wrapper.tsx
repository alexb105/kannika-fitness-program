"use client"

import { PasswordGate } from "@/components/password-gate"
import { LanguageProvider } from "@/lib/contexts/language-context"

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <LanguageProvider>
      <PasswordGate>{children}</PasswordGate>
    </LanguageProvider>
  )
}

