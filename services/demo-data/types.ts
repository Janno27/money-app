/**
 * Types et interfaces pour le générateur de données de démonstration
 */

// Types d'enregistrement des dépenses (individuel ou couple)
export type ExpenseType = 'individual' | 'couple';

// Fréquences possibles pour les transactions
export type TransactionFrequency = 
  | 'daily' 
  | 'workdays' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'yearly' 
  | 'random';

// Fourchette de montants
export interface AmountRange {
  min: number;
  max: number;
}

// Multiplicateurs saisonniers
export interface SeasonalMultiplier {
  winter?: number;
  spring?: number;
  summer?: number;
  autumn?: number;
}

// Interface pour les modèles de dépenses
export interface ExpensePattern {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  frequency: TransactionFrequency;
  amount: AmountRange;
  expenseType: ExpenseType;
  
  // Propriétés optionnelles selon la fréquence
  dayOfMonth?: number;        // Pour monthly/bimonthly
  dayOfWeek?: number;         // Pour weekly (0-6, dimanche-samedi)
  variance?: number;          // Nombre de jours de variance
  probability?: number;       // Pour workdays, probabilité par jour
  oddsPerWeek?: number;       // Pour random, probabilité par semaine
  oddsPerMonth?: number;      // Pour random, probabilité par mois
  oddsPerYear?: number;       // Pour random, probabilité par an
  
  // Propriétés optionnelles pour effets saisonniers et remboursements
  seasonalMultiplier?: SeasonalMultiplier;
  refundProbability?: number; // Probabilité de remboursement
}

// Interface pour les modèles de revenus
export interface IncomePattern {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  frequency: TransactionFrequency;
  amount: AmountRange;
  
  // Propriétés optionnelles selon la fréquence
  dayOfMonth?: number;        // Pour monthly
  variance?: number;          // Nombre de jours de variance
  oddsPerMonth?: number;      // Pour random, probabilité par mois
  oddsPerYear?: number;       // Pour random, probabilité par an
}

// Interface pour les transactions générées
export interface GeneratedTransaction {
  amount: number;
  description: string;
  transaction_date: string;
  accounting_date: string;
  category_id: string;
  subcategory_id: string | null;
  user_id: string;
  expense_type: ExpenseType;
  is_income: boolean;
  organization_id: string;
}

// Interface pour les remboursements générés
export interface GeneratedRefund {
  transaction_id: string;
  amount: number;
  refund_date: string;
  description: string;
  user_id: string;
  organization_id: string;
}

// Configuration pour le générateur
export interface GenerationConfig {
  startDate: Date;
  endDate: Date;
  users: { id: string; name: string }[];
  organization_id: string;
  categoryMap: Map<string, {
    id: string;
    subcategories: Map<string, string>;
  }>;
}

// Résultats de la génération
export interface GenerationResults {
  transactions: GeneratedTransaction[];
} 