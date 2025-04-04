import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'

// Endpoint pour ajouter un utilisateur à une organisation
export async function POST(request: Request) {
  try {
    console.log("API /api/organization/member appelée")
    
    // Créer un client Supabase avec la clé de service pour contourner les restrictions RLS
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer les données du corps de la requête
    const { user_id, organization_id, role = 'member' } = await request.json()
    console.log("Données reçues:", { user_id, organization_id, role })

    if (!user_id || !organization_id) {
      return NextResponse.json(
        { error: 'user_id et organization_id sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'organisation existe
    const { data: organizationData, error: organizationError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organization_id)
      .single()

    if (organizationError || !organizationData) {
      console.error("Organisation non trouvée:", organizationError)
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      )
    }
    
    console.log("Organisation trouvée:", organizationData)

    // Vérifier que l'utilisateur existe dans auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (userError || !userData.user) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', userError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }
    
    console.log("Utilisateur trouvé dans auth.users:", {
      id: userData.user.id,
      email: userData.user.email,
      user_metadata: userData.user.user_metadata
    })
    
    // Vérifier/attendre que l'utilisateur soit bien présent dans public.users
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      attempts++
      const { data: publicUser, error: _publicUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user_id)
        .single()
        
      if (publicUser) {
        console.log("Utilisateur trouvé dans public.users:", publicUser)
        break
      }
      
      if (attempts === maxAttempts) {
        console.warn(`Utilisateur non trouvé dans public.users après ${maxAttempts} tentatives`)
        // On continue quand même, la table organization_members fera référence à l'ID correct
      } else {
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Ajouter l'utilisateur à l'organisation
    console.log("Ajout de l'utilisateur à l'organisation")
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id,
        user_id,
        role
      })
      .select()

    if (memberError) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur à l\'organisation:', memberError)
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      )
    }
    
    console.log("Utilisateur ajouté à organization_members:", memberData)

    // Mettre à jour la colonne organization_id dans la table users
    console.log("Mise à jour de organization_id dans public.users")
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ organization_id })
      .eq('id', user_id)
      .select()

    if (updateError) {
      console.error('Erreur lors de la mise à jour de organization_id:', updateError)
      // Non bloquant, on continue
    } else {
      console.log("organization_id mis à jour dans public.users:", updateData)
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur ajouté à l\'organisation avec succès',
      data: memberData
    })
  } catch (error) {
    console.error('Erreur dans l\'API /api/organization/member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Une erreur est survenue' },
      { status: 500 }
    )
  }
} 