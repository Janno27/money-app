import * as React from "react"
import { Users } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function LogoSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="w-full justify-start"
        >
          <div className="mr-3 h-8 w-8 rounded-lg bg-primary/10 p-1.5">
            <Users className="h-full w-full text-primary" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="font-bold">Soares-Rosset</span>
            <span className="text-xs text-muted-foreground">Family</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 
