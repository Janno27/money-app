"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onChange?: (date: DateRange | undefined) => void
  defaultMonth?: Date
  showOutsideDays?: boolean
}

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export function DateRangePicker({
  className,
  value,
  onChange,
  defaultMonth,
  showOutsideDays = true,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth || new Date())
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleSelectDate = (selectedDate: Date) => {
    if (!date?.from) {
      const newDate = { from: selectedDate }
      setDate(newDate)
      onChange?.(newDate)
    } else if (date.from && !date.to) {
      if (isSameDay(selectedDate, date.from)) {
        // Si on clique sur le même jour, on le considère comme un événement d'un jour
        const newDate = { from: selectedDate, to: selectedDate }
        setDate(newDate)
        onChange?.(newDate)
        setIsOpen(false)
      } else if (selectedDate < date.from) {
        const newDate = { from: selectedDate }
        setDate(newDate)
        onChange?.(newDate)
      } else {
        const newDate = { from: date.from, to: selectedDate }
        setDate(newDate)
        onChange?.(newDate)
        setIsOpen(false)
      }
    } else {
      const newDate = { from: selectedDate }
      setDate(newDate)
      onChange?.(newDate)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  return (
    <div className={cn("flex-1", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              "border-opacity-40 hover:border-opacity-100",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                isSameDay(date.from, date.to) ? (
                  format(date.from, "d MMMM yyyy", { locale: fr })
                ) : (
                  <>
                    {format(date.from, "d MMMM yyyy", { locale: fr })} -{" "}
                    {format(date.to, "d MMMM yyyy", { locale: fr })}
                  </>
                )
              ) : (
                format(date.from, "d MMMM yyyy", { locale: fr })
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-4 divide-x divide-border">
            {[currentMonth, addDays(currentMonth, 32)].map((monthStart, index) => {
              const start = startOfMonth(monthStart)
              const end = endOfMonth(monthStart)
              const days = eachDayOfInterval({ start, end })

              // Ajouter les jours du mois précédent pour commencer au lundi seulement si showOutsideDays est true
              const startDay = start.getDay() || 7 // 0 (dimanche) devient 7
              const previousDays = showOutsideDays ? Array.from({ length: startDay - 1 }, (_, i) => {
                const date = new Date(start)
                date.setDate(-i)
                return date
              }).reverse() : []

              // Ajouter les jours du mois suivant pour finir la grille seulement si showOutsideDays est true
              const remainingDays = showOutsideDays ? 42 - (previousDays.length + days.length) : 0
              const nextDays = showOutsideDays ? Array.from({ length: remainingDays }, (_, i) => {
                const date = new Date(end)
                date.setDate(end.getDate() + i + 1)
                return date
              }) : []

              const allDays = [...previousDays, ...days, ...nextDays]

              return (
                <div key={index} className="w-[286px]">
                  <div className="flex items-center justify-between mb-4">
                    {index === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handlePrevMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex-1 text-center text-sm font-medium">
                      {format(monthStart, 'MMMM yyyy', { locale: fr })}
                    </div>
                    {index === 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="text-xs font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {allDays.map((day, dayIndex) => {
                      const isSelected = date?.from && (
                        isSameDay(day, date.from) || 
                        (date.to && day >= date.from && day <= date.to)
                      )
                      const isRangeStart = date?.from && isSameDay(day, date.from)
                      const isRangeEnd = date?.to && isSameDay(day, date.to)
                      const isWithinRange = date?.from && date.to && day > date.from && day < date.to

                      return (
                        <Button
                          key={dayIndex}
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            isToday(day) && "bg-accent text-accent-foreground",
                            isSelected && "bg-primary text-primary-foreground",
                            isWithinRange && "bg-primary/10",
                            !isSameMonth(day, monthStart) && "text-muted-foreground",
                            isRangeStart && "rounded-l-md",
                            isRangeEnd && "rounded-r-md",
                          )}
                          onClick={() => handleSelectDate(day)}
                        >
                          {format(day, 'd')}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}