"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarPlus, CircleDollarSign, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { AddEventDialog } from "./AddEventDialog"

interface CalendarToolbarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onTransactionAdded?: () => void
}

export function CalendarToolbar({ 
  currentDate, 
  onDateChange,
  onTransactionAdded 
}: CalendarToolbarProps) {
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = useState(false)
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)

  const handlePreviousMonth = () => {
    onDateChange(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleTransactionSuccess = () => {
    onTransactionAdded?.()
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsAddEventDialogOpen(true)}
        >
          <CalendarPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsAddIncomeDialogOpen(true)}
        >
          <CircleDollarSign className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsAddExpenseDialogOpen(true)}
        >
          <Wallet className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="w-[160px] text-center text-sm font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs ml-2"
            onClick={handleToday}
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </div>

      <AddTransactionDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        isIncome={false}
        onSuccess={handleTransactionSuccess}
      />

      <AddTransactionDialog
        open={isAddIncomeDialogOpen}
        onOpenChange={setIsAddIncomeDialogOpen}
        isIncome={true}
        onSuccess={handleTransactionSuccess}
      />

      <AddEventDialog
        open={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
      />
    </div>
  )
} 