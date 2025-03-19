"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export function LogoSwitcher() {
  const [organizationName, setOrganizationName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchOrganizationName = async () => {
      try {
        setIsLoading(true)
        
        // 1. Récupérer l'utilisateur actuel
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }
        
        // 2. Récupérer l'appartenance à l'organisation pour cet utilisateur
        // Utiliser une requête SQL directe pour simplifier et éviter les problèmes de RLS
        const { data: orgData, error: orgError } = await supabase
          .rpc('get_user_organization_name', { user_id_param: user.id })
        
        if (orgError || !orgData) {
          console.error("Erreur lors de la récupération du nom de l'organisation:", orgError)
          setIsLoading(false)
          return
        }
        
        // Mettre à jour le nom si trouvé
        if (orgData.length > 0 && orgData[0].name) {
          setOrganizationName(orgData[0].name)
        }
      } catch (error) {
        console.error("Erreur inattendue:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrganizationName()
  }, [supabase])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="justify-start w-auto"
        >
          <div className="grid text-left text-sm leading-tight">
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span className="font-bold">{organizationName}</span>
            )}
            <span className="text-xs text-muted-foreground">Family</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 
