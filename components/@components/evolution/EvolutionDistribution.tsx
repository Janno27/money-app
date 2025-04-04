import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Category {
  id: string
  name: string
  amount: number
  percentage: number
  subcategories: {
    id: string
    name: string
    amount: number
    percentage: number
    globalPercentage: number
    categoryName: string
  }[]
}

interface EvolutionDistributionProps {
  showAllSubcategories: boolean
}

export function EvolutionDistribution({ showAllSubcategories }: EvolutionDistributionProps) {
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      const startDate = new Date(currentYear, 0, 1)
      const endDate = new Date(currentYear, 11, 31)

      const { data: transactions, error } = await supabase
        .from('transactions_with_refunds')
        .select(`
          *,
          category:categories(id, name),
          subcategory:subcategories(id, name)
        `)
        .gte('accounting_date', startDate.toISOString())
        .lte('accounting_date', endDate.toISOString())

      if (error) throw error

      const expenseTotals: { [key: string]: number } = {}
      const incomeTotals: { [key: string]: number } = {}
      const expenseSubTotals: { [key: string]: { [key: string]: number } } = {}
      const incomeSubTotals: { [key: string]: { [key: string]: number } } = {}
      let totalExpensesSum = 0
      let totalIncomeSum = 0

      transactions?.forEach(transaction => {
        const amount = Math.abs(transaction.final_amount)
        const categoryId = transaction.category.id
        // @ts-expect-error - Variable conservée pour usage futur potentiel
        const _categoryName = transaction.category.name
        const subcategoryId = transaction.subcategory?.id
        // @ts-expect-error - Variable conservée pour usage futur potentiel
        const _subcategoryName = transaction.subcategory?.name

        if (transaction.is_income) {
          totalIncomeSum += amount
          incomeTotals[categoryId] = (incomeTotals[categoryId] || 0) + amount
          if (subcategoryId) {
            incomeSubTotals[categoryId] = incomeSubTotals[categoryId] || {}
            incomeSubTotals[categoryId][subcategoryId] = (incomeSubTotals[categoryId][subcategoryId] || 0) + amount
          }
        } else {
          totalExpensesSum += amount
          expenseTotals[categoryId] = (expenseTotals[categoryId] || 0) + amount
          if (subcategoryId) {
            expenseSubTotals[categoryId] = expenseSubTotals[categoryId] || {}
            expenseSubTotals[categoryId][subcategoryId] = (expenseSubTotals[categoryId][subcategoryId] || 0) + amount
          }
        }
      })

      const processCategories = (
        totals: { [key: string]: number },
        subTotals: { [key: string]: { [key: string]: number } },
        total: number
      ): Category[] => {
        const categories = Object.entries(totals)
          .map(([categoryId, amount]) => {
            const categoryName = transactions?.find(t => t.category.id === categoryId)?.category.name || ''
            return {
              id: categoryId,
              name: categoryName,
              amount,
              percentage: (amount / total) * 100,
              subcategories: Object.entries(subTotals[categoryId] || {}).map(([subId, subAmount]) => ({
                id: subId,
                name: transactions?.find(t => t.subcategory?.id === subId)?.subcategory.name || '',
                amount: subAmount,
                percentage: (subAmount / amount) * 100,
                globalPercentage: (subAmount / total) * 100,
                categoryName
              })).sort((a, b) => b.amount - a.amount)
            }
          })
          .sort((a, b) => b.amount - a.amount)

        return categories
      }

      setExpenseCategories(processCategories(expenseTotals, expenseSubTotals, totalExpensesSum))
      setIncomeCategories(processCategories(incomeTotals, incomeSubTotals, totalIncomeSum))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasSubcategories = category.subcategories.length > 0

    return (
      <div key={category.id} className="space-y-1.5 mb-3">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded-sm",
            hasSubcategories && "cursor-pointer"
          )}
          onClick={() => hasSubcategories && toggleCategory(category.id)}
        >
          {hasSubcategories && (
            <div className="w-4">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
          <div className="flex-1 flex items-center justify-between gap-4">
            <span className="text-sm">{category.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: '#3b82f6'
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {category.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="pl-6 space-y-1.5 pt-1 pb-2">
            {category.subcategories.map((sub, index) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-4 py-0.5"
              >
                <span className="text-xs text-muted-foreground">{sub.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${sub.percentage}%`,
                        transitionDelay: `${index * 100}ms`,
                        backgroundColor: '#60a5fa'
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {sub.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAllSubcategories = (categories: Category[]) => {
    const allSubcategories = categories.flatMap(category => 
      category.subcategories.map(sub => ({
        ...sub,
        categoryName: category.name
      }))
    ).sort((a, b) => b.globalPercentage - a.globalPercentage)

    const allSortedSubcategories = allSubcategories

    return (
      <div className="space-y-3">
        {allSortedSubcategories.map((sub, index) => (
          <div key={sub.id} className="flex items-center justify-between gap-4 py-1">
            <span className="text-xs">{sub.name} <span className="text-xs text-muted-foreground">({sub.categoryName})</span></span>
            <div className="flex items-center gap-2">
              <div className="w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${sub.globalPercentage}%`,
                    transitionDelay: `${index * 50}ms`,
                    backgroundColor: '#3b82f6'
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {sub.globalPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return <EvolutionDistributionSkeleton />
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="expenses" 
        className="h-full flex flex-col"
      >
        <div className="flex-none">
          <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger 
              value="expenses" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Dépenses
            </TabsTrigger>
            <TabsTrigger 
              value="income"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Revenus
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 mt-4">
          <TabsContent 
            value="expenses" 
            className="h-full data-[state=active]:flex data-[state=active]:flex-col"
            style={{ height: '100%' }}
          >
            <ScrollArea className="h-full w-full" type="always">
              <div className="pr-4 pb-12">
                {showAllSubcategories ? (
                  renderAllSubcategories(expenseCategories)
                ) : (
                  expenseCategories.map(renderCategory)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent 
            value="income" 
            className="h-full data-[state=active]:flex data-[state=active]:flex-col"
            style={{ height: '100%' }}
          >
            <ScrollArea className="h-full w-full" type="always">
              <div className="pr-4 pb-12">
                {showAllSubcategories ? (
                  renderAllSubcategories(incomeCategories)
                ) : (
                  incomeCategories.map(renderCategory)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export function EvolutionDistributionSkeleton() {
  // Valeurs constantes pour remplacer les valeurs aléatoires
  const categoryWidths = [65, 75, 55, 85, 45];
  const subcategoryWidths = [60, 70, 50];
  
  return (
    <div className="w-full h-full">
      {/* Tabs skeleton */}
      <Tabs defaultValue="expenses" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="expenses" className="flex-1">
              <Skeleton className="h-4 w-16 rounded-sm" />
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              <Skeleton className="h-4 w-16 rounded-sm" />
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content skeleton */}
        <ScrollArea className="h-full max-h-[calc(100vh-400px)]">
          <div className="space-y-2 px-1 py-2">
            {/* Catégories de dépenses simulées */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-background/80 border border-border rounded-md overflow-hidden">
                <div className="p-2 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted/40">
                      <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    <Skeleton className="h-4 w-24 rounded-sm" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-16 rounded-sm" />
                    <div className="w-24 h-4 relative overflow-hidden rounded-full bg-muted/20">
                      <div 
                        className="absolute inset-y-0 left-0 bg-muted/50 rounded-full animate-pulse"
                        style={{ width: `${categoryWidths[i % categoryWidths.length]}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Sous-catégories (visible pour une catégorie) */}
                {i === 1 && (
                  <div className="p-2 space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-1">
                        <Skeleton className="h-3 w-20 rounded-sm" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-3 w-12 rounded-sm" />
                          <div className="w-16 h-3 relative overflow-hidden rounded-full bg-muted/20">
                            <div 
                              className="absolute inset-y-0 left-0 bg-muted/40 rounded-full animate-pulse"
                              style={{ width: `${subcategoryWidths[j % subcategoryWidths.length]}%`, animationDelay: `${j * 150}ms` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
} 