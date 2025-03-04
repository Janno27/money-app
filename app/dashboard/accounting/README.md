# Module de Comptabilité

## Structure des Fichiers

```
app/dashboard/accounting/
├── page.tsx           # Point d'entrée du module
├── README.md         # Documentation
components/@components/
├── AccountingPage.tsx       # Composant principal
├── AccountingHeader.tsx     # En-tête de la page
├── AccountingFilters.tsx    # Filtres de recherche et date
└── AccountingGridView.tsx   # Vue en grille des données

components/transactions/
├── drawer-transactions-table.tsx  # Table des transactions dans le drawer
├── add-transaction-dialog.tsx     # Dialog d'ajout de transaction
├── edit-transaction-dialog.tsx    # Dialog de modification
└── columns.tsx                    # Définition des colonnes
```

## Flux des Données

1. **Point d'Entrée (`page.tsx`)**
   - Route principale du module de comptabilité
   - Intègre le `SidebarProvider` et l'`AppSidebar`
   - Contient le fil d'Ariane (Breadcrumb)
   - Charge le composant `AccountingPage`

2. **Composant Principal (`AccountingPage.tsx`)**
   - Gère l'état global de la page
   - États:
     - `searchQuery`: Terme de recherche pour la grille principale
     - `dateRange`: Période sélectionnée
     - `isAddExpenseDialogOpen`: État du dialog d'ajout de dépense
     - `isAddIncomeDialogOpen`: État du dialog d'ajout de revenu
   - Intègre les onglets (Tabs) pour basculer entre dépenses et revenus
   - Structure:
     ```jsx
     <AccountingHeader />
     <Tabs>
       <AccountingFilters />
       <AccountingGridView />
     </Tabs>
     <AddTransactionDialog />
     ```

3. **Filtres (`AccountingFilters.tsx`)**
   - Barre de recherche principale (impacte uniquement `AccountingGridView`)
   - Sélecteur de période
   - Intègre un Sheet (drawer) pour afficher les transactions
   - Props:
     - `onSearchChange`: (value: string) => void
     - `onDateRangeChange`: (range: { from: Date, to: Date }) => void
     - `onRefresh`: () => void
     - `onToggleAllCategories`: () => void

4. **Table des Transactions (`drawer-transactions-table.tsx`)**
   - Système de recherche indépendant
   - État local:
     - `localSearchQuery`: Terme de recherche spécifique au drawer
     - `dateRange`: Filtre de date local
   - Filtrage local sur:
     - Description de la transaction
     - Nom de la catégorie
     - Nom de la sous-catégorie
   - Fonctionnalités:
     - Tri par colonnes
     - Filtrage par catégorie via menu déroulant
     - Actions contextuelles (modification/suppression)
     - Pagination
   - Performance:
     - Utilisation de `useMemo` pour le filtrage des transactions
     - Optimisation des re-rendus avec état local

5. **Vue en Grille (`AccountingGridView.tsx`)**
   - Affiche les données en format tableau avec catégories extensibles
   - Utilise le `searchQuery` global de `AccountingPage`
   - Props:
     - `searchQuery`: string
     - `dateRange`: { from: Date, to: Date }
     - `isIncome`: boolean
   - Fonctionnalités:
     - Catégories extensibles (▸/▾)
     - Calcul des totaux par catégorie
     - Indicateurs de variation mois/mois
     - Formatage des montants
   - Structure des données:
     ```typescript
     interface CategoryData {
       id: string
       name: string
       years: Record<string, number>
       months: Record<string, number>
       subcategories: {
         id: string
         name: string
         years: Record<string, number>
         months: Record<string, number>
       }[]
     }
     ```

## Composants UI Réutilisables

- `Sheet`: Remplace le Drawer, utilisé pour les vues latérales
  - Durée d'animation: 1000ms
  - Position: droite
  - Largeur: 2/3 de l'écran

- `MonthRangePicker`: Sélecteur de période personnalisé
  - Format: MMM YYYY - MMM YYYY
  - Support de la sélection de plage

## Gestion des Données

1. **Supabase**
   - Table principale: `transactions_with_refunds`
   - Relations:
     - categories
     - subcategories
     - users

2. **Format des Transactions**
   ```typescript
   interface Transaction {
     id: string
     amount: number
     description: string
     transaction_date: string
     accounting_date: string
     category_id: string
     subcategory_id: string
     user_id: string
     expense_type: 'individual' | 'couple'
     is_income: boolean
     split_ratio: number
     refunded_amount: number
     final_amount: number
     // Relations
     category: { id: string; name: string }
     subcategory?: { id: string; name: string }
     user: { id: string; name: string; avatar: string }
   }
   ```

## Styles et Thème

- Utilisation de Tailwind CSS
- Support du mode sombre via `ThemeProvider`
- Classes communes:
  - Conteneurs: `space-y-4`, `flex-1`
  - Grille: `grid grid-cols-[250px_1fr]`
  - Texte: `text-muted-foreground`, `font-medium`

## Modification des Composants

1. **Ajouter une Colonne**
   - Modifier `columns.tsx`
   - Ajouter la définition dans `ColumnDef[]`
   - Mettre à jour l'interface `Transaction` si nécessaire

2. **Modifier les Filtres**
   - Éditer `AccountingFilters.tsx`
   - Ajouter/modifier les props dans `AccountingFiltersProps`
   - Mettre à jour le composant parent `AccountingPage.tsx`

3. **Personnaliser l'Affichage**
   - Les styles sont principalement dans les composants individuels
   - Utiliser `cn()` pour combiner les classes Tailwind
   - Modifier les animations via les classes `duration-*`

## Bonnes Pratiques

1. **Gestion des États**
   - États locaux pour les composants autonomes (ex: recherche dans le drawer)
   - États globaux pour les fonctionnalités partagées
   - Séparation claire des responsabilités de recherche/filtrage

2. **Performance**
   - Utilisation de `useMemo` pour les calculs coûteux
   - Filtrage optimisé avec états locaux
   - Évitement des re-rendus inutiles

3. **UX**
   - Recherche indépendante dans le drawer pour une meilleure expérience utilisateur
   - Feedback immédiat lors des actions de filtrage
   - Cohérence dans l'interface tout en maintenant l'indépendance des composants

4. **État**
   - Centraliser la gestion d'état dans `AccountingPage`
   - Utiliser les props pour la communication descendante
   - Implémenter les callbacks pour la communication ascendante

5. **Types**
   - Maintenir les interfaces à jour
   - Utiliser des types stricts pour les props
   - Documenter les changements d'interface 