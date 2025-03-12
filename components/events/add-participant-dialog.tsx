import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AddParticipantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onParticipantAdded: () => void
}

export function AddParticipantDialog({
  open,
  onOpenChange,
  eventId,
  onParticipantAdded
}: AddParticipantDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Charger les utilisateurs de l'organisation
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Utiliser la fonction RPC pour récupérer uniquement les utilisateurs de la même organisation
        const { data, error } = await supabase
          .rpc('get_users_in_my_organization')
        
        if (error) throw error
        
        console.log("Utilisateurs de mon organisation:", data)
        setUsers(data || [])
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les utilisateurs de votre organisation."
        })
      }
    }

    if (open) {
      fetchUsers()
    }
  }, [open, supabase])

  const handleAddParticipant = async () => {
    if (!selectedUserId) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('event_participants')
        .insert([
          { event_id: eventId, user_id: selectedUserId }
        ])
      
      if (error) throw error
      
      toast({
        title: "Participant ajouté",
        description: "Le participant a été ajouté avec succès à l'événement."
      })
      
      setSelectedUserId("")
      onParticipantAdded()
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur lors de l'ajout du participant:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le participant à l'événement."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un participant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Utilisateur
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    Aucun utilisateur dans votre organisation
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleAddParticipant} 
            disabled={!selectedUserId || loading}
          >
            {loading ? "Ajout en cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 