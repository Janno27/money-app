"use client"

import * as React from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ComparisonMode } from "./accounting/AccountingFilters"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  Row,
} from "@tanstack/react-table"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AccountingGridViewProps {
  searchQuery: string
  dateRange: {
    from: Date | null
    to: Date | null
  }
  isIncome: boolean
  comparisonMode: ComparisonMode
  selectedMonths: string[]
  className?: string
  onSearchChange?: (value: string) => void
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void
}

interface CategoryData {
  id: string
  name: string
  years: {
    [key: string]: number
  }
  months: {
    [key: string]: number
  }
  subcategories: {
    id: string
    name: string
    years: {
      [key: string]: number
    }
    months: {
      [key: string]: number
    }
  }[]
}

// Étendre l'interface HTMLDivElement pour inclure animationFrameId
interface ExtendedHTMLDivElement extends HTMLDivElement {
  animationFrameId?: number;
}

const calculateComparison = (
  currentValue: number,
  previousValue: number | number[],
  mode: ComparisonMode,
  selectedMonths: string[]
) => {
  if (mode === 'month-to-month') {
    if (typeof previousValue !== 'number') return { percentage: 0, difference: 0 }
    if (previousValue === 0) return { percentage: 0, difference: 0 }
    const difference = currentValue - previousValue
    const percentage = (difference / Math.abs(previousValue)) * 100
    return { percentage, difference }
  } else {
    // Mode moyenne
    if (!Array.isArray(previousValue) || previousValue.length === 0) {
      return { percentage: 0, difference: 0 }
    }
    const average = previousValue.reduce((sum, val) => sum + val, 0) / previousValue.length
    if (average === 0) return { percentage: 0, difference: 0 }
    const difference = currentValue - average
    const percentage = (difference / Math.abs(average)) * 100
    return { percentage, difference }
  }
}

export const AccountingGridView = React.forwardRef<
  { fetchData: () => void; toggleAllCategories: () => void },
  AccountingGridViewProps
>(({ 
  searchQuery, 
  dateRange, 
  isIncome,
  comparisonMode,
  selectedMonths,
  className,
  onSearchChange,
  onDateRangeChange
}, ref) => {
  const [data, setData] = React.useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [expandedYears, setExpandedYears] = React.useState<Set<number>>(new Set([new Date().getFullYear()]))
  const [availableYears, setAvailableYears] = React.useState<number[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [totals, setTotals] = React.useState<{
    years: { [key: number]: number },
    months: { [key: string]: number }
  }>({ years: {}, months: {} })
  const cardRef = React.useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ]

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      // Fermer les autres années quand on en ouvre une nouvelle
      newExpanded.clear()
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
  }

  const toggleAllCategories = React.useCallback(() => {
    if (expandedCategories.size === data.length) {
      setExpandedCategories(new Set())
    } else {
      setExpandedCategories(new Set(data.map(category => category.id)))
    }
  }, [data, expandedCategories])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('transactions_with_refunds')
        .select(`
          *,
          category:categories(id, name),
          subcategory:subcategories(id, name)
        `)
        .eq('is_income', isIncome)

      if (dateRange.from) {
        query = query.gte('accounting_date', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        query = query.lte('accounting_date', dateRange.to.toISOString())
      }

      const { data: transactions, error } = await query

      if (error) throw error

      const years = new Set<number>()
      const categoryTotals: { [key: string]: CategoryData } = {}
      const globalTotals: {
        years: { [key: number]: number },
        months: { [key: string]: number }
      } = { years: {}, months: {} }

      transactions?.forEach(transaction => {
        const date = new Date(transaction.accounting_date)
        const year = date.getFullYear()
        const month = format(date, 'MMMM', { locale: fr }).toLowerCase()
        const categoryId = transaction.category.id
        const subcategoryId = transaction.subcategory?.id

        years.add(year)

        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = {
            id: categoryId,
            name: transaction.category.name,
            years: {},
            months: {},
            subcategories: []
          }
        }

        // Gérer les totaux par année pour la catégorie
        if (!categoryTotals[categoryId].years[year]) {
          categoryTotals[categoryId].years[year] = 0
        }
        categoryTotals[categoryId].years[year] += transaction.final_amount

        // Gérer les mois pour la catégorie
        if (!categoryTotals[categoryId].months[`${year}-${month}`]) {
          categoryTotals[categoryId].months[`${year}-${month}`] = 0
        }
        categoryTotals[categoryId].months[`${year}-${month}`] += transaction.final_amount

        // Gérer les totaux globaux par année
        if (!globalTotals.years[year]) {
          globalTotals.years[year] = 0
        }
        globalTotals.years[year] += transaction.final_amount

        // Gérer les totaux globaux par mois
        if (!globalTotals.months[`${year}-${month}`]) {
          globalTotals.months[`${year}-${month}`] = 0
        }
        globalTotals.months[`${year}-${month}`] += transaction.final_amount

        // Gérer les sous-catégories
        if (subcategoryId) {
          let subcategory = categoryTotals[categoryId].subcategories.find(
            sub => sub.id === subcategoryId
          )

          if (!subcategory) {
            subcategory = {
              id: subcategoryId,
              name: transaction.subcategory.name,
              years: {},
              months: {}
            }
            categoryTotals[categoryId].subcategories.push(subcategory)
          }

          // Gérer les totaux par année pour la sous-catégorie
          if (!subcategory.years[year]) {
            subcategory.years[year] = 0
          }
          subcategory.years[year] += transaction.final_amount

          // Gérer les mois pour la sous-catégorie
          if (!subcategory.months[`${year}-${month}`]) {
            subcategory.months[`${year}-${month}`] = 0
          }
          subcategory.months[`${year}-${month}`] += transaction.final_amount
        }
      })

      // Tri croissant des années (du plus ancien au plus récent)
      const sortedYears = Array.from(years).sort((a, b) => a - b)
      setAvailableYears(sortedYears)
      
      // Définir l'année actuelle comme développée par défaut
      const currentYear = new Date().getFullYear()
      if (sortedYears.includes(currentYear)) {
        setExpandedYears(new Set([currentYear]))
      } else if (sortedYears.length > 0) {
        setExpandedYears(new Set([sortedYears[sortedYears.length - 1]]))
      }

      // Filtrer les données si une recherche est active
      let filteredData = Object.values(categoryTotals)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredData = filteredData.filter(category =>
          category.name.toLowerCase().includes(query) ||
          category.subcategories.some(sub => 
            sub.name.toLowerCase().includes(query)
          )
        )
      }

      // Trier les catégories par montant total pour l'année la plus récente (décroissant)
      const mostRecentYear = sortedYears[sortedYears.length - 1] || new Date().getFullYear()
      filteredData.sort((a, b) => {
        const aTotal = a.years[mostRecentYear] || 0
        const bTotal = b.years[mostRecentYear] || 0
        return Math.abs(bTotal) - Math.abs(aTotal)
      })

      // Trier les sous-catégories par montant total pour l'année la plus récente (décroissant)
      filteredData.forEach(category => {
        category.subcategories.sort((a, b) => {
          const aTotal = a.years[mostRecentYear] || 0
          const bTotal = b.years[mostRecentYear] || 0
          return Math.abs(bTotal) - Math.abs(aTotal)
        })
      })

      // Par défaut, toutes les catégories sont déployées
      setExpandedCategories(new Set(filteredData.map(category => category.id)))
      
      setData(filteredData)
      setTotals(globalTotals)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [dateRange, searchQuery, isIncome])

  // Pour résoudre le problème du useEffect nettoyage ref
  React.useEffect(() => {
    const currentCardRef = cardRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!currentCardRef) return;
      
      const rect = currentCardRef.getBoundingClientRect();
      
      // Calculer la position relative du curseur par rapport au composant
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Vérifier si le curseur est en dehors du composant
      const isOutside = x < 0 || x > rect.width || y < 0 || y > rect.height;
      
      // Calculer en pourcentage pour les gradients
      const relX = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const relY = Math.max(0, Math.min(100, (y / rect.height) * 100));
      
      // Déterminer le bord le plus proche
      const distToLeft = relX;
      const distToRight = 100 - relX;
      const distToTop = relY;
      const distToBottom = 100 - relY;
      
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let gradientDirection;
      
      // Définir la direction du gradient
      if (minDist === distToLeft) {
        gradientDirection = 'right';
      } else if (minDist === distToRight) {
        gradientDirection = 'left';
      } else if (minDist === distToTop) {
        gradientDirection = 'bottom';
      } else {
        gradientDirection = 'top';
      }
      
      // Calculer la position du gradient (où le bleu devrait être plus intense)
      let gradientPosition;
      if (minDist === distToLeft || minDist === distToRight) {
        gradientPosition = relY;
      } else {
        gradientPosition = relX;
      }
      
      // Intensifier l'effet lorsque la souris est proche du bord
      const isNearEdge = minDist < 20 && !isOutside;
      
      // Mettre à jour les variables CSS
      const targetElement = currentCardRef as ExtendedHTMLDivElement;
      
      // Annuler toute animation précédente
      if (targetElement.animationFrameId) {
        cancelAnimationFrame(targetElement.animationFrameId);
      }
      
      // Mettre à jour les styles dans la prochaine frame d'animation
      targetElement.animationFrameId = requestAnimationFrame(() => {
        targetElement.style.setProperty('--gradient-direction', gradientDirection);
        targetElement.style.setProperty('--gradient-position', `${gradientPosition}%`);
        
        // Ajuster la lueur en fonction de la proximité du bord
        if (isNearEdge) {
          targetElement.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.3)';
        } else {
          targetElement.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
        }
        
        // Mettre à jour le gradient de bordure en fonction de la proximité
        if (isNearEdge) {
          targetElement.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #e2e8f0, #3b82f6 ' + (minDist * 2) + '%, #1e40af ' + (minDist * 3) + '%, #e2e8f0) border-box';
        } else {
          targetElement.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
            gradientDirection + ', #e2e8f0, #2563eb ' + gradientPosition + '%, #e2e8f0) border-box';
        }
      });
    };
    
    // Ajouter l'écouteur d'événement au document
    document.addEventListener('mousemove', handleMouseMove);
    
    // Nettoyer l'écouteur d'événement et les animations en cours
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      
      // Annuler toute animation en cours
      if (currentCardRef) {
        const targetElement = currentCardRef as ExtendedHTMLDivElement;
        if (targetElement.animationFrameId) {
          cancelAnimationFrame(targetElement.animationFrameId);
        }
      }
    };
  }, []);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    fetchData,
    toggleAllCategories
  }))

  // Définir les colonnes pour la table
  const columns = React.useMemo<ColumnDef<CategoryData>[]>(() => {
    // Colonne de catégorie
    const categoryColumn: ColumnDef<CategoryData> = {
      accessorKey: "name",
      header: "Catégorie",
      cell: ({ row }) => {
        const category = row.original
        const isExpanded = expandedCategories.has(category.id)
        const hasSubcategories = category.subcategories.length > 0
        
        return (
          <div className="space-y-2 min-w-[200px]">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => hasSubcategories && toggleCategory(category.id)}
            >
              {hasSubcategories && (
                <span className="text-muted-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        )
      }
    }
    
    // Colonnes pour les années
    const yearColumns = availableYears.map(year => {
      const isExpanded = expandedYears.has(year)
      
      return {
        id: `year-${year}`,
        header: () => (
          <div 
            className="flex items-center justify-center gap-1 cursor-pointer min-w-[120px]"
            onClick={() => toggleYear(year)}
          >
            <span>{year}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        ),
        cell: ({ row }: { row: Row<CategoryData> }) => {
          const category = row.original
          const total = category.years[year] || 0
          
          return (
            <div className="text-right font-medium min-w-[120px]">
              {total === 0 ? "-" : formatCurrency(Math.abs(total))}
            </div>
          )
        }
      }
    })
    
    // Colonnes pour les mois (uniquement pour les années développées)
    const monthColumns = Array.from(expandedYears).flatMap(year => 
      months.map(month => ({
        id: `${year}-${month}`,
        header: () => (
          <div className="text-center capitalize text-xs text-muted-foreground min-w-[110px]">
            <span>{month}</span>
            <div className="text-[10px] text-muted-foreground/70">{year}</div>
          </div>
        ),
        cell: ({ row }: { row: Row<CategoryData> }) => {
          const category = row.original
          const monthKey = `${year}-${month}`
          const value = category.months[monthKey] || 0
          
          // Calcul de la comparaison
          let comparisonValue: number | number[]
          if (comparisonMode === 'month-to-month') {
            const monthIndex = months.indexOf(month)
            // Pour janvier (index 0), on ne fait pas de comparaison
            if (monthIndex === 0) {
              comparisonValue = 0; // Valeur qui donnera une différence de 0%
            } else {
              const previousMonth = months[monthIndex - 1]
              comparisonValue = category.months[`${year}-${previousMonth}`] || 0
            }
          } else {
            const monthValues = selectedMonths
              .map(m => category.months[`${year}-${m}`] || 0)
              .filter(v => v !== 0)
            comparisonValue = monthValues
          }
          
          const comparison = calculateComparison(value, comparisonValue, comparisonMode, selectedMonths)
          
          return (
            <div className="text-right min-w-[110px]">
              <div className="flex items-center justify-end gap-2">
                <div className="font-medium text-xs w-[70px] text-right">
                  {value === 0 ? "-" : formatCurrency(Math.abs(value))}
                </div>
                <div className="w-[45px] text-right">
                  {value !== 0 && comparison.percentage !== 0 ? (
                    <div className={cn(
                      "text-xs",
                      comparison.percentage > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {comparison.percentage > 0 ? "+" : ""}
                      {comparison.percentage.toFixed(1)}%
                    </div>
                  ) : <div className="w-[45px]"></div>}
                </div>
              </div>
            </div>
          )
        }
      }))
    )
    
    // Combiner toutes les colonnes
    return [categoryColumn, ...yearColumns, ...monthColumns]
  }, [availableYears, expandedYears, expandedCategories, comparisonMode, selectedMonths, isIncome, toggleCategory, toggleYear, months])

  // Créer la table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    filterFns: {
      dateRange: (row, id, value: [Date, Date]) => {
        const cellValue = row.getValue(id) as string
        const date = new Date(cellValue)
        return date >= value[0] && date <= value[1]
      },
    },
  })

  if (isLoading) {
    return (
      <div style={{ height: '100%', padding: '1rem' }}>
        <Card style={{ height: '100%', padding: '1rem' }}>
          <Skeleton style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }} />
        </Card>
      </div>
    )
  }

  // Fonction pour générer les cellules de sous-catégorie pour une année spécifique
  const renderSubcategoryMonthCells = (subcategory: CategoryData['subcategories'][0], year: number) => {
    if (!expandedYears.has(year)) return null
    
    return months.map(month => {
      const monthKey = `${year}-${month}`
      const value = subcategory.months[monthKey] || 0
      
      // Calcul de la comparaison
      let comparisonValue: number | number[]
      if (comparisonMode === 'month-to-month') {
        const monthIndex = months.indexOf(month)
        // Pour janvier (index 0), on ne fait pas de comparaison
        if (monthIndex === 0) {
          comparisonValue = 0; // Valeur qui donnera une différence de 0%
        } else {
          const previousMonth = months[monthIndex - 1]
          comparisonValue = subcategory.months[`${year}-${previousMonth}`] || 0
        }
      } else {
        const monthValues = selectedMonths
          .map(m => subcategory.months[`${year}-${m}`] || 0)
          .filter(v => v !== 0)
        comparisonValue = monthValues
      }
      
      const comparison = calculateComparison(value, comparisonValue, comparisonMode, selectedMonths)
      
      return (
        <TableCell key={`${year}-${month}`} className="text-right min-w-[110px]">
          <div className="flex items-center justify-end gap-2">
            <div className="text-xs text-muted-foreground w-[70px] text-right">
              {value === 0 ? "-" : formatCurrency(Math.abs(value))}
            </div>
            <div className="w-[45px] text-right">
              {value !== 0 && comparison.percentage !== 0 ? (
                <div className={cn(
                  "text-xs",
                  comparison.percentage > 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {comparison.percentage > 0 ? "+" : ""}
                  {comparison.percentage.toFixed(1)}%
                </div>
              ) : <div className="w-[45px]"></div>}
            </div>
          </div>
        </TableCell>
      )
    })
  }

  // Trouver l'année active
  const activeYear = Array.from(expandedYears)[0] || 0
  const activeYearIndex = availableYears.findIndex(year => year === activeYear)

  return (
    <div style={{ height: '100%', paddingTop: '1rem', paddingBottom: '1rem' }} className={className}>
      <div 
        ref={cardRef}
        className="relative bg-white rounded-xl"
        style={{ 
          height: '100%',
          borderRadius: '12px',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to var(--gradient-direction, right), #e2e8f0, #2563eb var(--gradient-position, 50%), #e2e8f0) border-box',
          overflow: 'hidden',
          boxShadow: '0 0 15px rgba(37, 99, 235, 0.1)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <div style={{ 
          height: '100%', 
          overflow: 'auto',
          borderRadius: '11px'
        }}>
          <Table className="relative w-full border-collapse">
            <TableHeader className="sticky top-0 z-50 bg-background">
              <TableRow className="shadow-[0_4px_8px_-4px_rgba(0,0,0,0.1)]">
                {table.getFlatHeaders().map((header) => {
                  const isNameCell = header.id === "name";
                  const isYearCell = header.id.startsWith("year-");
                  
                  return (
                    <TableHead 
                      key={header.id}
                      style={isNameCell ? { 
                        position: 'sticky', 
                        left: 0, 
                        zIndex: 10,
                        boxShadow: isNameCell ? '4px 4px 8px -4px rgba(0,0,0,0.1)' : '4px 0 8px -4px rgba(0,0,0,0.1)'
                      } : {}}
                      className={cn(
                        "text-center border-b",
                        isNameCell && "text-left bg-background border-r",
                        isYearCell && "bg-muted/30",
                        "backdrop-blur-sm bg-background/95"
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        {row.getVisibleCells().map((cell) => {
                          const isNameCell = cell.column.id === "name";
                          const isYearCell = cell.column.id.startsWith("year-");
                          
                          return (
                            <TableCell 
                              key={cell.id}
                              style={isNameCell ? { 
                                position: 'sticky', 
                                left: 0, 
                                zIndex: 5,
                                boxShadow: '4px 0 8px -4px rgba(0,0,0,0.1)' 
                              } : {}}
                              className={cn(
                                isNameCell ? "text-left bg-background border-r" : "text-center",
                                isYearCell && "bg-muted/30"
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      
                      {/* Sous-catégories */}
                      {expandedCategories.has(row.original.id) && row.original.subcategories.length > 0 && (
                        <>
                          {row.original.subcategories.map(subcategory => {
                            // Vérifier si la sous-catégorie a des valeurs pour au moins une année
                            const hasValues = availableYears.some(year => 
                              (subcategory.years[year] || 0) !== 0
                            )
                            
                            if (!hasValues) return null
                            
                            return (
                              <TableRow key={subcategory.id} className="bg-muted/5">
                                <TableCell 
                                  className="pl-8 min-w-[200px] border-r"
                                  style={{ 
                                    position: 'sticky', 
                                    left: 0, 
                                    zIndex: 5,
                                    backgroundColor: 'rgba(241, 245, 249, 0.8)',
                                    boxShadow: '4px 0 8px -4px rgba(0,0,0,0.1)' 
                                  }}
                                >
                                  <span className="text-sm text-muted-foreground">
                                    {subcategory.name}
                                  </span>
                                </TableCell>
                                
                                {/* Cellules pour les années */}
                                {availableYears.map((year) => (
                                  <TableCell 
                                    key={`year-${year}`} 
                                    className="text-right bg-muted/30 min-w-[120px]"
                                  >
                                    <div className="text-xs text-muted-foreground">
                                      {(subcategory.years[year] || 0) === 0 
                                        ? "-" 
                                        : formatCurrency(Math.abs(subcategory.years[year] || 0))
                                      }
                                    </div>
                                  </TableCell>
                                ))}
                                
                                {/* Cellules pour les mois des années développées */}
                                {Array.from(expandedYears).flatMap(year => 
                                  renderSubcategoryMonthCells(subcategory, year)
                                )}
                              </TableRow>
                            )
                          })}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-md">
              <TableRow className="text-muted-foreground text-sm font-medium">
                <TableCell 
                  className="border-r min-w-[200px]"
                  style={{ 
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 5,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '4px 0 8px -4px rgba(0,0,0,0.1)' 
                  }}
                >
                  <span className="font-semibold">Total</span>
                </TableCell>
                {availableYears.map((year) => (
                  <TableCell 
                    key={`total-year-${year}`}
                    className="text-right bg-muted/30 min-w-[120px]"
                  >
                    <span className="font-semibold">
                      {formatCurrency(Math.abs(totals.years[year] || 0))}
                    </span>
                  </TableCell>
                ))}
                {Array.from(expandedYears).flatMap(year => 
                  months.map(month => {
                    const monthKey = `${year}-${month}`
                    const total = totals.months[monthKey] || 0
                    return (
                      <TableCell key={`total-${monthKey}`} className="text-right min-w-[110px]">
                        <span className="font-semibold">
                          {total === 0 ? "-" : formatCurrency(Math.abs(total))}
                        </span>
                      </TableCell>
                    )
                  })
                )}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  )
})

AccountingGridView.displayName = "AccountingGridView" 