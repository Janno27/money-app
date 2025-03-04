"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

import {
  SquareTerminal,
  Map,
  PieChart,
  Frame,
  FileText,
  Calendar,
  Star,
  Home,
  GalleryVerticalEnd,
  Car,
  Plane,
  Briefcase,
  Heart,
  Settings,
  Bookmark,
  Package,
  Building,
  Gift,
  Coffee,
  Compass,
  Book,
  Leaf,
  Music,
  Camera,
  Smartphone,
  Palette,
  PenTool,
  Globe,
  Tv,
  Zap,
  Award
} from "lucide-react"

interface Project {
  id: string;
  name: string;
  iconName: string;
  color?: string;
  subprojects?: SubProject[];
  description?: string;
  createdAt?: string;
}

interface SubProject {
  id: string;
  name: string;
  parentId: string;
  color?: string;
  description?: string;
}

interface ProjectData {
  id: string;
  name: string;
  iconName: string;
  color?: string;
  subprojects?: SubProject[];
  description?: string;
  createdAt?: string;
}

const getIconByName = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Terminal: SquareTerminal,
    Map: Map,
    Chart: PieChart,
    Frame: Frame,
    Document: FileText,
    Calendar: Calendar,
    Star: Star,
    Home: Home,
    Gallery: GalleryVerticalEnd,
    Car: Car,
    Plane: Plane,
    Briefcase: Briefcase,
    Heart: Heart,
    Settings: Settings,
    Bookmark: Bookmark,
    Package: Package,
    Building: Building,
    Gift: Gift,
    Coffee: Coffee,
    Compass: Compass,
    Book: Book,
    Leaf: Leaf,
    Music: Music,
    Camera: Camera,
    Smartphone: Smartphone,
    Palette: Palette,
    PenTool: PenTool,
    Globe: Globe,
    Tv: Tv,
    Zap: Zap,
    Award: Award,
    Folder: Folder
  };

  return iconMap[iconName] || Folder;
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchProject = () => {
      setLoading(true)
      const savedProjects = localStorage.getItem("projects")
      
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects) as ProjectData[]
          const foundProject = parsedProjects.find((p) => p.id === projectId)
          
          if (foundProject) {
            setProject(foundProject)
          }
        } catch (err) {
          console.error("Erreur lors du chargement du projet:", err)
        }
      }
      
      setLoading(false)
    }

    fetchProject()
    
    // Ajouter un listener pour les changements de localStorage
    const handleStorageChange = () => {
      fetchProject()
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [projectId])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center">
        <Folder className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Projet non trouvé</h3>
        <p className="text-muted-foreground mt-1">
          Le projet que vous recherchez n&apos;existe pas ou a été supprimé
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/projects')}>
          Retour aux projets
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-none">
        <Button
          variant="ghost"
          className="w-fit pl-2"
          onClick={() => router.push('/dashboard/projects')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <div className="px-6 pb-4 mt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {React.createElement(getIconByName(project.iconName), { 
                className: cn("h-8 w-8", project.color ? "" : "text-foreground"),
                style: project.color ? { color: project.color } : {}
              })}
              <h1 
                className="text-2xl font-medium tracking-tight text-slate-700" 
                style={project.color ? { color: project.color } : {}}
              >
                {project.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 mb-4">
        <Tabs 
          defaultValue={project.subprojects && project.subprojects.length > 0 ? project.subprojects[0].id : "overview"} 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-2">
            {(!project.subprojects || project.subprojects.length === 0) ? (
              <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            ) : (
              project.subprojects.map(subproject => (
                <TabsTrigger 
                  key={subproject.id} 
                  value={subproject.id}
                  onClick={() => router.push(`/dashboard/projects/${projectId}/${subproject.id}`)}
                >
                  {subproject.name}
                </TabsTrigger>
              ))
            )}
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 min-h-0 px-6">
        {/* Contenu principal du projet sera ajouté ici */}
      </main>
    </div>
  )
} 