"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash, Edit, ChevronRight, ChevronDown, Tag, FileText, AlertOctagon, AlertTriangle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'fixed_expense'
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

export function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string, category_id: string} | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubcategory, setShowAddSubcategory] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteItemInfo, setDeleteItemInfo] = useState<{
    id: string, 
    name: string, 
    isCategory: boolean, 
    transactionCount: number
  } | null>(null)
  
  const supabase = createClientComponentClient()

  // Charger les catégories et sous-catégories
  useEffect(() => {
    fetchCategories()
  }, [categoryType])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('type', categoryType)
        .order('name')

      if (categoriesError) throw categoriesError

      if (categoriesData) {
        const categoriesWithSubcategories: Category[] = []

        // Pour chaque catégorie, récupérer ses sous-catégories
        for (const category of categoriesData) {
          const { data: subcategoriesData, error: subcategoriesError } = await supabase
            .from('subcategories')
            .select('*')
            .eq('category_id', category.id)
            .order('name')

          if (subcategoriesError) throw subcategoriesError

          categoriesWithSubcategories.push({
            ...category,
            subcategories: subcategoriesData || []
          })
        }

        setCategories(categoriesWithSubcategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const getTransactionCount = async (id: string, isCategory: boolean) => {
    try {
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq(isCategory ? 'category_id' : 'subcategory_id', id)
      
      if (error) throw error
      
      return count || 0
    } catch (error) {
      console.error('Error counting transactions:', error)
      return 0
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategoryName.trim(), 
          type: categoryType 
        }])
        .select()

      if (error) throw error

      setNewCategoryName('')
      setShowAddCategory(false)
      await fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name.trim() })
        .eq('id', editingCategory.id)

      if (error) throw error

      setEditingCategory(null)
      await fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const confirmDeleteCategory = async (categoryId: string, name: string) => {
    const count = await getTransactionCount(categoryId, true)
    setDeleteItemInfo({
      id: categoryId,
      name,
      isCategory: true,
      transactionCount: count
    })
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteSubcategory = async (subcategoryId: string, name: string) => {
    const count = await getTransactionCount(subcategoryId, false)
    setDeleteItemInfo({
      id: subcategoryId,
      name,
      isCategory: false,
      transactionCount: count
    })
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteItemInfo) return
    
    try {
      if (deleteItemInfo.isCategory) {
        // Supprimer d'abord toutes les sous-catégories associées
        const { error: subcategoryError } = await supabase
          .from('subcategories')
          .delete()
          .eq('category_id', deleteItemInfo.id)

        if (subcategoryError) throw subcategoryError

        // Puis supprimer la catégorie
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', deleteItemInfo.id)

        if (error) throw error
      } else {
        // Supprimer la sous-catégorie
        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', deleteItemInfo.id)

        if (error) throw error
      }

      await fetchCategories()
      toast({
        title: "Suppression réussie",
        description: `${deleteItemInfo.isCategory ? "Catégorie" : "Sous-catégorie"} supprimée avec succès.`,
      })
    } catch (error) {
      console.error('Error deleting:', error)
      toast({
        title: "Erreur de suppression",
        description: "Une erreur s'est produite lors de la suppression.",
        variant: "destructive",
      })
    }
  }

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryId) return

    try {
      const { error } = await supabase
        .from('subcategories')
        .insert([{ 
          name: newSubcategoryName.trim(), 
          category_id: selectedCategoryId 
        }])

      if (error) throw error

      setNewSubcategoryName('')
      setSelectedCategoryId(null)
      setShowAddSubcategory(false)
      await fetchCategories()
    } catch (error) {
      console.error('Error adding subcategory:', error)
    }
  }

  const handleEditSubcategory = async () => {
    if (!editingSubcategory || !editingSubcategory.name.trim()) return

    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ name: editingSubcategory.name.trim() })
        .eq('id', editingSubcategory.id)

      if (error) throw error

      setEditingSubcategory(null)
      await fetchCategories()
    } catch (error) {
      console.error('Error updating subcategory:', error)
    }
  }

  const renderCategoryItem = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id} className="mb-2">
        <div className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded-sm px-2 group">
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCategory(category.id)}>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{category.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
              onClick={(e) => {
                e.stopPropagation()
                setEditingCategory(category)
              }}
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              className="text-muted-foreground hover:text-destructive p-1 rounded-sm"
              onClick={(e) => {
                e.stopPropagation()
                confirmDeleteCategory(category.id, category.name)
              }}
            >
              <Trash className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {isExpanded && category.subcategories && category.subcategories.length > 0 && (
          <div className="ml-5 mt-1 space-y-1">
            {category.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="flex items-center justify-between py-1 hover:bg-muted/50 rounded-sm pl-4 pr-1 group">
                <span className="text-xs text-muted-foreground">{subcategory.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSubcategory(subcategory)
                    }}
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDeleteSubcategory(subcategory.id, subcategory.name)
                    }}
                  >
                    <Trash className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 pb-20">
        <Tabs 
          defaultValue="expense" 
          value={categoryType}
          onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="expense">Dépenses</TabsTrigger>
              <TabsTrigger value="income">Revenus</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-4">
              <button 
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                onClick={() => {
                  setSelectedCategoryId(null)
                  setShowAddSubcategory(true)
                }}
              >
                <Plus className="h-3 w-3" />
                Sous-catégorie
              </button>
              <button 
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                onClick={() => setShowAddCategory(true)}
              >
                <Plus className="h-3 w-3" />
                Catégorie
              </button>
            </div>
          </div>
        </Tabs>
        
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>Chargement des catégories...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertOctagon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Aucune catégorie trouvée. Créez-en une pour commencer.
                </p>
                <button 
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="h-3 w-3" />
                  Ajouter une catégorie
                </button>
              </div>
            ) : (
              categories.map(renderCategoryItem)
            )}
          </div>
        )}
        
        {/* Modale pour ajouter une catégorie */}
        <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une catégorie</DialogTitle>
              <DialogDescription>
                Créez une nouvelle catégorie pour vos {categoryType === 'expense' ? 'dépenses' : 'revenus'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCategory}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modale pour éditer une catégorie */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier la catégorie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="edit-name"
                  value={editingCategory?.name || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditCategory}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modale pour ajouter une sous-catégorie */}
        <Dialog open={showAddSubcategory} onOpenChange={setShowAddSubcategory}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une sous-catégorie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Catégorie
                </Label>
                <Select
                  value={selectedCategoryId || ''}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subname" className="text-right">
                  Nom
                </Label>
                <Input
                  id="subname"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddSubcategory} disabled={!selectedCategoryId}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modale pour éditer une sous-catégorie */}
        <Dialog open={!!editingSubcategory} onOpenChange={(open) => !open && setEditingSubcategory(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier la sous-catégorie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subname" className="text-right">
                  Nom
                </Label>
                <Input
                  id="edit-subname"
                  value={editingSubcategory?.name || ''}
                  onChange={(e) => setEditingSubcategory(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditSubcategory}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialogue de confirmation de suppression */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            
            <div className="py-3">
              {deleteItemInfo && deleteItemInfo.transactionCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center text-amber-500 gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Attention : Cette action ne peut pas être annulée.</span>
                  </div>
                  <div>
                    La suppression de {deleteItemInfo.isCategory ? "la catégorie" : "la sous-catégorie"} <strong>{deleteItemInfo.name}</strong> affectera <strong>{deleteItemInfo.transactionCount}</strong> transaction{deleteItemInfo.transactionCount > 1 ? "s" : ""}.
                  </div>
                  <div>
                    Ces transactions resteront dans votre compte mais n'auront plus de {deleteItemInfo.isCategory ? "catégorie" : "sous-catégorie"} associée.
                  </div>
                </div>
              ) : (
                <div>
                  Êtes-vous sûr de vouloir supprimer {deleteItemInfo?.isCategory ? "la catégorie" : "la sous-catégorie"} <strong>{deleteItemInfo?.name}</strong> ?
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirmed}
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
} 