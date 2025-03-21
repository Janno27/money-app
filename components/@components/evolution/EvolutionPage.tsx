"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EvolutionSummary } from "./EvolutionSummary"
import { EvolutionChart } from "./EvolutionChart"
import { EvolutionDistribution } from "./EvolutionDistribution"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import React, { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export default function EvolutionPage() {
  const router = useRouter()
  const [data, setData] = useState<MonthlyData[]>([])
  const [comparisonData, setComparisonData] = useState<MonthlyData[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAllSubcategories, setShowAllSubcategories] = useState(false)
  const supabase = createClientComponentClient()

  const fetchYearData = useCallback(async (year: string) => {
    const { data: transactions } = await supabase
      .from("transactions_with_refunds")
      .select("*")
      .gte('accounting_date', `${year}-01-01`)
      .lte('accounting_date', `${year}-12-31`)
      .order('accounting_date', { ascending: true })

    if (!transactions) return []

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(parseInt(year), i, 1), 'MMMM', { locale: fr }),
      income: 0,
      expenses: 0,
    }))

    transactions.forEach((transaction) => {
      const month = new Date(transaction.accounting_date).getMonth()
      if (transaction.is_income) {
        monthlyData[month].income += transaction.final_amount
      } else {
        monthlyData[month].expenses += Math.abs(transaction.final_amount)
      }
    })

    return monthlyData
  }, [supabase])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const currentYear = new Date().getFullYear().toString()
      const yearData = await fetchYearData(currentYear)
      setData(yearData)

      // Si aucune année n'est sélectionnée, on prend l'année précédente par défaut
      if (!selectedYear) {
        const previousYear = (parseInt(currentYear) - 1).toString()
        setSelectedYear(previousYear)
        const comparisonYearData = await fetchYearData(previousYear)
        setComparisonData(comparisonYearData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchYearData, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (selectedYear) {
      fetchYearData(selectedYear).then(setComparisonData)
    }
  }, [selectedYear, fetchYearData])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* En-tête fixe */}
      <div className="flex-none">
        <Button
          variant="ghost"
          className="w-fit pl-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="px-6 pb-4 mt-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight text-slate-700 dark:text-slate-100">Évolution</h1>
            <p className="text-md text-slate-600 dark:text-slate-300">
              Analysez l&apos;évolution de vos finances dans le temps
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal avec hauteur fixe */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {/* Résumé de l'évolution - hauteur fixe */}
          <div className="flex-none">
            <EvolutionSummary 
              onYearChange={handleYearChange} 
              selectedYear={selectedYear}
            />
          </div>
          
          {/* Conteneur avec hauteur fixe pour les graphiques */}
          <div className="flex-1 overflow-hidden px-6 min-h-0 mb-8">
            <div className="flex h-full gap-6">
              <div className="w-[60%] flex flex-col h-full">
                <div className="flex-none pt-6 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium tracking-tight text-slate-700 dark:text-slate-100">Évolution Financière</h3>
                      
                      {/* CTA */}
                      <Button 
                        variant="link" 
                        className="text-blue-500 flex items-center gap-1 hover:gap-2 transition-all text-xs p-0 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => router.push('/dashboard/planner')}
                      >
                        Voir les prévisions
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Vue détaillée de vos finances sur l&apos;année {new Date().getFullYear().toString()}
                      </p>
                      
                      {/* Légende */}
                      <div className="flex items-center gap-6">
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
                  </div>
                </div>
                {/* Conteneur fixe pour les graphiques */}
                <div className="flex-1 h-full flex flex-col">
                  <EvolutionChart data={data} isLoading={isLoading} comparisonData={comparisonData} isDashboard={false} />
                </div>
              </div>
              
              <div className="w-[40%] flex flex-col h-full">
                <div className="flex-none pt-6 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium tracking-tight text-slate-700 dark:text-slate-100">Distribution</h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="show-subcategories" className="text-xs text-slate-600 dark:text-slate-300">
                          Toutes les sous-catégories
                        </Label>
                        <Switch
                          id="show-subcategories"
                          checked={showAllSubcategories}
                          onCheckedChange={setShowAllSubcategories}
                          className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Répartition des dépenses et revenus par catégorie
                    </p>
                  </div>
                </div>
                {/* Conteneur fixe pour la distribution */}
                <div className="flex-1 overflow-hidden">
                  <EvolutionDistribution showAllSubcategories={showAllSubcategories} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 