"use client"

import { OnboardingGeneral } from "@/components/onboarding/OnboardingGeneral"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  // Vérifier si l'utilisateur est authentifié et s'il a déjà complété l'onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // Rediriger vers la page de connexion si non authentifié
          router.push('/login')
          return
        }
        
        // Vérifier si l'utilisateur a déjà terminé l'onboarding
        const { data, error } = await supabase
          .from('user_preferences')
          .select('completed_onboarding')
          .eq('user_id', session.user.id)
          .single()
        
        if (!error && data?.completed_onboarding) {
          // Si l'utilisateur a déjà terminé l'onboarding, le rediriger vers le dashboard
          console.log("L'utilisateur a déjà terminé l'onboarding, redirection vers le dashboard")
          router.push('/dashboard')
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Erreur lors de la vérification du statut d'onboarding:", error)
        setIsLoading(false)
      }
    }
    
    checkOnboardingStatus()
  }, [router])
  
  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return <OnboardingGeneral />
} 