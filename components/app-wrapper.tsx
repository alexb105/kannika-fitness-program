"use client"

import { PasswordGate } from "@/components/password-gate"

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return <PasswordGate>{children}</PasswordGate>
}

