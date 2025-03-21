import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

// Singleton pour le client Supabase
let supabaseInstance: SupabaseClient | null = null

// Limiter les appels à l'API
const apiCallsTracker = {
  calls: new Map<string, { count: number, timestamp: number }>(),
  maxCallsPerMinute: 30, // Limite de 30 appels par minute pour une même méthode
  resetInterval: 60000, // 1 minute en millisecondes
  
  // Journaliser les appels à l'API pour le débogage
  logApiCall(method: string, success: boolean): void {
    try {
      // Récupérer l'historique des appels
      const apiCallsLog = localStorage.getItem('apiCallsLog')
      const now = Date.now()
      const log = apiCallsLog ? JSON.parse(apiCallsLog) : []
      
      // Ajouter cet appel au journal
      log.push({
        method,
        timestamp: now,
        success
      })
      
      // Ne garder que les 100 derniers appels
      const recentLog = log.slice(-100)
      
      // Sauvegarder le journal
      localStorage.setItem('apiCallsLog', JSON.stringify(recentLog))
      
      // Compter les appels par méthode dans la dernière minute
      const lastMinute = now - 60000
      const methodCounts = recentLog
        .filter((entry: { timestamp: number; method: string }) => entry.timestamp > lastMinute)
        .reduce((acc: Record<string, number>, entry: { timestamp: number; method: string }) => {
          acc[entry.method] = (acc[entry.method] || 0) + 1
          return acc
        }, {})
      
      // Journaliser les méthodes avec beaucoup d'appels
      Object.entries(methodCounts).forEach(([method, count]) => {
        if ((count as number) > 10) {
          console.warn(`ATTENTION: ${count} appels à ${method} dans la dernière minute`)
        }
      })
    } catch (e) {
      // Ignorer les erreurs de journalisation
      console.error('Erreur de journalisation:', e)
    }
  },
  
  // Vérifier si on peut faire un appel
  canMakeCall(method: string): boolean {
    const now = Date.now()
    const callInfo = this.calls.get(method)
    
    // Si pas d'appel précédent ou si l'intervalle est dépassé, réinitialiser le compteur
    if (!callInfo || (now - callInfo.timestamp) > this.resetInterval) {
      this.calls.set(method, { count: 1, timestamp: now })
      this.logApiCall(method, true)
      return true
    }
    
    // Si on a dépassé la limite, bloquer l'appel
    if (callInfo.count >= this.maxCallsPerMinute) {
      console.warn(`Rate limit atteint pour la méthode ${method}. Attendez avant de réessayer.`)
      this.logApiCall(method, false)
      return false
    }
    
    // Incrémenter le compteur
    this.calls.set(method, { count: callInfo.count + 1, timestamp: callInfo.timestamp })
    this.logApiCall(method, true)
    return true
  },
  
  // Réinitialiser le compteur pour une méthode
  resetCounter(method: string): void {
    this.calls.delete(method)
  },
  
  // Obtenir les statistiques d'appels
  getStats(): { method: string, count: number, lastCall: number }[] {
    const stats = []
    const now = Date.now()
    
    for (const [method, info] of this.calls.entries()) {
      stats.push({
        method,
        count: info.count,
        lastCall: now - info.timestamp
      })
    }
    
    return stats
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}

// Fonction pour réinitialiser le client (utile pour les tests ou après déconnexion)
export function resetSupabaseClient(): void {
  supabaseInstance = null
}

// Fonction pour vérifier si l'utilisateur est connecté sans déclencher de multiples appels
let cachedSession: unknown = null
let lastSessionCheck = 0
const SESSION_CACHE_DURATION = 60000 // 1 minute en millisecondes

export async function getSession(forceRefresh = false) {
  const now = Date.now()
  const method = 'auth.getSession'
  
  // Utiliser la session en cache si elle existe et n'est pas expirée
  if (!forceRefresh && cachedSession && (now - lastSessionCheck) < SESSION_CACHE_DURATION) {
    return { data: { session: cachedSession }, error: null }
  }
  
  // Vérifier si on peut faire un appel à l'API
  if (!apiCallsTracker.canMakeCall(method)) {
    // Si on ne peut pas faire d'appel, utiliser la session en cache même si elle est expirée
    if (cachedSession) {
      return { data: { session: cachedSession }, error: null }
    }
    // Sinon, retourner une erreur
    return { 
      data: { session: null }, 
      error: { message: 'Rate limit reached for auth.getSession' } 
    }
  }
  
  // Sinon, récupérer une nouvelle session
  try {
    const client = getSupabaseClient()
    const result = await client.auth.getSession()
    
    // Mettre en cache le résultat
    cachedSession = result.data.session
    lastSessionCheck = now
    
    return result
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return { data: { session: null }, error }
  }
}

// Fonction pour vérifier si l'utilisateur est connecté
export async function isAuthenticated(): Promise<boolean> {
  const { data, error } = await getSession()
  return !error && !!data.session
}

// Fonction pour se déconnecter
export async function signOut() {
  const method = 'auth.signOut'
  
  // Vérifier si on peut faire un appel à l'API
  if (!apiCallsTracker.canMakeCall(method)) {
    throw new Error('Rate limit reached for auth.signOut')
  }
  
  const client = getSupabaseClient()
  const result = await client.auth.signOut()
  
  // Réinitialiser le cache de session
  cachedSession = null
  lastSessionCheck = 0
  
  return result
}

// Fonction pour se connecter avec email et mot de passe
export async function signInWithPassword(credentials: { email: string, password: string }) {
  const method = 'auth.signInWithPassword'
  
  // Vérifier si on peut faire un appel à l'API
  if (!apiCallsTracker.canMakeCall(method)) {
    return { 
      data: { user: null, session: null }, 
      error: { message: 'Request rate limit reached', name: 'AuthApiError' } 
    }
  }
  
  const client = getSupabaseClient()
  return await client.auth.signInWithPassword(credentials)
}

// Fonction pour réinitialiser le mot de passe par email
export async function resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
  const method = 'auth.resetPasswordForEmail'
  
  // Vérifier si on peut faire un appel à l'API
  if (!apiCallsTracker.canMakeCall(method)) {
    return { 
      data: null, 
      error: { message: 'Request rate limit reached', name: 'AuthApiError' } 
    }
  }
  
  // Vérifier si une demande récente a été faite pour cet email
  const lastResetKey = `lastPasswordReset_${email}`
  const lastReset = localStorage.getItem(lastResetKey)
  
  if (lastReset) {
    const lastResetTime = parseInt(lastReset, 10)
    const now = Date.now()
    const timeDiff = now - lastResetTime
    
    // Limiter à une demande par minute pour le même email
    if (timeDiff < 60000) { // 1 minute
      return { 
        data: null, 
        error: { 
          message: `Veuillez patienter ${Math.ceil((60000 - timeDiff) / 1000)} secondes avant de demander un nouveau lien.`, 
          name: 'RateLimitError' 
        } 
      }
    }
  }
  
  // Enregistrer cette demande
  localStorage.setItem(lastResetKey, Date.now().toString())
  
  const client = getSupabaseClient()
  return await client.auth.resetPasswordForEmail(email, options)
}

// Fonction pour mettre à jour le mot de passe de l'utilisateur
export async function updateUserPassword(password: string) {
  const method = 'auth.updateUser'
  
  // Vérifier si on peut faire un appel à l'API
  if (!apiCallsTracker.canMakeCall(method)) {
    return { 
      data: { user: null }, 
      error: { message: 'Request rate limit reached', name: 'AuthApiError' } 
    }
  }
  
  // Vérifier si une mise à jour récente a été faite
  const lastUpdateKey = 'lastPasswordUpdate'
  const lastUpdate = localStorage.getItem(lastUpdateKey)
  
  if (lastUpdate) {
    const lastUpdateTime = parseInt(lastUpdate, 10)
    const now = Date.now()
    const timeDiff = now - lastUpdateTime
    
    // Limiter à une mise à jour par minute
    if (timeDiff < 60000) { // 1 minute
      return { 
        data: { user: null }, 
        error: { 
          message: `Veuillez patienter ${Math.ceil((60000 - timeDiff) / 1000)} secondes avant de réessayer.`, 
          name: 'RateLimitError' 
        } 
      }
    }
  }
  
  // Enregistrer cette mise à jour
  localStorage.setItem(lastUpdateKey, Date.now().toString())
  
  const client = getSupabaseClient()
  return await client.auth.updateUser({ password })
}

// Fonction pour obtenir les statistiques d'appels à l'API
export function getApiCallStats() {
  return apiCallsTracker.getStats()
}

// Fonction pour obtenir le journal des appels à l'API
export function getApiCallLogs() {
  try {
    const apiCallsLog = localStorage.getItem('apiCallsLog')
    return apiCallsLog ? JSON.parse(apiCallsLog) : []
  } catch (e) {
    console.error('Erreur lors de la récupération des logs:', e)
    return []
  }
} 