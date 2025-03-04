import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/format"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

interface EvolutionChartProps {
  data: Array<{
    month: string
    expenses: number
    income: number
  }>
  isLoading?: boolean
  comparisonData?: Array<{
    month: string
    expenses: number
    income: number
  }>
}

export function EvolutionChart({ data, isLoading, comparisonData }: EvolutionChartProps) {
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
      <div className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        <span>{Math.abs(percentage).toFixed(1)}%</span>
        <span className="text-muted-foreground">
          ({formatCurrency(Math.abs(difference))})
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        Chargement...
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month"
            className="text-[0.7rem] text-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            className="text-[0.7rem] text-muted-foreground"
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const expenses = Number(payload[0].value) || 0
                const income = Number(payload[1].value) || 0
                const balance = income - expenses
                const month = payload[0].payload.month

                // Trouver les données de comparaison pour ce mois si disponibles
                const comparisonMonth = comparisonData?.find(d => d.month === month)
                const comparisonExpenses = comparisonMonth?.expenses || 0
                const comparisonIncome = comparisonMonth?.income || 0
                const comparisonBalance = comparisonMonth 
                  ? comparisonIncome - comparisonExpenses
                  : null

                return (
                  <div className="bg-background/95 backdrop-blur-sm p-3 border shadow-sm rounded-md">
                    <div className="text-xs font-medium mb-2">{month}</div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="text-sm font-medium">
                          {formatCurrency(balance)}
                        </div>
                        {comparisonBalance !== null && (
                          renderComparisonValue(balance, comparisonBalance)
                        )}
                      </div>

                      <div className="h-[1px] bg-border my-2" />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <div className="text-[0.6rem] text-muted-foreground">Revenus</div>
                          <div className="text-xs font-medium">
                            {formatCurrency(income)}
                          </div>
                          {comparisonMonth && (
                            renderComparisonValue(income, comparisonIncome)
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-[0.6rem] text-muted-foreground">Dépenses</div>
                          <div className="text-xs font-medium">
                            {formatCurrency(expenses)}
                          </div>
                          {comparisonMonth && (
                            renderComparisonValue(expenses, comparisonExpenses)
                          )}
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
            dataKey="expenses"
            stroke="hsl(var(--destructive))"
            fill="hsl(var(--destructive))"
            fillOpacity={0.1}
            strokeWidth={1.5}
            name="Dépenses"
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.1}
            strokeWidth={1.5}
            name="Revenus"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 