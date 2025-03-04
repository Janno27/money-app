# Module d'Évolution

## Structure des Fichiers

```
app/dashboard/evolution/
├── page.tsx           # Point d'entrée du module
├── README.md         # Documentation

components/@components/evolution/
├── EvolutionPage.tsx       # Composant principal
├── EvolutionSummary.tsx    # Résumé des totaux et comparaisons
├── EvolutionChart.tsx      # Graphique d'évolution
└── EvolutionDistribution.tsx # Distribution des catégories
```

## Flux des Données

1. **Point d'Entrée (`page.tsx`)**
   - Route principale du module d'évolution
   - Intègre le `SidebarProvider` et l'`AppSidebar`
   - Contient le fil d'Ariane (Breadcrumb)
   - Charge le composant `EvolutionPage`

2. **Composant Principal (`EvolutionPage.tsx`)**
   - Gère l'état global de la page
   - États:
     - `data`: Données mensuelles de l'année en cours
     - `comparisonData`: Données mensuelles de l'année de comparaison
     - `selectedYear`: Année sélectionnée pour comparaison
     - `isLoading`: État de chargement
     - `showAllSubcategories`: État du switch pour l'affichage des sous-catégories
   - Structure:
     ```jsx
     <EvolutionSummary />
     <div className="flex">
       <EvolutionChart />
       <EvolutionDistribution />
     </div>
     ```

3. **Résumé (`EvolutionSummary.tsx`)**
   - Affiche les totaux de l'année en cours
   - Permet la sélection de l'année de comparaison
   - Calcule et affiche les variations en pourcentage
   - Props:
     - `onYearChange`: (year: string) => void
     - `selectedYear`: string
   - Fonctionnalités:
     - Navigation entre les années
     - Calcul des variations année/année
     - Formatage des montants

4. **Graphique (`EvolutionChart.tsx`)**
   - Utilise `recharts` pour visualiser l'évolution
   - Props:
     - `data`: Données mensuelles
     - `isLoading`: État de chargement
     - `comparisonData`: Données de comparaison
   - Fonctionnalités:
     - Graphique en aires
     - Tooltip personnalisé avec comparaisons
     - Animation de chargement des données
     - Axes formatés (dates et montants)

5. **Distribution (`EvolutionDistribution.tsx`)**
   - Affiche la répartition des dépenses/revenus
   - Props:
     - `showAllSubcategories`: boolean
   - Fonctionnalités:
     - Vue par catégories avec sous-catégories extensibles
     - Vue "Top 9" des sous-catégories + "Autres"
     - Barres de progression animées
     - Calcul des pourcentages globaux et locaux
   - Structure des données:
     ```typescript
     interface Category {
       id: string
       name: string
       amount: number
       percentage: number
       subcategories: {
         id: string
         name: string
         amount: number
         percentage: number
         globalPercentage: number
         categoryName: string
       }[]
     }
     ```

## Composants UI Réutilisables

- `Tabs`: Navigation entre les vues actuelles et planifiées
  - Durée d'animation: 200ms
  - Styles personnalisés pour l'état actif

- `ScrollArea`: Zone de défilement pour la distribution
  - Hauteur dynamique
  - Défilement fluide

## Gestion des Données

1. **Supabase**
   - Table principale: `transactions_with_refunds`
   - Requêtes:
     - Filtrage par année
     - Agrégation par mois
     - Calcul des totaux par catégorie

2. **Format des Données**
   ```typescript
   interface MonthlyData {
     month: string
     income: number
     expenses: number
   }
   ```

## Styles et Animations

1. **Graphique**
   - Couleurs:
     - Revenus: `hsl(var(--primary))`
     - Dépenses: `hsl(var(--destructive))`
   - Opacité des aires: 0.1
   - Épaisseur des lignes: 1.5px

2. **Distribution**
   - Barres de progression:
     - Hauteur: 1.5px (sous-catégories) / 2px (catégories)
     - Animation: 1000ms ease-out
     - Délai progressif: 100ms par élément
   - Texte:
     - Catégories: text-sm
     - Sous-catégories: text-xs
     - Pourcentages: text-muted-foreground

## Bonnes Pratiques

1. **Performance**
   - Utilisation de `useMemo` pour les calculs coûteux
   - Chargement asynchrone des données
   - Animations optimisées avec CSS

2. **UX**
   - Feedback immédiat lors des changements d'année
   - Animations progressives pour la visualisation des données
   - Cohérence des styles avec le reste de l'application

3. **État**
   - État global minimal dans `EvolutionPage`
   - Props pour la communication descendante
   - Gestion locale des états d'UI (expansion, survol)

4. **Types**
   - Interfaces strictes pour toutes les props
   - Types pour les données Supabase
   - Documentation des structures de données 