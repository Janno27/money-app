"use client"

import { useState, useEffect } from "react"
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, compareAsc, isSameDay, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

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
  isDashboard?: boolean
}

interface GroupedEvents {
  today: Event[]
  tomorrow: Event[]
  thisWeek: Event[]
  thisMonth: Event[]
  future: Event[]
}

export function UpcomingEvents({ events, onEventEdit, hideTitle, isDashboard = false }: UpcomingEventsProps) {
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

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    
    if (isToday(date)) {
      return "Aujourd'hui"
    }
    
    if (isSameDay(date, addDays(new Date(), 1))) {
      return "Demain"
    }
    
    return format(date, 'EEEE d MMMM', { locale: fr })
  }

  const renderEvent = (event: Event) => {
    return (
      <Card 
        key={event.id} 
        className="p-3 hover:shadow-md transition-shadow border cursor-pointer dark:bg-slate-700/80 dark:border-slate-600/80 dark:hover:bg-slate-600/80"
        onClick={() => onEventEdit?.(event)}
      >
        <div className="flex justify-between">
          <h4 className="font-medium text-sm dark:text-slate-50">{event.title}</h4>
          <span className="text-xs text-muted-foreground dark:text-slate-300">{formatEventDate(event.start_date)}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground dark:text-slate-300 mt-1 line-clamp-1">{event.description}</p>
        )}
        {event.participants && event.participants.length > 0 && (
          <div className="flex items-center mt-2">
            <div className="flex -space-x-2">
              {event.participants.slice(0, 3).map((participant, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border-2 border-background dark:border-slate-700/80">
                        <AvatarImage src={participant.user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {participant.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{participant.user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {event.participants.length > 3 && (
                <Avatar className="h-6 w-6 border-2 border-background dark:border-slate-700/80 bg-muted dark:bg-slate-800">
                  <AvatarFallback className="text-xs dark:text-slate-200">
                    +{event.participants.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <span className="text-xs text-muted-foreground dark:text-slate-300 ml-2">
              {event.participants.length} participant{event.participants.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </Card>
    )
  }

  const renderSection = (title: string, events: Event[]) => {
    if (events.length === 0) return null

    return (
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium">{title}</h3>
        {events.map(renderEvent)}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Événements à venir</h3>
          {!isDashboard && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <CalendarPlus className="h-4 w-4" />
              <span className="text-xs">Ajouter</span>
            </Button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Aucun événement prévu prochainement
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {!hideTitle && (
        <div className="space-y-1.5 mb-6">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">
            {isDashboard ? "Événements à venir →" : "Événements à venir"}
          </h3>
          {isDashboard && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Aperçu des prochains événements
            </p>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 -mr-6 pr-6">
        {renderSection("Cette semaine", [...groupedEvents.today, ...groupedEvents.tomorrow, ...groupedEvents.thisWeek])}
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

export function UpcomingEventsSkeleton({ isDashboard = false }: { isDashboard?: boolean }) {
  return (
    <div className="space-y-4">
      {!isDashboard && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {!isDashboard && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        )}
        
        <div className="space-y-1.5">
          {Array.from({ length: isDashboard ? 4 : 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-1 flex-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-14" />
                </div>
                {!isDashboard && (
                  <Skeleton className="h-3 w-48" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 