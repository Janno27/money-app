"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

// Note: Les métadonnées sont définies via une configuration metadata.ts dans le même dossier

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  
  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()
      
      if (!data.session) {
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <>
      {children}
    </>
  )
} 