"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AccountingFilters, ComparisonMode } from "./AccountingFilters"
import { AccountingGridView } from "./AccountingGridView"
import { AccountingIncomeGridView } from "./AccountingIncomeGridView"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

export function AccountingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<string>("expenses")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dateRange, setDateRange] = React.useState<{
    from: Date | null
    to: Date | null
  }>({
    from: null,
    to: null,
  })
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = React.useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = React.useState(false)
  const [comparisonMode, setComparisonMode] = React.useState<ComparisonMode>('month-to-month')
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>([])
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const expensesGridViewRef = React.useRef<{ fetchData: () => void; toggleAllCategories: () => void }>(null)
  const incomeGridViewRef = React.useRef<{ fetchData: () => void; toggleAllCategories: () => void }>(null)

  // Ici, simulation du chargement des données
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    if (activeTab === "expenses") {
      expensesGridViewRef.current?.fetchData()
    } else {
      incomeGridViewRef.current?.fetchData()
    }
  }

  const handleToggleCategories = () => {
    if (activeTab === "expenses") {
      expensesGridViewRef.current?.toggleAllCategories()
    } else {
      incomeGridViewRef.current?.toggleAllCategories()
    }
  }

  const handleComparisonModeChange = (mode: ComparisonMode, months?: string[]) => {
    setComparisonMode(mode)
    if (months) {
      setSelectedMonths(months)
    }
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  if (isLoading) {
    return <AccountingPageSkeleton />
  }

  return (
    <div className="flex flex-col h-screen">
      {!isMaximized && (
        <header className="flex-none">
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
              <h1 className="text-2xl font-medium tracking-tight text-slate-700 dark:text-slate-100">Comptabilité</h1>
              <p className="text-md text-slate-600 dark:text-slate-300">
                Gérez vos dépenses et revenus
              </p>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${isMaximized ? 'pt-0 px-0 h-screen fixed inset-0 z-50 bg-white dark:bg-slate-900' : 'pt-6 px-6'}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className={`h-full ${isMaximized ? 'p-4 md:p-6' : ''}`}>
          {!isMaximized && (
            <div className="flex items-center justify-between mb-2">
              <TabsList>
                <TabsTrigger value="expenses" className="data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">Dépenses</TabsTrigger>
                <TabsTrigger value="income" className="data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">Revenus</TabsTrigger>
              </TabsList>

              {activeTab === "expenses" ? (
                <Button 
                  variant="link"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  onClick={() => setIsAddExpenseDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une dépense
                </Button>
              ) : (
                <Button 
                  variant="link"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  onClick={() => setIsAddIncomeDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un revenu
                </Button>
              )}
            </div>
          )}

          {/* Contenu principal basé sur l'onglet actif */}
          <div className={`${isMaximized ? 'h-full' : 'h-[calc(100%-40px)]'} flex flex-col`}>
            {activeTab === "expenses" ? (
              <>
                <AccountingFilters
                  onSearchChange={setSearchQuery}
                  onDateRangeChange={setDateRange}
                  onRefresh={handleRefresh}
                  onToggleAllCategories={handleToggleCategories}
                  onComparisonModeChange={handleComparisonModeChange}
                  comparisonMode={comparisonMode}
                  className={isMaximized ? "mb-2" : "mb-2"}
                  onMaximize={handleMaximize}
                  isMaximized={isMaximized}
                />

                <div style={{ height: isMaximized ? "calc(100% - 55px)" : "calc(100% - 110px)" }}>
                  <AccountingGridView
                    ref={expensesGridViewRef}
                    searchQuery={searchQuery}
                    dateRange={dateRange}
                    onSearchChange={setSearchQuery}
                    onDateRangeChange={setDateRange}
                    comparisonMode={comparisonMode}
                    selectedMonths={selectedMonths}
                    isMaximized={isMaximized}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full income-tab-content" style={{ gap: 0 }}>
                <AccountingFilters
                  onSearchChange={setSearchQuery}
                  onDateRangeChange={setDateRange}
                  onRefresh={handleRefresh}
                  onToggleAllCategories={handleToggleCategories}
                  onComparisonModeChange={handleComparisonModeChange}
                  comparisonMode={comparisonMode}
                  className={isMaximized ? "mb-2 h-[45px]" : "mb-0 h-[45px]"}
                  onMaximize={handleMaximize}
                  isMaximized={isMaximized}
                />

                <div style={{ height: isMaximized ? "calc(100% - 55px)" : "calc(100% - 45px)" }}>
                  <AccountingIncomeGridView
                    ref={incomeGridViewRef}
                    searchQuery={searchQuery}
                    dateRange={dateRange}
                    onSearchChange={setSearchQuery}
                    onDateRangeChange={setDateRange}
                    comparisonMode={comparisonMode}
                    selectedMonths={selectedMonths}
                    className="income-grid-view"
                    isMaximized={isMaximized}
                  />
                </div>
              </div>
            )}
          </div>
        </Tabs>

        <AddTransactionDialog
          open={isAddExpenseDialogOpen}
          onOpenChange={setIsAddExpenseDialogOpen}
          isIncome={false}
        />

        <AddTransactionDialog
          open={isAddIncomeDialogOpen}
          onOpenChange={setIsAddIncomeDialogOpen}
          isIncome={true}
        />
      </main>
    </div>
  )
}

export function AccountingPageSkeleton() {
  // Valeurs constantes pour remplacer les valeurs aléatoires
  const descWidths = [80, 120, 90, 150, 100, 130, 110, 140, 95, 125];
  const categoryWidths = [120, 180, 150, 200, 170, 190, 160, 210, 140, 185];
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none">
        <div className="w-24 h-10 mt-2 ml-2">
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="px-6 pb-4 mt-4">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
      </header>

      <main style={{ 
        height: "calc(100vh - 140px)",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        paddingBottom: "1rem",
        display: "flex",
        flexDirection: "column"
      }}>
        <div className="flex-1 flex flex-col">
          {/* Tabs du haut */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-56 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>

          {/* Filtres */}
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-10 w-48 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md ml-auto" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          {/* Tableau de transactions */}
          <div className="flex-1 border rounded-md overflow-hidden">
            {/* Entête du tableau */}
            <div className="flex items-center p-3 border-b bg-muted/20">
              <Skeleton className="h-5 w-5 mr-3" />
              <Skeleton className="h-5 w-24 mr-4" />
              <Skeleton className="h-5 w-32 mr-4" />
              <Skeleton className="h-5 w-40 mr-4" />
              <Skeleton className="h-5 w-24 mr-4" />
              <Skeleton className="h-5 w-20 mr-4 ml-auto" />
              <Skeleton className="h-5 w-10" />
            </div>

            {/* Lignes du tableau */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="flex items-center p-3 border-b last:border-b-0"
                style={{ 
                  opacity: 1 - i * 0.07, // Fait disparaître progressivement les lignes
                }}
              >
                <Skeleton className="h-4 w-4 mr-3 rounded-full" />
                <Skeleton className="h-4 w-24 mr-4" />
                <Skeleton 
                  className="h-4 mr-4"
                  style={{ width: `${descWidths[i % descWidths.length]}px` }}
                />
                <Skeleton 
                  className="h-4 mr-4"
                  style={{ width: `${categoryWidths[i % categoryWidths.length]}px` }}
                />
                <Skeleton className="h-4 w-24 mr-4" />
                <Skeleton className="h-4 w-20 mr-4 ml-auto" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex space-x-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md bg-muted/50" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </main>
    </div>
  )
} 
