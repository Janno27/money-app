"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export function AcceptInvitation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organization, setOrganization] = useState<{ id: string, name: string } | null>(null)
  const [invitationId, setInvitationId] = useState<string | null>(null)
  
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      
      try {
        // Vérifier si l'utilisateur est authentifié
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Rediriger vers la page de connexion si non authentifié
          router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
          return
        }
        
        // Récupérer l'ID de l'organisation depuis les paramètres d'URL
        const organizationId = searchParams.get('organization_id')
        
        if (!organizationId) {
          setError("Invitation invalide. Aucune organisation spécifiée.")
          return
        }
        
        // Récupérer les détails de l'organisation
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', organizationId)
          .single()
        
        if (orgError) {
          setError("Organisation introuvable.")
          return
        }
        
        setOrganization(orgData)
        
        // Récupérer l'invitation en attente
        const { data: invitationData, error: invitationError } = await supabase
          .from('organization_invitations')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('email', user.email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single()
        
        if (invitationError) {
          setError("Aucune invitation valide trouvée pour cette adresse email.")
          return
        }
        
        setInvitationId(invitationData.id)
        
      } catch (err) {
        console.error("Erreur lors de l'initialisation:", err)
        setError("Une erreur est survenue. Veuillez réessayer.")
      } finally {
        setLoading(false)
      }
    }
    
    init()
  }, [router, searchParams, supabase])
  
  const handleAcceptInvitation = async () => {
    if (!invitationId) return
    
    setLoading(true)
    
    try {
      // Appeler la fonction pour accepter l'invitation
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Utilisateur non authentifié.")
        return
      }
      
      const { data, error } = await supabase
        .rpc('accept_organization_invitation', {
          p_invitation_id: invitationId,
          p_user_id: user.id
        })
      
      if (error) throw error
      
      if (!data) {
        setError("Impossible d'accepter l'invitation. Veuillez contacter l'administrateur.")
        return
      }
      
      setSuccess(true)
      
      toast({
        title: "Invitation acceptée",
        description: `Vous avez rejoint ${organization?.name}.`
      })
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'invitation:", err)
      setError("Une erreur est survenue lors de l'acceptation de l'invitation.")
    } finally {
      setLoading(false)
    }
  }
  
  const handleRejectInvitation = async () => {
    if (!invitationId) return
    
    setLoading(true)
    
    try {
      // Mettre à jour le statut de l'invitation à "rejected"
      const { error } = await supabase
        .from('organization_invitations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', invitationId)
      
      if (error) throw error
      
      toast({
        title: "Invitation refusée",
        description: "Vous avez refusé l'invitation."
      })
      
      // Rediriger vers la page d'accueil
      router.push('/')
      
    } catch (err) {
      console.error("Erreur lors du refus de l'invitation:", err)
      setError("Une erreur est survenue lors du refus de l'invitation.")
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation</CardTitle>
            <CardDescription>Vérification de votre invitation...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Erreur
            </CardTitle>
            <CardDescription>Impossible de traiter l&apos;invitation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Retour à l&apos;accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Invitation acceptée
            </CardTitle>
            <CardDescription>Vous avez rejoint l&apos;organisation avec succès</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vous êtes maintenant membre de <span className="font-semibold">{organization?.name}</span>.
              Vous allez être redirigé vers le tableau de bord.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
          <CardDescription>Vous avez été invité à rejoindre une organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Vous avez reçu une invitation à rejoindre l&apos;organisation <span className="font-semibold">{organization?.name}</span>.
            Souhaitez-vous accepter cette invitation?
          </p>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button onClick={handleRejectInvitation} variant="outline">
            Refuser
          </Button>
          <Button onClick={handleAcceptInvitation}>
            Accepter l&apos;invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 