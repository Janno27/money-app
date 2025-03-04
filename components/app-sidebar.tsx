"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { NavProjects } from "@/components/nav-projects"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { LogoSwitcher } from "@/components/logo-switcher"
import { data, NavMainItem } from "@/lib/data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  
  // Mise à jour des items pour gérer l'ouverture de la modale Settings
  const navItems = React.useMemo<NavMainItem[]>(() => {
    return data.navMain.map(item => {
      if (item.title === "Settings") {
        return {
          ...item,
          onItemClick: () => setSettingsOpen(true)
        } as NavMainItem
      }
      return item
    })
  }, [])

  return (
    <>
      <Sidebar collapsible="icon" variant="inset" {...props}>
        <SidebarHeader className="flex items-center justify-between px-2 py-2">
          <LogoSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navItems} />
          <NavProjects />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
