"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { EvolutionChart } from "./EvolutionChart"
import { EvolutionSummary } from "./EvolutionSummary"
import { EvolutionDistribution } from "./EvolutionDistribution"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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

  const fetchYearData = async (year: string) => {
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
  }

  const fetchData = async () => {
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
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      fetchYearData(selectedYear).then(setComparisonData)
    }
  }, [selectedYear])

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
            <h1 className="text-2xl font-medium tracking-tight text-slate-700">Évolution</h1>
            <p className="text-md text-slate-600">
              Analysez l'évolution de vos finances dans le temps
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal avec hauteur fixe */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="actuel" className="h-full flex flex-col">
          <div className="flex-none px-6">
            <TabsList>
              <TabsTrigger value="actuel">Actuel</TabsTrigger>
              <TabsTrigger value="planifie">Planifié</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="actuel" className="h-[calc(100%-40px)] flex flex-col overflow-hidden">
            {/* Résumé de l'évolution - hauteur fixe */}
            <div className="flex-none">
              <EvolutionSummary 
                onYearChange={handleYearChange} 
                selectedYear={selectedYear}
              />
            </div>
            
            {/* Conteneur avec hauteur fixe pour les graphiques */}
            <div className="flex-1 overflow-hidden px-6 min-h-0 mb-6" style={{ maxHeight: "calc(100vh - 350px)" }}>
              <div className="flex h-full gap-6">
                {/* Graphique d'évolution - largeur 60%, hauteur fixe */}
                <div className="w-[60%] flex flex-col h-full">
                  <div className="flex-none pt-6 pb-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Évolution annuelle</h3>
                      <p className="text-sm text-muted-foreground">
                        Évolution des dépenses et revenus pour l'année {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                  {/* Conteneur fixe pour le graphique */}
                  <div className="flex-1 overflow-hidden">
                    <EvolutionChart 
                      data={data} 
                      isLoading={isLoading}
                      comparisonData={comparisonData}
                    />
                  </div>
                </div>

                {/* Distribution - largeur 40%, hauteur fixe */}
                <div className="w-[40%] flex flex-col h-full">
                  <div className="flex-none pt-6 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Distribution</h3>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="show-subcategories" className="text-xs text-muted-foreground">
                            Toutes les sous-catégories
                          </Label>
                          <Switch
                            id="show-subcategories"
                            checked={showAllSubcategories}
                            onCheckedChange={setShowAllSubcategories}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
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
          </TabsContent>

          <TabsContent value="planifie" className="flex-1">
            {/* Contenu de l'onglet Planifié */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 