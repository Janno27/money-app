"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload, Loader2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function AccountSettings() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<{ id: string, email: string, name: string, avatar: string | null }>()
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      
      try {
        // Récupérer l'utilisateur authentifié
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Récupérer les données de profil utilisateur
          const { data, error } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', authUser.id)
            .single()
          
          if (error) throw error
          
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: data.name || '',
            avatar: data.avatar
          })
          
          setName(data.name || '')
          setAvatar(data.avatar)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos données de profil."
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [supabase])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    
    // Créer un aperçu de l'image
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleUpdateProfile = async () => {
    if (!user) return
    
    setUpdating(true)
    
    try {
      // Mettre à jour les informations de base
      const updates: { name: string; avatar?: string } = {
        name: name
      }

      // Si un fichier est sélectionné, nous allons simuler le stockage d'avatar
      // en utilisant une solution temporaire (URL de données)
      if (selectedFile && previewUrl) {
        // Approche temporaire : utiliser l'URL de données directement
        // Note: Dans une application de production, cela n'est pas recommandé car les URLs
        // de données peuvent être très volumineuses. Normalement, on utiliserait
        // un service de stockage comme Supabase Storage ou autre.
        updates.avatar = previewUrl
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      // Mettre à jour le state local
      if (selectedFile && previewUrl) {
        setAvatar(previewUrl)
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de profil ont été mises à jour avec succès."
      })
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil."
      })
    } finally {
      setUpdating(false)
      setSelectedFile(null)
      // Ne pas effacer le previewUrl car il est maintenant utilisé comme avatar
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium">Informations du compte</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les informations de votre compte et votre profil
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Section Avatar */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Photo de profil</h4>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Aperçu" />
                ) : (
                  <>
                    <AvatarImage src={avatar || undefined} alt={name} />
                    <AvatarFallback>
                      {name ? name.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              
              <div className="space-y-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex h-8 items-center justify-center rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80">
                  <Upload className="mr-2 h-3 w-3" />
                  Changer l&apos;image
                </Label>
                <Input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou GIF. 1MB maximum.
                </p>
              </div>
            </div>
          </div>
          
          {/* Section Informations */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Informations personnelles</h4>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Votre nom"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Pour modifier votre email, contactez l&apos;administrateur.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleUpdateProfile} 
              disabled={updating}
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 