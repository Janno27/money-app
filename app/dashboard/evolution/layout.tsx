import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Évolution"
}

export default function EvolutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 