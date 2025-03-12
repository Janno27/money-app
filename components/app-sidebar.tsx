"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { NavProjects } from "@/components/nav-projects"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { LogoSwitcher } from "@/components/logo-switcher"
import { data, NavMainItem } from "@/lib/data"

function NavSettings({ onSettingsClick }: { onSettingsClick: () => void }) {
  const settingsItem = data.navMain.find(item => item.title === "Settings")
  if (!settingsItem) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={onSettingsClick}>
          <settingsItem.icon />
          <span>{settingsItem.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  
  const navItems = React.useMemo<NavMainItem[]>(() => {
    return data.navMain.filter(item => item.title !== "Settings")
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
    </>
  )
}
