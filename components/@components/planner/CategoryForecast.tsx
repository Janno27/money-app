"use client"

import React, { useState, useRef, useEffect } from "react"
import { formatCurrency } from "@/lib/format"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Skeleton } from "@/components/ui/skeleton"

interface CategoryForecastProps {
  monthsAhead?: number
  className?: string
}

interface TooltipState {
  visible: boolean;
  item: any;
  x: number;
  y: number;
}

interface CategoryData {
  subcategory: string;
  reel: number;
  prevision: number;
  category: string;
}

export function CategoryForecast({ monthsAhead = 6, className }: CategoryForecastProps) {
  // Référence au conteneur pour les calculs de position
  const containerRef = useRef<HTMLDivElement>(null);
  
  // État pour le tooltip
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    item: null,
    x: 0,
    y: 0
  });

  // État pour les données et le chargement
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Client Supabase
  const supabase = createClientComponentClient();
  
  // Mois courant
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: fr });

  // Récupérer les données depuis le backend
  useEffect(() => {
    const fetchCategoryData = async () => {
      setIsLoading(true);
      try {
        // 1. Récupérer les données réelles depuis Supabase
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Format des dates pour Supabase
        const todayIso = today.toISOString().split('T')[0];
        const startOfMonthIso = startOfMonth.toISOString().split('T')[0];
        
        // Requête pour les dépenses du mois courant par sous-catégorie
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions_with_refunds')
          .select(`
            final_amount, 
            is_income, 
            accounting_date,
            category:categories(id, name),
            subcategory:subcategories(id, name)
          `)
          .eq('is_income', false) // Uniquement les dépenses
          .gte('accounting_date', startOfMonthIso)
          .lte('accounting_date', todayIso);
        
        if (transactionsError) {
          throw new Error(`Erreur lors de la récupération des transactions: ${transactionsError.message}`);
        }
        
        // 2. Appel à l'API de prévision pour obtenir les données prévisionnelles
        const API_URL = process.env.NEXT_PUBLIC_FORECAST_API_URL || 'http://localhost:8000';
        const API_KEY = process.env.NEXT_PUBLIC_FORECAST_API_KEY || 'dev_key';
        
        const response = await fetch(`${API_URL}/api/forecast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify({
            months_ahead: monthsAhead,
            include_recurring: true,
            detailed_categories: true // Important pour obtenir les prévisions par catégorie
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        
        const forecastData = await response.json();
        
        // 3. Traiter les données pour les regrouper par sous-catégorie
        const subcategoryMap = new Map<string, CategoryData>();
        
        // Traiter les transactions réelles
        transactionsData?.forEach((transaction: any) => {
          if (!transaction.subcategory) return;
          
          const subcategoryName = transaction.subcategory.name;
          const categoryName = transaction.category?.name || 'Autre';
          const amount = Math.abs(parseFloat(transaction.final_amount));
          
          if (!subcategoryMap.has(subcategoryName)) {
            subcategoryMap.set(subcategoryName, {
              subcategory: subcategoryName,
              category: categoryName,
              reel: 0,
              prevision: 0
            });
          }
          
          const current = subcategoryMap.get(subcategoryName)!;
          current.reel += amount;
        });
        
        // Traiter les prévisions
        if (forecastData.categories && forecastData.categories.expense) {
          Object.entries(forecastData.categories.expense).forEach(([category, values]: [string, any]) => {
            // Trouver les sous-catégories correspondantes
            const subcategories = Array.from(subcategoryMap.values())
              .filter(item => item.category.toLowerCase() === category.toLowerCase());
            
            if (subcategories.length > 0) {
              // Répartir les prévisions proportionnellement aux dépenses réelles
              const totalReel = subcategories.reduce((sum, item) => sum + item.reel, 0);
              const totalPrevision = Array.isArray(values) ? values.reduce((sum: number, val: number) => sum + val, 0) : 0;
              
              subcategories.forEach(subcategory => {
                if (totalReel > 0) {
                  const ratio = subcategory.reel / totalReel;
                  subcategory.prevision = subcategory.reel + (totalPrevision * ratio);
                } else {
                  subcategory.prevision = totalPrevision / subcategories.length;
                }
              });
            }
          });
        }
        
        // Convertir la Map en tableau et trier par dépenses réelles décroissantes
        const categoryData = Array.from(subcategoryMap.values())
          .sort((a, b) => b.reel - a.reel)
          .slice(0, 15); // Limiter aux 15 premières sous-catégories
        
        setData(categoryData);
        setError(null);
        
      } catch (err) {
        console.error("Erreur:", err);
        setError("Une erreur s'est produite lors du chargement des données.");
        
        // Données de démonstration en cas d'erreur
        const demoData: CategoryData[] = [
          {
            subcategory: "Courses",
            reel: 320,
            prevision: 380,
            category: "Alimentation"
          },
          {
            subcategory: "Loyer",
            reel: 950,
            prevision: 950,
            category: "Logement"
          },
          {
            subcategory: "Carburant",
            reel: 120,
            prevision: 150,
            category: "Transport"
          },
          {
            subcategory: "Restaurants",
            reel: 80,
            prevision: 150,
            category: "Alimentation"
          },
          {
            subcategory: "Électricité",
            reel: 85,
            prevision: 110,
            category: "Logement"
          },
          {
            subcategory: "Internet",
            reel: 40,
            prevision: 40,
            category: "Logement"
          },
          {
            subcategory: "Transport public",
            reel: 40,
            prevision: 40,
            category: "Transport"
          },
          {
            subcategory: "Cinéma",
            reel: 30,
            prevision: 50,
            category: "Loisirs"
          },
          {
            subcategory: "Vêtements",
            reel: 65,
            prevision: 120,
            category: "Personnel"
          },
          {
            subcategory: "Téléphone",
            reel: 25,
            prevision: 25,
            category: "Services"
          },
          {
            subcategory: "Vacances",
            reel: 200,
            prevision: 600,
            category: "Loisirs"
          },
          {
            subcategory: "Assurances",
            reel: 90,
            prevision: 90,
            category: "Finance"
          },
          {
            subcategory: "Santé",
            reel: 45,
            prevision: 70,
            category: "Bien-être"
          },
          {
            subcategory: "Abonnements",
            reel: 35,
            prevision: 35,
            category: "Loisirs"
          },
          {
            subcategory: "Cadeaux",
            reel: 20,
            prevision: 50,
            category: "Personnel"
          }
        ];
        
        setData(demoData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryData();
  }, [monthsAhead, supabase]);
  
  // Calculer le pourcentage de progression
  const calculateProgress = (real: number, prediction: number) => {
    return Math.min(100, (real / prediction) * 100)
  }
  
  // Déterminer la classe de progression
  const getProgressClass = (percentage: number) => {
    if (percentage >= 100) return "text-red-500"
    if (percentage >= 80) return "text-amber-500"
    return "text-emerald-500"
  }

  // Gérer l'apparition du tooltip
  const handleMouseEnter = (e: React.MouseEvent, item: any) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTooltip({
      visible: true,
      item,
      x,
      y
    });
  };

  // Gérer le déplacement de la souris
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip.visible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setTooltip({
        ...tooltip,
        x,
        y
      });
    }
  };

  // Gérer la disparition du tooltip
  const handleMouseLeave = () => {
    setTooltip({
      ...tooltip,
      visible: false
    });
  };
  
  // Définir une taille fixe pour les barres - ajustement pour le défilement horizontal
  const barWidth = 22;  // largeur en pixels pour chaque barre
  const barGap = 14;    // espacement entre les barres
  
  // Afficher un skeleton loading pendant le chargement
  if (isLoading) {
    // Hauteurs prédéfinies pour éviter les erreurs d'hydratation
    const skeletonHeights = [80, 120, 60, 150, 100, 130, 70, 110];
    
    return (
      <div 
        className={`${className} relative bg-card border rounded-lg`} 
        style={{ height: '370px' }}
      >
        <div className="h-full flex flex-col p-4">
          <div className="text-xs text-center mb-4">
            <Skeleton className="h-3 w-40 mx-auto bg-muted/40 rounded" />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex items-end gap-3 px-4">
              {/* Barres de skeleton avec hauteurs prédéfinies et animation */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: `${barWidth}px` }}>
                  <div className="w-full relative">
                    <Skeleton 
                      className="w-full bg-muted/40 rounded-t-full animate-pulse" 
                      style={{ 
                        height: `${skeletonHeights[i]}px`,
                        animationDelay: `${i * 100}ms`
                      }} 
                    />
                  </div>
                  <div className="mt-2 w-full">
                    <Skeleton className="h-10 w-full bg-muted/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Couleur pour les barres
  const barColor = "#6366f1" // violet indigo
  
  return (
    <div 
      ref={containerRef}
      className={`${className} relative`} 
      style={{ height: '370px' }}
    >
      <div className="h-full flex flex-col">
        <div className="text-xs text-center mb-2 text-slate-500">
          Budget du mois - {currentMonth}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Conteneur avec défilement horizontal */}
          <div className="overflow-x-auto h-full pb-2">
            {/* La grille avec largeur basée sur le nombre d'éléments */}
            <div 
              className="h-full pr-4" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${data.length}, ${barWidth}px)`,
                gap: `${barGap}px`, 
                minWidth: '100%', 
                width: 'max-content' 
              }}
            >
              {data.map((item, index) => {
                const progress = calculateProgress(item.reel, item.prevision)
                
                return (
                  <div key={index} className="flex flex-col h-full">
                    {/* Bar container */}
                    <div className="flex-1 relative flex items-end mb-1">
                      {/* Background bar */}
                      <div 
                        className="absolute inset-x-0 bottom-0 top-0 bg-indigo-100"
                        style={{ borderRadius: '999px 999px 0 0' }}
                      ></div>
                      
                      {/* Foreground bar */}
                      <div 
                        className="relative w-full bg-indigo-500 flex items-center justify-center cursor-pointer"
                        style={{ 
                          height: `${progress}%`,
                          minHeight: '25px',
                          borderRadius: '999px 999px 0 0'
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, item)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Vertical text - reduced font size */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center text-white font-medium text-[10px]"
                          style={{ 
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)'
                          }}
                        >
                          {item.reel >= 1000 
                            ? `${Math.round(item.reel/1000)}k€` 
                            : `${item.reel}€`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Subcategory label - now vertical at the bottom */}
                    <div className="text-center text-[9px] text-slate-600 h-[60px] flex justify-center">
                      <div 
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.subcategory}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip - position absolue par rapport au conteneur et amélioré pour être plus visible */}
      {tooltip.visible && tooltip.item && (
        <div 
          className="absolute z-10 bg-white p-3 rounded-md shadow-lg border border-gray-200"
          style={{
            left: Math.min(tooltip.x, containerRef.current ? containerRef.current.clientWidth - 200 : 0),
            top: Math.max(tooltip.y - 150, 10),
            pointerEvents: 'none',
            width: '200px'
          }}
        >
          {/* Tooltip content */}
          <p className="text-sm font-medium">{tooltip.item.subcategory}</p>
          <p className="text-xs text-muted-foreground mb-2">Catégorie: {tooltip.item.category}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: barColor }}
                />
                <span className="text-xs">Réel</span>
              </div>
              <span className="text-xs font-medium">{formatCurrency(tooltip.item.reel)}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#94a3b8" }}
                />
                <span className="text-xs">Reste</span>
              </div>
              <span className="text-xs font-medium">{formatCurrency(Math.max(0, tooltip.item.prevision - tooltip.item.reel))}</span>
            </div>
            
            <div className="h-[1px] bg-slate-100 my-1" />
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Prévision</span>
              <span className="text-xs font-medium">{formatCurrency(tooltip.item.prevision)}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Progression</span>
              <span className={`text-xs font-medium ${getProgressClass(calculateProgress(tooltip.item.reel, tooltip.item.prevision))}`}>
                {Math.round(calculateProgress(tooltip.item.reel, tooltip.item.prevision))}%
                {tooltip.item.reel > tooltip.item.prevision && ' (dépassé)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 