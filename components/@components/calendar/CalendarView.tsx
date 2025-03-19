"use client"

import { cn } from "@/lib/utils"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, parse, isWithinInterval } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import { CircleDollarSign, Wallet, CalendarPlus, Pencil, Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { AddEventDialog } from "./AddEventDialog"
import { formatCurrency } from "@/lib/format"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { EditEventSheet } from "./EditEventSheet"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import Image from "next/image"

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface Transaction {
  id: string
  amount: number
  description: string
  accounting_date: string
  is_income: boolean
  category: {
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

interface CalendarViewProps {
  currentDate: Date
  transactions: Transaction[]
  onTransactionsChange?: () => void
  events: Event[]
  onEventsChange?: () => void
  onEventEdit?: (event: Event) => void
}

export function CalendarView({ currentDate, transactions, onTransactionsChange, events, onEventsChange, onEventEdit }: CalendarViewProps) {
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = useState(false)
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const supabase = createClientComponentClient()
  const calendarRef = useRef<HTMLDivElement>(null)

  const start = startOfMonth(currentDate)
  const end = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start, end })

  // Ajouter les jours du mois précédent pour commencer au lundi
  const startDay = start.getDay() || 7 // 0 (dimanche) devient 7
  const previousDays = Array.from({ length: startDay - 1 }, (_, i) => {
    const date = new Date(start)
    date.setDate(-i)
    return date
  }).reverse()

  // Ajouter les jours du mois suivant pour finir la grille
  const remainingDays = 42 - (previousDays.length + days.length) // 42 = 6 semaines * 7 jours
  const nextDays = Array.from({ length: remainingDays }, (_, i) => {
    const date = new Date(end)
    date.setDate(end.getDate() + i + 1)
    return date
  })

  const allDays = [...previousDays, ...days, ...nextDays]

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(transaction => 
      isSameDay(new Date(transaction.accounting_date), date)
    )
  }

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          participants:event_participants(
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
        data.map(event => ({
          ...event,
          participants: event.participants.map((p: { user: unknown }) => ({
            user: p.user
          }))
        }))
        onEventsChange?.()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [supabase, onEventsChange])

  useEffect(() => {
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
  }, [fetchEvents, supabase])

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const startDate = new Date(event.start_date)
      const endDate = event.end_date ? new Date(event.end_date) : null

      switch (event.frequency) {
        case 'once':
          if (endDate) {
            return isWithinInterval(date, { start: startDate, end: endDate })
          }
          return isSameDay(date, startDate)

        case 'daily':
          if (endDate) {
            return isWithinInterval(date, { start: startDate, end: endDate })
          }
          return date >= startDate

        case 'weekly':
          if (endDate && date > endDate) return false
          const weekDiff = Math.floor(
            (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
          return (
            weekDiff >= 0 &&
            date.getDay() === startDate.getDay() &&
            (!endDate || date <= endDate)
          )

        case 'monthly':
          if (endDate && date > endDate) return false
          return (
            date.getDate() === startDate.getDate() &&
            date >= startDate &&
            (!endDate || date <= endDate)
          )

        case 'yearly':
          if (endDate && date > endDate) return false
          return (
            date.getDate() === startDate.getDate() &&
            date.getMonth() === startDate.getMonth() &&
            date >= startDate &&
            (!endDate || date <= endDate)
          )

        default:
          return false
      }
    }).map((event, index) => {
      const startDate = new Date(event.start_date)
      const endDate = event.end_date ? new Date(event.end_date) : startDate
      const isStart = isSameDay(date, startDate)
      const isEnd = isSameDay(date, endDate)
      const color = `hsl(${(index * 60) % 360}, 70%, 50%)`

      return {
        ...event,
        isStart,
        isEnd,
        color
      }
    })
  }

  const handleDeleteEvent = async (event: Event) => {
    try {
      const { error: deleteParticipantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)

      if (deleteParticipantsError) throw deleteParticipantsError

      const { error: deleteEventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (deleteEventError) throw deleteEventError

      onEventsChange?.()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const renderEventIndicator = (event: Event, eventIndex: number) => {
    // Générer une couleur plus accessible et adaptée au mode sombre
    // Utilisation de couleurs pastel plus visibles pour tous les modes
    const baseHue = (eventIndex * 50) % 360;
    const color = `hsl(${baseHue}, 70%, 50%)`;
    const darkModeColor = `hsl(${baseHue}, 60%, 60%)`; // Plus lumineux pour le mode sombre
    
    return (
      <ContextMenu key={event.id}>
        <ContextMenuTrigger asChild>
          <div
            className="absolute w-[calc(100%+2px)] h-[12px] hover:h-[14px] transition-all -left-[1px] rounded-sm flex items-center px-1 overflow-hidden cursor-pointer shadow-sm"
            style={{
              backgroundColor: `var(--event-color-${eventIndex % 10}, ${color})`,
              bottom: `${eventIndex * 16}px`,
              opacity: 0.8
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedEvent(event)
              setIsEditEventOpen(true)
            }}
          >
            <span className="text-[10px] text-white font-medium truncate">
              {event.title}
            </span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute inset-0" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 shadow-md rounded-md min-w-[200px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-foreground dark:text-slate-200">{event.title}</div>
                      <div className="flex -space-x-2">
                        {event.participants.map((participant) => {
                          if (!participant.user) return null
                          return (
                            <div
                              key={participant.user.id}
                              className="relative"
                              title={participant.user.name}
                            >
                              {participant.user.avatar ? (
                                <Image
                                  src={participant.user.avatar}
                                  alt={participant.user.name}
                                  className="h-5 w-5 rounded-full border-2 border-background dark:border-slate-800"
                                  width={20}
                                  height={20}
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-primary/10 dark:bg-primary/20 border-2 border-background dark:border-slate-800 flex items-center justify-center text-[0.6rem] text-primary dark:text-blue-400">
                                  {participant.user.name[0]}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground/90 dark:text-slate-400">{event.description}</div>
                    )}
                    <div className="text-xs font-medium text-primary dark:text-blue-400">
                      {format(new Date(event.start_date), 'dd MMMM yyyy', { locale: fr })}
                      {event.start_time ? (
                        <span className="text-muted-foreground dark:text-slate-500 ml-1">
                          à {format(parse(event.start_time, 'HH:mm:ss', new Date()), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground dark:text-slate-500 ml-1">
                          Journée
                        </span>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-md">
          <ContextMenuItem
            onClick={() => {
              setSelectedEvent(event)
              setIsEditEventOpen(true)
            }}
            className="text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:text-slate-900 dark:focus:text-white"
          >
            <Pencil className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
            Modifier
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:text-red-600 dark:focus:text-red-300"
            onClick={() => handleDeleteEvent(event)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // Variable CSS pour le mode sombre
  useEffect(() => {
    if (calendarRef.current) {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Définir les couleurs en fonction du thème avec des contrastes améliorés pour le mode sombre
      if (isDark) {
        calendarRef.current.style.setProperty('--background-color', '#0f172a'); // slate-900
        calendarRef.current.style.setProperty('--border-start-color', '#475569'); // slate-600 (plus contrasté)
        calendarRef.current.style.setProperty('--border-mid-color', '#60a5fa'); // blue-400 (plus lumineux)
        calendarRef.current.style.setProperty('--glow-color', 'rgba(96, 165, 250, 0.35)'); // blue-400 avec opacité
        calendarRef.current.style.setProperty('--tooltip-bg', 'rgba(30, 41, 59, 0.95)'); // slate-800 avec transparence
        calendarRef.current.style.setProperty('--muted-overlay', 'rgba(30, 41, 59, 0.2)'); // overlay pour le fond muted
        
        // Couleurs d'événements plus lumineuses pour le mode sombre
        calendarRef.current.style.setProperty('--event-color-0', 'hsl(0, 60%, 60%)');      // Rouge
        calendarRef.current.style.setProperty('--event-color-1', 'hsl(30, 60%, 60%)');     // Orange
        calendarRef.current.style.setProperty('--event-color-2', 'hsl(60, 60%, 55%)');     // Jaune
        calendarRef.current.style.setProperty('--event-color-3', 'hsl(120, 55%, 55%)');    // Vert
        calendarRef.current.style.setProperty('--event-color-4', 'hsl(180, 60%, 50%)');    // Cyan
        calendarRef.current.style.setProperty('--event-color-5', 'hsl(210, 65%, 60%)');    // Bleu
        calendarRef.current.style.setProperty('--event-color-6', 'hsl(240, 60%, 65%)');    // Indigo
        calendarRef.current.style.setProperty('--event-color-7', 'hsl(270, 65%, 65%)');    // Violet
        calendarRef.current.style.setProperty('--event-color-8', 'hsl(300, 60%, 65%)');    // Rose
        calendarRef.current.style.setProperty('--event-color-9', 'hsl(330, 60%, 65%)');    // Rose-rouge
      } else {
        calendarRef.current.style.setProperty('--background-color', '#fff');
        calendarRef.current.style.setProperty('--border-start-color', '#e2e8f0'); // slate-200
        calendarRef.current.style.setProperty('--border-mid-color', '#2563eb'); // blue-600
        calendarRef.current.style.setProperty('--glow-color', 'rgba(37, 99, 235, 0.25)'); // blue-600 avec opacité
        calendarRef.current.style.setProperty('--tooltip-bg', 'rgba(255, 255, 255, 0.95)'); // white avec transparence
        calendarRef.current.style.setProperty('--muted-overlay', 'rgba(241, 245, 249, 0.3)'); // slate-100 avec transparence
        
        // Couleurs d'événements normales pour le mode clair
        calendarRef.current.style.setProperty('--event-color-0', 'hsl(0, 70%, 50%)');      // Rouge
        calendarRef.current.style.setProperty('--event-color-1', 'hsl(30, 70%, 50%)');     // Orange
        calendarRef.current.style.setProperty('--event-color-2', 'hsl(60, 70%, 45%)');     // Jaune
        calendarRef.current.style.setProperty('--event-color-3', 'hsl(120, 65%, 45%)');    // Vert
        calendarRef.current.style.setProperty('--event-color-4', 'hsl(180, 70%, 40%)');    // Cyan
        calendarRef.current.style.setProperty('--event-color-5', 'hsl(210, 75%, 50%)');    // Bleu
        calendarRef.current.style.setProperty('--event-color-6', 'hsl(240, 70%, 55%)');    // Indigo
        calendarRef.current.style.setProperty('--event-color-7', 'hsl(270, 75%, 55%)');    // Violet
        calendarRef.current.style.setProperty('--event-color-8', 'hsl(300, 70%, 55%)');    // Rose
        calendarRef.current.style.setProperty('--event-color-9', 'hsl(330, 70%, 55%)');    // Rose-rouge
      }
    }
  }, []);

  // Initialiser les variables CSS au chargement
  useEffect(() => {
    if (calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect();
      // Initialiser avec la position centrale
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      calendarRef.current.style.setProperty('--mouse-x', `${centerX}px`);
      calendarRef.current.style.setProperty('--mouse-y', `${centerY}px`);
      calendarRef.current.style.setProperty('--gradient-direction', 'right');
      calendarRef.current.style.setProperty('--gradient-position', '50%');
    }
  }, [events, transactions]); // Recalculer quand les données changent

  // Suivre le curseur partout dans la page
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!calendarRef.current) return;
      
      const rect = calendarRef.current.getBoundingClientRect();
      
      // Calculer la position relative du curseur par rapport au composant
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Vérifier si le curseur est en dehors du composant
      const isOutside = x < 0 || x > rect.width || y < 0 || y > rect.height;
      
      // Calculer en pourcentage pour les gradients
      const relX = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const relY = Math.max(0, Math.min(100, (y / rect.height) * 100));
      
      // Déterminer le bord le plus proche
      const distToLeft = relX;
      const distToRight = 100 - relX;
      const distToTop = relY;
      const distToBottom = 100 - relY;
      
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let gradientDirection;
      
      // Définir la direction du gradient
      if (minDist === distToLeft) {
        gradientDirection = 'right';
      } else if (minDist === distToRight) {
        gradientDirection = 'left';
      } else if (minDist === distToTop) {
        gradientDirection = 'bottom';
      } else {
        gradientDirection = 'top';
      }
      
      // Calculer la position du gradient (où le bleu devrait être plus intense)
      let gradientPosition;
      if (minDist === distToLeft || minDist === distToRight) {
        gradientPosition = relY;
      } else {
        gradientPosition = relX;
      }
      
      // Intensifier l'effet lorsque la souris est proche du bord
      const isNearEdge = minDist < 20 && !isOutside;
      
      // Mettre à jour les variables CSS
      calendarRef.current.style.setProperty('--gradient-direction', gradientDirection);
      calendarRef.current.style.setProperty('--gradient-position', `${gradientPosition}%`);
      
      // Ajuster la lueur en fonction de la proximité du bord et du mode sombre
      const isDark = document.documentElement.classList.contains('dark');
      if (isNearEdge) {
        if (isDark) {
          calendarRef.current.style.boxShadow = '0 0 20px var(--glow-color)';
        } else {
          calendarRef.current.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.3)';
        }
      } else {
        if (isDark) {
          calendarRef.current.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.15)';
        } else {
          calendarRef.current.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
        }
      }
      
      // Mettre à jour le gradient de bordure en fonction de la proximité et du mode sombre
      if (isDark) {
        if (isNearEdge) {
          calendarRef.current.style.background = 'linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #475569, #60a5fa ' + (minDist * 2) + '%, #3b82f6 ' + (minDist * 3) + '%, #475569) border-box';
        } else {
          calendarRef.current.style.background = 'linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #475569, #60a5fa ' + gradientPosition + '%, #475569) border-box';
        }
      } else {
        if (isNearEdge) {
          calendarRef.current.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #e2e8f0, #3b82f6 ' + (minDist * 2) + '%, #1e40af ' + (minDist * 3) + '%, #e2e8f0) border-box';
        } else {
          calendarRef.current.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #e2e8f0, #2563eb ' + gradientPosition + '%, #e2e8f0) border-box';
        }
      }
    };
    
    // Ajouter l'écouteur d'événement au document
    document.addEventListener('mousemove', handleMouseMove);
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      ref={calendarRef}
      className="h-full flex flex-col rounded-xl relative bg-white dark:bg-slate-900"
      style={{ 
        borderRadius: '12px',
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        background: 'linear-gradient(var(--background-color, #fff), var(--background-color, #fff)) padding-box, linear-gradient(to var(--gradient-direction, right), var(--border-start-color, #e2e8f0), var(--border-mid-color, #2563eb) var(--gradient-position, 50%), var(--border-start-color, #e2e8f0)) border-box',
        overflow: 'hidden',
        boxShadow: '0 0 15px rgba(37, 99, 235, 0.1)',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      {/* En-tête des jours de la semaine */}
      <div className="flex-none grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-muted/50 dark:bg-slate-800/50" style={{ borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-200 dark:divide-slate-700/70 bg-muted/30 dark:bg-slate-800/20" style={{ borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px' }}>
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isCurrentDay = isToday(date)
          const dayTransactions = getTransactionsForDate(date)
          const dayEvents = getEventsForDate(date)
          const hasIncome = dayTransactions.some(t => t.is_income)
          const hasExpense = dayTransactions.some(t => !t.is_income)
          const hasEvents = dayEvents.length > 0

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.2,
                delay: index * 0.01 
              }}
              className={cn(
                "relative p-2 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors",
                isCurrentMonth 
                  ? "bg-background dark:bg-slate-900" 
                  : "text-muted-foreground bg-muted/5 dark:bg-slate-800/5",
                "cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors",
                  isCurrentDay 
                    ? "bg-primary text-primary-foreground font-semibold dark:bg-blue-500 dark:text-white" 
                    : "hover:bg-muted-foreground/10 dark:hover:bg-slate-700/50",
                  !isCurrentMonth && "text-slate-400 dark:text-slate-500"
                )}
              >
                {format(date, 'd')}
              </div>

              {/* Indicateurs de transactions et événements */}
              <div className="absolute top-2 right-2 flex gap-1">
                {hasExpense && dayTransactions.filter(t => !t.is_income).length > 0 && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-2 w-2 rounded-full bg-destructive/70 hover:bg-destructive transition-colors shadow-sm dark:bg-red-500/80 dark:hover:bg-red-500" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 shadow-md rounded-md">
                        <div className="text-xs font-medium text-foreground dark:text-slate-200 mb-2">{format(date, 'd MMMM yyyy', { locale: fr })}</div>
                        <div className="space-y-2">
                          {dayTransactions
                            .filter(t => !t.is_income)
                            .map(transaction => (
                              <div key={transaction.id} className="space-y-0.5">
                                <div className="text-[0.6rem] text-muted-foreground dark:text-slate-400">Dépense</div>
                                <div className="text-xs font-medium text-destructive dark:text-red-400">
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </div>
                                <div className="text-xs text-foreground dark:text-slate-300">{transaction.description}</div>
                                {transaction.category && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{transaction.category.name}</div>
                                )}
                              </div>
                            ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {hasIncome && dayTransactions.filter(t => t.is_income).length > 0 && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-2 w-2 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition-colors shadow-sm dark:bg-emerald-400/80 dark:hover:bg-emerald-400" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 shadow-md rounded-md">
                        <div className="text-xs font-medium text-foreground dark:text-slate-200 mb-2">{format(date, 'd MMMM yyyy', { locale: fr })}</div>
                        <div className="space-y-2">
                          {dayTransactions
                            .filter(t => t.is_income)
                            .map(transaction => (
                              <div key={transaction.id} className="space-y-0.5">
                                <div className="text-[0.6rem] text-muted-foreground dark:text-slate-400">Revenu</div>
                                <div className="text-xs font-medium text-emerald-500 dark:text-emerald-400">
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </div>
                                <div className="text-xs text-foreground dark:text-slate-300">{transaction.description}</div>
                                {transaction.category && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{transaction.category.name}</div>
                                )}
                              </div>
                            ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Indicateurs d'événements */}
              {hasEvents && (
                <div className="absolute bottom-1 left-0 right-0 flex flex-col px-0">
                  <div className="relative h-[60px]">
                    {dayEvents.map((event, eventIndex) => (
                      renderEventIndicator(event, eventIndex))
                    )}
                  </div>
                </div>
              )}

              {/* Menu contextuel pour les événements */}
              {selectedEvent && (
                <Popover open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                  <PopoverContent className="w-40 p-2 bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-md" align="end">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                        onClick={() => {
                          // TODO: Implémenter la modification
                          setSelectedEvent(null)
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs text-destructive dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-destructive dark:hover:text-red-300"
                        onClick={() => {
                          handleDeleteEvent(selectedEvent)
                          setSelectedEvent(null)
                        }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Bouton d'ajout rapide avec Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute bottom-1 right-1 p-1 text-muted-foreground/50 hover:text-foreground dark:text-slate-500/50 dark:hover:text-slate-300 transition-colors"
                    onClick={() => setSelectedDate(date)}
                  >
                    +
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-background/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-md" align="end">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                      onClick={() => {
                        setIsAddExpenseDialogOpen(true)
                      }}
                    >
                      <Wallet className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      Dépense
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                      onClick={() => {
                        setIsAddIncomeDialogOpen(true)
                      }}
                    >
                      <CircleDollarSign className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      Revenu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                      onClick={() => {
                        setIsAddEventDialogOpen(true)
                      }}
                    >
                      <CalendarPlus className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      Événement
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          )
        })}
      </div>

      {/* Dialogs */}
      <AddTransactionDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        isIncome={false}
        defaultDate={selectedDate}
        onSuccess={() => {
          setIsAddExpenseDialogOpen(false)
          onTransactionsChange?.()
        }}
      />

      <AddTransactionDialog
        open={isAddIncomeDialogOpen}
        onOpenChange={setIsAddIncomeDialogOpen}
        isIncome={true}
        defaultDate={selectedDate}
        onSuccess={() => {
          setIsAddIncomeDialogOpen(false)
          onTransactionsChange?.()
        }}
      />

      <AddEventDialog
        open={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
        defaultDate={selectedDate}
        onSuccess={() => {
          setIsAddEventDialogOpen(false)
          fetchEvents()
        }}
      />

      <EditEventSheet
        event={selectedEvent}
        open={isEditEventOpen}
        onOpenChange={setIsEditEventOpen}
        onSuccess={() => {
          fetchEvents()
          setSelectedEvent(null)
        }}
      />
    </div>
  )
} 