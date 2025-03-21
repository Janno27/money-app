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
import { NavProjects } from "@/components/nav-projects"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { LogoSwitcher } from "@/components/logo-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { data, NavMainItem } from "@/lib/data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navItems = React.useMemo<NavMainItem[]>(() => {
    return data.navMain.filter(item => item.title !== "Settings")
  }, [])

  return (
    <>
      <Sidebar collapsible="icon" variant="inset" {...props}>
        <SidebarHeader className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center justify-between w-full">
            <LogoSwitcher />
            <ThemeSwitcher />
          </div>
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
