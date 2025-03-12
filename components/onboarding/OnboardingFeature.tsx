"use client"

import { ReactNode } from "react"
import { BarChart3, Plus, CreditCard, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingFeatureProps {
  children?: ReactNode;
  theme: 'light' | 'dark';
}

export function OnboardingFeature({ children, theme }: OnboardingFeatureProps) {
  // Étapes des fonctionnalités
  const featureSteps = [
    // Étape 1 : Gérer les finances
    {
      title: "Gérez vos finances",
      description: "Explorez toutes vos transactions et analysez vos dépenses en un coup d'œil",
      content: (
        <div className="flex flex-col items-center justify-center">
          {/* Illustration stylisée */}
          <div className="relative w-52 h-52 mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 rounded-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <BarChart3 className="h-20 w-20 text-blue-500 dark:text-blue-400 opacity-60" />
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="absolute top-6 left-6 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
              <div className="w-24 h-2 bg-blue-200 dark:bg-blue-700 rounded-full mb-1"></div>
              <div className="w-16 h-2 bg-blue-100 dark:bg-blue-800 rounded-full"></div>
            </div>
          </div>
        </div>
      ),
      showBackButton: true
    },
    // Étape 2 : Enregistrer les transactions
    {
      title: "Enregistrez vos transactions",
      description: "Ajoutez facilement vos dépenses et revenus pour un suivi précis",
      content: (
        <div className="flex flex-col items-center justify-center">
          {/* Illustration de transaction */}
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mt-4">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nouvelle transaction</span>
              </div>
              <button className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                <X className="h-3 w-3 text-blue-500 dark:text-blue-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="w-full h-8 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="w-full h-8 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="w-full h-8 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
              
              <div className="flex justify-end mt-4">
                <div className="w-24 h-8 bg-blue-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      showBackButton: true
    },
    // Étape 3 : Analyser les finances
    {
      title: "Analysez vos finances",
      description: "Comparez vos dépenses et revenus pour mieux gérer votre budget",
      content: (
        <div className="flex flex-col items-center justify-center">
          {/* Graphique simplifié */}
          <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="flex space-x-1">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700"></div>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700"></div>
              </div>
            </div>
            
            <div className="h-32 flex items-end space-x-2 mb-2">
              <div className="flex-1 bg-blue-100 dark:bg-blue-900 rounded-t h-[60%]"></div>
              <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-t h-[40%]"></div>
              <div className="flex-1 bg-blue-300 dark:bg-blue-700 rounded-t h-[80%]"></div>
              <div className="flex-1 bg-blue-400 dark:bg-blue-600 rounded-t h-[60%]"></div>
              <div className="flex-1 bg-blue-500 dark:bg-blue-500 rounded-t h-[90%]"></div>
              <div className="flex-1 bg-sky-400 dark:bg-sky-600 rounded-t h-[70%]"></div>
              <div className="flex-1 bg-sky-300 dark:bg-sky-700 rounded-t h-[50%]"></div>
            </div>
            
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <div>Jan</div>
              <div>Fév</div>
              <div>Mar</div>
              <div>Avr</div>
              <div>Mai</div>
              <div>Juin</div>
              <div>Juil</div>
            </div>
          </div>
        </div>
      ),
      showBackButton: true
    },
  ];

  return (
    <>
      {featureSteps.map((step, index) => (
        <div key={index} className="mb-10 last:mb-0">
          <h2 className={cn(
            "text-xl font-medium mb-2",
            theme === 'dark' ? "text-white" : "text-slate-800"
          )}>
            {step.title}
          </h2>
          <p className={cn(
            "text-base mb-4",
            theme === 'dark' ? "text-slate-300" : "text-slate-600"
          )}>
            {step.description}
          </p>
          {step.content}
        </div>
      ))}
      {children}
    </>
  );
} 