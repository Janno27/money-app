"use client"

import { cn } from "@/lib/utils"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, parse, addDays, addWeeks, addMonths, addYears, isWithinInterval } from "date-fns"
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
import { useState, useCallback, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { EditEventSheet } from "./EditEventSheet"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { UpcomingEvents } from "./UpcomingEvents"

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
  onEventEdit?: (event: Event) => void
  onEventsChange?: () => void
}

// Étendre l'interface HTMLDivElement pour inclure animationFrameId
interface ExtendedHTMLDivElement extends HTMLDivElement {
  animationFrameId?: number;
}

export function CalendarView({ currentDate, transactions, onTransactionsChange, events, onEventEdit, onEventsChange }: CalendarViewProps) {
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

  const fetchEvents = async () => {
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
          participants: event.participants.map((p: any) => ({
            user: p.user
          }))
        })) as Event[]
        onEventsChange?.()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

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
    const color = `hsl(${(eventIndex * 50) % 360}, 70%, 50%)`
    
    return (
      <ContextMenu key={event.id}>
        <ContextMenuTrigger asChild>
          <div
            className="absolute w-[calc(100%+2px)] h-[12px] hover:h-[14px] transition-all -left-[1px] rounded-sm flex items-center px-1 overflow-hidden cursor-pointer"
            style={{
              backgroundColor: color,
              bottom: `${eventIndex * 16}px`,
              opacity: 0.7
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
                  className="bg-background/95 backdrop-blur-sm p-3 border shadow-sm rounded-md min-w-[200px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-foreground">{event.title}</div>
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
                                <img
                                  src={participant.user.avatar}
                                  alt={participant.user.name}
                                  className="h-5 w-5 rounded-full border-2 border-background"
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[0.6rem] text-primary">
                                  {participant.user.name[0]}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground/90">{event.description}</div>
                    )}
                    <div className="text-xs font-medium text-primary">
                      {format(new Date(event.start_date), 'dd MMMM yyyy', { locale: fr })}
                      {event.start_time ? (
                        <span className="text-muted-foreground ml-1">
                          à {format(parse(event.start_time, 'HH:mm:ss', new Date()), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground ml-1">
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
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              setSelectedEvent(event)
              setIsEditEventOpen(true)
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive"
            onClick={() => handleDeleteEvent(event)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

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
      
      // Ajuster la lueur en fonction de la proximité du bord
      if (isNearEdge) {
        calendarRef.current.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.3)';
      } else {
        calendarRef.current.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
      }
      
      // Mettre à jour le gradient de bordure en fonction de la proximité
      if (isNearEdge) {
        calendarRef.current.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
          gradientDirection + ', #e2e8f0, #3b82f6 ' + (minDist * 2) + '%, #1e40af ' + (minDist * 3) + '%, #e2e8f0) border-box';
      } else {
        calendarRef.current.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
          gradientDirection + ', #e2e8f0, #2563eb ' + gradientPosition + '%, #e2e8f0) border-box';
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
      className="h-full flex flex-col rounded-xl relative bg-white"
      style={{ 
        borderRadius: '12px',
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to var(--gradient-direction, right), #e2e8f0, #2563eb var(--gradient-position, 50%), #e2e8f0) border-box',
        overflow: 'hidden',
        boxShadow: '0 0 15px rgba(37, 99, 235, 0.1)',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      {/* En-tête des jours de la semaine */}
      <div className="flex-none grid grid-cols-7 border-b bg-muted" style={{ borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="px-3 py-2 text-sm font-medium text-muted-foreground text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y bg-muted/30" style={{ borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px' }}>
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
                "relative p-2 bg-background hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "text-muted-foreground bg-muted/5",
                "cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors",
                  isCurrentDay && "bg-primary text-primary-foreground font-semibold",
                  !isCurrentDay && "hover:bg-muted-foreground/10"
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
                        <div className="h-2 w-2 rounded-full bg-destructive/70 hover:bg-destructive transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background/95 backdrop-blur-sm p-3 border shadow-sm rounded-md">
                        <div className="text-xs font-medium text-foreground mb-2">{format(date, 'd MMMM yyyy', { locale: fr })}</div>
                        <div className="space-y-2">
                          {dayTransactions
                            .filter(t => !t.is_income)
                            .map(transaction => (
                              <div key={transaction.id} className="space-y-0.5">
                                <div className="text-[0.6rem] text-muted-foreground">Dépense</div>
                                <div className="text-xs font-medium text-destructive">
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </div>
                                <div className="text-xs text-foreground">{transaction.description}</div>
                                {transaction.category && (
                                  <div className="text-xs text-foreground">{transaction.category.name}</div>
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
                        <div className="h-2 w-2 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-background/95 backdrop-blur-sm p-3 border shadow-sm rounded-md">
                        <div className="text-xs font-medium text-foreground mb-2">{format(date, 'd MMMM yyyy', { locale: fr })}</div>
                        <div className="space-y-2">
                          {dayTransactions
                            .filter(t => t.is_income)
                            .map(transaction => (
                              <div key={transaction.id} className="space-y-0.5">
                                <div className="text-[0.6rem] text-muted-foreground">Revenu</div>
                                <div className="text-xs font-medium text-emerald-500">
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </div>
                                <div className="text-xs text-foreground">{transaction.description}</div>
                                {transaction.category && (
                                  <div className="text-xs text-foreground">{transaction.category.name}</div>
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
                  <PopoverContent className="w-40 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => {
                          // TODO: Implémenter la modification
                          setSelectedEvent(null)
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs text-destructive hover:text-destructive"
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
                    className="absolute bottom-1 right-1 p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                    onClick={() => setSelectedDate(date)}
                  >
                    +
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => {
                        setIsAddExpenseDialogOpen(true)
                      }}
                    >
                      <Wallet className="mr-2 h-3.5 w-3.5" />
                      Dépense
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => {
                        setIsAddIncomeDialogOpen(true)
                      }}
                    >
                      <CircleDollarSign className="mr-2 h-3.5 w-3.5" />
                      Revenu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => {
                        setIsAddEventDialogOpen(true)
                      }}
                    >
                      <CalendarPlus className="mr-2 h-3.5 w-3.5" />
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