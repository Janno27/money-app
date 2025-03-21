"use client"

import * as React from "react"
import {
  Folder,
  MoreHorizontal,
  Trash2,
  Plus,
  ChevronDown,
  LucideIcon,
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
  Award,
  Edit3,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Project {
  id: string;
  name: string;
  icon: LucideIcon;
  color?: string;
  subprojects?: SubProject[];
}

interface SubProject {
  id: string;
  name: string;
  parentId: string;
  color?: string;
}

const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Terminal", icon: SquareTerminal },
  { name: "Map", icon: Map },
  { name: "Chart", icon: PieChart },
  { name: "Frame", icon: Frame },
  { name: "Document", icon: FileText },
  { name: "Calendar", icon: Calendar },
  { name: "Star", icon: Star },
  { name: "Home", icon: Home },
  { name: "Gallery", icon: GalleryVerticalEnd },
  { name: "Car", icon: Car },
  { name: "Plane", icon: Plane },
  { name: "Briefcase", icon: Briefcase },
  { name: "Heart", icon: Heart },
  { name: "Settings", icon: Settings },
  { name: "Bookmark", icon: Bookmark },
  { name: "Package", icon: Package },
  { name: "Building", icon: Building },
  { name: "Gift", icon: Gift },
  { name: "Coffee", icon: Coffee },
  { name: "Compass", icon: Compass },
  { name: "Book", icon: Book },
  { name: "Leaf", icon: Leaf },
  { name: "Music", icon: Music },
  { name: "Camera", icon: Camera },
  { name: "Smartphone", icon: Smartphone },
  { name: "Palette", icon: Palette },
  { name: "PenTool", icon: PenTool },
  { name: "Globe", icon: Globe },
  { name: "Tv", icon: Tv },
  { name: "Zap", icon: Zap },
  { name: "Award", icon: Award },
  { name: "Folder", icon: Folder },
];

const AVAILABLE_COLORS = [
  { name: "Par défaut", value: "" },
  { name: "Rouge", value: "#e11d48" },
  { name: "Orange", value: "#f97316" },
  { name: "Jaune", value: "#eab308" },
  { name: "Vert", value: "#16a34a" },
  { name: "Bleu", value: "#0ea5e9" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Gris", value: "#6b7280" },
];

export function NavProjects() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set())
  const [newProjectDialogOpen, setNewProjectDialogOpen] = React.useState(false)
  const [newSubprojectDialogOpen, setNewSubprojectDialogOpen] = React.useState(false)
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [newSubprojectName, setNewSubprojectName] = React.useState("")
  const [selectedIcon, setSelectedIcon] = React.useState<string>("Terminal")
  const [selectedColor, setSelectedColor] = React.useState<string>("")
  const [selectedSubprojectColor, setSelectedSubprojectColor] = React.useState<string>("")
  const [editProjectDialogOpen, setEditProjectDialogOpen] = React.useState(false)
  const [editSubprojectDialogOpen, setEditSubprojectDialogOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [editingSubproject, setEditingSubproject] = React.useState<{subproject: SubProject, parentId: string} | null>(null)

  // Charger les projets depuis le localStorage au démarrage
  React.useEffect(() => {
    const savedProjects = localStorage.getItem("projects")
    if (savedProjects) {
      try {
        // Les icônes ne sont pas sérialisables, nous devons les reconstruire
        const parsedProjects = JSON.parse(savedProjects)
        const projectsWithIcons = parsedProjects.map((project: { id: string; name: string; iconName: string; color?: string; subprojects?: SubProject[] }) => ({
          ...project,
          icon: AVAILABLE_ICONS.find(i => i.name === project.iconName)?.icon || Folder
        }))
        setProjects(projectsWithIcons)
      } catch (err) {
        console.error("Erreur lors du chargement des projets:", err)
      }
    }
  }, [])

  // Sauvegarder les projets dans le localStorage à chaque modification
  React.useEffect(() => {
    if (projects.length > 0) {
      // Convertir les icônes en noms d'icônes pour le stockage
      const projectsToSave = projects.map(project => ({
        ...project,
        iconName: AVAILABLE_ICONS.find(i => i.icon === project.icon)?.name || "Folder",
        icon: undefined // Nous n'avons pas besoin de stocker l'objet icône
      }))
      localStorage.setItem("projects", JSON.stringify(projectsToSave))
    }
  }, [projects])

  const toggleProject = (projectId: string, event: React.MouseEvent) => {
    // Si l'utilisateur a cliqué sur l'icône ou le nom du projet, on le dirige vers la page du projet
    if (event.target !== event.currentTarget) {
      router.push(`/dashboard/projects/${projectId}`)
      return
    }
    
    // Sinon, on gère l'expansion/réduction comme avant
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const navigateToProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(`/dashboard/projects/${projectId}`)
  }

  const navigateToSubproject = (projectId: string, subprojectId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(`/dashboard/projects/${projectId}/${subprojectId}`)
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: newProjectName.trim(),
      icon: AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon || Folder,
      color: selectedColor,
      subprojects: []
    }
    
    setProjects([...projects, newProject])
    setNewProjectName("")
    setSelectedIcon("Terminal")
    setSelectedColor("")
    setNewProjectDialogOpen(false)
  }

  const handleAddSubproject = () => {
    if (!newSubprojectName.trim() || !selectedParentId) return
    
    const newSubproject: SubProject = {
      id: `subproject_${Date.now()}`,
      name: newSubprojectName.trim(),
      parentId: selectedParentId,
      color: selectedSubprojectColor
    }
    
    const updatedProjects = projects.map(project => {
      if (project.id === selectedParentId) {
        return {
          ...project,
          subprojects: [...(project.subprojects || []), newSubproject]
        }
      }
      return project
    })
    
    setProjects(updatedProjects)
    setNewSubprojectName("")
    setSelectedSubprojectColor("")
    setSelectedParentId(null)
    setNewSubprojectDialogOpen(false)
    
    // Assurez-vous que le projet parent est développé
    if (selectedParentId && !expandedProjects.has(selectedParentId)) {
      const newExpanded = new Set(expandedProjects)
      newExpanded.add(selectedParentId)
      setExpandedProjects(newExpanded)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId))
  }

  const handleDeleteSubproject = (projectId: string, subprojectId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          subprojects: (project.subprojects || []).filter(sp => sp.id !== subprojectId)
        }
      }
      return project
    })
    
    setProjects(updatedProjects)
  }

  const handleEditProject = () => {
    if (!editingProject || !newProjectName.trim()) return

    const updatedProjects = projects.map(project => {
      if (project.id === editingProject.id) {
        return {
          ...project,
          name: newProjectName.trim(),
          icon: AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon || Folder,
          color: selectedColor
        }
      }
      return project
    })

    setProjects(updatedProjects)
    setEditProjectDialogOpen(false)
    setEditingProject(null)
    setNewProjectName("")
    setSelectedIcon("Terminal")
    setSelectedColor("")
  }

  const handleEditSubproject = () => {
    if (!editingSubproject || !newSubprojectName.trim()) return

    const updatedProjects = projects.map(project => {
      if (project.id === editingSubproject.parentId) {
        return {
          ...project,
          subprojects: (project.subprojects || []).map(sp => {
            if (sp.id === editingSubproject.subproject.id) {
              return {
                ...sp,
                name: newSubprojectName.trim(),
                color: selectedSubprojectColor
              }
            }
            return sp
          })
        }
      }
      return project
    })

    setProjects(updatedProjects)
    setEditSubprojectDialogOpen(false)
    setEditingSubproject(null)
    setNewSubprojectName("")
    setSelectedSubprojectColor("")
  }

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setSelectedIcon(AVAILABLE_ICONS.find(i => i.icon === project.icon)?.name || "Folder")
    setSelectedColor(project.color || "")
    setEditProjectDialogOpen(true)
  }

  const openEditSubprojectDialog = (subproject: SubProject, parentId: string) => {
    setEditingSubproject({ subproject, parentId })
    setNewSubprojectName(subproject.name)
    setSelectedSubprojectColor(subproject.color || "")
    setEditSubprojectDialogOpen(true)
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between pr-2">
          <SidebarGroupLabel>Projets</SidebarGroupLabel>
          <button 
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => setNewProjectDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <SidebarMenu>
          {projects.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => setNewProjectDialogOpen(true)}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <Plus className="text-sidebar-foreground/70" />
                <span>Ajouter un projet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            projects.map((project) => (
              <React.Fragment key={project.id}>
                <SidebarMenuItem className="group">
                  <div className="flex items-center gap-1.5 flex-1 cursor-pointer px-1.5 py-1 rounded-md hover:bg-sidebar-background-highlight" onClick={(e) => toggleProject(project.id, e)}>
                    <project.icon 
                      className={cn(
                        "h-3.5 w-3.5", 
                        project.color ? "" : "text-sidebar-foreground",
                      )}
                      style={project.color ? { color: project.color } : {}}
                      onClick={(e) => navigateToProject(project.id, e)}
                    />
                    <span 
                      className={cn(
                        "text-xs",
                        project.color ? "" : "text-sidebar-foreground"
                      )}
                      style={project.color ? { color: project.color } : {}}
                      onClick={(e) => navigateToProject(project.id, e)}
                    >
                      {project.name}
                    </span>
                    
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-sidebar-foreground/50 hover:text-sidebar-foreground/80 p-1">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-48 rounded-lg"
                          side={isMobile ? "bottom" : "right"}
                          align={isMobile ? "end" : "start"}
                        >
                          <DropdownMenuItem onClick={() => {
                            setSelectedParentId(project.id)
                            setNewSubprojectDialogOpen(true)
                          }}>
                            <Plus className="text-muted-foreground mr-2 h-4 w-4" />
                            <span>Ajouter un sous-projet</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditProjectDialog(project)}>
                            <Edit3 className="text-muted-foreground mr-2 h-4 w-4" />
                            <span>Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className="text-muted-foreground mr-2 h-4 w-4" />
                            <span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </SidebarMenuItem>
                
                {expandedProjects.has(project.id) && project.subprojects && project.subprojects.length > 0 && (
                  <div className="ml-4 pl-1.5 border-l border-sidebar-background-highlight space-y-0.5 mb-1.5">
                    {project.subprojects.map((subproject) => (
                      <SidebarMenuItem key={subproject.id} className="pl-0 group">
                        <div 
                          className="flex items-center gap-1.5 flex-1 px-1.5 py-0.5 rounded-md hover:bg-sidebar-background-highlight cursor-pointer"
                          onClick={(e) => navigateToSubproject(project.id, subproject.id, e)}
                        >
                          <span 
                            className={cn(
                              "text-[11px] ml-1.5",
                              subproject.color ? "" : "text-sidebar-foreground/90"
                            )}
                            style={subproject.color ? { color: subproject.color } : {}}
                          >
                            {subproject.name}
                          </span>
                          
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-sidebar-foreground/50 hover:text-sidebar-foreground/80 p-1">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                className="w-48 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                              >
                                <DropdownMenuItem onClick={() => openEditSubprojectDialog(subproject, project.id)}>
                                  <Edit3 className="text-muted-foreground mr-2 h-4 w-4" />
                                  <span>Modifier</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteSubproject(project.id, subproject.id)}>
                                  <Trash2 className="text-muted-foreground mr-2 h-4 w-4" />
                                  <span>Supprimer</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Dialog pour ajouter un nouveau projet */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un projet</DialogTitle>
            <DialogDescription>
              Créez un nouveau projet pour organiser vos activités
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="project-name" className="text-right text-sm">
                Nom
              </label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du projet"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Icône
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon && (
                        React.createElement(AVAILABLE_ICONS.find(i => i.name === selectedIcon)!.icon, { className: "h-4 w-4" })
                      )}
                      <span>{selectedIcon}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                    <DropdownMenuLabel>Sélectionnez une icône</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedIcon} onValueChange={setSelectedIcon}>
                      {AVAILABLE_ICONS.map((icon) => (
                        <DropdownMenuRadioItem
                          key={icon.name}
                          value={icon.name}
                          className="flex items-center gap-2"
                        >
                          {React.createElement(icon.icon, { className: "h-4 w-4 mr-2" })}
                          {icon.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Couleur
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {selectedColor && (
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedColor }}></div>
                      )}
                      <span>{AVAILABLE_COLORS.find(c => c.value === selectedColor)?.name || "Par défaut"}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Sélectionnez une couleur</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedColor} onValueChange={setSelectedColor}>
                      {AVAILABLE_COLORS.map((color) => (
                        <DropdownMenuRadioItem
                          key={color.name}
                          value={color.value}
                          className="flex items-center gap-2"
                        >
                          {color.value && (
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                          )}
                          {color.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddProject} disabled={!newProjectName.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter un sous-projet */}
      <Dialog open={newSubprojectDialogOpen} onOpenChange={setNewSubprojectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un sous-projet</DialogTitle>
            <DialogDescription>
              Créez un sous-projet pour {projects.find(p => p.id === selectedParentId)?.name || ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="subproject-name" className="text-right text-sm">
                Nom
              </label>
              <Input
                id="subproject-name"
                value={newSubprojectName}
                onChange={(e) => setNewSubprojectName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du sous-projet"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Couleur
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {selectedSubprojectColor && (
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedSubprojectColor }}></div>
                      )}
                      <span>{AVAILABLE_COLORS.find(c => c.value === selectedSubprojectColor)?.name || "Par défaut"}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Sélectionnez une couleur</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedSubprojectColor} onValueChange={setSelectedSubprojectColor}>
                      {AVAILABLE_COLORS.map((color) => (
                        <DropdownMenuRadioItem
                          key={color.name}
                          value={color.value}
                          className="flex items-center gap-2"
                        >
                          {color.value && (
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                          )}
                          {color.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSubprojectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddSubproject} disabled={!newSubprojectName.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un projet */}
      <Dialog open={editProjectDialogOpen} onOpenChange={setEditProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Modifier les détails du projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-project-name" className="text-right text-sm">
                Nom
              </label>
              <Input
                id="edit-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du projet"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Icône
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon && (
                        React.createElement(AVAILABLE_ICONS.find(i => i.name === selectedIcon)!.icon, { className: "h-4 w-4" })
                      )}
                      <span>{selectedIcon}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                    <DropdownMenuLabel>Sélectionnez une icône</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedIcon} onValueChange={setSelectedIcon}>
                      {AVAILABLE_ICONS.map((icon) => (
                        <DropdownMenuRadioItem
                          key={icon.name}
                          value={icon.name}
                          className="flex items-center gap-2"
                        >
                          {React.createElement(icon.icon, { className: "h-4 w-4 mr-2" })}
                          {icon.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Couleur
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {selectedColor && (
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedColor }}></div>
                      )}
                      <span>{AVAILABLE_COLORS.find(c => c.value === selectedColor)?.name || "Par défaut"}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Sélectionnez une couleur</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedColor} onValueChange={setSelectedColor}>
                      {AVAILABLE_COLORS.map((color) => (
                        <DropdownMenuRadioItem
                          key={color.name}
                          value={color.value}
                          className="flex items-center gap-2"
                        >
                          {color.value && (
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                          )}
                          {color.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditProject} disabled={!newProjectName.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un sous-projet */}
      <Dialog open={editSubprojectDialogOpen} onOpenChange={setEditSubprojectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le sous-projet</DialogTitle>
            <DialogDescription>
              Modifier les détails du sous-projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-subproject-name" className="text-right text-sm">
                Nom
              </label>
              <Input
                id="edit-subproject-name"
                value={newSubprojectName}
                onChange={(e) => setNewSubprojectName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du sous-projet"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right text-sm pt-2">
                Couleur
              </span>
              <div className="col-span-3 flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 w-full justify-between">
                      {selectedSubprojectColor && (
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedSubprojectColor }}></div>
                      )}
                      <span>{AVAILABLE_COLORS.find(c => c.value === selectedSubprojectColor)?.name || "Par défaut"}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Sélectionnez une couleur</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedSubprojectColor} onValueChange={setSelectedSubprojectColor}>
                      {AVAILABLE_COLORS.map((color) => (
                        <DropdownMenuRadioItem
                          key={color.name}
                          value={color.value}
                          className="flex items-center gap-2"
                        >
                          {color.value && (
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                          )}
                          {color.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubprojectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubproject} disabled={!newSubprojectName.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
