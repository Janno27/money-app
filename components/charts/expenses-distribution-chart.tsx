import * as React from "react"
import { BarChart as BarChartIcon, ChevronDown, Search } from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Transaction } from "@/components/transactions/columns"

interface ExpensesDistributionChartProps {
  transactions: Transaction[]
  className?: string
}

const ALL_CATEGORIES = "all"

export function ExpensesDistributionChart({ transactions, className }: ExpensesDistributionChartProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string>(ALL_CATEGORIES)
  const [searchQuery, setSearchQuery] = React.useState("")
  const modalRef = React.useRef<HTMLDivElement>(null)
  
  const currentDate = new Date()
  const currentMonth = format(currentDate, 'MMM', { locale: fr })
  const previousMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1), 'MMM', { locale: fr })

  // Extraire toutes les catégories uniques
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

  // Calculer les dépenses par catégorie ou sous-catégorie
  const calculateExpenses = (transactions: Transaction[], month: string) => {
    return transactions
      .filter(t => !t.is_income && format(new Date(t.accounting_date), 'MMM', { locale: fr }) === month)
      .reduce((acc: Record<string, number>, curr) => {
        const key = selectedCategory !== ALL_CATEGORIES
          ? (curr.subcategory?.name || 'Sans sous-catégorie')
          : curr.category.name
        
        if (selectedCategory !== ALL_CATEGORIES && curr.category.name !== selectedCategory) {
          return acc
        }
        
        acc[key] = (acc[key] || 0) + curr.final_amount
        return acc
      }, {})
  }

  const currentMonthExpenses = calculateExpenses(transactions, currentMonth)
  const previousMonthExpenses = calculateExpenses(transactions, previousMonth)

  // Préparer les données pour le graphique
  const labels = Array.from(new Set([
    ...Object.keys(currentMonthExpenses),
    ...Object.keys(previousMonthExpenses)
  ]))

  const chartData = labels.map(label => ({
    category: label,
    [currentMonth]: currentMonthExpenses[label] || 0,
    [previousMonth]: previousMonthExpenses[label] || 0
  }))

  // Trier les données par montant du mois en cours
  const sortedChartData = [...chartData].sort((a, b) => {
    const aValue = a[currentMonth as keyof typeof a] as number
    const bValue = b[currentMonth as keyof typeof b] as number
    return bValue - aValue
  })

  // Prendre les 5 premières entrées
  const top5ChartData = sortedChartData.slice(0, 5)

  return (
    <Card className={cn("border-0 shadow-none relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/50 dark:via-transparent dark:to-purple-950/50" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2 relative">
        <div className="border bg-background/30 backdrop-blur-[2px] p-2 rounded-lg">
          <BarChartIcon className="h-4 w-4 text-blue-500" />
        </div>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="justify-between text-muted-foreground text-sm w-[200px]"
          >
            {selectedCategory === ALL_CATEGORIES ? "Toutes les catégories" : selectedCategory}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {isOpen && (
            <div 
              ref={modalRef}
              className="absolute right-0 top-full mt-1 bg-background rounded-lg shadow-lg w-[200px] max-h-[300px] flex flex-col overflow-hidden border z-[100]"
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
                        setSelectedCategory(ALL_CATEGORIES)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs",
                        "transition-colors duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                        selectedCategory === ALL_CATEGORIES && "text-primary font-medium"
                      )}
                    >
                      <div className="w-3.5" />
                      <span className="flex-1 truncate text-left">Toutes les catégories</span>
                    </button>
                    {categories
                      .filter(category => 
                        category.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((category) => (
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
      <CardContent className="px-4 relative">
        <div className="relative h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={top5ChartData} 
              layout="vertical" 
              barGap={0}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="category" 
                width={140}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center">
                            <div className="w-full space-y-1">
                              <p className="text-xs font-medium">{payload[0]?.name}</p>
                              <p className="font-medium text-[#0ea5e9]">
                                {Number(payload[0]?.value).toLocaleString('fr-FR')}€
                              </p>
                            </div>
                          </div>
                          {payload[1] && (
                            <div className="flex items-center">
                              <div className="w-full space-y-1">
                                <p className="text-xs font-medium">{payload[1]?.name}</p>
                                <p className="font-medium text-[#7dd3fc]">
                                  {Number(payload[1]?.value).toLocaleString('fr-FR')}€
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey={currentMonth} 
                name={currentMonth}
                fill="#0ea5e9"
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey={previousMonth} 
                name={previousMonth}
                fill="#7dd3fc"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 
