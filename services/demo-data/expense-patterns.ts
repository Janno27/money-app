import { ExpensePattern } from './types';

/**
 * Modèles de dépenses pour la génération de données de démonstration
 * Chaque modèle représente un type de dépense récurrente avec ses caractéristiques
 */
export const EXPENSE_PATTERNS: ExpensePattern[] = [
  // LOGEMENT
  {
    name: "Loyer",
    description: "Loyer mensuel",
    category: "Logement",
    subcategory: "Loyer",
    frequency: "monthly",
    dayOfMonth: 5,
    variance: 0, // Pas de variance pour le loyer
    amount: { min: 1200, max: 1200 },
    expenseType: "couple"
  },
  {
    name: "Électricité",
    description: "Facture EDF",
    category: "Logement",
    subcategory: "Électricité",
    frequency: "bimonthly",
    dayOfMonth: 15,
    variance: 3,
    amount: { min: 70, max: 120 },
    seasonalMultiplier: { winter: 1.5, summer: 0.7 }, // Plus cher en hiver
    expenseType: "couple"
  },
  {
    name: "Internet",
    description: "Abonnement fibre Free",
    category: "Logement",
    subcategory: "Internet",
    frequency: "monthly",
    dayOfMonth: 12,
    variance: 1,
    amount: { min: 39.99, max: 39.99 },
    expenseType: "couple"
  },
  {
    name: "Assurance habitation",
    description: "Assurance habitation AXA",
    category: "Logement",
    subcategory: "Assurance",
    frequency: "monthly",
    dayOfMonth: 8,
    variance: 1,
    amount: { min: 25, max: 25 },
    expenseType: "couple"
  },
  {
    name: "Réparations",
    description: "Réparations diverses",
    category: "Logement",
    subcategory: "Réparations",
    frequency: "random",
    oddsPerMonth: 0.5, // Environ une fois tous les deux mois
    amount: { min: 20, max: 150 },
    expenseType: "couple"
  },
  {
    name: "Meubles",
    description: "Achat meubles",
    category: "Logement",
    subcategory: "Meubles",
    frequency: "random",
    oddsPerYear: 4, // Environ 4 fois par an
    amount: { min: 50, max: 300 },
    expenseType: "couple",
    refundProbability: 0.3 // 30% de chance de remboursement
  },

  // ALIMENTATION
  {
    name: "Supermarché",
    description: "Courses alimentaires",
    category: "Alimentation",
    subcategory: "Supermarché",
    frequency: "weekly",
    dayOfWeek: 6, // Samedi
    variance: 1,
    amount: { min: 60, max: 120 },
    expenseType: "couple",
    refundProbability: 0.5 // 50% de chance de remboursement
  },
  {
    name: "Restaurant",
    description: "Sorties restaurant",
    category: "Alimentation",
    subcategory: "Restaurant",
    frequency: "biweekly",
    variance: 2,
    amount: { min: 40, max: 90 },
    expenseType: "couple"
  },
  {
    name: "Livraison repas",
    description: "Uber Eats",
    category: "Alimentation",
    subcategory: "Livraison",
    frequency: "weekly",
    dayOfWeek: 5, // Vendredi soir
    variance: 2,
    amount: { min: 25, max: 45 },
    expenseType: "couple"
  },
  {
    name: "Café",
    description: "Pause café",
    category: "Alimentation",
    subcategory: "Café",
    frequency: "workdays",
    probability: 0.6, // 60% des jours de travail
    amount: { min: 2.5, max: 5.5 },
    expenseType: "individual"
  },

  // TRANSPORT
  {
    name: "Transports en commun",
    description: "Navigo mensuel",
    category: "Transport",
    subcategory: "Transports en commun",
    frequency: "monthly",
    dayOfMonth: 3,
    variance: 2,
    amount: { min: 75.20, max: 75.20 },
    expenseType: "individual"
  },
  {
    name: "Essence",
    description: "Carburant",
    category: "Transport",
    subcategory: "Carburant",
    frequency: "biweekly",
    variance: 3,
    amount: { min: 40, max: 70 },
    seasonalMultiplier: { summer: 1.3 }, // Plus en été pour les vacances
    expenseType: "couple"
  },
  {
    name: "Entretien voiture",
    description: "Révision voiture",
    category: "Transport",
    subcategory: "Entretien",
    frequency: "random",
    oddsPerYear: 2, // Environ 2 fois par an
    amount: { min: 120, max: 350 },
    expenseType: "couple"
  },
  {
    name: "Péage",
    description: "Péage autoroute",
    category: "Transport",
    subcategory: "Péage",
    frequency: "random",
    oddsPerMonth: 1, // Environ 1 fois par mois
    amount: { min: 8, max: 30 },
    seasonalMultiplier: { summer: 2.0 }, // Beaucoup plus en été
    expenseType: "couple"
  },
  {
    name: "Taxi/VTC",
    description: "Uber",
    category: "Transport",
    subcategory: "Taxi/VTC",
    frequency: "biweekly",
    variance: 4,
    amount: { min: 15, max: 35 },
    expenseType: "individual",
    refundProbability: 0.2 // 20% de chance de remboursement
  },

  // SANTÉ
  {
    name: "Médecin généraliste",
    description: "Consultation médecin",
    category: "Santé",
    subcategory: "Consultation",
    frequency: "random",
    oddsPerMonth: 0.8, // Environ 0.8 fois par mois
    amount: { min: 25, max: 30 },
    expenseType: "individual",
    refundProbability: 0.9 // 90% de chance de remboursement
  },
  {
    name: "Pharmacie",
    description: "Médicaments",
    category: "Santé",
    subcategory: "Pharmacie",
    frequency: "random",
    oddsPerMonth: 1.5, // Environ 1.5 fois par mois
    amount: { min: 10, max: 50 },
    seasonalMultiplier: { winter: 1.4 }, // Plus en hiver
    expenseType: "individual",
    refundProbability: 0.7 // 70% de chance de remboursement
  },
  {
    name: "Dentiste",
    description: "Soins dentaires",
    category: "Santé",
    subcategory: "Dentiste",
    frequency: "random",
    oddsPerYear: 2, // Environ 2 fois par an
    amount: { min: 70, max: 300 },
    expenseType: "individual",
    refundProbability: 0.8 // 80% de chance de remboursement
  },
  {
    name: "Optique",
    description: "Lunettes/Lentilles",
    category: "Santé",
    subcategory: "Optique",
    frequency: "random",
    oddsPerYear: 1, // Environ 1 fois par an
    amount: { min: 150, max: 400 },
    expenseType: "individual",
    refundProbability: 0.6 // 60% de chance de remboursement
  },

  // LOISIRS
  {
    name: "Cinéma",
    description: "Séance cinéma",
    category: "Loisirs",
    subcategory: "Cinéma",
    frequency: "biweekly",
    variance: 4,
    amount: { min: 10, max: 25 },
    expenseType: "couple"
  },
  {
    name: "Abonnements",
    description: "Netflix",
    category: "Loisirs",
    subcategory: "Abonnements",
    frequency: "monthly",
    dayOfMonth: 15,
    variance: 1,
    amount: { min: 13.49, max: 13.49 },
    expenseType: "couple"
  },
  {
    name: "Abonnements",
    description: "Spotify",
    category: "Loisirs",
    subcategory: "Abonnements",
    frequency: "monthly",
    dayOfMonth: 10,
    variance: 1,
    amount: { min: 9.99, max: 9.99 },
    expenseType: "individual"
  },
  {
    name: "Sport",
    description: "Abonnement salle de sport",
    category: "Loisirs",
    subcategory: "Sport",
    frequency: "monthly",
    dayOfMonth: 5,
    variance: 1,
    amount: { min: 35, max: 35 },
    expenseType: "individual"
  },
  {
    name: "Livres",
    description: "Achat livres",
    category: "Loisirs",
    subcategory: "Livres",
    frequency: "random",
    oddsPerMonth: 1.5, // Environ 1.5 fois par mois
    amount: { min: 10, max: 35 },
    expenseType: "individual"
  },
  {
    name: "Concert",
    description: "Billets concert",
    category: "Loisirs",
    subcategory: "Sorties",
    frequency: "random",
    oddsPerMonth: 0.5, // Environ une fois tous les deux mois
    amount: { min: 30, max: 80 },
    expenseType: "couple"
  },

  // SHOPPING
  {
    name: "Vêtements",
    description: "Achat vêtements",
    category: "Shopping",
    subcategory: "Vêtements",
    frequency: "random",
    oddsPerMonth: 2, // Environ 2 fois par mois
    amount: { min: 20, max: 120 },
    seasonalMultiplier: { spring: 1.3, autumn: 1.3 }, // Plus au changement de saison
    expenseType: "individual"
  },
  {
    name: "Chaussures",
    description: "Achat chaussures",
    category: "Shopping",
    subcategory: "Chaussures",
    frequency: "random",
    oddsPerMonth: 0.5, // Environ une fois tous les deux mois
    amount: { min: 60, max: 150 },
    expenseType: "individual"
  },
  {
    name: "Électronique",
    description: "Achats tech",
    category: "Shopping",
    subcategory: "Électronique",
    frequency: "random",
    oddsPerYear: 4, // Environ 4 fois par an
    amount: { min: 50, max: 250 },
    expenseType: "individual"
  },
  {
    name: "Cadeaux",
    description: "Cadeaux",
    category: "Shopping",
    subcategory: "Cadeaux",
    frequency: "random",
    oddsPerMonth: 1, // Environ 1 fois par mois
    amount: { min: 20, max: 100 },
    seasonalMultiplier: { winter: 2.0 }, // Beaucoup plus en hiver (Noël)
    expenseType: "individual"
  },

  // VOYAGES
  {
    name: "Hôtel",
    description: "Réservation hôtel",
    category: "Voyages",
    subcategory: "Hébergement",
    frequency: "random",
    oddsPerYear: 6, // Environ 6 fois par an
    amount: { min: 80, max: 250 },
    seasonalMultiplier: { summer: 1.5, winter: 1.3 }, // Plus en été et en hiver
    expenseType: "couple",
    refundProbability: 0.3 // 30% de chance de remboursement
  },
  {
    name: "Avion",
    description: "Billets d'avion",
    category: "Voyages",
    subcategory: "Transport",
    frequency: "random",
    oddsPerYear: 4, // Environ 4 fois par an
    amount: { min: 100, max: 400 },
    seasonalMultiplier: { summer: 1.5 }, // Plus en été
    expenseType: "individual",
    refundProbability: 0.4 // 40% de chance de remboursement
  },
  {
    name: "Activités touristiques",
    description: "Visites et activités",
    category: "Voyages",
    subcategory: "Activités",
    frequency: "random",
    oddsPerYear: 10, // Environ 10 fois par an
    amount: { min: 15, max: 80 },
    seasonalMultiplier: { summer: 1.8, winter: 1.4 }, // Beaucoup plus en été et en hiver
    expenseType: "couple"
  },

  // FRAIS BANCAIRES
  {
    name: "Frais bancaires",
    description: "Frais de tenue de compte",
    category: "Frais bancaires",
    subcategory: "Frais bancaires",
    frequency: "monthly",
    dayOfMonth: 2,
    variance: 0,
    amount: { min: 6.50, max: 6.50 },
    expenseType: "individual"
  },
  {
    name: "Assurance moyens de paiement",
    description: "Assurance CB",
    category: "Frais bancaires",
    subcategory: "Assurance",
    frequency: "yearly",
    amount: { min: 30, max: 30 },
    expenseType: "individual"
  },

  // AUTRES
  {
    name: "Dons",
    description: "Don association",
    category: "Autres",
    subcategory: "Dons",
    frequency: "random",
    oddsPerMonth: 0.5, // Environ une fois tous les deux mois
    amount: { min: 10, max: 50 },
    expenseType: "individual"
  },
  {
    name: "Impôts sur le revenu",
    description: "Impôts sur le revenu",
    category: "Autres",
    subcategory: "Impôts",
    frequency: "monthly",
    dayOfMonth: 15,
    variance: 1,
    amount: { min: 250, max: 300 },
    expenseType: "individual"
  },
  {
    name: "Taxe d'habitation",
    description: "Taxe d'habitation",
    category: "Autres",
    subcategory: "Impôts",
    frequency: "yearly",
    amount: { min: 400, max: 450 },
    expenseType: "couple"
  }
]; 