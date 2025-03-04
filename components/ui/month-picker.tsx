"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format, setMonth, setYear } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  value?: Date
  onChange?: (date: Date) => void
  disabled?: boolean
  placeholder?: string
}

export function MonthPicker({ 
  value, 
  onChange,
  disabled,
  placeholder = "Sélectionner un mois" 
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const handlePreviousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()))
  }

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()))
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(new Date(), currentDate.getFullYear()), monthIndex)
    setSelectedDate(newDate)
    onChange?.(newDate)
    setIsOpen(false)
  }

  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date()
    return today.getMonth() === monthIndex && today.getFullYear() === currentDate.getFullYear()
  }

  const isSelectedMonth = (monthIndex: number) => {
    return selectedDate?.getMonth() === monthIndex && 
           selectedDate?.getFullYear() === currentDate.getFullYear()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'MMMM yyyy', { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousYear}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">
              {currentDate.getFullYear()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextYear}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((month, index) => (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-9 text-sm",
                  isCurrentMonth(index) && "bg-accent text-accent-foreground",
                  isSelectedMonth(index) && "bg-primary text-primary-foreground",
                  !isSelectedMonth(index) && !isCurrentMonth(index) && "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 