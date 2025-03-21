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
  isDashboard?: boolean
}

export function EvolutionChart({ data, isLoading, comparisonData, isDashboard = false }: EvolutionChartProps) {
  // Style conditionnel basé sur si c'est le dashboard ou la page évolution
  const containerStyle = isDashboard
    ? { minHeight: "calc(100% - 30px)" }
    : { minHeight: "calc(100% - 30px)", maxHeight: "290px" }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const renderComparisonValue = (current: number, previous: number) => {
    const difference = current - previous
    const percentage = calculatePercentageChange(current, previous)
    if (percentage === null) return null

    const Icon = difference > 0 ? ArrowUp : difference < 0 ? ArrowDown : Minus
    const color = difference > 0 
      ? "text-emerald-500 dark:text-emerald-400" 
      : difference < 0 
      ? "text-rose-500 dark:text-rose-400" 
      : "text-muted-foreground dark:text-slate-400"

    return (
      <div className="flex items-center gap-1 text-xs">
        <div className={`flex items-center gap-1 ${color}`}>
          <Icon className="h-3 w-3" />
          <span>{Math.abs(percentage).toFixed(1)}%</span>
        </div>
        <span className="text-muted-foreground dark:text-slate-400">
          ({formatCurrency(Math.abs(difference))})
        </span>
      </div>
    )
  }

  if (isLoading) {
    return <EvolutionChartSkeleton />
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1" style={containerStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60 dark:stroke-slate-600" />
            <XAxis 
              dataKey="month"
              className="text-xs text-muted-foreground dark:text-slate-200"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: 'currentColor', fontSize: '0.75rem' }}
              tickLine={{ stroke: 'currentColor', strokeWidth: 1.5 }}
              axisLine={{ stroke: 'currentColor', strokeWidth: 1.5 }}
            />
            <YAxis 
              className="text-xs text-muted-foreground dark:text-slate-200"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fill: 'currentColor', fontSize: '0.75rem' }}
              tickLine={{ stroke: 'currentColor', strokeWidth: 1.5 }}
              axisLine={{ stroke: 'currentColor', strokeWidth: 1.5 }}
              width={80}
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
                    <div className="bg-background/95 backdrop-blur-sm p-3 border shadow-sm rounded-md dark:bg-slate-800 dark:border-slate-700">
                      <div className="text-xs font-medium mb-2 dark:text-white">{month}</div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground dark:text-slate-300">Balance</div>
                          <div className="text-sm font-medium dark:text-white">
                            {formatCurrency(balance)}
                          </div>
                          {comparisonBalance !== null && (
                            renderComparisonValue(balance, comparisonBalance)
                          )}
                        </div>

                        <div className="h-[1px] bg-border dark:bg-slate-700 my-2" />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <div className="text-[0.6rem] text-muted-foreground dark:text-slate-400">Revenus</div>
                            <div className="text-xs font-medium dark:text-white">
                              {formatCurrency(income)}
                            </div>
                            {comparisonMonth && (
                              renderComparisonValue(income, comparisonIncome)
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-[0.6rem] text-muted-foreground dark:text-slate-400">Dépenses</div>
                            <div className="text-xs font-medium dark:text-white">
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
              stroke="#818cf8"
              fill="#818cf8"
              fillOpacity={0.3}
              strokeWidth={2.5}
              name="Dépenses"
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.3}
              strokeWidth={2.5}
              name="Revenus"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende en ligne et CTA */}
      {isDashboard && (
        <div className="flex justify-between items-center mt-0 text-sm flex-none">
          <div className="flex items-center gap-6 pl-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#818cf8]"></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Dépenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa]"></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Revenus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function EvolutionChartSkeleton() {
  // Utiliser des valeurs fixes pour éviter les erreurs d'hydratation
  const axisDelays = [0, 150, 300, 450, 600, 750];
  const yAxisDelays = [0, 200, 400];
  
  return (
    <div className="h-full w-full relative">
      <div className="h-full flex-1 relative">
        {/* Fond avec grille */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border-b border-r border-muted/20"></div>
          ))}
        </div>
        
        {/* Ligne de référence zéro */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-muted/30"></div>
        
        {/* Animation des courbes */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity="0.3" />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity="0.3" />
                <stop offset="95%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* Courbe des dépenses (statique) */}
            <path 
              d="M0,140 C80,150 160,90 240,100 C320,110 400,95 400,105 L400,200 L0,200 Z" 
              fill="url(#gradientPurple)"
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            
            {/* Courbe des revenus (statique) */}
            <path 
              d="M0,80 C80,90 160,50 240,70 C320,60 400,75 400,65 L400,200 L0,200 Z" 
              fill="url(#gradientBlue)"
              className="animate-pulse"
              style={{ animationDuration: '3s', animationDelay: '0.5s' }}
            />
            
            {/* Lignes des courbes (statiques mais avec animation de pulsation) */}
            <path 
              d="M0,140 C80,150 160,90 240,100 C320,110 400,95 400,105" 
              fill="none" 
              stroke="#818cf8" 
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            
            <path 
              d="M0,80 C80,90 160,50 240,70 C320,60 400,75 400,65" 
              fill="none" 
              stroke="#60a5fa" 
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDuration: '3s', animationDelay: '0.5s' }}
            />
          </svg>
        </div>
        
        {/* Axe X (mois) */}
        <div className="absolute bottom-0 left-0 right-6 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-3 w-10 bg-muted/40 rounded-sm animate-pulse" 
                style={{ animationDelay: `${axisDelays[i]}ms` }}></div>
            </div>
          ))}
        </div>
        
        {/* Axe Y (valeurs) */}
        <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-2 w-10 bg-muted/40 rounded-sm animate-pulse"
              style={{ animationDelay: `${yAxisDelays[i]}ms` }}></div>
          ))}
        </div>
      </div>
      
      {/* Skeleton pour la légende */}
      <div className="flex justify-between items-center mt-2 text-sm">
        <div className="flex items-center gap-4 pl-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted/60"></div>
            <div className="h-2 w-16 bg-muted/40 rounded-sm animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted/60"></div>
            <div className="h-2 w-16 bg-muted/40 rounded-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 