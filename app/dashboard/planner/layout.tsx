import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Planifié",
  description: "Projection budgétaire basée sur les données historiques",
}

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 