"use client"

import { Suspense } from "react"
import { AcceptInvitation } from "@/components/accept-invitation"

export const metadata = {
  title: "Accepter l'invitation | Money App",
  description: "Acceptez l'invitation à rejoindre une organisation sur Money App",
}

// Composant de chargement pour Suspense
function Loading() {
  return <div className="flex justify-center items-center min-h-[60vh]">Chargement...</div>
}

export default function AcceptInvitationPage() {
  return (
    <div className="container max-w-screen-xl mx-auto py-10">
      <Suspense fallback={<Loading />}>
        <AcceptInvitation />
      </Suspense>
    </div>
  )
} 