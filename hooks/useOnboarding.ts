"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

type OnboardingType = 'new-user' | 'feature-release'
type OnboardingStep = number

interface UseOnboardingResult {
  isOnboardingActive: boolean
  currentStep: OnboardingStep
  onboardingType: OnboardingType
  totalSteps: number
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
}

export function useOnboarding(
  type: OnboardingType = 'new-user',
  totalSteps: number = 3
): UseOnboardingResult {
  // Commencer avec isOnboardingActive = true par défaut
  const [isOnboardingActive, setIsOnboardingActive] = useState(true)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0)
  const [onboardingType, setOnboardingType] = useState<OnboardingType>(type)
  
  const supabase = getSupabaseClient()
  
  // Vérifier si l'utilisateur a déjà vu l'onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('completed_onboarding, completed_feature_releases')
            .eq('user_id', session.user.id)
            .single()
            
          if (error) {
            console.error('Erreur lors de la récupération des préférences utilisateur:', error)
            return
          }
          
          if (data) {
            if (type === 'new-user' && data.completed_onboarding) {
              // Si l'utilisateur a déjà complété l'onboarding, on le désactive
              setIsOnboardingActive(false)
            } else if (type === 'feature-release') {
              // Vérifier si l'utilisateur a complété cette version spécifique
              const completedReleases = data.completed_feature_releases || []
              if (completedReleases.includes(process.env.NEXT_PUBLIC_APP_VERSION)) {
                setIsOnboardingActive(false)
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'onboarding:', error)
      }
    }
    
    checkOnboardingStatus()
  }, [type, supabase])
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const skipOnboarding = () => {
    setIsOnboardingActive(false)
    saveOnboardingCompletion()
  }
  
  const completeOnboarding = () => {
    setIsOnboardingActive(false)
    saveOnboardingCompletion()
  }
  
  const saveOnboardingCompletion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        if (type === 'new-user') {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: session.user.id,
              completed_onboarding: true
            })
        } else if (type === 'feature-release') {
          // Récupérer d'abord les préférences actuelles
          const { data } = await supabase
            .from('user_preferences')
            .select('completed_feature_releases')
            .eq('user_id', session.user.id)
            .single()
            
          const completedReleases = data?.completed_feature_releases || []
          const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
          
          if (appVersion && !completedReleases.includes(appVersion)) {
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: session.user.id,
                completed_feature_releases: [...completedReleases, appVersion]
              })
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la complétion de l\'onboarding:', error)
    }
  }
  
  return {
    isOnboardingActive,
    currentStep,
    onboardingType,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding
  }
} 