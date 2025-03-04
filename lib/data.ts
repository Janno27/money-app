import { SquareTerminal, Settings2 } from "lucide-react"

// Définition du type pour les éléments de navigation
export interface NavMainItem {
  title: string;
  url: string | null;
  icon: any; // Utilisation de any pour éviter les problèmes de type avec les icônes
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