"use client"

import { useEffect, useState } from "react"
import { getApiCallStats, getApiCallLogs } from "@/lib/supabase/client"

export function DiagnosticButton() {
  const [isDev, setIsDev] = useState(false)
  
  useEffect(() => {
    // Vérifier si nous sommes en mode développement
    setIsDev(process.env.NODE_ENV === 'development')
  }, [])
  
  const handleDiagnostic = () => {
    try {
      const stats = getApiCallStats()
      const logs = getApiCallLogs()
      
      console.log('=== STATISTIQUES DES APPELS API ===')
      console.table(stats)
      
      console.log('=== JOURNAL DES APPELS API ===')
      console.table(logs)
      
      alert(`Statistiques d'appels API affichées dans la console. ${stats.length} méthodes suivies, ${logs.length} appels journalisés.`)
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error)
      alert('Erreur lors du diagnostic. Voir la console pour plus de détails.')
    }
  }

  // Ne rien afficher si nous ne sommes pas en mode développement
  if (!isDev) {
    return null
  }

  return (
    <div className="absolute bottom-2 left-2 z-10">
      <button
        onClick={handleDiagnostic}
        className="text-[10px] text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-sm transition-colors"
        title="Afficher les statistiques d'appels API dans la console"
      >
        Diagnostiquer API
      </button>
    </div>
  )
} 