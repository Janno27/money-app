"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Note } from "./types"
import { NotesCanvas } from "./NotesCanvas"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NotesDrawer() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null } | null>(null)
  const [creators, setCreators] = useState<{id: string, name: string}[]>([])
  const [selectedCreator, setSelectedCreator] = useState<string>("all")
  const supabase = createClientComponentClient()

  const fetchNotes = useCallback(async () => {
    try {
      console.log("Récupération des notes depuis Supabase...")
      
      // Récupérer toutes les notes
      const { data: notesData, error } = await supabase
        .from('notes')
        .select(`
          *,
          users (
            id,
            name,
            avatar
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des notes:', error)
        return
      }

      if (notesData && notesData.length > 0) {
        console.log(`${notesData.length} notes récupérées`)
        const notesWithUsers = notesData.map(note => ({
          ...note,
          user: {
            id: note.users?.id,
            name: note.users?.name || "Utilisateur",
            avatar: note.users?.avatar
          }
        }))
        setNotes(notesWithUsers)
        
        // Extraire la liste des créateurs uniques
        const uniqueCreators = Array.from(new Set(notesWithUsers.map(note => note.user_id)))
          .map(userId => {
            const user = notesWithUsers.find(note => note.user_id === userId)
            return {
              id: userId,
              name: user?.user?.name || "Utilisateur"
            }
          })
        
        setCreators(uniqueCreators)
      } else {
        console.log("Aucune note trouvée")
        setNotes([])
        setCreators([])
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la récupération des notes:", error)
    }
  }, [supabase])

  // Filtrer les notes en fonction du créateur sélectionné
  useEffect(() => {
    if (selectedCreator === "all") {
      setFilteredNotes(notes)
    } else {
      setFilteredNotes(notes.filter(note => note.user_id === selectedCreator))
    }
  }, [selectedCreator, notes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    const handleOpenDrawer = () => {
      setOpen(true)
    }
    
    const handleRefreshNotes = () => {
      console.log("Événement refresh-notes reçu, rafraîchissement des notes...")
      fetchNotes()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-notes-drawer', handleOpenDrawer)
    window.addEventListener('refresh-notes', handleRefreshNotes)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-notes-drawer', handleOpenDrawer)
      window.removeEventListener('refresh-notes', handleRefreshNotes)
    }
  }, [fetchNotes])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser({ ...user, ...userData })
      }
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    if (open) {
      // Forcer un rafraîchissement des notes à chaque ouverture du drawer
      console.log("Drawer ouvert, rafraîchissement des notes...")
      fetchNotes()
    }
  }, [open, fetchNotes])

  const handleCreateNote = async () => {
    if (!currentUser) return

    // Calculer une position aléatoire dans les limites du drawer
    const drawerContent = document.querySelector('.notes-canvas')
    const drawerRect = drawerContent?.getBoundingClientRect()
    const maxX = (drawerRect?.width || 800) - 300 // 300 est la largeur d'une note
    const maxY = (drawerRect?.height || 600) - 200 // 200 est la hauteur approximative d'une note

    const newNote = {
      id: crypto.randomUUID(),
      content: "",
      color: "yellow" as const,
      position: { 
        x: Math.max(0, Math.random() * maxX),
        y: Math.max(0, Math.random() * maxY)
      },
      user_id: currentUser.id
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert(newNote)
      .select(`
        *,
        users (
          name,
          avatar
        )
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la création de la note:', error)
      return
    }

    if (note) {
      const noteWithUser = {
        ...note,
        user: {
          name: note.users?.name || "Utilisateur",
          avatar: note.users?.avatar
        }
      }
      setNotes(prev => [...prev, noteWithUser])
    }
  }

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    // Destructurer en ignorant le champ user qui n'est pas nécessaire pour l'update
    const { user: _user, ...updateData } = updates

    const { data: note, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users (
          name,
          avatar
        )
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la note:', error)
      return
    }

    if (note) {
      const updatedNote = {
        ...note,
        user: {
          name: note.users?.name || "Utilisateur",
          avatar: note.users?.avatar
        }
      }
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n))
    }
  }

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression de la note:', error)
      return
    }

    setNotes(prev => prev.filter(note => note.id !== id))
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="px-6">
          <div className="space-y-1">
            <DrawerTitle className="text-2xl font-medium tracking-tight text-slate-700">Notes</DrawerTitle>
            <DrawerDescription className="text-md text-slate-600">
              Appuyez sur ⌘N pour ouvrir/fermer
            </DrawerDescription>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par créateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les créateurs</SelectItem>
                {creators.map((creator) => (
                  <SelectItem key={creator.id} value={creator.id}>
                    {creator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateNote} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle note
            </Button>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <NotesCanvas
            notes={filteredNotes}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
} 