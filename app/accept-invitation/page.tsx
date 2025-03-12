import { AcceptInvitation } from "@/components/accept-invitation"

export const metadata = {
  title: "Accepter l'invitation | Money App",
  description: "Acceptez l'invitation à rejoindre une organisation sur Money App",
}

export default function AcceptInvitationPage() {
  return (
    <div className="container max-w-screen-xl mx-auto py-10">
      <AcceptInvitation />
    </div>
  )
} 