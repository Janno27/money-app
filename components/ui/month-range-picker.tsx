import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format, setMonth, setYear, startOfMonth, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"

interface MonthRangePickerProps {
  startDate?: Date
  endDate?: Date
  onChange?: (range: { from: Date; to: Date }) => void
  disabled?: boolean
  className?: string
}

export function MonthRangePicker({ 
  startDate,
  endDate,
  onChange,
  disabled,
  className
}: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: startDate || null,
    end: endDate || null,
  })

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
    const selectedDate = setMonth(setYear(new Date(), currentDate.getFullYear()), monthIndex)
    
    let newRange = { ...selectedRange }
    
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      newRange = { 
        start: startOfMonth(selectedDate), 
        end: null 
      }
    } else {
      if (selectedDate < selectedRange.start) {
        newRange = { 
          start: startOfMonth(selectedDate), 
          end: endOfMonth(selectedRange.start) 
        }
      } else {
        newRange = { 
          start: selectedRange.start, 
          end: endOfMonth(selectedDate) 
        }
      }
    }

    setSelectedRange(newRange)
    
    if (newRange.start && newRange.end && onChange) {
      onChange({ from: newRange.start, to: newRange.end })
      setIsOpen(false)
    }
  }

  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date()
    return today.getMonth() === monthIndex && today.getFullYear() === currentDate.getFullYear()
  }

  const isInRange = (monthIndex: number) => {
    if (!selectedRange.start || !selectedRange.end) return false
    
    const date = new Date(currentDate.getFullYear(), monthIndex)
    return date >= startOfMonth(selectedRange.start) && date <= endOfMonth(selectedRange.end)
  }

  const isStartMonth = (monthIndex: number) => {
    if (!selectedRange.start) return false
    const date = new Date(currentDate.getFullYear(), monthIndex)
    return date.getMonth() === selectedRange.start.getMonth() && 
           date.getFullYear() === selectedRange.start.getFullYear()
  }

  const isEndMonth = (monthIndex: number) => {
    if (!selectedRange.end) return false
    const date = new Date(currentDate.getFullYear(), monthIndex)
    return date.getMonth() === selectedRange.end.getMonth() && 
           date.getFullYear() === selectedRange.end.getFullYear()
  }

  const formatDateRange = () => {
    if (selectedRange.start && selectedRange.end) {
      return `${format(selectedRange.start, 'MMM yyyy', { locale: fr })} - ${format(selectedRange.end, 'MMM yyyy', { locale: fr })}`
    }
    return "Sélectionner une période"
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !selectedRange.start && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
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
                  isInRange(index) && "bg-primary/10",
                  (isStartMonth(index) || isEndMonth(index)) && "bg-primary text-primary-foreground",
                  !isInRange(index) && !isCurrentMonth(index) && "hover:bg-accent hover:text-accent-foreground"
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