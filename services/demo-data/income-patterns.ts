import { IncomePattern } from './types';

/**
 * Modèles de revenus pour la génération de données de démonstration
 * Chaque modèle représente un type de revenu récurrent avec ses caractéristiques
 */
export const INCOME_PATTERNS: IncomePattern[] = [
  // REVENUS RÉGULIERS
  {
    name: "Salaire principal",
    description: "Salaire mensuel",
    category: "Revenus",
    subcategory: "Salaire",
    frequency: "monthly",
    dayOfMonth: 25, // Virement le 25 du mois
    variance: 0, // Pas de variance pour le salaire
    amount: { min: 2500, max: 2800 } // Légère variation selon les mois (heures supp, etc.)
  },
  {
    name: "Salaire secondaire",
    description: "Salaire conjoint",
    category: "Revenus",
    subcategory: "Salaire",
    frequency: "monthly",
    dayOfMonth: 28, // Virement en fin de mois
    variance: 0, // Pas de variance pour le salaire
    amount: { min: 2100, max: 2300 } // Légère variation selon les mois
  },
  {
    name: "Coverflex",
    description: "Tickets restaurant",
    category: "Revenus",
    subcategory: "Avantages",
    frequency: "monthly",
    dayOfMonth: 10,
    variance: 1,
    amount: { min: 160, max: 180 } // Variation selon les jours travaillés
  },

  // REVENUS EXCEPTIONNELS
  {
    name: "Prime annuelle",
    description: "Prime de fin d'année",
    category: "Revenus",
    subcategory: "Prime",
    frequency: "yearly", // Une fois par an
    amount: { min: 1800, max: 2500 } // Montant variable selon la performance
  },
  {
    name: "Vente occasion",
    description: "Vente Le Bon Coin",
    category: "Revenus",
    subcategory: "Vente",
    frequency: "random",
    oddsPerMonth: 0.4, // Environ une fois tous les 2-3 mois
    amount: { min: 20, max: 150 } // Montant très variable selon l'objet vendu
  },
  {
    name: "Cadeau anniversaire",
    description: "Cadeau argent anniversaire",
    category: "Revenus",
    subcategory: "Cadeaux",
    frequency: "random",
    oddsPerYear: 2, // Environ 2 fois par an
    amount: { min: 50, max: 200 } // Montant variable selon le donateur
  }
]; 