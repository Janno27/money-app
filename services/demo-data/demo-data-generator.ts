import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, addDays, subDays, differenceInDays, isWeekend, getMonth, getDate, getDay } from 'date-fns';
import { 
  ExpensePattern, IncomePattern, GeneratedTransaction, 
  GeneratedRefund, GenerationConfig, GenerationResults, ExpenseType 
} from './types';
import { EXPENSE_PATTERNS } from './expense-patterns';
import { INCOME_PATTERNS } from './income-patterns';

// Générateur de données de démonstration
export class DemoDataGenerator {
  private supabase = createClientComponentClient();
  private config: GenerationConfig | null = null;
  private transactionIds: string[] = [];

  // Méthode principale pour générer les données de démonstration
  public async generateDemoData(): Promise<boolean> {
    try {
      // Récupérer les informations nécessaires
      await this.initializeConfig();
      
      if (!this.config) {
        console.error("Impossible d'initialiser la configuration");
        return false;
      }

      // Générer les transactions et remboursements
      const results = this.generateTransactions();
      
      // Insérer les données dans la base de données
      await this.insertTransactions(results.transactions);
      await this.insertRefunds(results.refunds);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération des données de démonstration:", error);
      return false;
    }
  }

  // Initialiser la configuration avec les données nécessaires
  private async initializeConfig(): Promise<void> {
    try {
      // Récupérer la session utilisateur
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) throw new Error("Utilisateur non connecté");

      // Récupérer les informations de l'organisation
      const { data: userData } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!userData?.organization_id) {
        throw new Error("Aucune organisation associée à cet utilisateur");
      }

      // Récupérer les utilisateurs de l'organisation
      const { data: users } = await this.supabase
        .from('users')
        .select('id, name')
        .eq('organization_id', userData.organization_id);

      if (!users || users.length === 0) {
        throw new Error("Aucun utilisateur trouvé dans l'organisation");
      }

      // Récupérer les catégories
      const { data: categories } = await this.supabase
        .from('categories')
        .select('id, name, type');

      if (!categories || categories.length === 0) {
        throw new Error("Aucune catégorie trouvée");
      }

      // Récupérer les sous-catégories
      const { data: subcategories } = await this.supabase
        .from('subcategories')
        .select('id, name, category_id');

      if (!subcategories) {
        throw new Error("Impossible de récupérer les sous-catégories");
      }

      // Créer une map des catégories et sous-catégories
      const categoryMap = new Map();
      
      categories.forEach(category => {
        const subcategoryMap = new Map();
        
        // Trouver toutes les sous-catégories pour cette catégorie
        const relatedSubcategories = subcategories.filter(
          sub => sub.category_id === category.id
        );
        
        relatedSubcategories.forEach(sub => {
          subcategoryMap.set(sub.name, sub.id);
        });
        
        categoryMap.set(category.name, {
          id: category.id,
          subcategories: subcategoryMap
        });
      });

      // Définir la configuration
      this.config = {
        startDate: new Date(2024, 0, 1), // 1er janvier 2024
        endDate: new Date(), // Aujourd'hui
        users,
        organization_id: userData.organization_id,
        categoryMap
      };
      
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la configuration:", error);
      throw error;
    }
  }

  // Générer les transactions et remboursements
  private generateTransactions(): GenerationResults {
    if (!this.config) {
      throw new Error("Configuration non initialisée");
    }

    const transactions: GeneratedTransaction[] = [];
    const refunds: GeneratedRefund[] = [];
    
    // Toujours générer les revenus réguliers en premier
    this.generateRevenusReguliers(transactions);
    
    // Générer les revenus exceptionnels
    this.generateRevenusExceptionnels(transactions);
    
    // Générer tous les revenus (garantie complète)
    this.generateIncomeTransactions(transactions);
    
    // Générer les dépenses essentielles (garanties chaque mois)
    this.generateDepensesEssentielles(transactions);
    
    // Générer les autres dépenses variables
    this.generateExpenseTransactions(transactions, refunds);

    return {
      transactions,
      refunds
    };
  }

  // Garantir les revenus réguliers (salaires, etc.)
  private generateRevenusReguliers(transactions: GeneratedTransaction[]): void {
    if (!this.config) return;
    
    const { startDate, endDate, users, organization_id, categoryMap } = this.config;
    
    // Filtrer uniquement les revenus réguliers (salaires et avantages mensuels)
    const regularIncomes = INCOME_PATTERNS.filter(pattern => 
      pattern.frequency === 'monthly' && 
      (pattern.subcategory === 'Salaire' || pattern.subcategory === 'Avantages')
    );
    
    console.log(`Nombre de revenus réguliers trouvés: ${regularIncomes.length}`);
    
    // Pour chaque modèle de revenu régulier
    regularIncomes.forEach(pattern => {
      const categoryInfo = this.findMatchingCategory(categoryMap, pattern.category);
      if (!categoryInfo) {
        console.log(`Catégorie non trouvée pour le revenu: ${pattern.name} (${pattern.category})`);
        return;
      }
      
      const categoryId = categoryInfo.id;
      const subcategoryId = this.findMatchingSubcategory(categoryInfo.subcategories, pattern.subcategory);
      
      if (!subcategoryId) {
        console.log(`Sous-catégorie non trouvée pour le revenu: ${pattern.name} (${pattern.subcategory})`);
      }
      
      // Pour les salaires, assigner à un utilisateur spécifique (alterner si multiples utilisateurs)
      const userId = pattern.name === "Salaire principal" ? users[0].id : 
                    (pattern.name === "Salaire secondaire" && users.length > 1 ? users[1].id : users[0].id);
      
      console.log(`Génération du revenu régulier: ${pattern.name} pour l'utilisateur: ${userId}`);
      
      // Pour chaque mois entre startDate et endDate
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Définir la date du salaire (généralement en fin de mois)
        const transactionDate = new Date(currentDate);
        transactionDate.setDate(pattern.dayOfMonth || 25); // Jour du mois pour le salaire
        
        // Si la date est dans la période valide
        if (transactionDate >= startDate && transactionDate <= endDate) {
          // Générer un montant dans la fourchette avec une légère variance
          const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
          
          // Créer la transaction de salaire
          transactions.push({
            amount: amount,
            description: pattern.description || pattern.name,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            accounting_date: format(transactionDate, 'yyyy-MM-dd'),
            category_id: categoryId,
            subcategory_id: subcategoryId,
            user_id: userId,
            expense_type: 'individual',
            is_income: true,
            organization_id: organization_id
          });
          
          console.log(`Transaction de revenu créée: ${amount}€ le ${format(transactionDate, 'yyyy-MM-dd')}`);
        }
        
        // Passer au mois suivant
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
  }

  // Générer les revenus exceptionnels
  private generateRevenusExceptionnels(transactions: GeneratedTransaction[]): void {
    if (!this.config) return;
    
    // Filtrer les revenus qui ne sont pas mensuels
    const exceptionalIncomes = INCOME_PATTERNS.filter(pattern => 
      pattern.frequency !== 'monthly'
    );
    
    // Utiliser la méthode existante pour générer ces revenus
    exceptionalIncomes.forEach(pattern => {
      const categoryInfo = this.config?.categoryMap.get(pattern.category);
      if (!categoryInfo || !this.config) return;
      
      const categoryId = categoryInfo.id;
      const subcategoryId = categoryInfo.subcategories.get(pattern.subcategory) || null;
      
      // Alterner les utilisateurs
      const userId = this.config.users[Math.floor(Math.random() * this.config.users.length)].id;
      
      if (pattern.frequency === 'yearly') {
        this.generateYearlyTransactions(
          pattern, this.config.startDate, this.config.endDate, userId, categoryId, 
          subcategoryId, this.config.organization_id, true, transactions
        );
      } else if (pattern.frequency === 'random') {
        this.generateRandomTransactions(
          pattern, this.config.startDate, this.config.endDate, userId, categoryId, 
          subcategoryId, this.config.organization_id, true, transactions
        );
      }
    });
  }

  // Garantir les dépenses essentielles chaque mois (loyer, charges fixes, etc.)
  private generateDepensesEssentielles(transactions: GeneratedTransaction[]): void {
    if (!this.config) return;
    
    const { startDate, endDate, users, organization_id, categoryMap } = this.config;
    
    // Liste des catégories et sous-catégories garanties chaque mois
    const essentialExpenses = [
      // Habitat - Loyer (toujours le même montant)
      {
        name: "Loyer",
        description: "Loyer mensuel",
        category: "Habitat",
        subcategory: "Loyer",
        frequency: "monthly",
        dayOfMonth: 5,
        variance: 0,
        amount: { min: 1200, max: 1200 },
        expenseType: "couple" as ExpenseType
      },
      // Services - Abonnements
      {
        name: "Abonnements",
        description: "Netflix",
        category: "Services",
        subcategory: "Abonnements",
        frequency: "monthly",
        dayOfMonth: 15,
        variance: 1,
        amount: { min: 13.49, max: 13.49 },
        expenseType: "couple" as ExpenseType
      },
      // Internet
      {
        name: "Internet",
        description: "Abonnement fibre Free",
        category: "Habitat",
        subcategory: "Internet",
        frequency: "monthly",
        dayOfMonth: 12,
        variance: 1,
        amount: { min: 39.99, max: 39.99 },
        expenseType: "couple" as ExpenseType
      },
      // Assurance habitation
      {
        name: "Assurance habitation",
        description: "Assurance habitation",
        category: "Services",
        subcategory: "Assurance habitation",
        frequency: "monthly",
        dayOfMonth: 8,
        variance: 1,
        amount: { min: 25, max: 25 },
        expenseType: "couple" as ExpenseType
      },
      // Transport en commun
      {
        name: "Transports en commun",
        description: "Navigo mensuel",
        category: "Transport",
        subcategory: "Transport en commun",
        frequency: "monthly",
        dayOfMonth: 3,
        variance: 2,
        amount: { min: 75.20, max: 75.20 },
        expenseType: "individual" as ExpenseType
      }
    ];
    
    // Pour chaque dépense essentielle
    essentialExpenses.forEach(expense => {
      // Trouver les catégories correspondantes dans la base de données
      let categoryInfo = categoryMap.get(expense.category);
      
      // Si on ne trouve pas la catégorie exacte, chercher une correspondance proche
      if (!categoryInfo) {
        // Recherche d'une catégorie similaire
        for (const [catName, catInfo] of categoryMap.entries()) {
          if (catName.includes(expense.category) || expense.category.includes(catName)) {
            categoryInfo = catInfo;
            break;
          }
        }
      }
      
      if (!categoryInfo) {
        console.log(`Catégorie non trouvée pour ${expense.category}`);
        return;
      }
      
      const categoryId = categoryInfo.id;
      
      // Trouver la sous-catégorie
      let subcategoryId: string | null = null;
      const subcategoriesMap = categoryInfo.subcategories;
      
      // Recherche directe ou approximative
      if (subcategoriesMap.has(expense.subcategory)) {
        subcategoryId = subcategoriesMap.get(expense.subcategory) || null;
      } else {
        // Recherche d'une sous-catégorie similaire
        for (const [subName, subId] of subcategoriesMap.entries()) {
          if (subName.includes(expense.subcategory) || expense.subcategory.includes(subName)) {
            subcategoryId = subId;
            break;
          }
        }
      }
      
      // Déterminer l'utilisateur
      let userId: string;
      if (expense.expenseType === 'couple') {
        userId = users[0].id; // Attribué au premier utilisateur pour les dépenses de couple
      } else {
        // Alterner entre les utilisateurs pour les dépenses individuelles
        userId = users.length > 1 ? users[Math.floor(Math.random() * users.length)].id : users[0].id;
      }
      
      // Pour chaque mois entre startDate et endDate
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Définir le jour du mois pour la transaction
        const transactionDate = new Date(currentDate);
        transactionDate.setDate(Math.min(expense.dayOfMonth || 1, 28));
        
        // Ajouter une légère variance si spécifiée
        if (expense.variance) {
          const variance = Math.floor(Math.random() * (expense.variance * 2 + 1)) - expense.variance;
          transactionDate.setDate(transactionDate.getDate() + variance);
        }
        
        // Si la date est dans la période valide
        if (transactionDate >= startDate && transactionDate <= endDate) {
          // Générer un montant dans la fourchette
          const amount = this.getRandomAmount(expense.amount.min, expense.amount.max);
          
          // Créer la transaction de dépense essentielle
          transactions.push({
            amount: amount,
            description: expense.description || expense.name,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            accounting_date: format(transactionDate, 'yyyy-MM-dd'),
            category_id: categoryId,
            subcategory_id: subcategoryId,
            user_id: userId,
            expense_type: expense.expenseType,
            is_income: false,
            organization_id: organization_id
          });
        }
        
        // Passer au mois suivant
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
    
    // Générer des dépenses aléatoires mais garanties pour loisirs/cadeaux (au moins une par mois)
    this.generateMonthlySurpriseExpenses(transactions);
  }
  
  // Générer des dépenses de loisirs et cadeaux avec au moins une garantie par mois
  private generateMonthlySurpriseExpenses(transactions: GeneratedTransaction[]): void {
    if (!this.config) return;
    
    const { startDate, endDate, users, organization_id, categoryMap } = this.config;
    
    // Définir les types de dépenses "surprises" mensuelles (loisirs, cadeaux, etc.)
    const surpriseTypes = [
      {
        name: "Weekend/Vacances",
        description: "Weekend en Bretagne",
        category: "Loisirs",
        subcategory: "Weekends/Vacances",
        amount: { min: 150, max: 450 },
        expenseType: "couple" as ExpenseType
      },
      {
        name: "Cadeau",
        description: "Cadeau anniversaire",
        category: "Personnel",
        subcategory: "Cadeaux",
        amount: { min: 30, max: 120 },
        expenseType: "individual" as ExpenseType
      },
      {
        name: "Shopping",
        description: "Vêtements",
        category: "Personnel",
        subcategory: "Shopping",
        amount: { min: 50, max: 200 },
        expenseType: "individual" as ExpenseType
      },
      {
        name: "Sortie",
        description: "Restaurant entre amis",
        category: "Loisirs",
        subcategory: "Loisirs et sorties",
        amount: { min: 35, max: 120 },
        expenseType: "couple" as ExpenseType
      }
    ];
    
    // Pour chaque mois entre startDate et endDate
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Choisir 1 ou 2 types de surprises pour ce mois (garantie)
      const numSurprises = Math.floor(Math.random() * 2) + 1;
      
      // Créer une copie du tableau et le mélanger pour une sélection aléatoire
      const shuffledSurprises = [...surpriseTypes].sort(() => Math.random() - 0.5);
      
      // Pour chaque surprise sélectionnée
      for (let i = 0; i < numSurprises && i < shuffledSurprises.length; i++) {
        const surprise = shuffledSurprises[i];
        
        // Vérifier si la catégorie existe
        const categoryInfo = this.findMatchingCategory(categoryMap, surprise.category);
        if (!categoryInfo) continue;
        
        const categoryId = categoryInfo.id;
        
        // Trouver la sous-catégorie
        const subcategoryId = this.findMatchingSubcategory(categoryInfo.subcategories, surprise.subcategory);
        
        // Déterminer l'utilisateur en fonction du type de dépense
        const userId = this.selectUserForExpense(users, surprise.expenseType);
        
        // Créer une date aléatoire dans le mois courant
        const transactionDate = this.createRandomDateInMonth(currentDate, startDate, endDate);
        
        // Ne créer la transaction que si la date est dans la période valide
        if (transactionDate && transactionDate >= startDate && transactionDate <= endDate) {
          // Générer un montant aléatoire dans la fourchette définie
          const amount = this.getRandomAmount(surprise.amount.min, surprise.amount.max);
          
          // Ajouter la transaction au tableau
          transactions.push({
            amount,
            description: surprise.description,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            accounting_date: format(transactionDate, 'yyyy-MM-dd'),
            category_id: categoryId,
            subcategory_id: subcategoryId,
            user_id: userId,
            expense_type: surprise.expenseType,
            is_income: false,
            organization_id
          });
        }
      }
      
      // Passer au mois suivant
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      currentDate = nextMonth;
    }
  }
  
  // Trouver une catégorie correspondante ou une catégorie similaire
  private findMatchingCategory(categoryMap: Map<string, any>, categoryName: string): any {
    // Recherche directe
    const exactMatch = categoryMap.get(categoryName);
    if (exactMatch) return exactMatch;
    
    // Recherche approximative
    for (const [catName, catInfo] of categoryMap.entries()) {
      if (catName.includes(categoryName) || categoryName.includes(catName)) {
        return catInfo;
      }
    }
    
    return null;
  }
  
  // Trouver une sous-catégorie correspondante ou similaire
  private findMatchingSubcategory(subcategoriesMap: Map<string, string>, subcategoryName: string): string | null {
    // Recherche directe
    const exactMatch = subcategoriesMap.get(subcategoryName);
    if (exactMatch !== undefined) return exactMatch;
    
    // Recherche approximative
    for (const [subName, subId] of subcategoriesMap.entries()) {
      if (subName.includes(subcategoryName) || subcategoryName.includes(subName)) {
        return subId;
      }
    }
    
    return null;
  }
  
  // Sélectionner un utilisateur en fonction du type de dépense
  private selectUserForExpense(users: any[], expenseType: ExpenseType): string {
    // Si pas d'utilisateurs, retourner une chaîne vide
    if (!users || users.length === 0) {
      return '';
    }
    
    // Pour les dépenses de couple, utiliser le premier utilisateur
    if (expenseType === 'couple') {
      return users[0].id;
    }
    
    // Pour les dépenses individuelles, choisir un utilisateur aléatoire
    return users[Math.floor(Math.random() * users.length)].id;
  }
  
  // Créer une date aléatoire dans le mois donné, qui soit dans l'intervalle valide
  private createRandomDateInMonth(monthDate: Date, startDate: Date, endDate: Date): Date | null {
    if (!monthDate || !startDate || !endDate) return null;
    
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Déterminer le nombre de jours dans le mois (28 pour simplifier)
      const daysInMonth = 28;
      
      // Choisir un jour aléatoire
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      
      const date = new Date(year, month, day);
      
      // Vérifier si la date est dans l'intervalle valide
      if (date && date >= startDate && date <= endDate) {
        return date;
      }
    } catch (error) {
      console.error("Erreur lors de la création d'une date aléatoire:", error);
    }
    
    return null;
  }

  // Générer les transactions de revenus
  private generateIncomeTransactions(transactions: GeneratedTransaction[]): void {
    if (!this.config) return;
    
    const { startDate, endDate, users, organization_id, categoryMap } = this.config;
    const totalDays = differenceInDays(endDate, startDate);
    
    // Parcourir tous les patterns de revenus
    INCOME_PATTERNS.forEach(pattern => {
      const categoryInfo = categoryMap.get(pattern.category);
      if (!categoryInfo) return;
      
      const categoryId = categoryInfo.id;
      const subcategoryId = categoryInfo.subcategories.get(pattern.subcategory) || null;
      
      // Alterner les utilisateurs pour les revenus
      const userId = users[0].id;
      
      // Selon la fréquence, générer les transactions
      if (pattern.frequency === 'monthly') {
        this.generateMonthlyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, true, transactions
        );
      } else if (pattern.frequency === 'yearly') {
        this.generateYearlyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, true, transactions
        );
      } else if (pattern.frequency === 'random') {
        this.generateRandomTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, true, transactions
        );
      }
    });
  }

  // Générer les transactions de dépenses
  private generateExpenseTransactions(
    transactions: GeneratedTransaction[], 
    refunds: GeneratedRefund[]
  ): void {
    if (!this.config) return;
    
    const { startDate, endDate, users, organization_id, categoryMap } = this.config;
    
    // Parcourir tous les patterns de dépenses
    EXPENSE_PATTERNS.forEach(pattern => {
      const categoryInfo = categoryMap.get(pattern.category);
      if (!categoryInfo) return;
      
      const categoryId = categoryInfo.id;
      const subcategoryId = categoryInfo.subcategories.get(pattern.subcategory) || null;
      
      // Déterminer l'utilisateur selon le type de dépense
      let userId: string;
      
      if (pattern.expenseType === 'couple') {
        // Alterner entre les utilisateurs pour les dépenses de couple
        userId = Math.random() > 0.5 ? users[0].id : (users[1]?.id || users[0].id);
      } else {
        // Pour les dépenses individuelles, choisir aléatoirement
        userId = Math.random() > 0.5 ? users[0].id : (users[1]?.id || users[0].id);
      }
      
      // Selon la fréquence, générer les transactions
      if (pattern.frequency === 'monthly') {
        this.generateMonthlyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, false, transactions
        );
      } else if (pattern.frequency === 'bimonthly') {
        this.generateBimonthlyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, transactions
        );
      } else if (pattern.frequency === 'weekly') {
        this.generateWeeklyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, transactions
        );
      } else if (pattern.frequency === 'biweekly') {
        this.generateBiweeklyTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, transactions
        );
      } else if (pattern.frequency === 'workdays') {
        this.generateWorkdaysTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, transactions
        );
      } else if (pattern.frequency === 'random') {
        this.generateRandomTransactions(
          pattern, startDate, endDate, userId, categoryId, 
          subcategoryId, organization_id, false, transactions
        );
      }
    });
    
    // Générer des remboursements pour certaines transactions
    this.generateRefunds(transactions, refunds);
  }

  // Générer des transactions mensuelles
  private generateMonthlyTransactions(
    pattern: ExpensePattern | IncomePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    isIncome: boolean,
    transactions: GeneratedTransaction[]
  ): void {
    // Déterminer le jour du mois
    const dayOfMonth = pattern.dayOfMonth || 1;
    
    // Pour chaque mois entre startDate et endDate
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Fixer le jour du mois
      const transactionDate = new Date(currentDate);
      transactionDate.setDate(Math.min(dayOfMonth, 28)); // Maximum 28 pour éviter les problèmes avec février
      
      // Ajouter une variance de quelques jours si spécifiée
      if (pattern.variance) {
        const variance = Math.floor(Math.random() * (pattern.variance * 2 + 1)) - pattern.variance;
        transactionDate.setDate(transactionDate.getDate() + variance);
      }
      
      // Si la date est dans la période valide
      if (transactionDate >= startDate && transactionDate <= endDate) {
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Appliquer un multiplicateur saisonnier si applicable
        const adjustedAmount = this.applySeasonalMultiplier(
          amount, transactionDate, (pattern as ExpensePattern).seasonalMultiplier
        );
        
        // Créer la transaction
        transactions.push({
          amount: adjustedAmount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: (pattern as ExpensePattern).expenseType || 'couple',
          is_income: isIncome,
          organization_id: organizationId
        });
      }
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  // Générer des transactions bimensuelles
  private generateBimonthlyTransactions(
    pattern: ExpensePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    transactions: GeneratedTransaction[]
  ): void {
    // Déterminer le jour du mois
    const dayOfMonth = pattern.dayOfMonth || 1;
    
    // Pour chaque période de deux mois entre startDate et endDate
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Fixer le jour du mois
      const transactionDate = new Date(currentDate);
      transactionDate.setDate(Math.min(dayOfMonth, 28));
      
      // Ajouter une variance de quelques jours si spécifiée
      if (pattern.variance) {
        const variance = Math.floor(Math.random() * (pattern.variance * 2 + 1)) - pattern.variance;
        transactionDate.setDate(transactionDate.getDate() + variance);
      }
      
      // Si la date est dans la période valide
      if (transactionDate >= startDate && transactionDate <= endDate) {
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Appliquer un multiplicateur saisonnier si applicable
        const adjustedAmount = this.applySeasonalMultiplier(
          amount, transactionDate, pattern.seasonalMultiplier
        );
        
        // Créer la transaction
        transactions.push({
          amount: adjustedAmount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: pattern.expenseType,
          is_income: false,
          organization_id: organizationId
        });
      }
      
      // Passer à la période suivante (2 mois)
      currentDate.setMonth(currentDate.getMonth() + 2);
    }
  }

  // Générer des transactions hebdomadaires
  private generateWeeklyTransactions(
    pattern: ExpensePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    transactions: GeneratedTransaction[]
  ): void {
    // Déterminer le jour de la semaine (0 = dimanche, 6 = samedi)
    const dayOfWeek = pattern.dayOfWeek !== undefined ? pattern.dayOfWeek : 5; // Vendredi par défaut
    
    // Pour chaque semaine entre startDate et endDate
    let currentDate = new Date(startDate);
    
    // Ajuster au premier jour de la semaine spécifié
    const currentDayOfWeek = getDay(currentDate);
    const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
    currentDate = addDays(currentDate, daysToAdd);
    
    while (currentDate <= endDate) {
      // Ajouter une variance de quelques jours si spécifiée
      let transactionDate = new Date(currentDate);
      if (pattern.variance) {
        const variance = Math.floor(Math.random() * (pattern.variance * 2 + 1)) - pattern.variance;
        transactionDate = addDays(transactionDate, variance);
      }
      
      // Si la date est dans la période valide
      if (transactionDate >= startDate && transactionDate <= endDate) {
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Appliquer un multiplicateur saisonnier si applicable
        const adjustedAmount = this.applySeasonalMultiplier(
          amount, transactionDate, pattern.seasonalMultiplier
        );
        
        // Créer la transaction
        transactions.push({
          amount: adjustedAmount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: pattern.expenseType,
          is_income: false,
          organization_id: organizationId
        });
      }
      
      // Passer à la semaine suivante
      currentDate = addDays(currentDate, 7);
    }
  }

  // Générer des transactions bihebdomadaires
  private generateBiweeklyTransactions(
    pattern: ExpensePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    transactions: GeneratedTransaction[]
  ): void {
    // Pour chaque quinzaine entre startDate et endDate
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Ajouter une variance de quelques jours si spécifiée
      let transactionDate = new Date(currentDate);
      if (pattern.variance) {
        const variance = Math.floor(Math.random() * (pattern.variance * 2 + 1)) - pattern.variance;
        transactionDate = addDays(transactionDate, variance);
      }
      
      // Si la date est dans la période valide
      if (transactionDate >= startDate && transactionDate <= endDate) {
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Appliquer un multiplicateur saisonnier si applicable
        const adjustedAmount = this.applySeasonalMultiplier(
          amount, transactionDate, pattern.seasonalMultiplier
        );
        
        // Créer la transaction
        transactions.push({
          amount: adjustedAmount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: pattern.expenseType,
          is_income: false,
          organization_id: organizationId
        });
      }
      
      // Passer à la période suivante (2 semaines)
      currentDate = addDays(currentDate, 14);
    }
  }

  // Générer des transactions pour les jours ouvrables
  private generateWorkdaysTransactions(
    pattern: ExpensePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    transactions: GeneratedTransaction[]
  ): void {
    // Pour chaque jour entre startDate et endDate
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Vérifier si c'est un jour ouvrable (lundi-vendredi)
      const dayOfWeek = getDay(currentDate);
      const isWorkday = dayOfWeek > 0 && dayOfWeek < 6; // 1-5 = lundi-vendredi
      
      if (isWorkday) {
        // Décider si une transaction se produit ce jour (probabilité)
        const probability = pattern.probability || 0.7;
        if (Math.random() <= probability) {
          // Générer un montant aléatoire dans la fourchette
          const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
          
          // Appliquer un multiplicateur saisonnier si applicable
          const adjustedAmount = this.applySeasonalMultiplier(
            amount, currentDate, pattern.seasonalMultiplier
          );
          
          // Créer la transaction
          transactions.push({
            amount: adjustedAmount,
            description: pattern.description || pattern.name,
            transaction_date: format(currentDate, 'yyyy-MM-dd'),
            accounting_date: format(currentDate, 'yyyy-MM-dd'),
            category_id: categoryId,
            subcategory_id: subcategoryId,
            user_id: userId,
            expense_type: pattern.expenseType,
            is_income: false,
            organization_id: organizationId
          });
        }
      }
      
      // Passer au jour suivant
      currentDate = addDays(currentDate, 1);
    }
  }

  // Générer des transactions annuelles
  private generateYearlyTransactions(
    pattern: ExpensePattern | IncomePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    isIncome: boolean,
    transactions: GeneratedTransaction[]
  ): void {
    // Pour chaque année entre startDate et endDate
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      // Choisir un mois aléatoire pour la transaction annuelle (souvent décembre pour les primes)
      const month = pattern.name.toLowerCase().includes('prime') ? 11 : Math.floor(Math.random() * 12);
      
      // Choisir un jour aléatoire du mois
      const day = Math.floor(Math.random() * 28) + 1; // Max 28 pour éviter les problèmes avec février
      
      // Créer la date de transaction
      const transactionDate = new Date(year, month, day);
      
      // Si la date est dans la période valide
      if (transactionDate >= startDate && transactionDate <= endDate) {
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Créer la transaction
        transactions.push({
          amount: amount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: (pattern as ExpensePattern).expenseType || 'couple',
          is_income: isIncome,
          organization_id: organizationId
        });
      }
    }
  }

  // Générer des transactions aléatoires
  private generateRandomTransactions(
    pattern: ExpensePattern | IncomePattern,
    startDate: Date,
    endDate: Date,
    userId: string,
    categoryId: string,
    subcategoryId: string | null,
    organizationId: string,
    isIncome: boolean,
    transactions: GeneratedTransaction[]
  ): void {
    const totalDays = differenceInDays(endDate, startDate);
    
    // Déterminer la fréquence en fonction des probabilités
    let frequency: number = 0;
    
    if ((pattern as ExpensePattern).oddsPerWeek) {
      frequency = (pattern as ExpensePattern).oddsPerWeek! / 7; // Probabilité par jour
    } else if ((pattern as ExpensePattern).oddsPerMonth) {
      frequency = (pattern as ExpensePattern).oddsPerMonth! / 30; // Probabilité par jour
    } else if ((pattern as ExpensePattern).oddsPerYear) {
      frequency = (pattern as ExpensePattern).oddsPerYear! / 365; // Probabilité par jour
    } else {
      frequency = 0.05; // Valeur par défaut (~1-2 fois par mois)
    }
    
    // Pour chaque jour entre startDate et endDate
    for (let i = 0; i < totalDays; i++) {
      // Décider si une transaction se produit ce jour (selon la fréquence)
      if (Math.random() <= frequency) {
        const transactionDate = addDays(startDate, i);
        
        // Générer un montant aléatoire dans la fourchette
        const amount = this.getRandomAmount(pattern.amount.min, pattern.amount.max);
        
        // Appliquer un multiplicateur saisonnier si applicable
        const adjustedAmount = this.applySeasonalMultiplier(
          amount, transactionDate, (pattern as ExpensePattern).seasonalMultiplier
        );
        
        // Créer la transaction
        transactions.push({
          amount: adjustedAmount,
          description: pattern.description || pattern.name,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          accounting_date: format(transactionDate, 'yyyy-MM-dd'),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: userId,
          expense_type: (pattern as ExpensePattern).expenseType || 'couple',
          is_income: isIncome,
          organization_id: organizationId
        });
      }
    }
  }

  // Générer des remboursements pour certaines transactions
  private generateRefunds(
    transactions: GeneratedTransaction[],
    refunds: GeneratedRefund[]
  ): void {
    if (!this.config) return;

    const { users, organization_id } = this.config;
    
    // Parcourir les transactions de dépenses
    transactions.filter(t => !t.is_income).forEach((transaction, index) => {
      // Associer un ID temporaire pour référencer cette transaction
      this.transactionIds.push(`temp-${index}`);
      
      // Trouver le pattern correspondant à cette transaction
      const pattern = EXPENSE_PATTERNS.find(p => 
        p.description === transaction.description || 
        p.name === transaction.description
      );
      
      if (pattern?.refundProbability && Math.random() <= pattern.refundProbability) {
        // Déterminer un montant de remboursement (partie de la transaction)
        const refundRatio = Math.random() * 0.5 + 0.3; // Entre 30% et 80% de remboursement
        const refundAmount = Math.round(transaction.amount * refundRatio * 100) / 100;
        
        // Déterminer une date de remboursement (quelques jours après la transaction)
        const transactionDate = new Date(transaction.transaction_date);
        const daysToAdd = Math.floor(Math.random() * 7) + 3; // 3-10 jours après
        const refundDate = addDays(transactionDate, daysToAdd);
        
        // Vérifier si la date de remboursement est encore dans la plage valide
        if (refundDate <= this.config.endDate) {
          // Déterminer l'utilisateur qui rembourse (différent de celui qui a fait la dépense)
          const otherUsers = users.filter(u => u.id !== transaction.user_id);
          const refundUserId = otherUsers.length > 0 ? 
            otherUsers[Math.floor(Math.random() * otherUsers.length)].id : 
            transaction.user_id;
          
          // Créer le remboursement
          refunds.push({
            transaction_id: `temp-${index}`, // Référence temporaire
            amount: refundAmount,
            refund_date: format(refundDate, 'yyyy-MM-dd'),
            description: `Remboursement: ${transaction.description}`,
            user_id: refundUserId,
            organization_id
          });
        }
      }
    });
  }

  // Insérer les transactions dans la base de données
  private async insertTransactions(transactions: GeneratedTransaction[]): Promise<void> {
    if (transactions.length === 0) return;
    
    try {
      // Insérer les transactions par lots de 20 pour éviter les limites de taille de requête
      const batchSize = 20;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        const { data, error } = await this.supabase
          .from('transactions')
          .insert(batch)
          .select('id');
        
        if (error) {
          console.error("Erreur lors de l'insertion des transactions:", error);
          throw error;
        }
        
        // Stocker les IDs réels des transactions pour les remboursements
        if (data) {
          data.forEach((item, index) => {
            this.transactionIds[i + index] = item.id;
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'insertion des transactions:", error);
      throw error;
    }
  }

  // Insérer les remboursements dans la base de données
  private async insertRefunds(refunds: GeneratedRefund[]): Promise<void> {
    if (refunds.length === 0) return;
    
    try {
      // Remplacer les références temporaires par les IDs réels
      const refsWithValidIds = refunds.map(refund => {
        const tempIndex = parseInt(refund.transaction_id.replace('temp-', ''));
        return {
          ...refund,
          transaction_id: this.transactionIds[tempIndex]
        };
      });
      
      // Insérer les remboursements par lots de 20 pour éviter les limites de taille de requête
      const batchSize = 20;
      for (let i = 0; i < refsWithValidIds.length; i += batchSize) {
        const batch = refsWithValidIds.slice(i, i + batchSize);
        
        const { error } = await this.supabase
          .from('refunds')
          .insert(batch);
        
        if (error) {
          console.error("Erreur lors de l'insertion des remboursements:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'insertion des remboursements:", error);
      throw error;
    }
  }

  // Utilitaires
  private getRandomAmount(min: number, max: number): number {
    const amount = Math.random() * (max - min) + min;
    return Math.round(amount * 100) / 100; // Arrondir à 2 décimales
  }

  private applySeasonalMultiplier(
    amount: number, 
    date: Date, 
    multiplier?: { winter?: number; spring?: number; summer?: number; autumn?: number }
  ): number {
    if (!multiplier) return amount;
    
    const month = getMonth(date);
    
    // Déterminer la saison
    let seasonMultiplier = 1;
    
    if (month >= 0 && month <= 2) {
      // Hiver (janvier-mars)
      seasonMultiplier = multiplier.winter || 1;
    } else if (month >= 3 && month <= 5) {
      // Printemps (avril-juin)
      seasonMultiplier = multiplier.spring || 1;
    } else if (month >= 6 && month <= 8) {
      // Été (juillet-septembre)
      seasonMultiplier = multiplier.summer || 1;
    } else {
      // Automne (octobre-décembre)
      seasonMultiplier = multiplier.autumn || 1;
    }
    
    return Math.round(amount * seasonMultiplier * 100) / 100;
  }
}

// Exporter un singleton
export const demoDataGenerator = new DemoDataGenerator(); 