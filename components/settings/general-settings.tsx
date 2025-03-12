"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrashIcon, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

export function GeneralSettings() {
  const [tokenUsage, setTokenUsage] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(true)
  const [notifications, setNotifications] = React.useState(true)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const supabase = createClientComponentClient()

  // Fonction pour supprimer toutes les données de l'organisation
  const deleteAllData = async () => {
    setIsDeleting(true)
    
    try {
      // 1. Récupérer l'ID de l'organisation de l'utilisateur courant
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        throw new Error("Vous devez être connecté pour effectuer cette action")
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single()
      
      if (userError || !userData?.organization_id) {
        throw new Error("Impossible de récupérer votre organisation")
      }
      
      const organizationId = userData.organization_id
      
      // 2. Supprimer les données dans l'ordre pour respecter les contraintes de clés étrangères
      
      // Supprimer les remboursements (refunds)
      const { error: refundsError } = await supabase
        .from('refunds')
        .delete()
        .eq('organization_id', organizationId)
      
      if (refundsError) {
        console.error("Erreur lors de la suppression des remboursements:", refundsError)
      }
      
      // Supprimer les transactions
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('organization_id', organizationId)
      
      if (transactionsError) {
        console.error("Erreur lors de la suppression des transactions:", transactionsError)
      }
      
      // Supprimer les événements
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('organization_id', organizationId)
      
      if (eventsError) {
        console.error("Erreur lors de la suppression des événements:", eventsError)
      }
      
      // Supprimer les notes
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('organization_id', organizationId)
      
      if (notesError) {
        console.error("Erreur lors de la suppression des notes:", notesError)
      }
      
      // 3. Afficher un toast de confirmation
      toast({
        title: "Données supprimées",
        description: "Toutes vos données ont été supprimées avec succès.",
        variant: "default"
      })
      
      // 4. Fermer la boîte de dialogue
      setConfirmDelete(false)
    } catch (error: any) {
      console.error("Erreur lors de la suppression des données:", error)
      
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression des données.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 pb-20">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Préférences d&apos;affichage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Mode sombre</Label>
                <p className="text-sm text-muted-foreground">
                  Activer le thème sombre pour l&apos;application
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Données</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="token-usage">Utilisation des données</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser la collecte de données anonymes pour améliorer l&apos;application
                </p>
              </div>
              <Switch
                id="token-usage"
                checked={tokenUsage}
                onCheckedChange={setTokenUsage}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications sur l&apos;activité de l&apos;application
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Gestion des données</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ces actions sont irréversibles. Veuillez procéder avec prudence.
            </p>
            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="mt-2">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer toutes les données
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Confirmation de suppression
                  </DialogTitle>
                  <DialogDescription>
                    Cette action supprimera définitivement toutes vos données. Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm font-medium">
                    Êtes-vous absolument sûr de vouloir continuer ?
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={deleteAllData}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 