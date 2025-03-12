"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoginForm } from '@/components/ui/login-form'

interface Organization {
  id: string
  name: string
}

export default function SignupPage() {
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [emailParam, setEmailParam] = useState<string | null>(null)
  const initRef = useRef(false)
  
  useEffect(() => {
    // Éviter les appels multiples et infinies
    if (!searchParams || initRef.current) return
    
    const init = async () => {
      try {
        // Marquer que l'initialisation a commencé
        initRef.current = true
        
        // Récupérer les paramètres d'URL
        const organizationId = searchParams.get('organization_id')
        const email = searchParams.get('email')
        
        if (email) {
          setEmailParam(email)
        }
        
        console.log('Paramètres d\'URL détectés:', { emailParam: email, organizationId })
        
        if (organizationId) {
          // Essayer seulement une méthode à la fois avec des vérifications d'erreurs claires
          try {
            // Tenter de récupérer l'organisation directement
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', organizationId)
              .single()
            
            if (!orgError && orgData) {
              console.log('Organisation récupérée via requête directe')
              setOrganization(orgData)
            } else if (orgError) {
              console.log('Erreur requête directe:', orgError.message)
              
              // Essayer la méthode RPC
              try {
                const { data: orgNameData, error: rpcError } = await supabase
                  .rpc('get_organization_name', { org_id: organizationId })
                
                if (!rpcError && orgNameData) {
                  console.log('Organisation récupérée via RPC')
                  setOrganization({
                    id: organizationId,
                    name: orgNameData
                  })
                } else if (rpcError) {
                  console.log('Erreur RPC:', rpcError.message)
                  
                  // Dernière tentative avec l'API
                  try {
                    const response = await fetch(`/api/organization/${organizationId}`, {
                      // Ajouter un timeout pour éviter les requêtes bloquantes
                      signal: AbortSignal.timeout(5000)
                    })
                    
                    if (response.ok) {
                      const orgData = await response.json()
                      console.log('Organisation récupérée via API')
                      setOrganization({
                        id: organizationId,
                        name: orgData.name
                      })
                    }
                  } catch (apiError) {
                    console.error('Erreur API:', apiError)
                    // Continuer sans organisation plutôt que de bloquer
                  }
                }
              } catch (rpcError) {
                console.error('Erreur lors de l\'appel RPC:', rpcError)
                // Continuer sans organisation plutôt que de bloquer
              }
            }
          } catch (dbError) {
            console.error('Erreur base de données:', dbError)
            // Continuer sans organisation plutôt que de bloquer
          }
        }
      } catch (error) {
        console.error('Erreur globale:', error)
      } finally {
        // Toujours finir le chargement, même en cas d'erreur
        setLoading(false)
      }
    }
    
    init()
    
    // Fonction de nettoyage
    return () => {
      // Pas besoin de cleanup spécifique ici
    }
  }, [searchParams]) // Retirer supabase des dépendances car il est stable
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-10">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Chargement...</h1>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        {/* Utiliser le composant existant qui fonctionne déjà */}
        <LoginForm 
          initialStep="register"
          prefilledEmail={emailParam}
          organizationToJoin={organization}
        />
      </div>
    </div>
  )
} 