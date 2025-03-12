// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Fonction principale qui va servir les requêtes HTTP
serve(async (req) => {
  // Gestion des requêtes préliminaires OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Vérifier que toutes les variables d'environnement sont définies
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables d\'environnement manquantes')
    }

    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Créer un client Supabase avec la clé anonyme pour vérifier l'autorisation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('En-tête d\'autorisation manquant')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Vérifier que l'utilisateur est authentifié
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !caller) {
      throw new Error('Non autorisé')
    }

    // Récupérer les données de la requête
    const { email, organization_id } = await req.json()

    // Valider les données
    if (!email) {
      throw new Error('Email requis')
    }

    if (!organization_id) {
      throw new Error('ID d\'organisation requis')
    }

    // Vérifier que l'utilisateur appelant appartient à l'organisation
    const { data: memberCheck, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('id')
      .eq('user_id', caller.id)
      .eq('organization_id', organization_id)
      .single()

    if (memberError || !memberCheck) {
      throw new Error('Vous n\'êtes pas membre de cette organisation')
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: { email }
    })

    if (existingUsers && existingUsers.users.length > 0) {
      const existingUser = existingUsers.users[0]
      
      // Vérifier si l'utilisateur est déjà membre de l'organisation
      const { data: existingMember, error: memberCheckError } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', existingUser.id)
        .single()
      
      if (existingMember) {
        return new Response(
          JSON.stringify({ message: 'Cet utilisateur est déjà membre de votre organisation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Ajouter l'utilisateur existant à l'organisation
      await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id,
          user_id: existingUser.id,
          role: 'member'
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Utilisateur ajouté à l\'organisation',
          isNewUser: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Envoyer une invitation à un nouvel utilisateur
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(req.url).origin.replace('functions.', '')}/accept-invitation?organization_id=${organization_id}`,
      data: { 
        organization_id,
        invited_by: caller.id
      }
    })

    if (inviteError) {
      throw inviteError
    }

    // Tout s'est bien passé
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation envoyée',
        isNewUser: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Gérer les erreurs
    console.error('Erreur:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 