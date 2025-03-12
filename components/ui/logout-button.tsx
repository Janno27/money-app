"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/supabase/client"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LogoutButton({ variant = "ghost", size = "icon", className }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4" />
    </Button>
  )
} 