"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { CalendarToolbar } from "./CalendarToolbar"
import { CalendarView } from "./CalendarView"
import { UpcomingEvents } from "./UpcomingEvents"
import { EditEventSheet } from "./EditEventSheet"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { startOfMonth, endOfMonth } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  amount: number
  description: string
  accounting_date: string
  is_income: boolean
  category: {
    id: string
    name: string
  }
}

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

export function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)

    const { data, error } = await supabase
      .from('transactions_with_refunds')
      .select(`
        id,
        amount,
        description,
        accounting_date,
        is_income,
        category:categories(id, name)
      `)
      .gte('accounting_date', start.toISOString())
      .lte('accounting_date', end.toISOString())
      .order('accounting_date', { ascending: true })

    if (error) {
      console.error('Error fetching transactions:', error)
      setIsLoading(false)
      return
    }

    if (data) {
      setTransactions(data.map(item => ({
        ...item,
        category: item.category[0]
      })) as Transaction[])
    }
    setIsLoading(false)
  }, [currentDate, supabase])

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          start_time,
          frequency,
          created_by,
          participants:event_participants(
            user_id,
            user:users(
              id,
              name,
              avatar
            )
          )
        `)

      if (error) {
        console.error('Error fetching events:', error)
        return
      }

      if (data) {
        const formattedData = data.map(event => ({
          ...event,
          participants: event.participants.map((p: { user: unknown }) => ({
            user: p.user
          }))
        })) as Event[]
        setEvents(formattedData)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchTransactions()
    fetchEvents()

    // Souscrire aux changements de la table events
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchTransactions, fetchEvents, supabase])

  if (isLoading) {
    return <CalendarPageSkeleton />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none">
        <Button
          variant="ghost"
          className="w-fit pl-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="px-6 pb-4 mt-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight text-slate-700 dark:text-slate-100">Calendrier</h1>
            <p className="text-md text-slate-600 dark:text-slate-300">
              Gérez vos événements et rendez-vous
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-6">
        <div className="flex h-full gap-6">
          <div className="w-[65%] flex flex-col">
            <div className="flex-none py-4">
              <CalendarToolbar 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onTransactionAdded={fetchTransactions}
              />
            </div>
            <div className="flex-1 min-h-0">
              <CalendarView 
                currentDate={currentDate}
                transactions={transactions}
                onTransactionsChange={fetchTransactions}
                events={events}
                onEventEdit={(event) => {
                  setSelectedEvent(event)
                  setIsEditEventOpen(true)
                }}
                onEventsChange={fetchEvents}
              />
            </div>
          </div>
          <div className="w-[35%] bg-card">
            <div className="h-full p-6">
              <UpcomingEvents 
                events={events}
                onEventEdit={(event) => {
                  setSelectedEvent(event)
                  setIsEditEventOpen(true)
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <EditEventSheet
        event={selectedEvent}
        open={isEditEventOpen}
        onOpenChange={(open) => {
          setIsEditEventOpen(open)
          if (!open) {
            setSelectedEvent(null)
          }
        }}
        onSuccess={() => {
          setIsEditEventOpen(false)
          setSelectedEvent(null)
          fetchEvents()
        }}
      />
    </div>
  )
}

export function CalendarPageSkeleton() {
  // Utiliser des valeurs constantes pour éviter les problèmes d'hydratation
  const cellOpacities = Array(42).fill(0).map((_, i) => 0.5 + (i % 5) * 0.1);
  const eventWidths = [35, 45, 55, 40, 60, 30];
  const eventOpacities = [0.5, 0.6, 0.7, 0.4, 0.8];
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none">
        <div className="w-24 h-10 mt-2 ml-2">
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="px-6 pb-4 mt-4">
          <div className="space-y-1">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-6">
        <div className="flex h-full gap-6">
          <div className="w-[65%] flex flex-col">
            {/* Toolbar skeleton */}
            <div className="flex-none py-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-10 w-36 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-28 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              </div>
            </div>
            
            {/* Calendar grid skeleton */}
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-card">
              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 border-b bg-muted/10">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="p-2 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
              
              {/* Grille des jours */}
              <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-32px)]">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="border-r border-b p-1 relative" 
                    style={{ opacity: cellOpacities[i] }}>
                    {/* Numéro du jour */}
                    <div className="text-right mb-1">
                      <Skeleton className="h-5 w-5 ml-auto rounded-full" />
                    </div>
                    
                    {/* Événements (affichés de manière déterministe) */}
                    {/* Premier événement pour certaines cellules */}
                    {i % 4 === 0 && (
                      <div className="my-1">
                        <Skeleton 
                          className="h-5 rounded-sm"
                          style={{ 
                            width: `${eventWidths[i % 6]}px`,
                            opacity: eventOpacities[i % 5]
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Second événement pour certaines cellules */}
                    {i % 7 === 3 && (
                      <div className="my-1">
                        <Skeleton 
                          className="h-5 rounded-sm"
                          style={{ 
                            width: `${eventWidths[(i + 2) % 6]}px`,
                            opacity: eventOpacities[(i + 1) % 5]
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Upcoming events skeleton */}
          <div className="w-[35%] bg-card rounded-lg p-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center space-x-2 mt-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 