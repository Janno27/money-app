"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Mail, Lock } from "lucide-react"
import { getSupabaseClient, signInWithPassword, resetPasswordForEmail } from "@/lib/supabase/client"
import { DiagnosticButton } from '@/components/ui/diagnostic-button'

// Définir les types pour les différentes étapes du formulaire
type FormStep = 'login' | 'register' | 'email-confirmation' | 'forgot-password'

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialStep?: FormStep;
  prefilledEmail?: string | null;
  organizationToJoin?: {
    id: string;
    name: string;
  } | null;
}

export function LoginForm({
  initialStep = 'login',
  prefilledEmail = null,
  organizationToJoin = null,
}: LoginFormProps) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [email, setEmail] = useState(prefilledEmail || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formStep, setFormStep] = useState<FormStep>(initialStep)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loginLocked, setLoginLocked] = useState(false)
  const [lockCountdown, setLockCountdown] = useState(0)
  
  // Champs supplémentaires pour l'inscription
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [householdName, setHouseholdName] = useState(organizationToJoin?.name || '')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Vérifier si le login est verrouillé au chargement
  useEffect(() => {
    const lockedUntil = localStorage.getItem('loginLockedUntil')
    if (lockedUntil) {
      const lockTime = parseInt(lockedUntil, 10)
      const now = Date.now()
      
      if (lockTime > now) {
        // Le verrouillage est encore actif
        setLoginLocked(true)
        const remainingTime = Math.ceil((lockTime - now) / 1000)
        setLockCountdown(remainingTime)
        
        // Démarrer le compte à rebours
        const interval = setInterval(() => {
          setLockCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              setLoginLocked(false)
              localStorage.removeItem('loginLockedUntil')
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        return () => clearInterval(interval)
      } else {
        // Le verrouillage a expiré
        localStorage.removeItem('loginLockedUntil')
      }
    }
  }, [])

  const validateForm = () => {
    if (formStep === 'register') {
      if (!firstName.trim()) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Le prénom est requis"
        })
        return false
      }
      if (!lastName.trim()) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Le nom est requis"
        })
        return false
      }
      if (!householdName.trim()) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Le nom du foyer est requis"
        })
        return false
      }
      if (password.length < 6) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Le mot de passe doit contenir au moins 6 caractères"
        })
        return false
      }
      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Les mots de passe ne correspondent pas"
        })
        return false
      }
    }
    
    if (formStep === 'forgot-password' || formStep === 'login' || formStep === 'register') {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Veuillez entrer une adresse email valide"
        })
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier si le login est verrouillé
    if (loginLocked) {
      toast({
        variant: "destructive",
        title: "Connexion temporairement désactivée",
        description: `Veuillez patienter ${lockCountdown} secondes avant de réessayer.`
      })
      return
    }
    
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    if (formStep === 'register') {
      try {
        console.log("Démarrage de l'inscription avec:", { email, firstName, lastName, householdName, organizationToJoin });
        
        // 1. Créer l'utilisateur dans auth.users avec le nom complet comme display_name
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: `${firstName} ${lastName}`,
              first_name: firstName,
              last_name: lastName,
              name: `${firstName} ${lastName}`, // Ajouté pour s'assurer que le champ name est défini
              // Si nous avons une organisation à rejoindre, ne pas créer de temp_organization_id
              ...(organizationToJoin ? {} : { temp_organization_id: uuidv4() })
            }
          }
        })

        if (authError) {
          // Si l'erreur est liée à un email déjà utilisé, afficher un message spécifique
          if (authError.message.includes('email') && authError.message.includes('already')) {
            toast({
              variant: "destructive",
              title: "Email déjà utilisé",
              description: "Cette adresse email est déjà associée à un compte. Veuillez vous connecter ou utiliser une autre adresse."
            })
          } else {
            toast({
              variant: "destructive",
              title: "Erreur d'inscription",
              description: authError.message
            })
          }
          throw authError
        }
        
        // 2a. Si nous avons une organisation à rejoindre, ajouter l'utilisateur à cette organisation
        if (organizationToJoin && organizationToJoin.id && authData.user) {
          console.log("Ajout de l'utilisateur à l'organisation existante:", organizationToJoin.id);
          
          try {
            // Appeler l'API pour ajouter l'utilisateur à l'organisation
            const response = await fetch('/api/organization/member', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: authData.user.id,
                organization_id: organizationToJoin.id,
                role: 'member'
              })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
              console.error("Erreur lors de l'ajout à l'organisation:", result.error);
              // On continue même si l'ajout à l'organisation échoue
            } else {
              console.log("Utilisateur ajouté à l'organisation existante avec succès");
            }
          } catch (apiError) {
            console.error("Erreur API lors de l'ajout à l'organisation:", apiError);
            // On continue même si l'ajout à l'organisation échoue
          }
        } 
        // 2b. Sinon, créer une nouvelle organisation si householdName est défini
        else if (householdName && authData.user) {
          console.log("Création d'une nouvelle organisation:", householdName);
          
          const organizationId = authData.user?.user_metadata?.temp_organization_id || uuidv4();
          
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({
              id: organizationId,
              name: householdName,
              owner_id: authData.user.id
            });

          if (orgError) {
            console.error("Erreur lors de la création du foyer:", orgError);
            // On continue même si la création du foyer échoue
          } else {
            console.log("Nouvelle organisation créée avec succès:", organizationId);
          }
        }

        // 3. Afficher l'écran de confirmation d'email avec animation
        setSlideDirection('right')
        setFormStep('email-confirmation')
        toast({
          title: "Inscription réussie",
          description: organizationToJoin 
            ? `Votre compte a été créé avec succès. Vous avez rejoint ${organizationToJoin.name}.` 
            : "Votre compte a été créé avec succès. Veuillez vérifier votre email pour confirmer votre inscription.",
        })
        
      } catch (err) {
        console.error("Erreur d'inscription:", err)
      } finally {
        setLoading(false)
      }
    } else if (formStep === 'forgot-password') {
      try {
        const { error } = await resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: error.message
          })
          throw error
        }

        setResetEmailSent(true)
        toast({
          title: "Email envoyé",
          description: "Un email de réinitialisation de mot de passe a été envoyé à votre adresse email."
        })
      } catch (err) {
        console.error("Erreur lors de la réinitialisation du mot de passe:", err)
      } finally {
        setLoading(false)
      }
    } else {
      // Logique de connexion
      try {
        const { error } = await signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Messages d'erreur plus conviviaux
          if (error.message.includes('Invalid login credentials')) {
            toast({
              variant: "destructive",
              title: "Identifiants incorrects",
              description: "Email ou mot de passe incorrect. Veuillez réessayer."
            })
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              variant: "destructive",
              title: "Email non confirmé",
              description: "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception."
            })
            // Afficher l'écran de confirmation d'email
            setSlideDirection('right')
            setFormStep('email-confirmation')
          } else if (error.message.includes('Request rate limit reached')) {
            // Verrouiller la connexion pendant 2 minutes
            const lockDuration = 120 * 1000 // 2 minutes en millisecondes
            const unlockTime = Date.now() + lockDuration
            
            localStorage.setItem('loginLockedUntil', unlockTime.toString())
            setLoginLocked(true)
            setLockCountdown(120) // 2 minutes en secondes
            
            toast({
              variant: "destructive",
              title: "Trop de tentatives",
              description: "Vous avez effectué trop de tentatives de connexion. La connexion est désactivée pendant 2 minutes."
            })
            
            // Démarrer le compte à rebours
            const interval = setInterval(() => {
              setLockCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(interval)
                  setLoginLocked(false)
                  localStorage.removeItem('loginLockedUntil')
                  return 0
                }
                return prev - 1
              })
            }, 1000)
          } else {
            toast({
              variant: "destructive",
              title: "Erreur de connexion",
              description: error.message
            })
          }
          throw error
        }

        // Récupérer les préférences utilisateur pour vérifier si l'onboarding est complété
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Récupérer les préférences de l'utilisateur
          const { data: preferences, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('completed_onboarding, theme')
            .eq('user_id', user.id)
            .single()
          
          // Rediriger selon si l'onboarding est complété ou non
          router.refresh()
          
          if (preferencesError || !preferences || preferences.completed_onboarding !== true) {
            // Si pas de préférences ou onboarding non complété, rediriger vers onboarding
            router.push('/onboarding')
          } else {
            // Si onboarding complété, rediriger vers dashboard
            router.push('/dashboard')
          }
        } else {
          // Fallback au cas où user serait null (ne devrait pas arriver)
          router.refresh()
          router.push('/onboarding')
        }
      } catch (err) {
        console.error("Erreur de connexion:", err)
      } finally {
        setLoading(false)
      }
    }
  }

  const switchToRegister = () => {
    setSlideDirection('right')
    setFormStep('register')
  }

  const switchToLogin = () => {
    setSlideDirection('left')
    setFormStep('login')
    // Réinitialiser les champs lors du changement de mode
    setFirstName('')
    setLastName('')
    setHouseholdName('')
    setConfirmPassword('')
    setEmail('')
    setPassword('')
  }

  const switchToForgotPassword = () => {
    setSlideDirection('right')
    setFormStep('forgot-password')
    setResetEmailSent(false)
  }

  // Variants pour les animations
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 500 : -500,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -500 : 500,
      opacity: 0
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <Card className="overflow-hidden max-w-md w-full mx-auto shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              {formStep === 'login' && (
                <motion.div
                  key="login"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="p-8 md:p-10"
                >
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold">Bienvenue</h1>
                      <p className="text-balance text-muted-foreground">
                        Connectez-vous à votre compte
                      </p>
                    </div>
                    
                    {loginLocked && (
                      <div className="bg-amber-50 p-4 rounded-md text-amber-700 text-sm">
                        <p className="font-medium">Connexion temporairement désactivée</p>
                        <p className="mt-1">Trop de tentatives. Veuillez patienter {lockCountdown} secondes.</p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        className="h-10 bg-slate-50"
                        disabled={loginLocked}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs text-muted-foreground cursor-not-allowed"
                          onClick={switchToForgotPassword}
                          disabled={true}
                        >
                          Mot de passe oublié ?
                        </Button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 bg-slate-50"
                        disabled={loginLocked}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full h-10 bg-slate-900" disabled={loading || loginLocked}>
                      {loading ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                    
                    <div className="text-center text-sm">
                      Vous n&apos;avez pas de compte ?{" "}
                      <button 
                        type="button"
                        onClick={switchToRegister} 
                        className="underline underline-offset-4 text-blue-600"
                      >
                        S&apos;inscrire
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {formStep === 'register' && (
                <motion.div
                  key="register"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="p-8 md:p-10 w-full"
                >
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[450px] mx-auto">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold">Créer un compte</h1>
                      <p className="text-balance text-muted-foreground">
                        Inscrivez-vous pour commencer à gérer vos finances
                      </p>
                    </div>
                    
                    {/* Encadré informatif pour les utilisateurs invités */}
                    {organizationToJoin && (
                      <Card className="border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Vous rejoindrez <span className="font-semibold">{organizationToJoin.name}</span> en créant votre compte
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jean"
                          className="h-10 bg-slate-50"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Dupont"
                          className="h-10 bg-slate-50"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Masquer le champ foyer si l'utilisateur rejoint une organisation existante */}
                    {!organizationToJoin && (
                      <div className="grid gap-2">
                        <Label htmlFor="householdName">Nom du foyer</Label>
                        <Input
                          id="householdName"
                          value={householdName}
                          onChange={(e) => setHouseholdName(e.target.value)}
                          placeholder="Foyer Dupont"
                          className="h-10 bg-slate-50"
                          required
                        />
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        className={`h-10 ${prefilledEmail ? "bg-slate-100" : "bg-slate-50"}`}
                        readOnly={!!prefilledEmail}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 bg-slate-50"
                        required 
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Le mot de passe doit contenir au moins 6 caractères
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 bg-slate-50"
                        required 
                      />
                    </div>
                    
                    <Button type="submit" className="w-full h-10 bg-slate-900" disabled={loading}>
                      {loading ? "Inscription..." : "S'inscrire"}
                    </Button>
                    
                    <div className="text-center text-sm">
                      Vous avez déjà un compte ?{" "}
                      <button 
                        type="button"
                        onClick={switchToLogin} 
                        className="underline underline-offset-4 text-blue-600"
                      >
                        Se connecter
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {formStep === 'email-confirmation' && (
                <motion.div
                  key="email-confirmation"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="p-8 md:p-10"
                >
                  <div className="flex flex-col gap-6">
                    <button 
                      onClick={switchToLogin}
                      className="flex items-center text-sm text-slate-600 mb-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Retour à la connexion
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-50 rounded-full p-3 mb-4">
                        <Mail className="h-8 w-8 text-blue-500" />
                      </div>
                      <h1 className="text-2xl font-bold">Vérifiez votre email</h1>
                      <p className="text-balance text-muted-foreground mt-2">
                        Nous avons envoyé un lien de confirmation à <strong>{email}</strong>
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md text-blue-700 text-sm mt-4">
                      <p>Veuillez cliquer sur le lien dans l&apos;email pour activer votre compte.</p>
                      <p className="mt-2">Si vous ne trouvez pas l&apos;email, vérifiez votre dossier de spam.</p>
                    </div>
                    
                    <div className="text-center space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground flex items-center justify-center">
                        Vous n&apos;avez pas reçu d&apos;email ? 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-1"
                          onClick={async () => {
                            try {
                              const { error } = await supabase.auth.resend({
                                type: 'signup',
                                email,
                              })
                              
                              if (error) throw error
                              
                              toast({
                                title: "Email renvoyé",
                                description: "Un nouvel email de confirmation a été envoyé."
                              })
                            } catch (err) {
                              console.error("Erreur lors du renvoi de l'email:", err)
                              toast({
                                variant: "destructive",
                                title: "Erreur",
                                description: "Impossible de renvoyer l'email. Veuillez réessayer plus tard."
                              })
                            }
                          }}
                        >
                          Renvoyer l&apos;email
                        </Button>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {formStep === 'forgot-password' && (
                <motion.div
                  key="forgot-password"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="p-8 md:p-10"
                >
                  <div className="flex flex-col gap-6">
                    <button 
                      onClick={switchToLogin}
                      className="flex items-center text-sm text-slate-600 mb-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Retour à la connexion
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-50 rounded-full p-3 mb-4">
                        <Lock className="h-8 w-8 text-blue-500" />
                      </div>
                      <h1 className="text-2xl font-bold">Réinitialiser votre mot de passe</h1>
                      <p className="text-balance text-muted-foreground mt-2">
                        {resetEmailSent 
                          ? "Un email de réinitialisation a été envoyé" 
                          : "Entrez votre email pour recevoir un lien de réinitialisation"}
                      </p>
                    </div>
                    
                    {!resetEmailSent ? (
                      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="m@example.com"
                            className="h-10 bg-slate-50"
                            required
                          />
                        </div>
                        
                        <Button type="submit" className="w-full h-10 bg-slate-900" disabled={loading}>
                          {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                        </Button>
                      </form>
                    ) : (
                      <div className="mt-4 space-y-6">
                        <div className="bg-blue-50 p-4 rounded-md text-blue-700 text-sm">
                          <p>Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.</p>
                          <p className="mt-2">Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.</p>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={switchToLogin}
                        >
                          Retour à la connexion
                        </Button>
                        
                        <p className="text-sm text-muted-foreground text-center">
                          Vous n&apos;avez pas reçu d&apos;email ? 
                          <Button 
                            variant="link" 
                            className="p-0 h-auto ml-1"
                            onClick={async () => {
                              setLoading(true)
                              try {
                                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                  redirectTo: `${window.location.origin}/reset-password`,
                                })
                                
                                if (error) throw error
                                
                                toast({
                                  title: "Email renvoyé",
                                  description: "Un nouvel email de réinitialisation a été envoyé."
                                })
                              } catch (err) {
                                console.error("Erreur lors du renvoi de l'email:", err)
                                toast({
                                  variant: "destructive",
                                  title: "Erreur",
                                  description: "Impossible de renvoyer l'email. Veuillez réessayer plus tard."
                                })
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >
                            Renvoyer l&apos;email
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Bouton de diagnostic en mode développement */}
            <DiagnosticButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
