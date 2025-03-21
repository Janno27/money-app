import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { EvolutionChartSkeleton } from "../evolution/EvolutionChart"
import { EvolutionSummarySkeleton } from "../evolution/EvolutionSummary"

export function UpcomingEventsSkeletonDashboard() {
  // Version simplifiée pour le dashboard, basée sur la capture d'écran
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Événements à venir</h3>
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="space-y-3">
        {/* Section "Cette semaine" */}
        <div className="p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Cette semaine</h3>
          
          <Card className="p-3 border space-y-2 mb-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex -space-x-2">
                <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </Card>
        </div>
        
        {/* Section "Ce mois" */}
        <div className="p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Ce mois</h3>
          
          <Card className="p-3 border space-y-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex -space-x-2">
                <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
                <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function NotesStackSkeleton() {
  // Utilisons des valeurs constantes au lieu de Math.random() pour éviter les erreurs d'hydratation
  const noteWidths = [70, 40, 80, 60];
  const noteOpacities = [0.7, 0.8, 0.75, 0.85];
  const noteColors = ['#fef3c7', '#e0f2fe', '#dcfce7', '#f3e8ff'];
  
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Notes</h3>
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="p-3 rounded-md space-y-2"
            style={{ 
              backgroundColor: noteColors[i % 4],
              opacity: noteOpacities[i % 4]
            }}
          >
            <Skeleton 
              className="h-4"
              style={{ 
                width: `${noteWidths[i % 4]}%`,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}
            />
            <Skeleton 
              className="h-4"
              style={{ 
                width: `${Math.min(100, noteWidths[(i + 2) % 4] + 20)}%`,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}
            />
            {i % 2 === 0 && (
              <Skeleton 
                className="h-4"
                style={{ 
                  width: `${noteWidths[(i + 1) % 4]}%`,
                  backgroundColor: 'rgba(255,255,255,0.7)'
                }}
              />
            )}
            <div className="flex items-center space-x-2 mt-2">
              <Skeleton 
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
              />
              <Skeleton 
                className="h-3 w-16"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6 pl-2">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-80" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function EvolutionCardSkeleton() {
  return (
    <Card className="bg-muted/5 dark:bg-blue-600 p-2 h-full flex flex-col">
      <div className="flex-none">
        <div className="flex items-center justify-between mb-2 p-2">
          <div className="space-y-1">
            <h3 className="text-lg font-medium tracking-tight text-slate-700">Évolution Financière</h3>
            <p className="text-sm text-slate-600">Vue détaillée de vos finances</p>
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <EvolutionSummarySkeleton />
        <div className="h-[calc(100%-80px)]">
          <EvolutionChartSkeleton />
        </div>
      </div>
    </Card>
  )
}

export function UpcomingEventsCardSkeleton() {
  return (
    <Card className="bg-muted/5 dark:bg-blue-600 p-4 h-full flex flex-col">
      <div className="flex-none">
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <h3 className="text-lg font-medium tracking-tight text-slate-700">Événements à venir</h3>
            <p className="text-sm text-slate-600">Aperçu des prochains événements</p>
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          <UpcomingEventsSkeletonDashboard />
        </div>
      </div>
    </Card>
  )
}

export function NotesCardSkeleton() {
  return (
    <Card className="bg-muted/5 p-4 h-full flex flex-col">
      <div className="flex-none">
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <h3 className="text-lg font-medium tracking-tight text-slate-700">Notes</h3>
            <p className="text-sm text-slate-600">Notes importantes de la famille</p>
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          <NotesStackSkeleton />
        </div>
      </div>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-[100vh] overflow-hidden">
      <header className="flex-none border-b bg-background px-4 py-3">
        <Skeleton className="h-9 w-40" />
      </header>
      <main className="flex-1 min-h-0 p-8">
        <div className="grid grid-cols-12 grid-rows-6 gap-8 h-full">
          {/* Header */}
          <div className="col-span-8 row-span-1">
            <DashboardHeaderSkeleton />
          </div>

          {/* Evolution Card */}
          <div className="col-span-8 row-span-3">
            <EvolutionCardSkeleton />
          </div>

          {/* Upcoming Events Card */}
          <div className="col-span-4 row-span-3">
            <UpcomingEventsCardSkeleton />
          </div>

          {/* Notes Card */}
          <div className="col-span-12 row-span-2">
            <NotesCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
} 