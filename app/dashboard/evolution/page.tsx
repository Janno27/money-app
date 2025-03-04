"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import EvolutionPage from "../../../components/@components/evolution/EvolutionPage"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function EvolutionPageRoute() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-[100vh] overflow-hidden">
          <header className="flex-none border-b bg-background px-4 py-3">
            <Breadcrumb
              segments={[
                { title: "Tableau de bord", href: "/dashboard" },
                { title: "Evolution" }
              ]}
            />
          </header>
          <main className="flex-1 min-h-0 p-4">
            <div className="flex flex-col h-full">
              <EvolutionPage />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 