"use client"

import React, { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, ArrowLeft, Check } from "lucide-react"
import Image from "next/image"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient, updateUserPassword } from "@/lib/supabase/client"

interface ResetPasswordFormProps {
  onSuccess?: () => void
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier si un appel est déjà en cours
    if (loading) {
      return
    }
    
    // Validation des champs
    if (!password) {
      setError("Veuillez entrer un mot de passe")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Récupérer le token de l'URL
      const token_hash = searchParams.get('token_hash')
      
      if (!token_hash) {
        throw new Error("Token manquant. Veuillez utiliser le lien envoyé par email.")
      }
      
      const { error } = await updateUserPassword(password)
      
      if (error) throw error
      
      // Réinitialisation réussie
      setResetComplete(true)
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la réinitialisation du mot de passe")
    } finally {
      setLoading(false)
    }
  }
  
  const goToLogin = () => {
    router.push('/')
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <Card className="overflow-hidden max-w-4xl w-full mx-auto shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-8 md:p-10">
            {resetComplete ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-center">Mot de passe réinitialisé</h1>
                <p className="text-center text-muted-foreground">
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
                </p>
                <div className="mt-4 w-full">
                  <Button 
                    onClick={goToLogin} 
                    className="w-full h-10 bg-slate-900"
                  >
                    Se connecter
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={goToLogin}
                  className="flex items-center text-sm text-slate-600 mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour à la connexion
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="bg-blue-50 rounded-full p-3 mb-4">
                    <Lock className="h-8 w-8 text-blue-500" />
                  </div>
                  <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
                  <p className="text-balance text-muted-foreground mt-2">
                    Veuillez définir un nouveau mot de passe pour votre compte
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Réinitialiser votre mot de passe</h1>
                    <p className="text-sm text-muted-foreground">
                      Entrez votre nouveau mot de passe ci-dessous
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Nouveau mot de passe</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading || resetComplete}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading || resetComplete}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading || resetComplete}
                      >
                        {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
          <div className="relative hidden md:block">
            <Image
              src="https://i.ibb.co/3mC5prsD/IMG-2847.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              width={1200}
              height={800}
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 