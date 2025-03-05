"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { EvolutionSummary } from "@/components/@components/evolution/EvolutionSummary"
import { EvolutionChart } from "@/components/@components/evolution/EvolutionChart"
import { UpcomingEvents } from "@/components/@components/calendar/UpcomingEvents"
import { NotesStack } from "@/components/@components/notes/NotesStack"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from "react"
import { Note } from "@/components/@components/notes/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, CreditCard, Receipt, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddEventDialog } from "@/components/@components/calendar/AddEventDialog"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { useRouter } from "next/navigation"

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

    const fetchNotes = async () => {
      const { data: notesData } = await supabase
        .from('notes')
        .select(`
          *,
          user:users(name, avatar)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notesData) {
        setNotes(notesData)
      }
    }

    const fetchTransactions = async () => {
      const currentYear = new Date().getFullYear()
      const { data: transactionsData } = await supabase
        .from('transactions_with_refunds')
        .select('*')
        .gte('accounting_date', `${currentYear}-01-01`)
        .lte('accounting_date', `${currentYear}-12-31`)

      if (transactionsData) {
        // Créer un tableau avec tous les mois de l'année
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: format(new Date(currentYear, i, 1), 'MMM', { locale: fr }),
          income: 0,
          expenses: 0
        }))

        // Remplir les données pour chaque transaction
        transactionsData.forEach(transaction => {
          const monthIndex = new Date(transaction.accounting_date).getMonth()
          if (transaction.is_income) {
            monthlyData[monthIndex].income += transaction.final_amount
          } else {
            monthlyData[monthIndex].expenses += Math.abs(transaction.final_amount)
          }
        })

        setData(monthlyData)
      }
    }

    fetchUser()
    fetchEvents()
    fetchNotes()
    fetchTransactions()
  }, [supabase])

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    const { data } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (data) {
      setNotes(notes.map(note => note.id === id ? { ...note, ...data } : note))
    }
  }

  const handleDeleteNote = async (id: string) => {
    await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    setNotes(notes.filter(note => note.id !== id))
  }

  const handleCreateNote = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const newNote = {
      id: crypto.randomUUID(),
      content: "",
      color: "yellow" as const,
      position: { x: 0, y: 0 },
      user_id: userData.user.id,
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
      setNotes([noteWithUser, ...notes])
      
      // Déclencher l'événement pour mettre à jour le drawer des notes
      const refreshEvent = new CustomEvent('refresh-notes')
      window.dispatchEvent(refreshEvent)
    }
  }

  const openNotesDrawer = () => {
    // Déclencher d'abord l'événement pour rafraîchir les notes
    const refreshEvent = new CustomEvent('refresh-notes')
    window.dispatchEvent(refreshEvent)
    
    // Puis dispatch un événement personnalisé pour ouvrir le drawer des notes
    const event = new CustomEvent('open-notes-drawer')
    window.dispatchEvent(event)
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
            <div className="grid grid-cols-12 grid-rows-6 gap-8 h-full">
              {/* Title */}
              <div className="col-span-8 row-span-2">
                <div className="flex items-center justify-between mb-6 pl-2">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-medium tracking-tight text-slate-700">
                      Hello, <span className="font-semibold">{userName || 'User'}</span> 👋
                    </h1>
                    <p className="text-lg text-slate-600">
                      Voici un aperçu de vos finances
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      className="text-slate-700 hover:text-slate-800 gap-2"
                      onClick={() => setIsAddIncomeOpen(true)}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Revenus</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-slate-700 hover:text-slate-800 gap-2"
                      onClick={() => setIsAddExpenseOpen(true)}
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Dépenses</span>
                    </Button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 rounded-xl p-2 relative text-white [&_div]:text-white [&_.text-muted-foreground]:text-white/70 [&_button]:text-white/70 [&_button:hover]:text-white [&_button:hover]:bg-white/10 [&_.bg-border]:bg-white/20 [&_.text-emerald-500]:text-emerald-400 [&_.text-rose-500]:text-rose-400">
                  <EvolutionSummary isDashboard={true} />
                  <div className="flex justify-start">
                    <Button 
                      variant="link" 
                      className="text-white flex items-center gap-1 hover:gap-2 transition-all"
                      onClick={() => router.push('/dashboard/accounting')}
                    >
                      Accéder à la comptabilité
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* UpcomingEvents (3/6) */}
              <div className="col-span-4 row-span-3">
                <div className="h-full border rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-700/90">
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
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setIsAddEventOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-[calc(100%-4.5rem)] px-4 pb-4">
                    <ScrollArea className="h-full">
                      <div className="rounded-lg [&_h3]:text-white">
                        <UpcomingEvents events={events} hideTitle />
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {/* EvolutionChart (4/6) */}
              <div className="col-span-8 row-span-4 mt-12">
                <div className="h-full bg-background rounded-xl flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 pt-4 pb-1 px-2">
                    <EvolutionChart data={data} />
                  </div>
                  <div className="absolute bottom-0 right-0 p-2 z-10">
                    <Button 
                      variant="link" 
                      className="text-slate-700 flex items-center gap-1 hover:gap-2 transition-all p-0 h-6"
                      onClick={() => router.push('/dashboard/evolution')}
                    >
                      Accéder à l&apos;évolution
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes (3/6) */}
              <div className="col-span-4 row-span-3 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={openNotesDrawer}
                    >
                      <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-1 hover:gap-2 transition-all">
                        Notes
                        <ArrowRight className="h-4 w-4" />
                      </h2>
                    </Button>
                    <p className="text-sm text-slate-600">Vos notes personnelles</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    onClick={async () => {
                      await handleCreateNote();
                      // Ne pas ouvrir le drawer, la note sera déjà visible dans le stack
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 bg-card rounded-xl overflow-hidden">
                  <div className="h-full p-4">
                    <NotesStack 
                      notes={notes} 
                      onUpdateNote={handleUpdateNote} 
                      onDeleteNote={handleDeleteNote} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <AddEventDialog 
              open={isAddEventOpen}
              onOpenChange={setIsAddEventOpen}
            />
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
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
