import { SquareTerminal, Settings2, LucideIcon } from "lucide-react"

// Définition du type pour les éléments de navigation
export interface NavMainItem {
  title: string;
  url: string | null;
  icon: LucideIcon; // Utilisation du type LucideIcon au lieu de any
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
          title: "Catégories",
          url: "#",
        },
        {
          title: "Évolution",
          url: "/dashboard/evolution",
        },
        {
          title: "Calendrier",
          url: "/dashboard/calendar",
        },
      ],
    },
    {
      title: "Settings",
      url: null,
      icon: Settings2,
    },
  ]
} 