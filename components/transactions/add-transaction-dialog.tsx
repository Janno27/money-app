"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  id: string
  name: string
  avatar: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'fixed_expense'
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

const formSchema = z.object({
  category_id: z.string({
    required_error: "La catégorie est requise",
  }),
  subcategory_id: z.string().optional(),
  amount: z.string().min(1, "Le montant est requis"),
  description: z.string().optional(),
  transaction_date: z.date({
    required_error: "La date est requise",
  }),
  accounting_date: z.date({
    required_error: "La date comptable est requise",
  }),
  is_couple: z.boolean().default(true),
  user_id: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isIncome: boolean
  onSuccess?: () => void
  defaultDate?: Date | null
}

export function AddTransactionDialog({ 
  open, 
  onOpenChange,
  isIncome,
  onSuccess,
  defaultDate
}: AddTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const supabase = createClientComponentClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category_id: "",
      subcategory_id: "",
      expense_type: "individual",
      split_ratio: 50,
      accounting_date: defaultDate || new Date(),
      transaction_date: defaultDate || new Date(),
    },
  })

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar')
          .order('name')

        if (error) {
          console.error('Error fetching users:', error)
          return
        }

        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    if (open && !isIncome) {
      fetchUsers()
    }
  }, [open, isIncome, supabase])

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', isIncome ? 'income' : 'expense')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
          return
        }

        if (data) {
          console.log('Categories loaded:', data)
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    if (open) {
      fetchCategories()
    }
  }, [isIncome, open, supabase])

  // Charger les sous-catégories quand une catégorie est sélectionnée
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) return

      try {
        const { data, error } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', selectedCategoryId)
          .order('name')

        if (error) {
          console.error('Error fetching subcategories:', error)
          return
        }

        if (data) {
          console.log('Subcategories loaded:', data)
          setSubcategories(data)
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error)
      }
    }

    if (selectedCategoryId) {
      fetchSubcategories()
    }
  }, [selectedCategoryId, supabase])

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error("Utilisateur non connecté")

      const transactionData = {
        amount: parseFloat(values.amount),
        description: values.description || null,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        accounting_date: format(values.accounting_date, 'yyyy-MM-dd'),
        is_income: isIncome,
        user_id: values.user_id || userData.user.id,
        category_id: values.category_id,
        subcategory_id: values.subcategory_id || null,
        expense_type: isIncome ? 'couple' : (values.is_couple ? 'couple' : 'individual'),
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)

      if (transactionError) {
        console.error('Transaction error:', transactionError)
        throw new Error(transactionError.message)
      }

      form.reset()
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error adding transaction:', error)
      if (error instanceof Error) {
        form.setError('root', {
          type: 'submit',
          message: `Erreur lors de l'ajout de la transaction: ${error.message}`
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const watchIsCouple = form.watch('is_couple')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isIncome ? "Ajouter un revenu" : "Ajouter une dépense"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour ajouter une nouvelle transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedCategoryId(value)
                      form.setValue('subcategory_id', '') // Reset subcategory when category changes
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sous-catégorie (optionnel)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategoryId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une sous-catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Description de la transaction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={format(field.value, "d MMMM yyyy", { locale: fr })}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accounting_date"
                render={({ field: { value, onChange }}) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date comptable</FormLabel>
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      placeholder="Sélectionner une date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isIncome && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Options avancées
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="is_couple"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Dépense de couple
                          </FormLabel>
                          <FormDescription>
                            Cette dépense sera partagée entre les membres du couple
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchIsCouple && (
                    <FormField
                      control={form.control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un utilisateur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
