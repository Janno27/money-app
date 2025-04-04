"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { redirect } from "next/navigation"

export default function JoinPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [organization, setOrganization] = useState<{ id: string, name: string } | null>(null)
  // @ts-expect-error - Conservé pour usage futur potentiel
  const [_userId, setUserId] = useState("")
  
  const joinOrganization = useCallback(async (userId: string, organizationId: string) => {
    try {
      // Vérifier si l'utilisateur est déjà membre
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()
        
      if (existingMember) {
        setSuccess(true)
        toast({
          title: "Déjà membre",
          description: `Vous êtes déjà membre de ${organization?.name}.`
        })
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        
        return
      }
      
      // Ajouter l'utilisateur à l'organisation
      const { error: addError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: 'member'
        })
      
      if (addError) throw addError
      
      // Mettre à jour l'organization_id de l'utilisateur si nécessaire
      await supabase
        .from('users')
        .update({ organization_id: organizationId })
        .eq('id', userId)
      
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
      console.error("Erreur lors de l'ajout à l'organisation:", err)
      setError("Une erreur est survenue lors de l'acceptation de l'invitation.")
    }
  }, [router, supabase, toast, organization?.name])
  
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        
        // Vérifier si un utilisateur est déjà connecté
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Si un utilisateur est connecté, rediriger vers la page d'onboarding
        if (session) {
          // @ts-expect-error - Type non complet fourni par supabase
          const _userId = session.user.id
          // Utiliser la variable pour éviter l'erreur
          console.log("Utilisateur connecté:", _userId)
          redirect('/onboarding')
        }
        
        // Récupérer l'email d'invitation et le token
        const inviteEmail = searchParams?.get('email')
        const token = searchParams?.get('token')
        
        if (!inviteEmail) {
          setError("Aucun email d'invitation spécifié.")
          return
        }
        
        setEmail(inviteEmail)
        
        // Vérifier le token d'invitation
        if (!token) {
          setError("Token d'invitation manquant.")
          return
        }
        
        // Récupérer les détails de l'organisation
        const { data: inviteData, error: inviteError } = await supabase
          .from('organization_invites')
          .select('*, organizations(*)')
          .eq('email', inviteEmail)
          .eq('token', token)
          .maybeSingle()
        
        if (inviteError) throw inviteError
        
        if (!inviteData) {
          setError("Invitation non valide ou expirée.")
          return
        }
        
        // Vérifier si l'invitation n'est pas expirée
        if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
          setError("Cette invitation a expiré.")
          return
        }
        
        setOrganization(inviteData.organizations)
        
        // Si utilisateur connecté, rejoindre automatiquement
        if (session) {
          // @ts-expect-error - Type non complet fourni par supabase
          await joinOrganization(session.user.id, inviteData.organizations.id)
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error)
        setError("Une erreur est survenue lors du chargement de l'invitation.")
      } finally {
        setLoading(false)
      }
    }
    
    init()
  }, [searchParams, supabase, router, joinOrganization])
  
  const handleSignUpAndJoin = async () => {
    if (!organization || !email || !password) return
    
    setJoining(true)
    
    try {
      // Créer un nouveau compte
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            organization_id: organization.id
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (signUpData.user) {
        // Ajouter l'utilisateur à l'organisation
        await joinOrganization(signUpData.user.id, organization.id)
      } else {
        // Si email_confirmation est activé, l'utilisateur sera null
        toast({
          title: "Inscription en cours",
          description: "Veuillez vérifier votre email pour confirmer votre inscription. Vous rejoindrez automatiquement l'organisation après confirmation."
        })
        
        setSuccess(true)
      }
      
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err)
      setError("Une erreur est survenue lors de l'inscription.")
    } finally {
      setJoining(false)
    }
  }
  
  const handleSignInAndJoin = async () => {
    if (!organization || !email || !password) return
    
    setJoining(true)
    
    try {
      // Se connecter avec un compte existant
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      if (signInData.user) {
        // Ajouter l'utilisateur à l'organisation
        await joinOrganization(signInData.user.id, organization.id)
      }
      
    } catch (err) {
      console.error("Erreur lors de la connexion:", err)
      setError("Email ou mot de passe incorrect.")
    } finally {
      setJoining(false)
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
          <CardTitle>Rejoindre {organization?.name}</CardTitle>
          <CardDescription>Vous avez été invité à rejoindre cette organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleSignUpAndJoin} 
            className="w-full"
            disabled={joining || !email || !password || !name}
          >
            {joining ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Création du compte...</>
            ) : (
              "Créer un compte et rejoindre"
            )}
          </Button>
          
          <div className="text-sm text-center w-full my-2">ou</div>
          
          <Button 
            onClick={handleSignInAndJoin}
            variant="outline"
            className="w-full"
            disabled={joining || !email || !password}
          >
            {joining ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Connexion...</>
            ) : (
              "Se connecter et rejoindre"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 