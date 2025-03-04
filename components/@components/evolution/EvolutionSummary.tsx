import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatCurrency } from "@/lib/format"
import { ArrowDown, ArrowUp, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YearSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
}

interface EvolutionSummaryProps {
  onYearChange?: (year: string) => void
  selectedYear?: string
  isDashboard?: boolean
}

export function EvolutionSummary({ onYearChange, selectedYear: externalSelectedYear, isDashboard = false }: EvolutionSummaryProps) {
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState<string>((parseInt(currentYear) - 1).toString())
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [currentYearData, setCurrentYearData] = useState<YearSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  })
  const [comparisonYearData, setComparisonYearData] = useState<YearSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  })
  const supabase = createClientComponentClient()

  const fetchYearData = async (year: string) => {
    const startDate = new Date(parseInt(year), 0, 1)
    const endDate = new Date(parseInt(year), 11, 31)

    const { data: transactions, error } = await supabase
      .from('transactions_with_refunds')
      .select('*')
      .gte('accounting_date', startDate.toISOString())
      .lte('accounting_date', endDate.toISOString())

    if (error) {
      console.error('Error fetching data:', error)
      return null
    }

    const summary: YearSummary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0
    }

    transactions?.forEach(transaction => {
      if (transaction.is_income) {
        summary.totalIncome += transaction.final_amount
      } else {
        summary.totalExpenses += Math.abs(transaction.final_amount)
      }
    })

    summary.balance = summary.totalIncome - summary.totalExpenses
    return summary
  }

  const fetchAvailableYears = async () => {
    const { data, error } = await supabase
      .from('transactions_with_refunds')
      .select('accounting_date')

    if (error) {
      console.error('Error fetching years:', error)
      return
    }

    const years = new Set(data.map(t => 
      new Date(t.accounting_date).getFullYear().toString()
    ))
    const sortedYears = Array.from(years).sort().reverse()
    setAvailableYears(sortedYears)
  }

  useEffect(() => {
    fetchAvailableYears()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const currentYearSummary = await fetchYearData(currentYear)
      if (currentYearSummary) {
        setCurrentYearData(currentYearSummary)
      }
    }
    fetchData()
  }, [currentYear])

  useEffect(() => {
    if (selectedYear && selectedYear !== currentYear) {
      const fetchData = async () => {
        const comparisonSummary = await fetchYearData(selectedYear)
        if (comparisonSummary) {
          setComparisonYearData(comparisonSummary)
        }
      }
      fetchData()
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedYear) {
      onYearChange?.(selectedYear)
    }
  }, [selectedYear, onYearChange])

  useEffect(() => {
    if (externalSelectedYear) {
      setSelectedYear(externalSelectedYear)
    }
  }, [externalSelectedYear])

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const renderComparisonValue = (current: number, previous: number) => {
    const difference = current - previous
    const percentage = calculatePercentageChange(current, previous)
    if (percentage === null) return null

    const Icon = difference > 0 ? ArrowUp : difference < 0 ? ArrowDown : Minus
    const color = difference > 0 ? "text-emerald-500" : difference < 0 ? "text-rose-500" : "text-muted-foreground"
    
    return (
      <div className="flex items-center gap-2">
        <span className={`text-muted-foreground ${isDashboard ? 'text-[0.6rem]' : 'text-xs'}`}>
          vs {selectedYear}
        </span>
        <div className={`flex items-center gap-1 text-xs ${color}`}>
          <Icon className="h-3 w-3" />
          <span>{Math.abs(percentage).toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">
            ({formatCurrency(Math.abs(difference))})
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-6 px-6 py-4">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Balance {currentYear}</div>
        <div className="text-2xl font-medium">
          {formatCurrency(currentYearData.balance)}
        </div>
        {selectedYear && (
          renderComparisonValue(currentYearData.balance, comparisonYearData.balance)
        )}
      </div>

      <div className="h-12 w-[1px] bg-border mx-2 mb-1" />

      <div className="space-y-0.5 mb-1">
        <div className="text-[0.65rem] text-muted-foreground">Revenus {currentYear}</div>
        <div className="text-sm font-medium">
          {formatCurrency(currentYearData.totalIncome)}
        </div>
        {selectedYear && (
          renderComparisonValue(currentYearData.totalIncome, comparisonYearData.totalIncome)
        )}
      </div>

      <div className="space-y-0.5 mb-1">
        <div className="text-[0.65rem] text-muted-foreground">Dépenses {currentYear}</div>
        <div className="text-sm font-medium">
          {formatCurrency(currentYearData.totalExpenses)}
        </div>
        {selectedYear && (
          renderComparisonValue(currentYearData.totalExpenses, comparisonYearData.totalExpenses)
        )}
      </div>

      <div className="flex items-center gap-1 mb-[6px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={() => {
            const currentIndex = availableYears.indexOf(selectedYear)
            if (currentIndex < availableYears.length - 1) {
              setSelectedYear(availableYears[currentIndex + 1])
            }
          }}
          disabled={!availableYears.length || availableYears.indexOf(selectedYear) === availableYears.length - 1}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[2rem] text-center">
          {selectedYear}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={() => {
            const currentIndex = availableYears.indexOf(selectedYear)
            if (currentIndex > 0) {
              setSelectedYear(availableYears[currentIndex - 1])
            }
          }}
          disabled={!availableYears.length || availableYears.indexOf(selectedYear) === 0}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
} 