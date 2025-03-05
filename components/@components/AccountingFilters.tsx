"use client"

import * as React from "react"
import { Search, PenLine, RotateCcw, ChevronDown, Plus, Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { DrawerTransactionsTable } from "@/components/transactions/drawer-transactions-table"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from "@/lib/utils"
import { Transaction } from "@/components/transactions/columns"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"

export type ComparisonMode = 'month-to-month' | 'month-to-average'

interface AccountingFiltersProps {
  className?: string
  onSearchChange: (value: string) => void
  onRefresh?: () => void
  onToggleAllCategories?: () => void
  onComparisonModeChange?: (mode: ComparisonMode, selectedMonths?: string[]) => void
  comparisonMode?: ComparisonMode
}

export function AccountingFilters({
  className,
  onSearchChange,
  onRefresh,
  onToggleAllCategories,
  onComparisonModeChange,
  comparisonMode = 'month-to-month'
}: AccountingFiltersProps) {
  const [open, setOpen] = React.useState(false)
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const supabase = createClientComponentClient()
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = React.useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = React.useState(false)
  
  // Obtenir le mois actuel
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('fr-FR', { month: 'long' }).toLowerCase()
  
  // Sélectionner par défaut tous les mois précédents au mois actuel
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ]
  
  const currentMonthIndex = months.indexOf(currentMonth)
  const defaultSelectedMonths = months
    .filter((_, index) => index < currentMonthIndex)
    .map(m => m.toLowerCase())
  
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>(defaultSelectedMonths)

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions_with_refunds')
        .select(`
          *,
          category:categories(id, name),
          subcategory:subcategories(id, name),
          user:users(id, name, avatar)
        `)
        .order('accounting_date', { ascending: false })

      if (error) throw error

      if (data) {
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchTransactions()
    }
  }, [open, fetchTransactions])

  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? 'month-to-average' : 'month-to-month'
    onComparisonModeChange?.(newMode, selectedMonths)
  }

  const handleMonthToggle = (month: string) => {
    const monthLower = month.toLowerCase()
    let newSelectedMonths: string[]
    if (selectedMonths.includes(monthLower)) {
      newSelectedMonths = selectedMonths.filter(m => m !== monthLower)
    } else {
      newSelectedMonths = [...selectedMonths, monthLower]
    }
    setSelectedMonths(newSelectedMonths)
    if (comparisonMode === 'month-to-average') {
      onComparisonModeChange?.('month-to-average', newSelectedMonths)
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 py-2 h-[45px] flex-shrink-0", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAllCategories}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          className="pl-8"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-2">
          <Label htmlFor="comparison-mode" className="text-sm">
            {comparisonMode === 'month-to-month' ? 'Mois précédent' : 'Moyenne'}
          </Label>
          <Switch 
            id="comparison-mode" 
            checked={comparisonMode === 'month-to-average'}
            onCheckedChange={handleModeToggle}
          />
        </div>
        
        {comparisonMode === 'month-to-average' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="font-medium text-sm">Mois à inclure dans la moyenne</div>
                <div className="grid grid-cols-2 gap-2">
                  {months.map((month) => (
                    <div key={month} className="flex items-center space-x-2">
                      <Checkbox
                        id={month}
                        checked={selectedMonths.includes(month.toLowerCase())}
                        onCheckedChange={() => handleMonthToggle(month)}
                      />
                      <label
                        htmlFor={month}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {month}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <PenLine className="h-4 w-4" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Transactions</SheetTitle>
                <SheetDescription>
                  Visualisez et filtrez vos transactions
                </SheetDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsAddExpenseDialogOpen(true)} 
                  variant="link" 
                  className="text-slate-700 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une dépense
                </Button>
                <Button 
                  onClick={() => setIsAddIncomeDialogOpen(true)} 
                  variant="link" 
                  className="text-slate-700 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un revenu
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1">
            <DrawerTransactionsTable 
              transactions={transactions} 
              onTransactionChange={fetchTransactions}
            />
          </div>
          <SheetClose />
        </SheetContent>
      </Sheet>

      <AddTransactionDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        isIncome={false}
        onSuccess={() => {
          setIsAddExpenseDialogOpen(false)
          fetchTransactions()
        }}
      />

      <AddTransactionDialog
        open={isAddIncomeDialogOpen}
        onOpenChange={setIsAddIncomeDialogOpen}
        isIncome={true}
        onSuccess={() => {
          setIsAddIncomeDialogOpen(false)
          fetchTransactions()
        }}
      />
    </div>
  )
} 