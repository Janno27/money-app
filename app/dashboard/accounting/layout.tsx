import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Comptabilité"
}

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 