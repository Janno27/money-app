"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Table, 
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Loader2, 
  User,
  Mail,
  Trash2,
  CheckCircle,
  Copy,
  Plus
} from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OrganizationMember {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export function OrganizationSettings() {
  const supabase = createClientComponentClient()
  const [organization, setOrganization] = useState<{ id: string, name: string, owner_id: string }>()
  const [organizationName, setOrganizationName] = useState("")
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchOrganizationData = async () => {
      setLoading(true)
      
      try {
        // Récupérer l'utilisateur authentifié
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          setCurrentUserId(authUser.id)
          
          // Récupérer les données de l'organisation
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', authUser.id)
            .single()
          
          if (userData?.organization_id) {
            // Récupérer les informations de l'organisation
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', userData.organization_id)
              .single()
            
            if (orgError) throw orgError
            
            setOrganization(orgData)
            setOrganizationName(orgData.name)
            setIsOwner(orgData.owner_id === authUser.id)
            
            // Récupérer les membres de l'organisation
            const { data: membersData, error: membersError } = await supabase
              .rpc('get_users_in_my_organization')
            
            if (membersError) throw membersError
            
            // Récupérer les rôles des membres
            const { data: rolesData, error: rolesError } = await supabase
              .from('organization_members')
              .select('user_id, role')
              .eq('organization_id', userData.organization_id)
            
            if (rolesError) throw rolesError
            
            // Combiner les données des membres avec leurs rôles
            const membersWithRoles = membersData.map((member: { id: string; [key: string]: unknown }) => {
              const memberRole = rolesData.find((r: { user_id: string; role: string }) => r.user_id === member.id)
              return {
                ...member,
                role: memberRole?.role || 'member'
              }
            })
            
            setMembers(membersWithRoles)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données de l'organisation:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données de l'organisation."
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrganizationData()
  }, [supabase])
  
  const handleUpdateOrganization = async () => {
    if (!organization || !isOwner) return
    
    setUpdating(true)
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organizationName
        })
        .eq('id', organization.id)
      
      if (error) throw error
      
      toast({
        title: "Organisation mise à jour",
        description: "Le nom de l'organisation a été mis à jour avec succès."
      })
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'organisation:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour l'organisation."
      })
    } finally {
      setUpdating(false)
    }
  }
  
  const handleInviteMember = async () => {
    if (!organization || !inviteEmail) return
    
    setUpdating(true)

    try {
      // Vérifier la validité de l'email
      if (!isValidEmail(inviteEmail)) {
        throw new Error("Adresse email invalide.");
      }
      
      console.log("Tentative d'invitation pour:", inviteEmail);
      console.log("Organisation actuelle:", organization);
      
      // Récupérer le token d'authentification
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error("Vous devez être connecté pour inviter un utilisateur.");
      }
      
      // On utilise directement le client Supabase pour une vérification minimale
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail)
        .maybeSingle();
        
      if (existingUser?.id) {
        // L'utilisateur existe déjà, l'ajouter directement
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: existingUser.id,
            role: 'member'
          });
          
        if (memberError) {
          console.error("Erreur lors de l'ajout de l'utilisateur:", memberError);
          throw new Error("Impossible d'ajouter l'utilisateur à l'organisation.");
        }
        
        toast({
          title: "Membre ajouté",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>L&apos;utilisateur <strong>{inviteEmail}</strong> a été ajouté à votre organisation.</span>
            </div>
          ),
          duration: 5000
        });
      } else {
        // L'utilisateur n'existe pas, tenter d'envoyer une invitation
        // Appel à notre API qui communique avec la fonction Edge Supabase
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session.access_token}`
          },
          body: JSON.stringify({
            email: inviteEmail,
            organization_id: organization.id
          })
        });
        
        const result = await response.json();
        console.log("Réponse de l'API:", result);
        
        if (!response.ok) {
          throw new Error(result.error || "Impossible d'envoyer l'invitation.");
        }
        
        toast({
          title: "Lien d'invitation créé",
          description: (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Partagez ce lien avec <strong>{inviteEmail}</strong> pour l&apos;inviter à rejoindre votre organisation.</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(result.invitationLink);
                    toast({
                      title: "Lien copié",
                      description: "Le lien d'invitation a été copié dans le presse-papier."
                    });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copier le lien
                </Button>
              </div>
            </div>
          ),
          duration: 10000 // Augmenter la durée pour laisser le temps de cliquer sur le bouton
        });
      }
      
      setInviteEmail("");
      
    } catch (error: Error | unknown) {
      console.error("Erreur lors de l'invitation:", error);
      
      // Gérer les erreurs spécifiques
      const errorMessage = error instanceof Error ? error.message : "Impossible d&apos;envoyer l&apos;invitation.";
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // Fonction utilitaire pour valider les emails
  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!organization || !isOwner || memberId === currentUserId) return
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organization.id)
        .eq('user_id', memberId)
      
      if (error) throw error
      
      // Mettre à jour la liste des membres
      setMembers(members.filter(member => member.id !== memberId))
      
      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré de votre organisation."
      })
      
    } catch (error) {
      console.error("Erreur lors du retrait d'un membre:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de retirer ce membre."
      })
    }
  }
  
  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!organization || !isOwner || memberId === currentUserId) return
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({
          role: newRole
        })
        .eq('organization_id', organization.id)
        .eq('user_id', memberId)
      
      if (error) throw error
      
      // Mettre à jour le rôle dans la liste des membres
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ))
      
      toast({
        title: "Rôle modifié",
        description: "Le rôle du membre a été modifié avec succès."
      })
      
    } catch (error) {
      console.error("Erreur lors de la modification du rôle:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le rôle de ce membre."
      })
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
          <h3 className="text-lg font-medium">Paramètres de l&apos;organisation</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les informations de votre organisation et vos membres
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Section Informations de l&apos;organisation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Informations de l&apos;organisation</h4>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="orgName">Nom de l&apos;organisation</Label>
                <div className="flex gap-2">
                  <Input 
                    id="orgName" 
                    value={organizationName} 
                    onChange={(e) => setOrganizationName(e.target.value)} 
                    placeholder="Nom de l&apos;organisation"
                    disabled={!isOwner}
                  />
                  {isOwner && (
                    <Button 
                      onClick={handleUpdateOrganization} 
                      disabled={updating || organizationName === organization?.name}
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Section Membres */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Membres de l&apos;organisation</h4>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button 
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    onClick={() => {}}
                  >
                    <Plus className="h-3 w-3" />
                    Inviter un membre
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Inviter un utilisateur</DialogTitle>
                    <DialogDescription>
                      Nous enverrons un email d&apos;invitation pour rejoindre votre organisation.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="inviteEmail">Adresse email</Label>
                      <Input 
                        id="inviteEmail" 
                        type="email" 
                        value={inviteEmail} 
                        onChange={(e) => setInviteEmail(e.target.value)} 
                        placeholder="email@exemple.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Un email sera envoyé avec un lien d&apos;invitation.
                      </p>
                    </div>
                    
                    <Alert variant="info" className="bg-blue-50">
                      <Mail className="h-4 w-4" />
                      <AlertTitle>Comment ça fonctionne</AlertTitle>
                      <AlertDescription className="text-xs">
                        L&apos;utilisateur recevra un email avec un lien pour créer un compte ou se connecter.
                        Une fois connecté, il deviendra automatiquement membre de votre organisation.
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={handleInviteMember} 
                      disabled={updating || !inviteEmail}
                      className="relative"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer l&apos;invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    {isOwner && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isOwner ? 3 : 2} className="text-center text-muted-foreground py-6">
                        Aucun membre trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar || ''} alt={member.name} />
                              <AvatarFallback>
                                {member.name ? member.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOwner && member.id !== currentUserId ? (
                            <select 
                              className="w-full text-sm p-1 border border-input rounded-md"
                              value={member.role}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                            >
                              <option value="member">Membre</option>
                              <option value="admin">Administrateur</option>
                            </select>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-muted">
                              {member.id === organization?.owner_id ? "Propriétaire" : member.role === "admin" ? "Administrateur" : "Membre"}
                            </span>
                          )}
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            {member.id !== currentUserId && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 