"use client"

import { useState } from "react"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AccountingFilters, ComparisonMode } from "./AccountingFilters"
import { AccountingGridView } from "./AccountingGridView"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from "react"

export function AccountingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  })
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('month-to-month')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const gridViewRef = React.useRef<{ fetchData: () => void; toggleAllCategories: () => void } | null>(null)

  const handleRefresh = () => {
    gridViewRef.current?.fetchData()
  }

  const handleToggleCategories = () => {
    gridViewRef.current?.toggleAllCategories()
  }

  const handleComparisonModeChange = (mode: ComparisonMode, months?: string[]) => {
    setComparisonMode(mode)
    if (months) {
      setSelectedMonths(months)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
            <h1 className="text-2xl font-medium tracking-tight text-slate-700">Comptabilité</h1>
            <p className="text-md text-slate-600">
              Gérez vos dépenses et revenus
            </p>
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
        <Tabs defaultValue="expenses" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="expenses">Dépenses</TabsTrigger>
              <TabsTrigger value="income">Revenus</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="m-0">
              <Button 
                variant="link"
                className="text-slate-700 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 rounded-md"
                onClick={() => setIsAddExpenseDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Ajouter une dépense
              </Button>
            </TabsContent>

            <TabsContent value="income" className="m-0">
              <Button 
                variant="link"
                className="text-slate-700 flex items-center gap-1 hover:gap-2 transition-all hover:bg-slate-100 rounded-md"
                onClick={() => setIsAddIncomeDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Ajouter un revenu
              </Button>
            </TabsContent>
          </div>

          <TabsContent value="expenses" style={{ 
            height: "calc(100% - 40px)", 
            display: "flex", 
            flexDirection: "column" 
          }}>
            <AccountingFilters
              onSearchChange={setSearchQuery}
              onDateRangeChange={setDateRange}
              onRefresh={handleRefresh}
              onToggleAllCategories={handleToggleCategories}
              onComparisonModeChange={handleComparisonModeChange}
              comparisonMode={comparisonMode}
              className="mb-2"
            />

            <div style={{ height: "calc(100% - 110px)" }}>
              <AccountingGridView
                ref={gridViewRef}
                searchQuery={searchQuery}
                dateRange={dateRange}
                isIncome={false}
                onSearchChange={setSearchQuery}
                onDateRangeChange={setDateRange}
                comparisonMode={comparisonMode}
                selectedMonths={selectedMonths}
              />
            </div>
          </TabsContent>

          <TabsContent value="income" style={{ 
            height: "calc(100% - 40px)", 
            display: "flex", 
            flexDirection: "column"
          }}>
            <div className="flex flex-col h-full income-tab-content" style={{ gap: 0 }}>
              <AccountingFilters
                onSearchChange={setSearchQuery}
                onDateRangeChange={setDateRange}
                onRefresh={handleRefresh}
                onToggleAllCategories={handleToggleCategories}
                onComparisonModeChange={handleComparisonModeChange}
                comparisonMode={comparisonMode}
                className="mb-0 h-[45px]"
              />

              <div style={{ height: "calc(100% - 45px)" }}>
                <AccountingGridView
                  ref={gridViewRef}
                  searchQuery={searchQuery}
                  dateRange={dateRange}
                  isIncome={true}
                  onSearchChange={setSearchQuery}
                  onDateRangeChange={setDateRange}
                  comparisonMode={comparisonMode}
                  selectedMonths={selectedMonths}
                  className="income-grid-view"
                />
              </div>
            </div>
          </TabsContent>
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
