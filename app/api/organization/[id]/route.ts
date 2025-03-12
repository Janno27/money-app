import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const organizationId = params.id
  
  if (!organizationId) {
    return NextResponse.json({ 
      success: false, 
      error: 'ID d\'organisation requis'
    }, { status: 400 })
  }
  
  try {
    // Vérifier que les variables d'environnement sont définies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement manquantes")
      return NextResponse.json({ 
        success: false, 
        error: "Configuration du serveur incomplète."
      }, { status: 500 })
    }
    
    // Client avec la clé de service pour contourner les RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Récupérer les détails de l'organisation
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single()
    
    if (orgError) {
      console.error("Erreur lors de la récupération de l'organisation:", orgError)
      return NextResponse.json({ 
        success: false, 
        error: "Organisation introuvable"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      organization: orgData
    })
    
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 