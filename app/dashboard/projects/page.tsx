"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ProjectsPage } from "@/components/@components/projects/ProjectsPage"

export default function ProjectsPageRoute() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-[100vh] overflow-hidden">
          <header className="flex-none border-b bg-background px-4 py-3">
            <Breadcrumb
              segments={[
                { title: "Tableau de bord", href: "/dashboard" },
                { title: "Projets" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-4">
            <div className="flex flex-col h-full">
              <ProjectsPage />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 