import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache pour les sessions, avec une durée de vie de 1 minute
const sessionCache = new Map<string, { session: any, timestamp: number }>()
const SESSION_CACHE_DURATION = 60000 // 1 minute en millisecondes

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    // Génération d'une clé de cache basée sur le token d'authentification
    // Utiliser await avec cookies() pour éviter l'erreur "cookies() should be awaited"
    const supabaseCookie = req.cookies.get('sb-ouiwpkxvjxcfbypmurap-auth-token')?.value
    const cacheKey = supabaseCookie || 'anonymous'
    
    // Vérifier si nous avons une session en cache et si elle est encore valide
    const now = Date.now()
    const cachedData = sessionCache.get(cacheKey)
    
    let session = null
    
    if (cachedData && (now - cachedData.timestamp) < SESSION_CACHE_DURATION) {
      // Utiliser la session en cache
      session = cachedData.session
      console.log("Using cached session")
    } else {
      // Récupérer une nouvelle session
      const { data } = await supabase.auth.getSession()
      session = data.session
      
      // Mettre en cache la session
      sessionCache.set(cacheKey, { 
        session, 
        timestamp: now 
      })
      console.log("Fetched new session")
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
    const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || 
                        req.nextUrl.pathname.startsWith('/signup') ||
                        req.nextUrl.pathname.startsWith('/accept-invitation')
    
    const isOnboardingRoute = req.nextUrl.pathname.startsWith('/onboarding')
    
    if (!session && !isAuthRoute && !isOnboardingRoute && req.nextUrl.pathname !== '/') {
      console.log("Redirecting to login (unauthenticated)")
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Si l'utilisateur est connecté et tente d'accéder à la page login/signup
    if (session && isAuthRoute) {
      console.log("Redirecting to onboarding (already authenticated)")
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    
    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // En cas d'erreur, continuer sans bloquer l'utilisateur
    return res
  }
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth page)
     */
    '/',
    '/dashboard/:path*',
    '/onboarding',
    '/((?!_next/static|_next/image|favicon.ico|login).*)']
}