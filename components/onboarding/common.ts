/**
 * Constantes et types communs pour le processus d'onboarding
 */

// Enum pour les étapes du tour d'onboarding
export enum Step {
  OnboardingGeneral = 0,
  OnboardingCategories = 1,
  FinalStep = 2
}

// Titres des étapes du tour d'onboarding
export const tour = [
  "Initialisation des données",
  "Configuration des catégories", 
  "Finalisation"
]; 