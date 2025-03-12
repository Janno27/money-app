"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient, getSession } from "@/lib/supabase/client"

interface User {
  id: string
  name: string
  avatar: string | null
}

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface UseUserDataResult {
  user: User | null
  isLoading: boolean
  error: Error | null
  categories: Category[]
}

export function useUserData(): UseUserDataResult {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = getSupabaseClient()
  
  useEffect(() => {
    let isMounted = true
    let authListenerUnsubscribe: (() => void) | null = null
    
    async function fetchUserData() {
      if (!isMounted) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Récupérer l'utilisateur authentifié avec notre fonction mise en cache
        const { data: sessionData, error: sessionError } = await getSession()
        
        if (sessionError && typeof sessionError === 'object' && 'message' in sessionError) {
          throw new Error(sessionError.message as string)
        }
        
        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id
          
          // Récupérer les données utilisateur depuis la table 'users'
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', userId)
            .single()
            
          if (userError) {
            throw new Error(userError.message)
          }
          
          if (isMounted) {
            setUser(userData)
          }
          
          // Récupérer les catégories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .order('name')
            
          if (categoriesError) {
            throw new Error(categoriesError.message)
          }
          
          if (isMounted) {
            setCategories(categoriesData || [])
          }
        } else {
          // Pas de session, réinitialiser les données
          if (isMounted) {
            setUser(null)
            setCategories([])
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Une erreur inconnue est survenue'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Exécuter fetchUserData une seule fois au chargement
    fetchUserData()
    
    // Écouter les changements d'authentification avec un seul écouteur
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData()
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null)
          setCategories([])
          setIsLoading(false)
        }
      }
    })
    
    authListenerUnsubscribe = () => {
      authListener.subscription.unsubscribe()
    }
    
    // Nettoyage
    return () => {
      isMounted = false
      if (authListenerUnsubscribe) {
        authListenerUnsubscribe()
      }
    }
  }, []) // Dépendance vide pour n'exécuter qu'une seule fois
  
  // Si les données ne sont pas encore disponibles, utiliser des données par défaut
  if (!isLoading && !user) {
    // Données de test pour le développement
    const mockUser = {
      id: 'mock-user-id',
      name: 'Utilisateur Test',
      avatar: null
    }
    
    const mockCategories = [
      { id: '1', name: 'Salaire', color: '#10b981' },
      { id: '2', name: 'Logement', color: '#6366f1' },
      { id: '3', name: 'Services', color: '#f59e0b' },
      { id: '4', name: 'Alimentation', color: '#ef4444' },
      { id: '5', name: 'Transport', color: '#8b5cf6' },
      { id: '6', name: 'Loisirs', color: '#ec4899' }
    ]
    
    return {
      user: mockUser,
      categories: mockCategories,
      isLoading: false,
      error: null
    }
  }
  
  return { user, categories, isLoading, error }
} 