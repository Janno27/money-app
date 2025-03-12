import { SquareTerminal, Settings2, Calendar, LucideIcon, BarChart4 } from "lucide-react"

// Définition du type pour les éléments de navigation
export interface NavMainItem {
  title: string;
  url: string | null;
  icon: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
  onItemClick?: () => void;
}

// Données d'exemple
export const data = {
  navMain: [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Comptabilité",
          url: "/dashboard/accounting",
        },
        {
          title: "Évolution",
          url: "/dashboard/evolution",
        },
      ],
    },
    {
      title: "Calendrier",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: "Planifié",
      url: "/dashboard/planner",
      icon: BarChart4,
    },
    {
      title: "Settings",
      url: null,
      icon: Settings2,
    },
  ]
} 