# Module d'Onboarding

Ce document détaille le fonctionnement du module d'onboarding, son architecture technique, son flux de données avec Supabase, et son système de design.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture et composants](#architecture-et-composants)
3. [Flux de données](#flux-de-données)
4. [Étapes d'onboarding](#étapes-donboarding)
5. [Interaction avec Supabase](#interaction-avec-supabase)
6. [Système de design](#système-de-design)
7. [Extension à d'autres parties de l'application](#extension-à-dautres-parties-de-lapplication)

## Vue d'ensemble

Le module d'onboarding est conçu pour guider les nouveaux utilisateurs à travers les premières étapes d'utilisation de l'application et pour présenter de nouvelles fonctionnalités aux utilisateurs existants. Il propose deux types d'onboarding :

- **Onboarding pour nouveaux utilisateurs** : Guide complet pour les nouveaux utilisateurs
- **Onboarding de nouvelles fonctionnalités** : Présentation de nouvelles fonctionnalités pour les utilisateurs existants

Le système est entièrement intégré à Supabase pour stocker les préférences utilisateur et l'état de progression de l'onboarding.

## Architecture et composants

### Composants principaux

- `OnboardingProvider` : Composant racine qui gère l'état global de l'onboarding et injecte les composants appropriés en fonction du contexte
- `OnboardingTour` : Gère la navigation entre les différentes étapes du tour d'onboarding
- `OnboardingGeneral` : Composant principal pour l'onboarding général, avec initialisation des données
- `OnboardingCategories` : Gère la configuration des catégories
- `OnboardingFeature` : Présente les nouvelles fonctionnalités aux utilisateurs existants

### Hooks

- `useOnboarding` : Hook personnalisé qui gère la logique d'onboarding, notamment :
  - Vérification de l'état d'onboarding
  - Navigation entre les étapes
  - Enregistrement de la progression
  - Gestion des préférences utilisateur

### Flux de contrôle

```
OnboardingProvider
└── Détecte si l'onboarding est nécessaire
    ├── Si oui → Injecte le composant d'onboarding approprié
    │   ├── OnboardingGeneral (nouveaux utilisateurs)
    │   └── OnboardingFeature (nouvelles fonctionnalités)
    └── Si non → N'affiche rien
```

## Flux de données

1. **Initialisation** :
   - Vérification de la session utilisateur via Supabase
   - Récupération des préférences d'onboarding depuis la table `user_preferences`
   - Détermination du type d'onboarding à afficher

2. **Pendant l'onboarding** :
   - Génération des données de démonstration via `demo-data-generator.ts`
   - Création de catégories et transactions par défaut
   - Stockage des préférences utilisateur (thème, etc.)

3. **Finalisation** :
   - Mise à jour de la table `user_preferences` dans Supabase
   - Marquage de l'onboarding comme complété
   - Enregistrement des préférences finales de l'utilisateur

## Étapes d'onboarding

### Pour les nouveaux utilisateurs

1. **Accueil et initialisation** :
   - Présentation de l'application
   - Choix du thème (clair/sombre)
   - Animation d'initialisation des données

2. **Configuration des catégories** :
   - Vérification ou création des catégories par défaut
   - Possibilité d'importer des données existantes
   - Option pour générer des données de démonstration

3. **Finalisation** :
   - Tour des fonctionnalités principales
   - Conseils d'utilisation
   - Confirmation de fin d'onboarding

### Pour les nouvelles fonctionnalités

1. **Présentation de la fonctionnalité** :
   - Affichage du contexte et de l'utilité
   - Visualisation d'exemples d'utilisation

2. **Tour guidé interactif** :
   - Explications étape par étape
   - Possibilité d'interagir avec les nouvelles fonctionnalités

3. **Confirmation** :
   - Récapitulatif des avantages
   - Option pour ne plus afficher cet onboarding

## Interaction avec Supabase

### Tables utilisées

1. **user_preferences** :
   - `user_id` : ID de l'utilisateur
   - `completed_onboarding` : Boolean indiquant si l'onboarding initial est complété
   - `completed_feature_releases` : Array de versions pour lesquelles l'onboarding a été complété
   - `theme` : Préférence de thème (clair/sombre)

2. **categories** et **subcategories** :
   - Tables utilisées pour configurer les catégories par défaut

3. **transactions** :
   - Table recevant les transactions de démonstration

### Requêtes principales

```typescript
// Vérification de l'état d'onboarding
const { data } = await supabase
  .from('user_preferences')
  .select('completed_onboarding, completed_feature_releases')
  .eq('user_id', session.user.id)
  .single();

// Marquer l'onboarding comme complété
await supabase
  .from('user_preferences')
  .upsert({
    user_id: session.user.id,
    completed_onboarding: true
  });

// Enregistrer une version de fonctionnalité comme vue
await supabase
  .from('user_preferences')
  .upsert({
    user_id: session.user.id,
    completed_feature_releases: [...completedReleases, appVersion]
  });
```

## Système de design

### Palette de couleurs

Le système utilise les variables CSS de Tailwind pour garantir la cohérence des couleurs :

- **Couleurs primaires** :
  - Bleu principal : `hsl(var(--primary))` (#3b82f6)
  - Bleu clair : `hsl(var(--primary-foreground))` (#f8fafc)

- **Couleurs sémantiques** :
  - Succès : Vert (#22c55e)
  - Information : Bleu (#3b82f6)
  - Alerte : Orange (#f97316)
  - Erreur : Rouge (#ef4444)

- **Thème sombre** :
  - Arrière-plan : `hsl(var(--background))` (#020817)
  - Premier plan : `hsl(var(--foreground))` (#f8fafc)
  - Cartes : `hsl(var(--card))` (#1e293b)

- **Thème clair** :
  - Arrière-plan : `hsl(var(--background))` (#ffffff)
  - Premier plan : `hsl(var(--foreground))` (#020817)
  - Cartes : `hsl(var(--card))` (#f8fafc)

### Composants UI

1. **Cartes et conteneurs** :
   - Bordures arrondies : `rounded-xl`
   - Ombres légères : `shadow-sm`
   - Marges intérieures : `p-4` à `p-6`

2. **Typographie** :
   - Titres : `text-lg` à `text-3xl`, `font-medium` ou `font-semibold`
   - Corps de texte : `text-sm` à `text-base`
   - Couleurs de texte :
     - Principal : `text-foreground`
     - Secondaire : `text-muted-foreground`

3. **Boutons** :
   - Primaire : `bg-primary text-primary-foreground`
   - Secondaire : `bg-secondary text-secondary-foreground`
   - Outline : `border border-input bg-background`

4. **Animations** :
   - Transitions douces : `transition-all duration-300`
   - Animations de chargement : `animate-spin`, `animate-pulse`
   - Animations personnalisées : `animate-firework`

### Gestion des thèmes

Le thème est géré via la classe CSS `dark` ajoutée au niveau du HTML :

```typescript
// Appliquer le thème
const applyTheme = (selectedTheme: 'light' | 'dark') => {
  if (selectedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Sauvegarder la préférence
  localStorage.setItem('theme', selectedTheme);
};
```

Les variables CSS sont définies dans le fichier `globals.css` et utilisent le préfixe `--` pour les variables de base et sont appliquées via Tailwind.

## Extension à d'autres parties de l'application

Pour appliquer le même design à d'autres parties de l'application, suivez ces principes :

1. **Structure des composants** :
   - Utilisez une hiérarchie claire de composants
   - Séparez la logique (hooks) de la présentation (composants UI)
   - Utilisez les props pour la personnalisation plutôt que des états globaux

2. **Cohérence visuelle** :
   - Respectez la palette de couleurs définie
   - Utilisez les mêmes espacements et rayons de bordure
   - Maintenez une hiérarchie typographique cohérente

3. **Réutilisation des composants** :
   - Exploitez les composants UI existants comme `IconButton`, `Button`
   - Utilisez les mêmes animations et transitions
   - Appliquez les mêmes patterns pour les formulaires et les contrôles

4. **Gestion des thèmes** :
   - Utilisez systématiquement `className={cn(...)}` pour les conditions liées au thème
   - Évitez les couleurs codées en dur et préférez les variables CSS
   - Testez toujours en mode clair ET sombre

En suivant ces directives, le reste de l'application bénéficiera d'une expérience utilisateur cohérente et d'une qualité visuelle équivalente à celle de l'onboarding. 