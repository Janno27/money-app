"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AccountingOnboarding } from "./AccountingOnboarding"
import { getSupabaseClient } from "@/lib/supabase/client"

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname() || ''
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        
        setIsAuthenticated(!!data.session)
        setIsLoading(false)
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error)
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    }
    
    checkAuthStatus()
  }, [])
  
  // Ne rien afficher pendant le chargement
  if (isLoading) {
    return <>{children}</>
  }
  
  // Déterminer quel onboarding afficher en fonction du pathname
  const renderOnboarding = () => {
    if (!isAuthenticated) return null
    
    // Si on est sur la page de comptabilité ou sur la page d'accueil après login
    if (pathname.includes('/accounting') || pathname === '/dashboard') {
      return <AccountingOnboarding />
    }
    
    // Ajouter d'autres conditions pour d'autres types d'onboarding
    // Par exemple:
    // if (pathname.includes('/analytics')) {
    //   return <AnalyticsOnboarding />
    // }
    
    return null
  }
  
  return (
    <>
      {children}
      {renderOnboarding()}
    </>
  )
} 