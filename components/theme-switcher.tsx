"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import {
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme()
  const { } = useSidebar()
  const [mounted, setMounted] = React.useState(false)

  // Effet pour éviter l'hydration côté client/serveur
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" disabled>
        <Sun className="size-5" />
      </Button>
    )
  }

  // Variable non utilisée
  // const isExpanded = state === "expanded"
  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      </TooltipContent>
    </Tooltip>
  )
} 