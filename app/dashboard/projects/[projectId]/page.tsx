"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ProjectDetailPage } from "@/components/@components/projects/ProjectDetailPage"

export default function ProjectDetailPageRoute({
  params,
}: {
  params: { projectId: string }
}) {
  const projectId = params.projectId;
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-[100vh] overflow-hidden">
          <header className="flex-none border-b bg-background px-4 py-3">
            <Breadcrumb
              segments={[
                { title: "Tableau de bord", href: "/dashboard" },
                { title: "Projets", href: "/dashboard/projects" },
                { title: "Détail du projet" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-4">
            <div className="flex flex-col h-full">
              <ProjectDetailPage projectId={projectId} />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 