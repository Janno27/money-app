"use client"

import React from "react"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FinancialInsightsProps {
  className?: string
}

export function FinancialInsights({ className }: FinancialInsightsProps) {
  // Données fictives pour le composant
  const insights = [
    {
      type: "expense",
      message: "Vos dépenses ce mois-ci atteignent le niveau budgétaire !",
      progress: 60, // pourcentage du budget utilisé
      current: 3000, // montant actuel
      budget: 5000, // budget total
      remaining: 2000, // montant restant
    }
  ]

  return (
    <div className={`h-full ${className}`}>
      <div className="bg-indigo-600 rounded-lg p-3 h-full flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" />
              <h3 className="text-sm font-medium">Business Insights</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white text-xs hover:bg-indigo-700 p-0 h-7"
            >
              ADJUST
            </Button>
          </div>
          
          {insights.map((insight, index) => (
            <div key={index}>
              <p className="text-indigo-100 text-xs leading-tight">
                {insight.message}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-2">
          <div className="relative bg-white/20 rounded-full h-5 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full flex items-center justify-center text-xs font-medium text-indigo-900"
              style={{ width: `${insights[0].progress}%` }}
            >
              $ {insights[0].current}
            </div>
          </div>
          
          <div className="flex justify-between text-xs mt-1">
            <div>
              <div className="font-medium">$ {insights[0].remaining} LEFT</div>
            </div>
            <div>
              <div className="font-medium">$ {insights[0].budget}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 