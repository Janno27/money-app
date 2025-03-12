import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Récupérer le token d'autorisation de la requête entrante
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token d\'authentification manquant' 
      }, { status: 401 })
    }

    // Récupérer le corps de la requête
    const requestData = await req.json()

    // Construire l'URL de la fonction Supabase selon l'environnement
    const supabaseUrl = process.env.NODE_ENV === 'production'
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`
      : 'http://127.0.0.1:54321/functions/v1/invite-user'

    console.log(`Transfert de la requête vers: ${supabaseUrl}`)
    
    // Faire la requête à la fonction Supabase
    const response = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(requestData)
    })

    // Récupérer le corps de la réponse
    const responseData = await response.json().catch(() => ({}))
    
    // Log pour le débogage
    console.log(`Réponse de la fonction (status ${response.status}):`, responseData)

    // Renvoyer le statut et les données de la réponse
    return NextResponse.json(responseData, { status: response.status })
  } catch (error) {
    // Log détaillé de l'erreur pour faciliter le débogage
    console.error('Erreur lors du transfert de la requête:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors du transfert de la requête'
    }, { status: 500 })
  }
} 