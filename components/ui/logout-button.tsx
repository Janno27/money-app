"use client"

import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start" 
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Déconnexion</span>
    </Button>
  )
} 