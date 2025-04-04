"use client"

import * as React from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  ReferenceLine,
} from "recharts"

// Définir un index pour les mois
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const FULL_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Interface pour les données du graphique
interface ChartDataPoint {
  month: string;
  soldeReel?: number;
  soldePrevision?: number;
  displayMonth: string; // Format complet pour l'affichage
}

// Props du composant
interface PlannerChartProps {
  monthsAhead?: number;
  className?: string;
}

export function PlannerChart({ monthsAhead = 6, className }: PlannerChartProps) {
  const [data, setData] = React.useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Récupération des données réelles et des prévisions
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Récupérer les données réelles depuis Supabase
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        
        // Format des dates pour Supabase
        const todayIso = today.toISOString().split('T')[0];
        const startOfYearIso = startOfYear.toISOString().split('T')[0];
        
        // Requête pour récupérer les transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions_with_refunds')
          .select('amount, is_income, accounting_date')
          .gte('accounting_date', startOfYearIso)
          .lte('accounting_date', todayIso);
        
        if (transactionsError) {
          throw new Error(`Erreur lors de la récupération des transactions: ${transactionsError.message}`);
        }
        
        // Grouper par mois et calculer le solde
        const monthlySoldes: Record<string, number> = {};
        
        transactionsData?.forEach(transaction => {
          const dateComptable = new Date(transaction.accounting_date);
          const monthKey = format(dateComptable, 'yyyy-MM');
          
          if (!monthlySoldes[monthKey]) {
            monthlySoldes[monthKey] = 0;
          }
          
          const montant = parseFloat(transaction.amount);
          if (transaction.is_income) {
            monthlySoldes[monthKey] += montant;
          } else {
            monthlySoldes[monthKey] -= montant;
          }
        });
        
        // 2. Récupérer les prévisions depuis l'API
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
            detailed_categories: false
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        
        const forecastData = await response.json();
        
        // Traiter les prévisions
        const futureSoldes: Record<string, number> = {};
        
        if (forecastData.dates && forecastData.forecast) {
          forecastData.dates.forEach((dateStr: string, index: number) => {
            const monthKey = dateStr.substring(0, 7); // Format 'YYYY-MM'
            
            if (!futureSoldes[monthKey]) {
              futureSoldes[monthKey] = 0;
            }
            
            const income = forecastData.forecast.income ? forecastData.forecast.income[index] : 0;
            const expense = forecastData.forecast.expense ? forecastData.forecast.expense[index] : 0;
            futureSoldes[monthKey] += (income - expense);
          });
        }
        
        // On détermine le mois courant pour la transition
        const currentMonthKey = format(today, 'yyyy-MM');
        
        // Créer un ensemble unique de tous les mois
        const allMonthKeys = new Set([
          ...Object.keys(monthlySoldes),
          ...Object.keys(futureSoldes)
        ]);
        
        // Trier les mois chronologiquement
        const sortedMonthKeys = Array.from(allMonthKeys).sort();
        
        // Trouver l'index du mois courant
        const currentMonthIndex = sortedMonthKeys.indexOf(currentMonthKey);
        
        // Créer les données pour le graphique
        const chartData: ChartDataPoint[] = [];
        
        // Pour assurer la continuité, nous devons calculer la valeur du dernier mois réel
        let lastRealValue = 0;
        let lastRealMonthIndex = -1;
        
        // Trouver le dernier mois réel et sa valeur
        for (let i = 0; i <= currentMonthIndex; i++) {
          if (i < sortedMonthKeys.length) {
            const monthKey = sortedMonthKeys[i];
            if (monthKey in monthlySoldes) {
              lastRealValue = monthlySoldes[monthKey];
              lastRealMonthIndex = i;
            }
          }
        }
        
        sortedMonthKeys.forEach((monthKey, index) => {
          // Extraire l'année et le mois
          const year = parseInt(monthKey.substring(0, 4));
          const month = parseInt(monthKey.substring(5, 7)) - 1; // -1 car les mois sont 0-indexés en JS
          
          // Préparer les valeurs
          let soldeReel = undefined;
          let soldePrevision = undefined;
          
          // Attribuer les valeurs
          if (index <= lastRealMonthIndex) {
            // Données réelles pour les mois passés
            soldeReel = monthlySoldes[monthKey] || 0;
          }
          
          if (index >= lastRealMonthIndex) {
            // Pour la continuité, nous commençons les prévisions à partir du dernier mois réel
            if (index === lastRealMonthIndex) {
              // Au mois de transition, nous utilisons la dernière valeur réelle
              soldePrevision = lastRealValue;
            } else if (monthKey in futureSoldes) {
              // Pour les mois futurs, nous utilisons les prévisions
              soldePrevision = futureSoldes[monthKey];
            }
          }
          
          // Créer le point de données
          chartData.push({
            month: MONTHS[month],
            soldeReel: soldeReel,
            soldePrevision: soldePrevision,
            displayMonth: `${FULL_MONTHS[month]} ${year}`
          });
        });
        
        setData(chartData);
        setError(null);
        
      } catch (err) {
        console.error("Erreur:", err);
        setError("Une erreur s'est produite lors du chargement des données.");
        
        // Générer des données de démo en cas d'erreur
        generateDemoData();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [monthsAhead, supabase]);
  
  // Générer des données de démo en cas d'erreur
  const generateDemoData = () => {
    const demoData: ChartDataPoint[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Trouver une fonction continue pour les valeurs
    const getValueForMonth = (i: number) => {
      // Courbe sinusoïdale avec une légère tendance à la hausse
      return 1500 + Math.sin(i * 0.8) * 1200 + (i > currentMonth ? (i - currentMonth) * 100 : 0);
    };
    
    // Dernière valeur réelle pour assurer la continuité
    const lastRealValue = getValueForMonth(currentMonth);
    
    // Générer tous les mois de l'année
    for (let i = 0; i < 12; i++) {
      const value = getValueForMonth(i);
      
      demoData.push({
        month: MONTHS[i],
        soldeReel: i <= currentMonth ? value : undefined,
        // Pour assurer la continuité, nous incluons le dernier mois réel dans les prévisions
        soldePrevision: i >= currentMonth ? (i === currentMonth ? lastRealValue : value) : undefined,
        displayMonth: `${FULL_MONTHS[i]} ${currentYear}`
      });
    }
    
    setData(demoData);
  };
  
  // Formatage des valeurs en euros
  const formatEuro = (value: number | undefined) => {
    if (value === undefined) return '';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Définir une interface pour les props du CustomTooltip
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      payload: ChartDataPoint;
    }>;
  }

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      // Déterminer si on affiche une donnée réelle ou une prévision
      const isRealData = dataPoint.soldeReel !== undefined && payload[0].dataKey === "soldeReel";
      const value = isRealData ? dataPoint.soldeReel : dataPoint.soldePrevision;
      
      return (
        <div className="rounded-md shadow-md bg-white border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-800 mb-2">
            {dataPoint.displayMonth}
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: isRealData ? '#3b82f6' : '#818cf8' 
                }}></div>
              <span className="text-xs text-gray-600">
                {isRealData ? 'Réel' : 'Prévision'}
              </span>
            </div>
            <span className={`text-xs font-medium ${(value || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Afficher un indicateur de chargement si besoin
  if (isLoading) {
    return (
      <div className={`h-[300px] w-full ${className} bg-card border rounded-lg p-4`}>
        <div className="h-full flex flex-col">
          {/* Titre du skeleton */}
          <div className="mb-4">
            <div className="h-4 w-40 bg-muted/40 rounded animate-pulse"></div>
          </div>
          
          {/* Graphique skeleton */}
          <div className="flex-1 relative">
            {/* Ligne horizontale (axe X) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-muted/50"></div>
            
            {/* Ligne de référence zéro */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-muted/30"></div>
            
            {/* Courbe animée */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center">
              <svg className="w-full h-[120px]" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Animation de la courbe */}
                <defs>
                  <linearGradient id="skeletonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                  </linearGradient>
                  
                  {/* Animation pour la courbe */}
                  <animate 
                    xlinkHref="#curve-real"
                    attributeName="d"
                    dur="3s"
                    values="M0,50 C50,40 100,60 200,50; M0,50 C50,30 100,70 200,50; M0,50 C50,40 100,60 200,50"
                    repeatCount="indefinite"
                  />
                  
                  <animate 
                    xlinkHref="#curve-forecast"
                    attributeName="d"
                    dur="3s"
                    values="M200,50 C300,40 350,50 400,45; M200,50 C300,30 350,60 400,40; M200,50 C300,40 350,50 400,45"
                    repeatCount="indefinite"
                  />
                  
                  <animate 
                    xlinkHref="#area-fill"
                    attributeName="d"
                    dur="3s"
                    values="M0,50 C50,40 100,60 200,50 C300,40 350,50 400,45 L400,100 L0,100 Z; M0,50 C50,30 100,70 200,50 C300,30 350,60 400,40 L400,100 L0,100 Z; M0,50 C50,40 100,60 200,50 C300,40 350,50 400,45 L400,100 L0,100 Z"
                    repeatCount="indefinite"
                  />
                </defs>
                
                {/* Partie réelle de la courbe (gauche) */}
                <path 
                  id="curve-real"
                  d="M0,50 C50,40 100,60 200,50" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                
                {/* Partie prévisionnelle de la courbe (droite) */}
                <path 
                  id="curve-forecast"
                  d="M200,50 C300,40 350,50 400,45" 
                  fill="none" 
                  stroke="#818cf8" 
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeLinecap="round"
                />
                
                {/* Gradient sous la courbe */}
                <path 
                  id="area-fill"
                  d="M0,50 C50,40 100,60 200,50 C300,40 350,50 400,45 L400,100 L0,100 Z" 
                  fill="url(#skeletonGradient)"
                />
              </svg>
            </div>
            
            {/* Mois sur l'axe X */}
            <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between px-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 w-8 bg-muted/40 rounded animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
              ))}
            </div>
          </div>
          
          {/* Texte de chargement */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">Chargement des prévisions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[300px] w-full ${className}`}>
      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
        >
          <defs>
            <linearGradient id="gradientReel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="gradientPrevision" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb"
            opacity={0.5}
            vertical={false}
          />
          
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8"
            fontSize={12}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            padding={{ left: 30, right: 30 }}
            height={30}
          />
          
          {/* Axe Y supprimé mais on garde la ligne de référence à zéro */}
          <ReferenceLine y={0} stroke="#e5e7eb" />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Données réelles avec trait plein */}
          <Area 
            type="monotone"
            dataKey="soldeReel"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientReel)"
            connectNulls
          />
          
          {/* Prévisions avec trait pointillé */}
          <Area 
            type="monotone"
            dataKey="soldePrevision"
            stroke="#818cf8"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={0.8}
            fill="url(#gradientPrevision)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}