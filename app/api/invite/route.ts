// app/api/invite/route.ts (pour App Router)

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Récupérer le token d'autorisation
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non autorisé'
      }, { status: 401 })
    }

    // Récupérer le corps de la requête
    const { email, organization_id } = await req.json()
    
    // Valider les données
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email requis'
      }, { status: 400 })
    }

    if (!organization_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID d\'organisation requis'
      }, { status: 400 })
    }
    
    console.log(`Tentative d'invitation: ${email} pour l'organisation ${organization_id}`)
    
    // Vérifier que les variables d'environnement sont définies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Variables d'environnement manquantes")
      return NextResponse.json({ 
        success: false, 
        error: "Configuration du serveur incomplète."
      }, { status: 500 })
    }
    
    // Client avec le token d'auth de l'utilisateur
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !caller) {
      console.error("Erreur d'authentification:", authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Non autorisé'
      }, { status: 401 })
    }

    try {
      // Comme demandé, on considère toujours l'utilisateur comme nouveau
      // Générer un lien d'invitation personnalisé
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const signupLink = `${baseUrl}/signup?organization_id=${organization_id}&email=${encodeURIComponent(email)}`
      
      console.log("Lien d'invitation généré:", signupLink)
      
      // Dans une vraie application, on enverrait ce lien par email
      return NextResponse.json({
        success: true,
        message: 'Lien d\'invitation généré',
        isNewUser: true,
        invitationLink: signupLink
      })
      
    } catch (error) {
      console.error("Erreur:", error)
      return NextResponse.json({
        success: false,
        error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erreur générale:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 