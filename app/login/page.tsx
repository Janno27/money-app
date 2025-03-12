import { LoginForm } from '@/components/ui/login-form'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col justify-center w-full max-w-md mx-auto p-4">
        <LoginForm />
        {/* Le bouton de diagnostic est intégré dans le composant LoginForm */}
      </div>
    </div>
  )
}
