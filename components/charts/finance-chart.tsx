"use client"

import * as React from "react"
import { LineChart, ChevronDown, Search } from "lucide-react"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Transaction } from "@/components/transactions/columns"

interface FinanceChartProps {
  transactions: Transaction[]
  className?: string
}

export function FinanceChart({ transactions, className }: FinanceChartProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Extraire les catégories uniques
  const categories = Array.from(new Set(transactions.map(t => t.category.name)))

  // Fermer le popover lors d'un clic à l'extérieur
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filtrer les catégories selon la recherche
  const filteredCategories = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    if (!searchQuery) return categories
    return categories.filter(category => 
      category.toLowerCase().includes(searchLower)
    )
  }, [searchQuery, categories])

  // Calculer les données mensuelles à partir des transactions
  const monthlyTotals = transactions
    .filter(t => !selectedCategory || t.category.name === selectedCategory)
    .reduce((acc: Record<string, { month: string, revenue: number, expenses: number }>, curr) => {
      const month = format(new Date(curr.accounting_date), 'MMM', { locale: fr })
      if (!acc[month]) {
        acc[month] = { month, revenue: 0, expenses: 0 }
      }
      if (curr.is_income) {
        acc[month].revenue += curr.final_amount
      } else {
        acc[month].expenses += curr.final_amount
      }
      return acc
    }, {})

  // Calculer les totaux
  const totals = transactions
    .filter(t => !selectedCategory || t.category.name === selectedCategory)
    .reduce(
      (acc, curr) => {
        if (curr.is_income) {
          acc.revenue += curr.final_amount
        } else {
          acc.expenses += curr.final_amount
        }
        return acc
      },
      { revenue: 0, expenses: 0 }
    )

  // Convertir en tableau et trier par date
  const chartData = Object.values(monthlyTotals).sort((a, b) => {
    const monthA = new Date(new Date().getFullYear(), ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(a.month.toLowerCase()), 1)
    const monthB = new Date(new Date().getFullYear(), ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(b.month.toLowerCase()), 1)
    return monthA.getTime() - monthB.getTime()
  })

  return (
    <Card className={cn("border-0 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
          <LineChart className="h-4 w-4 text-blue-500" />
        </div>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="justify-between text-muted-foreground text-sm w-[200px]"
          >
            {selectedCategory || "Toutes les catégories"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {isOpen && (
            <div 
              ref={modalRef}
              className="absolute right-0 top-full mt-1 bg-background rounded-lg shadow-lg w-[200px] max-h-[300px] flex flex-col overflow-hidden border z-50"
            >
              <div className="p-2 border-b">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent border-none text-xs focus:outline-none placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 py-1">
                <div className="px-2 py-1">
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs",
                        "transition-colors duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                        !selectedCategory && "text-primary font-medium"
                      )}
                    >
                      <div className="w-3.5" />
                      <span className="flex-1 truncate text-left">Toutes les catégories</span>
                    </button>
                    {filteredCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs",
                          "transition-colors duration-150",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                          selectedCategory === category && "text-primary font-medium"
                        )}
                      >
                        <div className="w-3.5" />
                        <span className="flex-1 truncate text-left">{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 relative">
        <div className="flex justify-between mb-6">
          <div className="flex gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total revenus</p>
              <p className="text-lg font-bold text-[#0ea5e9]">+{totals.revenue > 0 ? totals.revenue.toLocaleString('fr-FR') + '€' : '0€'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total dépenses</p>
              <p className="text-lg font-bold text-[#f43f5e]">-{totals.expenses > 0 ? totals.expenses.toLocaleString('fr-FR') + '€' : '0€'}</p>
            </div>
          </div>
        </div>
        <div className="relative h-[300px] w-[calc(100%+3rem)] -mx-12">
          {chartData.length > 0 && (
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{
                  top: 0,
                  right: 0,
                  left: 35,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  className="stroke-muted-foreground" 
                  opacity={0.2}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={{ fontSize: 12 }}
                  className="text-xs capitalize text-muted-foreground"
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')}€`}
                  className="text-xs text-muted-foreground"
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center">
                              <div className="w-full space-y-1">
                                <p className="text-xs font-medium">Revenus</p>
                                <p className="font-medium text-[#0ea5e9]">
                                  {Number(payload[0].value).toLocaleString('fr-FR')}€
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-full space-y-1">
                                <p className="text-xs font-medium">Dépenses</p>
                                <p className="font-medium text-[#f43f5e]">
                                  {Number(payload[1].value).toLocaleString('fr-FR')}€
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  fill="url(#revenue)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#0ea5e9" }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f43f5e"
                  fill="url(#expenses)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#f43f5e" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}