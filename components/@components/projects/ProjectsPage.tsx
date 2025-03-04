"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowRight, Folder, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
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
  subprojects?: SubProjectData[];
  description?: string;
  createdAt?: string;
}

interface SubProjectData {
  id: string;
  name: string;
  parentId: string;
  color?: string;
  description?: string;
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

export function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Charger les projets depuis le localStorage
  useEffect(() => {
    const loadProjects = () => {
      const savedProjects = localStorage.getItem("projects")
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects) as ProjectData[]
          setProjects(parsedProjects)
        } catch (err) {
          console.error("Erreur lors du chargement des projets:", err)
        }
      }
    }

    loadProjects()
    
    // Ajouter un listener pour les changements de localStorage
    const handleStorageChange = () => {
      loadProjects()
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Filtrer les projets en fonction de la recherche et de l'onglet actif
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "all") {
      return matchesSearch
    }
    
    // Pour les onglets supplémentaires, vous pouvez ajouter d'autres conditions ici
    
    return matchesSearch
  })

  const navigateToProject = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-slate-700">Projets</h1>
        <p className="text-md text-slate-600">
          Gérez et organisez tous vos projets et sous-projets
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button onClick={() => {}}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau projet
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="recent">Récents</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1">
          <ScrollArea className="h-[calc(100vh-260px)]">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center">
                <Folder className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-medium">Aucun projet trouvé</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Essayez une autre recherche" : "Créez votre premier projet pour commencer"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => {}}>
                    <Plus className="mr-2 h-4 w-4" /> Créer un projet
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map(project => (
                  <Card 
                    key={project.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigateToProject(project.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {React.createElement(getIconByName(project.iconName), { 
                          className: cn("h-5 w-5", project.color ? "" : "text-foreground"),
                          style: project.color ? { color: project.color } : {}
                        })}
                        <CardTitle style={project.color ? { color: project.color } : {}}>
                          {project.name}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {project.description || "Aucune description"}
                        {project.subprojects && project.subprojects.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {project.subprojects.length} sous-projets
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {project.subprojects && project.subprojects.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Sous-projets:</div>
                          <div className="flex flex-wrap gap-2">
                            {project.subprojects.slice(0, 3).map(subproject => (
                              <Badge 
                                key={subproject.id} 
                                variant="secondary"
                                style={subproject.color ? { color: subproject.color, borderColor: subproject.color } : {}}
                              >
                                {subproject.name}
                              </Badge>
                            ))}
                            {project.subprojects.length > 3 && (
                              <Badge variant="outline">+{project.subprojects.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                        <span>Créé le {new Date(project.createdAt || Date.now()).toLocaleDateString("fr-FR")}</span>
                        <Button variant="ghost" size="sm" className="gap-1 ml-auto -mr-2">
                          Voir <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="recent" className="flex-1">
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">Fonctionnalité à venir</p>
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="flex-1">
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">Fonctionnalité à venir</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 