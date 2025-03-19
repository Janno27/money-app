"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { EvolutionSummary } from "@/components/@components/evolution/EvolutionSummary"
import { EvolutionChart } from "@/components/@components/evolution/EvolutionChart"
import { UpcomingEvents, UpcomingEventsSkeleton } from "@/components/@components/calendar/UpcomingEvents"
import { NotesStack } from "@/components/@components/notes/NotesStack"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from "react"
import { Note } from "@/components/@components/notes/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, CreditCard, Receipt, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddEventDialog } from "@/components/@components/calendar/AddEventDialog"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { useRouter } from "next/navigation"
import { NotesStackSkeleton } from "@/components/@components/notes/NotesStack"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_by: string
  participants: {
    user: {
      id: string
      name: string
      avatar: string
    }
  }[]
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [data, setData] = useState<Array<{ month: string; expenses: number; income: number }>>([])
  const [userName, setUserName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [isNotesLoading, setIsNotesLoading] = useState(true)
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const supabase = createClientComponentClient()
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        
        if (userData?.name) {
          setUserName(userData.name.split(' ')[0]) // On prend que le prénom
        }
      }
    }

    const fetchEvents = async () => {
      setIsEventsLoading(true)
      try {
        const { data: eventsData } = await supabase
          .from('events')
          .select(`
            *,
            participants:event_participants(
              user:users(id, name, avatar)
            )
          `)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(5)

        if (eventsData) {
          setEvents(eventsData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error)
      } finally {
        setIsEventsLoading(false)
      }
    }

    const fetchNotes = async () => {
      setIsNotesLoading(true)
      try {
        const { data: notesData } = await supabase
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
          .limit(5)

        if (notesData) {
          // Transformer les données pour avoir le bon format d'objet user
          const notesWithFormattedUsers = notesData.map(note => ({
            ...note,
            user: {
              id: note.users?.id,
              name: note.users?.name || "Utilisateur",
              avatar: note.users?.avatar
            }
          }));
          setNotes(notesWithFormattedUsers)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notes:", error)
      } finally {
        setIsNotesLoading(false)
      }
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() // 0-11, où 0 = janvier
        const { data: transactionsData } = await supabase
          .from('transactions_with_refunds')
          .select('*')
          .gte('accounting_date', `${currentYear}-01-01`)
          .lte('accounting_date', `${currentYear}-12-31`)

        if (transactionsData) {
          // Créer un tableau avec tous les mois de l'année jusqu'au mois actuel
          const monthlyData = Array.from({ length: currentMonth + 1 }, (_, i) => ({
            month: format(new Date(currentYear, i, 1), 'MMM', { locale: fr }),
            income: 0,
            expenses: 0
          }))

          // Remplir les données pour chaque transaction
          transactionsData.forEach(transaction => {
            const transactionDate = new Date(transaction.accounting_date)
            const transactionMonth = transactionDate.getMonth()
            
            // Ne prendre en compte que les transactions jusqu'au mois actuel
            if (transactionMonth <= currentMonth) {
              if (transaction.is_income) {
                monthlyData[transactionMonth].income += transaction.final_amount
              } else {
                monthlyData[transactionMonth].expenses += Math.abs(transaction.final_amount)
              }
            }
          })

          setData(monthlyData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
    fetchEvents()
    fetchNotes()
    fetchTransactions()
  }, [supabase])

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
      
      // Mettre à jour la note dans l'état local
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        )
      )
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la note:", error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      
      // Supprimer la note de l'état local
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id))
    } catch (error) {
      console.error("Erreur lors de la suppression de la note:", error)
    }
  }

  const handleCreateNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      // Créer une nouvelle note
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          content: '',
          color: 'yellow',
          position: { x: 0, y: 0 },
          user_id: user.id,
        })
        .select(`
          *,
          users (
            id,
            name,
            avatar
          )
        `)
        .single()
      
      if (error) throw error
      
      // Ajouter la nouvelle note à l'état local avec le format correctement transformé
      if (newNote) {
        const noteWithFormattedUser = {
          ...newNote,
          user: {
            id: newNote.users?.id,
            name: newNote.users?.name || "Utilisateur",
            avatar: newNote.users?.avatar
          }
        };
        setNotes(prevNotes => [noteWithFormattedUser, ...prevNotes])
      }
    } catch (error) {
      console.error("Erreur lors de la création de la note:", error)
    }
  }

  const openNotesDrawer = () => {
    // Cette fonction serait implémentée pour ouvrir un drawer avec toutes les notes
    // Pour l'instant, nous allons simplement envoyer un événement personnalisé
    const event = new CustomEvent('open-notes-drawer')
    window.dispatchEvent(event)
  }

  const openAddNoteModal = () => {
    handleCreateNote()
  }

  const handlePreviousNote = () => {
    setCurrentNoteIndex((prev) => (prev + 1) % notes.length)
  }

  const handleNextNote = () => {
    setCurrentNoteIndex((prev) => (prev - 1 + notes.length) % notes.length)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-[100vh] overflow-hidden">
          <header className="flex-none border-b bg-background px-4 py-3">
            <Breadcrumb
              segments={[
                { title: "Tableau de bord" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-8">
            <div className="grid grid-cols-12 gap-8 h-full">
              <div className="col-span-8 flex flex-col h-full">
                {/* Title and actions */}
                <div className="flex items-center justify-between pl-2 mb-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-medium tracking-tight text-slate-700 dark:text-slate-100">
                      Hello, <span className="font-semibold">{userName || 'User'}</span> 👋
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                      Voici un aperçu de vos finances
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      className="text-slate-700 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50 gap-2"
                      onClick={() => setIsAddIncomeOpen(true)}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Revenus</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-slate-700 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50 gap-2"
                      onClick={() => setIsAddExpenseOpen(true)}
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Dépenses</span>
                    </Button>
                  </div>
                </div>

                {/* Evolution Summary */}
                <div className="bg-gradient-to-r from-blue-500 to-sky-500 dark:from-blue-900/70 dark:to-sky-900/70 dark:bg-none dark:bg-slate-800/90 rounded-xl p-2 relative text-white [&_div]:text-white [&_.text-muted-foreground]:text-white/70 [&_button]:text-white/70 [&_button:hover]:text-white [&_button:hover]:bg-white/10 [&_.bg-border]:bg-white/20 [&_.text-emerald-500]:text-emerald-400 [&_.text-rose-500]:text-rose-400 mb-8 dark:[&_.dashboard-summary_.dark\:text-slate-300]:text-white/80 dark:[&_.dashboard-summary_.dark\:text-white]:text-white dark:[&_.dashboard-summary_.dark\:text-slate-400]:text-white/70">
                  <EvolutionSummary isDashboard={true} />
                  <div className="flex justify-start">
                    <Button 
                      variant="link" 
                      className="text-white flex items-center gap-1 hover:gap-2 transition-all dark:text-white dark:opacity-90 dark:hover:opacity-100"
                      onClick={() => router.push('/dashboard/accounting')}
                    >
                      Accéder à la comptabilité
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Evolution Chart - prend le reste de l'espace vertical */}
                <div className="bg-background rounded-xl flex flex-col relative overflow-hidden flex-1">
                  <div className="absolute inset-0 pt-4 pb-1 px-2">
                    <EvolutionChart data={data} isDashboard={true} isLoading={isLoading} />
                  </div>
                  <div className="absolute bottom-0 right-0 p-2 z-10">
                    <Button 
                      variant="link" 
                      className="text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:gap-2 transition-all p-0 h-6"
                      onClick={() => router.push('/dashboard/evolution')}
                    >
                      Accéder à l&apos;évolution
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col h-full gap-8">
                {/* Events card - aligned with title */}
                <div className="border rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-sky-500 dark:from-blue-900/70 dark:to-sky-900/70 dark:bg-none dark:bg-slate-800/90" style={{ height: "300px" }}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col items-start">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push('/dashboard/calendar')}
                      >
                        <h3 className="font-semibold text-white flex items-center gap-1 hover:gap-2 transition-all">
                          Événements à venir
                          <ArrowRight className="h-4 w-4" />
                        </h3>
                      </Button>
                      <p className="text-sm text-white/80 text-left">Aperçu des prochains événements</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 dark:text-white/90 dark:hover:text-white dark:hover:bg-slate-700/50"
                      onClick={() => setIsAddEventOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-[calc(100%-4.5rem)] px-4 pb-4">
                    <ScrollArea className="h-full">
                      <div className="rounded-lg [&_h3]:text-white [&_.dark\:bg-slate-800]:dark:bg-slate-700/80 [&_.dark\:border-slate-700]:dark:border-slate-600/80">
                        {isEventsLoading ? (
                          <UpcomingEventsSkeleton isDashboard={true} />
                        ) : (
                          <UpcomingEvents events={events} hideTitle isDashboard={true} />
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Notes section - prend le reste de l'espace vertical */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={openNotesDrawer}
                      >
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-white flex items-center gap-1 hover:gap-2 transition-all">
                          Notes
                          <ArrowRight className="h-4 w-4" />
                        </h2>
                      </Button>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Vos notes personnelles</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50"
                      onClick={openAddNoteModal}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="relative flex-1">
                    {isNotesLoading ? (
                      <NotesStackSkeleton />
                    ) : notes.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Aucune note à afficher
                      </div>
                    ) : (
                      <>
                        <div className="relative h-full">
                          {notes.map((note, index) => (
                            <div
                              key={note.id}
                              className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-300"
                              style={{
                                opacity: index === currentNoteIndex ? 1 : 0.15,
                                transform: `translate(${(index - currentNoteIndex) * -5}px, ${(index - currentNoteIndex) * -5}px) scale(${index === currentNoteIndex ? 1 : 0.9})`,
                                zIndex: index === currentNoteIndex ? notes.length : notes.length - Math.abs(index - currentNoteIndex),
                                pointerEvents: index === currentNoteIndex ? 'auto' : 'none',
                                maxWidth: "75%",
                                maxHeight: "75%",
                                margin: "auto",
                                top: "0",
                                left: "0",
                                right: "0",
                                bottom: "0"
                              }}
                            >
                              <Card className={cn(
                                "w-full h-full transition-colors shadow-sm",
                                note.color === 'yellow' && "bg-yellow-100 border-yellow-200 dark:bg-yellow-900/80 dark:border-yellow-700 dark:text-yellow-50",
                                note.color === 'blue' && "bg-blue-100 border-blue-200 dark:bg-blue-900/80 dark:border-blue-700 dark:text-blue-50",
                                note.color === 'green' && "bg-green-100 border-green-200 dark:bg-green-900/80 dark:border-green-700 dark:text-green-50",
                                note.color === 'pink' && "bg-pink-100 border-pink-200 dark:bg-pink-900/80 dark:border-pink-700 dark:text-pink-50",
                                note.color === 'purple' && "bg-purple-100 border-purple-200 dark:bg-purple-900/80 dark:border-purple-700 dark:text-purple-50"
                              )}>
                                <div className="flex flex-col gap-2 p-3 h-full">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage src={note.user?.avatar || undefined} />
                                        <AvatarFallback>{note.user?.name?.[0] || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{note.user?.name || "Utilisateur"}</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 overflow-auto">
                                    <p className="text-xs text-slate-700 dark:text-slate-200">{note.content || "Écrivez votre note ici..."}</p>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          ))}
                        </div>
                        {notes.length > 1 && (
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-40">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                              onClick={handlePreviousNote}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                              onClick={handleNextNote}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onSuccess={() => {
          // Rafraîchir les événements lors de l'ajout réussi
          const fetchEvents = async () => {
            const { data: eventsData } = await supabase
              .from('events')
              .select(`
                *,
                participants:event_participants(
                  user:users(id, name, avatar)
                )
              `)
              .gte('start_date', new Date().toISOString())
              .order('start_date', { ascending: true })
              .limit(5)

            if (eventsData) {
              setEvents(eventsData)
            }
          }
          fetchEvents()
        }}
      />

      {/* Add Transaction Dialogs */}
      <AddTransactionDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        isIncome={false}
      />
      <AddTransactionDialog
        open={isAddIncomeOpen}
        onOpenChange={setIsAddIncomeOpen}
        isIncome={true}
      />
    </SidebarProvider>
  )
}
