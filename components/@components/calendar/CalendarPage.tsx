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
  const supabase = createClientComponentClient()

  const fetchTransactions = useCallback(async () => {
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
      return
    }

    if (data) {
      setTransactions(data.map(item => ({
        ...item,
        category: item.category[0]
      })) as Transaction[])
    }
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
            user:users!user_id(
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
            <h1 className="text-2xl font-medium tracking-tight text-slate-700">Calendrier</h1>
            <p className="text-md text-slate-600">
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