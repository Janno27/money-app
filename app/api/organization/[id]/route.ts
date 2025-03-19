import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: "ID d'organisation requis"
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Configuration serveur invalide"
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single()

    if (orgError) {
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
      error: error instanceof Error ? error.message : 'Erreur système'
    }, { status: 500 })
  }
}
