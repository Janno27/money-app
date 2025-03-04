"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SubprojectDetailPage } from "@/components/@components/projects/SubprojectDetailPage"

interface SubprojectDetailPageRouteProps {
  params: {
    projectId: string;
    subprojectId: string;
  }
}

export default function SubprojectDetailPageRoute({ params }: SubprojectDetailPageRouteProps) {
  const { projectId, subprojectId } = params;
  
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
                { title: "Projet", href: `/dashboard/projects/${projectId}` },
                { title: "Sous-projet" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-4">
            <div className="flex flex-col h-full">
              <SubprojectDetailPage projectId={projectId} subprojectId={subprojectId} />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 