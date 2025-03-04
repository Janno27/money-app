"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Folder, MoreHorizontal, Plus, Calendar, Users, MessageSquare, CheckSquare, Clock, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

const getIconByName = (iconName: string): LucideIcon => {
  // Fonction simplifiée pour l'exemple - vous pouvez étendre cela avec tous vos icônes
  return Folder;
}

export function SubprojectDetailPage({ projectId, subprojectId }: { projectId: string, subprojectId: string }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [subproject, setSubproject] = useState<SubProject | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      setLoading(true)
      const savedProjects = localStorage.getItem("projects")
      
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects)
          const foundProject = parsedProjects.find((p: any) => p.id === projectId)
          
          if (foundProject) {
            setProject(foundProject)
            
            if (foundProject.subprojects) {
              const foundSubproject = foundProject.subprojects.find((s: any) => s.id === subprojectId)
              if (foundSubproject) {
                setSubproject(foundSubproject)
              }
            }
          }
        } catch (err) {
          console.error("Erreur lors du chargement des données:", err)
        }
      }
      
      setLoading(false)
    }

    fetchData()
    
    // Ajouter un listener pour les changements de localStorage
    const handleStorageChange = () => {
      fetchData()
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [projectId, subprojectId])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>
  }

  if (!project || !subproject) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center">
        <Folder className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Sous-projet non trouvé</h3>
        <p className="text-muted-foreground mt-1">
          Le sous-projet que vous recherchez n'existe pas ou a été supprimé
        </p>
        <Button 
          className="mt-4" 
          onClick={() => project ? router.push(`/dashboard/projects/${projectId}`) : router.push('/dashboard/projects')}
        >
          {project ? "Retour au projet" : "Retour aux projets"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour au projet
          </Button>
          
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "w-3 h-3 rounded-full",
                subproject.color ? "" : "bg-slate-400"
              )}
              style={subproject.color ? { backgroundColor: subproject.color } : {}}
            />
            <h1 
              className="text-2xl font-medium tracking-tight" 
              style={subproject.color ? { color: subproject.color } : {}}
            >
              {subproject.name}
            </h1>
            <Badge variant="outline" className="ml-2">
              Sous-projet de {project.name}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" /> Modifier
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Supprimer</DropdownMenuItem>
              <DropdownMenuItem>Archiver</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          {subproject.description || "Aucune description"}
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2" /> Tâches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progression</span>
                      <span>0/0</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">Pas de tâches</p>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter une tâche
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" /> Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">Pas de notes</p>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter une note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" /> Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">Aucune activité récente</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" /> Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">Aucun participant</p>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter des participants
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="flex-1">
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">Fonctionnalité à venir</p>
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="flex-1">
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">Fonctionnalité à venir</p>
          </div>
        </TabsContent>
        
        <TabsContent value="files" className="flex-1">
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-muted-foreground">Fonctionnalité à venir</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 