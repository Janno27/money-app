"use client"

import { useState, useEffect } from "react"
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, compareAsc, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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

interface UpcomingEventsProps {
  events: Event[]
  onEventEdit?: (event: Event) => void
  hideTitle?: boolean
}

interface GroupedEvents {
  today: Event[]
  tomorrow: Event[]
  thisWeek: Event[]
  thisMonth: Event[]
  future: Event[]
}

export function UpcomingEvents({ events, onEventEdit, hideTitle }: UpcomingEventsProps) {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({
    today: [],
    tomorrow: [],
    thisWeek: [],
    thisMonth: [],
    future: [],
  })

  useEffect(() => {
    const grouped = events.reduce((acc: GroupedEvents, event) => {
      const date = new Date(event.start_date)
      const now = new Date()
      
      // Ignorer les événements passés
      if (date < now && !isToday(date)) {
        return acc
      }
      
      if (isToday(date)) {
        acc.today.push(event)
      } else if (isTomorrow(date)) {
        acc.tomorrow.push(event)
      } else if (isThisWeek(date)) {
        acc.thisWeek.push(event)
      } else if (isThisMonth(date)) {
        acc.thisMonth.push(event)
      } else {
        acc.future.push(event)
      }

      return acc
    }, {
      today: [],
      tomorrow: [],
      thisWeek: [],
      thisMonth: [],
      future: [],
    })

    // Trier chaque groupe par date et heure
    const sortEvents = (events: Event[]) => {
      return events.sort((a, b) => {
        const dateA = new Date(a.start_date + (a.start_time ? ` ${a.start_time}` : ''))
        const dateB = new Date(b.start_date + (b.start_time ? ` ${b.start_time}` : ''))
        return compareAsc(dateA, dateB)
      })
    }

    grouped.today = sortEvents(grouped.today)
    grouped.tomorrow = sortEvents(grouped.tomorrow)
    grouped.thisWeek = sortEvents(grouped.thisWeek)
    grouped.thisMonth = sortEvents(grouped.thisMonth)
    grouped.future = sortEvents(grouped.future)

    setGroupedEvents(grouped)
  }, [events])

  const renderEvent = (event: Event) => {
    return (
      <div
        key={event.id}
        className="bg-white shadow-sm p-3 border rounded-lg space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="font-medium">{event.title}</div>
          {onEventEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEventEdit(event)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {format(new Date(event.start_date), 'EEEE d MMMM', { locale: fr })}
          {event.end_date && !isSameDay(new Date(event.start_date), new Date(event.end_date)) && (
            <> au {format(new Date(event.end_date), 'EEEE d MMMM', { locale: fr })}</>
          )}
          {event.start_time && (
            <> · {event.start_time.slice(0, 5)}</>
          )}
        </div>

        {(event.description || event.location) && (
          <div className="space-y-1 text-sm">
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
            {event.location && (
              <p className="text-xs text-muted-foreground">📍 {event.location}</p>
            )}
          </div>
        )}

        {event.participants.length > 0 && (
          <div className="flex -space-x-2">
            {event.participants.map((participant) => (
              <div
                key={participant.user.id}
                className="relative"
                title={participant.user.name}
              >
                {participant.user.avatar ? (
                  <Image
                    src={participant.user.avatar}
                    alt={participant.user.name}
                    className="h-6 w-6 rounded-full border-2 border-background"
                    width={24}
                    height={24}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[0.65rem] text-primary font-medium">
                    {participant.user.name[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderSection = (title: string, events: Event[]) => {
    if (events.length === 0) return null

    return (
      <div className="space-y-3 mb-6 p-4 rounded-lg">
        <h3 className="text-sm font-medium">{title}</h3>
        {events.map(renderEvent)}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {!hideTitle && (
        <div className="space-y-1.5 mb-6">
          <h2 className="text-lg font-semibold text-slate-700">Événements à venir</h2>
          <p className="text-sm text-slate-600">
            Aperçu des prochains événements
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 -mr-6 pr-6">
        {renderSection("Aujourd'hui", groupedEvents.today)}
        {renderSection("Demain", groupedEvents.tomorrow)}
        {renderSection("Cette semaine", groupedEvents.thisWeek)}
        {renderSection("Ce mois", groupedEvents.thisMonth)}
        {renderSection("Plus tard", groupedEvents.future)}

        {Object.values(groupedEvents).every(group => group.length === 0) && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Aucun événement à venir
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 