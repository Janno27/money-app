"use client"

import * as React from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ComparisonMode } from "./AccountingFilters"
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
  ColumnMeta,
} from "@tanstack/react-table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AccountingGridViewProps {
  searchQuery: string
  dateRange: {
    from: Date | null
    to: Date | null
  }
  isIncome?: boolean
  comparisonMode: ComparisonMode
  selectedMonths: string[]
  className?: string
  onSearchChange?: (value: string) => void
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void
  isMaximized?: boolean
}

interface CategoryData {
  id: string
  name: string
  yearlyData: {
    [year: string]: {
      total: number,
      monthlyData: {
        [month: string]: number
      }
    }
  }
  subcategories: {
    id: string
    name: string
    yearlyData: {
      [year: string]: {
        total: number,
        monthlyData: {
          [month: string]: number
        }
      }
    }
  }[]
}

// Définition personnalisée pour étendre ColumnMeta avec la propriété style
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    style?: React.CSSProperties;
    monthName?: string;
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
  onDateRangeChange,
  isMaximized = false
}, ref) => {
  const supabase = createClientComponentClient()
  const [data, setData] = React.useState<CategoryData[]>([])
  const [totalAmounts, setTotalAmounts] = React.useState<{[year: string]: number}>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [expandedYear, setExpandedYear] = React.useState<string>(new Date().getFullYear().toString())
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  
  // Années à afficher (année courante et les deux précédentes)
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [
      currentYear.toString(),
      (currentYear - 1).toString(),
      (currentYear - 2).toString()
    ]
  }, [])

  const toggleCategory = (categoryId: string) => {
    const newExpandedCategories = new Set(expandedCategories)
    if (newExpandedCategories.has(categoryId)) {
      newExpandedCategories.delete(categoryId)
    } else {
      newExpandedCategories.add(categoryId)
    }
    setExpandedCategories(newExpandedCategories)
  }
  
  const toggleYear = (year: string) => {
    if (expandedYear === year) {
      // Si l'année est déjà ouverte, on la ferme
      setExpandedYear('')
    } else {
      // Sinon, on ouvre cette année et on ferme les autres
      setExpandedYear(year)
    }
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
      const currentYear = new Date().getFullYear()
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      const yearsToFetch = [
        currentYear.toString(),
        (currentYear - 1).toString(),
        (currentYear - 2).toString()
      ]

      // Récupérer les transactions pour les trois années
      let query = supabase
        .from('transactions_with_refunds')
        .select(`
          *,
          category:categories(id, name),
          subcategory:subcategories(id, name)
        `)
        .eq('is_income', false)
        .gte('accounting_date', `${yearsToFetch[2]}-01-01`)
        .lte('accounting_date', `${yearsToFetch[0]}-12-31`)

      if (dateRange.from) {
        query = query.gte('accounting_date', dateRange.from.toISOString())
      }

      if (dateRange.to) {
        query = query.lte('accounting_date', dateRange.to.toISOString())
      }

      const { data: transactions, error } = await query

      if (error) throw error

      // Traiter les données pour les regrouper par catégorie, année et sous-catégorie
      const categoryMap = new Map<string, {
        id: string,
        name: string,
        yearlyData: {
          [year: string]: {
            total: number,
            monthlyData: {[month: string]: number}
          }
        },
        subcategories: Map<string, {
          id: string,
          name: string,
          yearlyData: {
            [year: string]: {
              total: number,
              monthlyData: {[month: string]: number}
            }
          }
        }>
      }>()

      // Initialiser les totaux par année
      const yearTotals: {[year: string]: number} = {}
      yearsToFetch.forEach(year => {
        yearTotals[year] = 0
      })

      if (transactions) {
        transactions.forEach(transaction => {
          const categoryId = transaction.category?.id
          const categoryName = transaction.category?.name || 'Non catégorisé'
          const subcategoryId = transaction.subcategory?.id || 'uncategorized'
          const subcategoryName = transaction.subcategory?.name || 'Non catégorisé'
          const amount = Math.abs(transaction.final_amount)
        const date = new Date(transaction.accounting_date)
          const year = date.getFullYear().toString()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          
          // Ignorer les transactions qui ne sont pas dans les années que nous voulons
          if (!yearsToFetch.includes(year)) return

          // Ajouter au total de l'année
          yearTotals[year] = (yearTotals[year] || 0) + amount

          // Ajouter ou mettre à jour la catégorie
          if (!categoryMap.has(categoryId)) {
            const categoryData: {
              id: string,
              name: string,
              yearlyData: {
                [year: string]: {
                  total: number,
                  monthlyData: {[month: string]: number}
                }
              },
              subcategories: Map<string, any>
            } = {
            id: categoryId,
              name: categoryName,
              yearlyData: {},
              subcategories: new Map()
            }
            
            // Initialiser les données pour chaque année
            yearsToFetch.forEach(y => {
              categoryData.yearlyData[y] = {
                total: 0,
                monthlyData: {}
              }
              // Initialiser les montants mensuels à 0
              months.forEach(m => {
                categoryData.yearlyData[y].monthlyData[m] = 0
              })
            })
            
            categoryMap.set(categoryId, categoryData)
          }

          const category = categoryMap.get(categoryId)!
          
          // S'assurer que les données de l'année existent
          if (!category.yearlyData[year]) {
            category.yearlyData[year] = {
              total: 0,
              monthlyData: {}
            }
            // Initialiser les montants mensuels à 0
            months.forEach(m => {
              category.yearlyData[year].monthlyData[m] = 0
            })
          }
          
          // Mettre à jour les montants
          category.yearlyData[year].total += amount
          category.yearlyData[year].monthlyData[month] = (category.yearlyData[year].monthlyData[month] || 0) + amount

          // Ajouter ou mettre à jour la sous-catégorie
          if (!category.subcategories.has(subcategoryId)) {
            const subcategoryData: {
              id: string,
              name: string,
              yearlyData: {
                [year: string]: {
                  total: number,
                  monthlyData: {[month: string]: number}
                }
              }
            } = {
              id: subcategoryId,
              name: subcategoryName,
              yearlyData: {}
            }
            
            // Initialiser les données pour chaque année
            yearsToFetch.forEach(y => {
              subcategoryData.yearlyData[y] = {
                total: 0,
                monthlyData: {}
              }
              // Initialiser les montants mensuels à 0
              months.forEach(m => {
                subcategoryData.yearlyData[y].monthlyData[m] = 0
              })
            })
            
            category.subcategories.set(subcategoryId, subcategoryData)
          }

          const subcategory = category.subcategories.get(subcategoryId)!
          
          // S'assurer que les données de l'année existent
          if (!subcategory.yearlyData[year]) {
            subcategory.yearlyData[year] = {
              total: 0,
              monthlyData: {}
            }
            // Initialiser les montants mensuels à 0
            months.forEach(m => {
              subcategory.yearlyData[year].monthlyData[m] = 0
            })
          }
          
          // Mettre à jour les montants
          subcategory.yearlyData[year].total += amount
          subcategory.yearlyData[year].monthlyData[month] = (subcategory.yearlyData[year].monthlyData[month] || 0) + amount
        })
      }

      // Convertir les Maps en tableaux pour l'état
      const formattedData = Array.from(categoryMap.values()).map(category => ({
        id: category.id,
        name: category.name,
        yearlyData: category.yearlyData,
        subcategories: Array.from(category.subcategories.values())
          .sort((a, b) => {
            // Trier par le montant total de l'année en cours
            const currentYear = new Date().getFullYear().toString()
            const aTotal = a.yearlyData[currentYear]?.total || 0
            const bTotal = b.yearlyData[currentYear]?.total || 0
            return bTotal - aTotal
          })
      })).sort((a, b) => {
        // Trier par le montant total de l'année en cours
        const currentYear = new Date().getFullYear().toString()
        const aTotal = a.yearlyData[currentYear]?.total || 0
        const bTotal = b.yearlyData[currentYear]?.total || 0
        return bTotal - aTotal
      })

      setData(formattedData)
      setTotalAmounts(yearTotals)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [isIncome, dateRange, searchQuery])

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    fetchData,
    toggleAllCategories
  }))

  // Style CSS pour l'effet d'agrandissement
  React.useEffect(() => {
    // Ajouter les styles de transition globaux et pour les éléments fixes
    const style = document.createElement('style')
    style.innerHTML = `
      .year-column-transition {
        transition: background-color 0.3s ease;
      }
      .year-column-active {
        animation: pulse 0.5s ease;
      }
      @keyframes pulse {
        0% { background-color: rgba(59, 130, 246, 0.2); }
        50% { background-color: rgba(59, 130, 246, 0.4); }
        100% { background-color: rgba(59, 130, 246, 0.2); }
      }
      .accounting-table-wrapper {
        transition: all 0.3s ease-in-out;
      }
      .sticky-header {
        position: sticky;
        top: 0;
        z-index: 40;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      .sticky-header th {
        position: sticky;
        top: 0;
        background-color: inherit;
      }
      .sticky-footer {
        position: sticky;
        bottom: 0;
        z-index: 20;
        box-shadow: 0 -1px 2px rgba(0,0,0,0.05);
      }
      .sticky-cell-left {
        position: sticky;
        left: 0;
        z-index: 10;
        background-color: inherit;
      }
      .header-cell-left {
        position: sticky;
        left: 0;
        z-index: 30;
      }
      .footer-cell-left {
        position: sticky;
        left: 0;
        z-index: 30;
      }
      /* Nouvelles classes pour les en-têtes des années et mois */
      .year-header {
        position: sticky !important;
        top: 0;
        z-index: 20;
        background-color: inherit;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .month-header {
        position: sticky !important;
        top: 0;
        z-index: 20;
        background-color: inherit;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      /* Styles pour la visualisation des colonnes */
      .table-grid-container {
        overflow: auto;
        position: relative;
      }
      /* Ajouter des ombres pour indiquer le défilement */
      .table-grid-container::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 40px;
        pointer-events: none;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.2));
        opacity: 0;
        transition: opacity 0.3s;
      }
      .table-grid-container[data-can-scroll-right="true"]::after {
        opacity: 1;
      }
      /* Style pour les mois qui permet de toujours voir le nom */
      .month-label {
        position: relative;
      }
      .month-label::before {
        content: attr(data-month-name);
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        padding: 2px 6px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 0.75rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 50;
      }
      .dark .month-label::before {
        background-color: rgba(15, 23, 42, 0.9);
        border-color: #334155;
        color: #f8fafc;
      }
      .table-grid-container:hover .month-label:hover::before {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Initialiser les variables CSS au chargement pour l'effet de bordure
  React.useEffect(() => {
    if (tableContainerRef.current) {
      const rect = tableContainerRef.current.getBoundingClientRect();
      // Initialiser avec la position centrale
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      tableContainerRef.current.style.setProperty('--mouse-x', `${centerX}px`);
      tableContainerRef.current.style.setProperty('--mouse-y', `${centerY}px`);
      tableContainerRef.current.style.setProperty('--gradient-direction', 'right');
      tableContainerRef.current.style.setProperty('--gradient-position', '50%');
    }
  }, [data, isMaximized]); // Recalculer quand les données ou le mode maximisé changent

  // Suivre le curseur pour l'effet de bordure
  React.useEffect(() => {
    const containerRef = tableContainerRef.current;
    if (!containerRef) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.getBoundingClientRect();
      
      // Calculer la position relative du curseur par rapport au composant
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculer les distances aux bords, même si le curseur est en dehors
      const distToLeft = x;
      const distToRight = rect.width - x;
      const distToTop = y;
      const distToBottom = rect.height - y;
      
      // Déterminer le bord le plus proche
      const distances = [distToLeft, distToRight, distToTop, distToBottom];
      const absDistances = distances.map(d => Math.abs(d));
      const minDist = Math.min(...absDistances);
      const minDistIndex = absDistances.indexOf(minDist);
      
      // Orientation du gradient selon le bord le plus proche
      let gradientDirection;
      switch (minDistIndex) {
        case 0: gradientDirection = 'right'; break;  // gauche
        case 1: gradientDirection = 'left'; break;   // droite
        case 2: gradientDirection = 'bottom'; break; // haut
        case 3: gradientDirection = 'top'; break;    // bas
        default: gradientDirection = 'right';
      }
      
      // Calculer la position du gradient en pourcentage selon l'axe du bord le plus proche
      let gradientPosition;
      if (gradientDirection === 'right' || gradientDirection === 'left') {
        gradientPosition = Math.max(0, Math.min(100, (y / rect.height) * 100));
      } else {
        gradientPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
      }
      
      // Pour l'intensité, on utilise la proximité relative aux dimensions
      const relativeProximity = minDist / Math.max(rect.width, rect.height);
      const isNearEdge = relativeProximity < 0.2;
        
        // Ajuster la lueur en fonction de la proximité du bord
        if (isNearEdge) {
        containerRef.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.3)';
        } else {
        containerRef.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
      }
      
      // Mise à jour directe du gradient de bordure en fonction de la position de la souris
      const isDark = document.documentElement.classList.contains('dark');
      // Mode sombre
      if (isDark) {
        containerRef.style.background = 'linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to ' + 
          gradientDirection + ', #334155, #60a5fa ' + gradientPosition + '%, #2563eb, #334155) border-box';
      } 
      // Mode clair
      else {
        containerRef.style.background = 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to ' + 
          gradientDirection + ', #e2e8f0, #3b82f6 ' + gradientPosition + '%, #1e40af, #e2e8f0) border-box';
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Fonction pour calculer la différence en pourcentage
  const calculatePercentDifference = (current: number, reference: number): number => {
    if (reference === 0) return current > 0 ? 100 : 0
    return ((current - reference) / Math.abs(reference)) * 100
  }

  // Fonction pour formater l'affichage du pourcentage
  const formatPercentage = (value: number): string => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Fonction pour déterminer la classe de couleur en fonction de la différence
  const getDifferenceColorClass = (difference: number): string => {
    if (Math.abs(difference) < 0.5) return 'text-slate-500 dark:text-slate-400' // Pas de changement significatif
    return difference > 0 
      ? 'text-green-600 dark:text-green-400' // Augmentation
      : 'text-red-600 dark:text-red-400'     // Diminution
  }

  // Fonction pour générer la cellule avec comparaison
  const renderMonthCellWithComparison = (
    amount: number, 
    comparisonAmount: number | null,
    comparisonType: 'previous' | 'average',
    isSubcategory: boolean = false
  ) => {
    const fontSizeClass = isSubcategory ? 'text-xs' : 'text-sm'
    const fontWeightClass = isSubcategory ? 'font-normal' : 'font-medium'
    
    if (comparisonAmount === null) {
      return (
        <div className={`text-right ${fontSizeClass} ${fontWeightClass}`}>
          {formatCurrency(amount)}
        </div>
      )
    }

    const difference = amount - comparisonAmount
    const percentDifference = calculatePercentDifference(amount, comparisonAmount)
    const percentClass = getDifferenceColorClass(percentDifference)
    
    return (
      <div className={`text-right ${fontSizeClass} ${fontWeightClass} flex items-center justify-end gap-2`}>
        <div>{formatCurrency(amount)}</div>
        <div className={`flex flex-col items-end text-2xs ${percentClass}`}>
          <span className="text-slate-500 dark:text-slate-400">({formatCurrency(Math.abs(difference))})</span>
          {formatPercentage(percentDifference)}
        </div>
      </div>
    )
  }
  
  // Fonction pour obtenir la valeur de référence pour la comparaison
  const getComparisonValue = (
    data: {[month: string]: number}, 
    month: string, 
    mode: ComparisonMode, 
    selectedMonths: string[]
  ): number | null => {
    if (mode === 'month-to-month') {
      // Comparaison avec le mois précédent
      const monthNum = parseInt(month)
      const prevMonth = String(monthNum - 1).padStart(2, '0')
      
      // Si c'est janvier, il n'y a pas de mois précédent dans l'année
      if (monthNum === 1) return null
      
      return data[prevMonth] || 0
    } else {
      // Comparaison avec la moyenne des mois sélectionnés
      if (!selectedMonths || selectedMonths.length === 0) return null
      
      // Convertir les mois format "Janvier", "Février" en "01", "02", etc.
      const monthMapping: {[key: string]: string} = {
        'Janvier': '01', 'Février': '02', 'Mars': '03', 'Avril': '04',
        'Mai': '05', 'Juin': '06', 'Juillet': '07', 'Août': '08',
        'Septembre': '09', 'Octobre': '10', 'Novembre': '11', 'Décembre': '12'
      }
      
      // Convertir les mois sélectionnés en numéros (en minuscules et en majuscules)
      const selectedMonthNumbers = selectedMonths.map(m => {
        // Convertir la première lettre en majuscule pour correspondre au mapping
        const mFormatted = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
        return monthMapping[mFormatted] || m
      })
      
      // Exclure le mois actuel de la comparaison
      const monthsForAverage = selectedMonthNumbers.filter(m => m !== month)
      
      if (monthsForAverage.length === 0) return null
      
      // Filtrer les valeurs valides avant de calculer la moyenne
      const selectedValues = monthsForAverage
        .map(m => data[m])
        .filter(v => v !== undefined && v !== null)
      
      if (selectedValues.length === 0) return null
      
      return selectedValues.reduce((sum, val) => sum + val, 0) / selectedValues.length
    }
  }

  const columns = React.useMemo<ColumnDef<CategoryData>[]>(() => {
    // Création des colonnes de base
    const baseColumns: ColumnDef<CategoryData>[] = [
      {
      accessorKey: "name",
        header: ({ column }) => (
          <div className="flex items-center">
            <button
              className="flex items-center"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Catégorie
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </button>
          </div>
        ),
      cell: ({ row }) => {
          const category = row.original as CategoryData
        const isExpanded = expandedCategories.has(category.id)
        const hasSubcategories = category.subcategories.length > 0
        
        return (
            <div className="flex items-center">
              {hasSubcategories && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="mr-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  )}
                </button>
              )}
              {!hasSubcategories && <div className="w-6" />}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {category.name}
              </span>
          </div>
        )
      }
    }
    ]
    
    // Trier les années dans l'ordre chronologique (plus ancienne à gauche)
    const sortedYears = [...years].sort()
    
    // Si une année est ouverte, on la retire de la liste pour la mettre à la fin
    let yearsToDisplay = sortedYears
    if (expandedYear) {
      yearsToDisplay = sortedYears.filter(year => year !== expandedYear)
    }
    
    // Ajouter les colonnes pour les années (selon l'ordre établi)
    yearsToDisplay.forEach(year => {
      baseColumns.push({
        id: `year-${year}`,
        accessorFn: (row) => row.yearlyData[year]?.total || 0,
        header: ({ column }) => (
          <div className="text-right">
            <button
              className="flex items-center justify-end ml-auto year-column-transition"
            onClick={() => toggleYear(year)}
          >
              {year}
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const category = row.original as CategoryData
          const amount = category.yearlyData[year]?.total || 0
          
          return (
            <div className="text-right text-sm font-medium">
              {formatCurrency(amount)}
            </div>
          )
        }
      })
    })
    
    // Si une année est ouverte, on l'ajoute à la fin des colonnes d'années
    if (expandedYear) {
      baseColumns.push({
        id: `year-${expandedYear}`,
        accessorFn: (row) => row.yearlyData[expandedYear]?.total || 0,
        header: ({ column }) => (
          <div className="text-right">
            <button
              className="flex items-center justify-end ml-auto year-column-transition year-column-active"
              onClick={() => toggleYear(expandedYear)}
            >
              {expandedYear}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const category = row.original as CategoryData
          const amount = category.yearlyData[expandedYear]?.total || 0
          
          return (
            <div className="text-right text-sm font-medium">
              {formatCurrency(amount)}
            </div>
          )
        }
      })
    }
    
    // Ajout des colonnes pour les mois de l'année ouverte
    if (expandedYear) {
      const months = [
        { key: '01', label: 'Janvier' },
        { key: '02', label: 'Février' },
        { key: '03', label: 'Mars' },
        { key: '04', label: 'Avril' },
        { key: '05', label: 'Mai' },
        { key: '06', label: 'Juin' },
        { key: '07', label: 'Juillet' },
        { key: '08', label: 'Août' },
        { key: '09', label: 'Septembre' },
        { key: '10', label: 'Octobre' },
        { key: '11', label: 'Novembre' },
        { key: '12', label: 'Décembre' }
      ]
      
      months.forEach(month => {
        baseColumns.push({
          id: `${expandedYear}-${month.key}`,
          accessorFn: (row) => row.yearlyData[expandedYear]?.monthlyData[month.key] || 0,
          header: month.label,
          cell: ({ row }) => {
            const category = row.original as CategoryData
            const amount = category.yearlyData[expandedYear]?.monthlyData[month.key] || 0
            const comparisonValue = getComparisonValue(
              category.yearlyData[expandedYear]?.monthlyData || {}, 
              month.key,
              comparisonMode,
              selectedMonths
            )
            
            return renderMonthCellWithComparison(amount, comparisonValue, comparisonMode === 'month-to-month' ? 'previous' : 'average')
          },
          // Augmenter la largeur des colonnes pour les mois et ajouter des métadonnées pour le nom du mois
          meta: {
            style: {
              minWidth: '150px'
            },
            monthName: month.label
          }
        })
      })
    }
    
    return baseColumns
  }, [years, expandedYear, expandedCategories, comparisonMode, selectedMonths])

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
      columnFilters
    }
  } as any)

  if (isLoading) {
    return (
      <div className={cn(
        "p-4 transition-all duration-300 accounting-table-wrapper", 
        className,
        isMaximized && "p-0 h-[calc(100vh-45px)]"
      )} style={{ height: isMaximized ? 'calc(100vh - 45px)' : '100%' }}>
        <div className="rounded-md border dark:border-slate-700 h-full overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton className="h-8 w-40 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-md ml-auto" />
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-10 w-full rounded-md bg-blue-100 dark:bg-blue-900/30" />
                <Skeleton className="h-10 w-full rounded-md bg-blue-100 dark:bg-blue-900/30" />
                <Skeleton className="h-10 w-full rounded-md bg-blue-100 dark:bg-blue-900/30" />
              </div>
              
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid grid-cols-4 gap-4" style={{ opacity: 1 - index * 0.15 }}>
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
              
              <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t dark:border-slate-700">
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fonction pour déterminer si une cellule est une colonne d'année
  const isYearColumn = (cellId: string) => {
    return years.some(year => cellId.includes(`year-${year}`))
  }

  // Fonction pour déterminer si une cellule est la colonne de l'année active
  const isActiveYearColumn = (cellId: string) => {
    return expandedYear && cellId.includes(`year-${expandedYear}`)
  }

  return (
                <div className={cn(
      "p-4 transition-all duration-300 accounting-table-wrapper", 
      className,
      isMaximized && "p-0 h-[calc(100vh-45px)]"
    )} style={{ height: isMaximized ? 'calc(100vh - 45px)' : '100%' }}>
      <div 
        ref={tableContainerRef}
        className={`rounded-md border dark:border-slate-700 h-full overflow-hidden table-container-with-gradient ${isMaximized ? "overflow-auto shadow-lg" : ""}`}
        style={{ 
          borderRadius: '12px',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          overflow: 'hidden',
          boxShadow: '0 0 15px rgba(37, 99, 235, 0.1)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <div className="overflow-auto h-full dark:bg-slate-900 table-grid-container" style={{ maxWidth: '100%' }}
             ref={tableRef => {
               if (tableRef) {
                 // Vérifier si on peut défiler horizontalement
                 const canScrollRight = tableRef.scrollWidth > tableRef.clientWidth;
                 tableRef.setAttribute('data-can-scroll-right', canScrollRight.toString());
                 
                 // Ajouter un écouteur de défilement pour mettre à jour l'attribut
                 const handleScroll = () => {
                   const maxScrollLeft = tableRef.scrollWidth - tableRef.clientWidth;
                   const canScrollMore = tableRef.scrollLeft < maxScrollLeft;
                   tableRef.setAttribute('data-can-scroll-right', canScrollMore.toString());
                 };
                 
                 tableRef.addEventListener('scroll', handleScroll);
                 
                 // Nettoyer l'écouteur lors du démontage
                 const currentTableRef = tableRef;
                 return () => {
                   currentTableRef.removeEventListener('scroll', handleScroll);
                 };
               }
             }}
        >
          <style jsx global>{`
            .text-2xs {
              font-size: 0.65rem;
              line-height: 0.9rem;
            }
            
            .month-column {
              min-width: 150px;
            }
            
            .subcategory-name {
              font-size: 0.875rem;
              color: #64748b;
            }
            
            .dark .subcategory-name {
              color: #94a3b8;
            }

            /* Styles pour l'effet de bordure */
            .table-container-with-gradient {
              --light-start-color: #e2e8f0;
              --light-mid-color: #2563eb;
              --light-focus-color: #3b82f6;
              --light-deep-color: #1e40af;
              --dark-start-color: #334155;
              --dark-mid-color: #3b82f6;
              --dark-focus-color: #60a5fa;
              --dark-deep-color: #2563eb;
              transition: background 0.3s ease, box-shadow 0.3s ease;
              background: linear-gradient(#fff, #fff) padding-box, 
                       linear-gradient(to var(--gradient-direction, right), 
                                     var(--light-start-color), 
                                     var(--light-mid-color) var(--gradient-position, 50%), 
                                     var(--light-start-color)) border-box !important;
            }
            
            .dark .table-container-with-gradient {
              background: linear-gradient(#0f172a, #0f172a) padding-box, 
                       linear-gradient(to var(--gradient-direction, right), 
                                      var(--dark-start-color), 
                                      var(--dark-mid-color) var(--gradient-position, 50%), 
                                      var(--dark-start-color)) border-box !important;
            }
            
            .table-container-with-gradient[style*="--is-near-edge: 1"] {
              --light-glow-color: rgba(37, 99, 235, 0.3);
              --dark-glow-color: rgba(59, 130, 246, 0.3);
              background: linear-gradient(#fff, #fff) padding-box, 
                       linear-gradient(to var(--gradient-direction, right), 
                                     var(--light-start-color), 
                                     var(--light-focus-color) calc(var(--min-dist) * 2%), 
                                     var(--light-deep-color) calc(var(--min-dist) * 3%), 
                                     var(--light-start-color)) border-box !important;
              box-shadow: 0 0 20px var(--light-glow-color) !important;
            }
            
            .dark .table-container-with-gradient[style*="--is-near-edge: 1"] {
              background: linear-gradient(#0f172a, #0f172a) padding-box, 
                       linear-gradient(to var(--gradient-direction, right), 
                                      var(--dark-start-color), 
                                      var(--dark-focus-color) calc(var(--min-dist) * 2%), 
                                      var(--dark-deep-color) calc(var(--min-dist) * 3%), 
                                      var(--dark-start-color)) border-box !important;
              box-shadow: 0 0 20px var(--dark-glow-color) !important;
            }
          `}</style>
          <Table className="relative w-auto min-w-full">
            <TableHeader className="sticky-header">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b dark:border-slate-700">
                  {headerGroup.headers.map((header, index) => (
                    <TableHead 
                      key={header.id}
                      className={cn(
                        "h-10 px-4 text-left text-slate-800 dark:text-slate-200 whitespace-nowrap year-column-transition",
                        header.id.startsWith("year-") && "bg-blue-50/50 dark:bg-blue-900/20 year-header",
                        isActiveYearColumn(header.id) && "bg-blue-100/70 dark:bg-blue-800/30 year-column-active year-header",
                        !header.id.startsWith("year-") && header.id !== "name" && "month-header",
                        index === 0 && "header-cell-left bg-slate-50 dark:bg-slate-800"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
              </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                    <TableRow 
                      className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell, index) => (
                            <TableCell 
                              key={cell.id}
                              className={cn(
                            "p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap year-column-transition",
                            isYearColumn(cell.id) && "bg-blue-50/30 dark:bg-blue-900/10",
                            isActiveYearColumn(cell.id) && "bg-blue-100/50 dark:bg-blue-800/20",
                            cell.column.columnDef.meta?.style && "month-column month-label",
                            index === 0 && "sticky-cell-left bg-white dark:bg-slate-900"
                          )}
                          style={cell.column.columnDef.meta?.style}
                          data-month-name={cell.column.columnDef.meta?.monthName || ""}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                      ))}
                      </TableRow>
                      
                    {/* Sous-catégories (affichées uniquement si la catégorie est développée) */}
                    {expandedCategories.has((row.original as CategoryData).id) && (
                      (row.original as CategoryData).subcategories.map((subcategory) => (
                        <TableRow 
                          key={subcategory.id}
                          className="bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-700/50"
                        >
                          <TableCell className="pl-10 p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap subcategory-name sticky-cell-left bg-slate-50 dark:bg-slate-800">
                                    {subcategory.name}
                                </TableCell>
                                
                          {/* Cellules pour les années (non-active) */}
                          {years.filter(year => year !== expandedYear).map(year => (
                                  <TableCell 
                              key={`${subcategory.id}-year-${year}`}
                              className="p-3 text-right text-xs font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap bg-blue-50/30 dark:bg-blue-900/10 year-column-transition"
                            >
                              {formatCurrency(subcategory.yearlyData[year]?.total || 0)}
                                  </TableCell>
                                ))}
                                
                          {/* Cellule pour l'année active */}
                          {expandedYear && (
                            <TableCell 
                              key={`${subcategory.id}-year-${expandedYear}`}
                              className="p-3 text-right text-xs font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap bg-blue-100/50 dark:bg-blue-800/20 year-column-transition"
                            >
                              {formatCurrency(subcategory.yearlyData[expandedYear]?.total || 0)}
                            </TableCell>
                          )}
                          
                          {/* Cellules pour les mois de l'année ouverte */}
                          {expandedYear && Object.keys(subcategory.yearlyData[expandedYear]?.monthlyData || {})
                            .sort()
                            .map(month => {
                              const amount = subcategory.yearlyData[expandedYear]?.monthlyData[month] || 0
                              const comparisonValue = getComparisonValue(
                                subcategory.yearlyData[expandedYear]?.monthlyData || {}, 
                                month,
                                comparisonMode,
                                selectedMonths
                              )
                              
                              return (
                                <TableCell 
                                  key={`${subcategory.id}-${expandedYear}-${month}`} 
                                  className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap month-column"
                                >
                                  {renderMonthCellWithComparison(amount, comparisonValue, comparisonMode === 'month-to-month' ? 'previous' : 'average', true)}
                                </TableCell>
                              )
                            })
                          }
                        </TableRow>
                      ))
                      )}
                    </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-96 text-center"
                  >
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-10">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                          <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"></path>
                          <path d="M9 22h9"></path>
                          <path d="M15 16v6"></path>
                          <line x1="9" y1="10" x2="15" y2="10"></line>
                          <line x1="12" y1="7" x2="12" y2="13"></line>
                        </svg>
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                          Aucune donnée disponible
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Les données comptables apparaîtront ici une fois chargées. Vous pouvez modifier les filtres ou la plage de dates pour afficher différentes périodes.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="sticky-footer bg-slate-100 dark:bg-slate-800">
              <TableRow className="border-t dark:border-slate-700">
                <TableCell className="p-4 font-medium text-slate-800 dark:text-white whitespace-nowrap footer-cell-left bg-slate-100 dark:bg-slate-800">
                  Total
                </TableCell>
                
                {/* Cellules de total pour les années (non-active) */}
                {years.filter(year => year !== expandedYear).map(year => (
                  <TableCell 
                    key={`total-year-${year}`}
                    className="p-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap bg-blue-50/30 dark:bg-blue-900/10 year-column-transition"
                  >
                    {formatCurrency(totalAmounts[year] || 0)}
                  </TableCell>
                ))}
                
                {/* Cellule de total pour l'année active */}
                {expandedYear && (
                  <TableCell 
                    key={`total-year-${expandedYear}`} 
                    className="p-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap bg-blue-100/50 dark:bg-blue-800/20 year-column-transition"
                  >
                    {formatCurrency(totalAmounts[expandedYear] || 0)}
                  </TableCell>
                )}
                
                {/* Cellules de total pour les mois de l'année ouverte */}
                {expandedYear && Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(month => {
                  const monthTotal = data.reduce((sum, category) => {
                    return sum + (category.yearlyData[expandedYear]?.monthlyData[month] || 0)
                  }, 0)
                  
                  const allMonthlyData = Object.fromEntries(
                    Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => [
                      m,
                      data.reduce((sum, category) => {
                        return sum + (category.yearlyData[expandedYear]?.monthlyData[m] || 0)
                      }, 0)
                    ])
                  )
                  
                  const comparisonValue = getComparisonValue(
                    allMonthlyData,
                    month,
                    comparisonMode,
                    selectedMonths
                  )
                  
                    return (
                    <TableCell 
                      key={`total-${expandedYear}-${month}`} 
                      className="p-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap"
                    >
                      {renderMonthCellWithComparison(monthTotal, comparisonValue, comparisonMode === 'month-to-month' ? 'previous' : 'average')}
                      </TableCell>
                    )
                })}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  )
})