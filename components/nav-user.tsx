"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings,
  Tag,
  User as UserIcon,
  Users,
} from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/supabase/client"
import { SettingsDialog } from "@/components/settings/settings-dialog"

interface User {
  name: string
  email: string
  avatar: string
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("general")

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, avatar')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser({
            name: userData.name,
            email: authUser.email || '',
            avatar: userData.avatar
          })
        }
      }
    }

    fetchUser()
  }, [supabase])

  const handleLogout = async () => {
    await signOut()
    router.refresh()
    router.push('/login')
  }

  const openSettings = (section: string) => {
    setActiveSection(section)
    setSettingsOpen(true)
  }

  if (!user) return null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align={isMobile ? "end" : "start"}
              side={isMobile ? "top" : "right"}
            >
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => openSettings("general")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("account")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Compte</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("organization")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Organisation</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("categories")}>
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Catégories</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
        initialSection={activeSection}
      />
    </>
  )
}
