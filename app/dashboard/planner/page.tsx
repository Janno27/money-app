"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlannerSummary } from "@/components/@components/planner/PlannerSummary"
import { PlannerChart } from "@/components/@components/planner/PlannerChart"
import { FinancialInsights } from "@/components/@components/planner/FinancialInsights"
import { CategoryForecast } from "@/components/@components/planner/CategoryForecast"

export default function PlannerPageRoute() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState("6")
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-[100vh] overflow-hidden">
          <header className="flex-none border-b bg-background px-4 py-3">
            <Breadcrumb
              segments={[
                { title: "Tableau de bord", href: "/dashboard" },
                { title: "Planifié" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-4">
            <div className="flex flex-col h-full">
              <header className="flex-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="w-fit pl-2"
                      onClick={() => router.back()}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Période de prévision:</span>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 mois</SelectItem>
                        <SelectItem value="6">6 mois</SelectItem>
                        <SelectItem value="12">1 an</SelectItem>
                        <SelectItem value="24">2 ans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="px-6 pb-4 mt-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-medium tracking-tight text-slate-700">Planifié</h1>
                    <p className="text-md text-slate-600">
                      Projection budgétaire basée sur les données historiques
                    </p>
                  </div>
                </div>
              </header>
              
              {/* Nouvelle structure en grille: 6 colonnes, 8 lignes */}
              <div className="flex-1 px-6 py-4">
                <div className="grid grid-cols-6 gap-6 h-full">
                  {/* PlannerSummary - 4 colonnes sur 2 lignes */}
                  <div className="col-span-4 row-span-2 bg-background rounded-lg border shadow-sm">
                    <PlannerSummary 
                      monthsAhead={parseInt(selectedPeriod)}
                    />
                  </div>
                  
                  {/* Zone à droite avec insights financiers */}
                  <div className="col-span-2 row-span-2">
                    <FinancialInsights />
                  </div>
                  
                  {/* PlannerChart - 4 colonnes sur 3 lignes avec titre et sous-titre */}
                  <div className="col-span-4 row-span-3 p-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-medium tracking-tight text-slate-700">Évolution prévisionnelle</h3>
                      <p className="text-sm text-slate-600">
                        Projection du solde sur les {selectedPeriod} prochains mois
                      </p>
                    </div>
                    <PlannerChart 
                      monthsAhead={parseInt(selectedPeriod)}
                      className="h-[350px]"
                    />
                  </div>

                  {/* Zone à droite du graphique - Prévisions par catégorie */}
                  <div className="col-span-2 row-span-3">
                    <CategoryForecast 
                      monthsAhead={parseInt(selectedPeriod)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 