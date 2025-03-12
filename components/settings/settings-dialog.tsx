"use client"

import * as React from "react"
import { Tag, Sliders, User, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GeneralSettings } from "@/components/settings/general-settings"
import { CategorySettings } from "@/components/settings/category-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { OrganizationSettings } from "@/components/settings/organization-settings"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: string
}

interface SettingsSidebarItem {
  id: string
  name: string
  icon: React.ReactNode
}

export function SettingsDialog({
  open,
  onOpenChange,
  initialSection = "general"
}: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState(initialSection)
  
  // Update activeSection when initialSection changes
  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection)
    }
  }, [initialSection])
  
  const sidebarItems: SettingsSidebarItem[] = [
    {
      id: "general",
      name: "Général",
      icon: <Sliders className="h-4 w-4 mr-2" />
    },
    {
      id: "account",
      name: "Compte",
      icon: <User className="h-4 w-4 mr-2" />
    },
    {
      id: "organization",
      name: "Organisation",
      icon: <Users className="h-4 w-4 mr-2" />
    },
    {
      id: "spacer",
      name: "",
      icon: null
    },
    {
      id: "categories",
      name: "Catégories",
      icon: <Tag className="h-4 w-4 mr-2" />
    }
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>
            Configurez vos préférences et gérez vos catégories
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Barre latérale de navigation */}
          <div className="w-64 border-r bg-muted/20">
            <div className="flex flex-col py-2">
              {sidebarItems.map((item) => (
                item.id === "spacer" ? (
                  <div key={item.id} className="my-2 mx-4 border-b border-border" />
                ) : (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                      "hover:bg-muted/50",
                      activeSection === item.id 
                        ? "bg-muted text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </button>
                )
              ))}
            </div>
          </div>
          
          {/* Contenu de la section */}
          <div className="flex-1 overflow-hidden">
            {activeSection === "general" && <GeneralSettings />}
            {activeSection === "account" && <AccountSettings />}
            {activeSection === "organization" && <OrganizationSettings />}
            {activeSection === "categories" && <CategorySettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 