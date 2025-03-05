"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Transaction } from "@/components/transactions/columns"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EditTransactionDialogProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

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

interface RefundWithUser {
  id: string;
  amount: number;
  refund_date: string;
  description: string | null;
  transaction_id: string;
  user_id: string;
  user: {
    name: string;
  };
}

const formSchema = z.object({
  accounting_date: z.date(),
  category_id: z.string(),
  subcategory_id: z.string().optional(),
  description: z.string(),
  amount: z.coerce.number().positive(),
  user_id: z.string(),
  is_refund: z.boolean().default(false),
  refund_amount: z.coerce.number().positive().optional(),
})

type FormData = z.infer<typeof formSchema>

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionDialogProps) {
  const [users, setUsers] = React.useState<User[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([])
  const [loading, setLoading] = React.useState(false)
  const supabase = createClientComponentClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accounting_date: new Date(transaction.accounting_date),
      category_id: transaction.category.id,
      subcategory_id: transaction.subcategory?.id || "",
      description: transaction.description || "",
      amount: transaction.amount,
      user_id: transaction.user.id,
      is_refund: false,
      refund_amount: undefined,
    },
  })

  // Afficher les remboursements existants
  const [existingRefunds, setExistingRefunds] = React.useState<RefundWithUser[]>([])

  const watchCategoryId = form.watch("category_id")
  const watchIsRefund = form.watch("is_refund")

  const fetchData = async () => {
    try {
      // Récupérer les utilisateurs
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('name')
      
      if (usersData) {
        setUsers(usersData)
      }

      // Récupérer les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Récupérer les sous-catégories
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .order('name')
      
      if (subcategoriesData) {
        setSubcategories(subcategoriesData)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    }
  }

  React.useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const fetchRefunds = async () => {
      const { data: refunds } = await supabase
        .from('refunds')
        .select(`
          *,
          user:users(name)
        `)
        .eq('transaction_id', transaction.id)
        .order('refund_date', { ascending: false })

      if (refunds) {
        setExistingRefunds(refunds)
      }
    }

    fetchRefunds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.id])

  const filteredSubcategories = subcategories.filter(
    (subcategory) => subcategory.category_id === watchCategoryId
  )

  async function onSubmit(values: FormData) {
    try {
      setLoading(true)

      // Mettre à jour la transaction existante
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          accounting_date: format(values.accounting_date, 'yyyy-MM-dd'),
          category_id: values.category_id,
          subcategory_id: values.subcategory_id || null,
          description: values.description,
          amount: values.amount,
          user_id: values.user_id,
        })
        .eq('id', transaction.id)

      if (updateError) throw updateError

      // Si c'est un remboursement, créer une nouvelle transaction
      if (values.is_refund && values.refund_amount) {
        const { error: refundError } = await supabase
          .from('refunds')
          .insert({
            transaction_id: transaction.id,
            amount: values.refund_amount,
            refund_date: format(values.accounting_date, 'yyyy-MM-dd'),
            description: `Remboursement: ${values.description}`,
            user_id: values.user_id
          })

        if (refundError) throw refundError
      }

      toast({
        title: "Transaction mise à jour",
        description: "La transaction a été mise à jour avec succès.",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la transaction.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Trouver la catégorie et la sous-catégorie actuelles
  const currentCategory = categories.find(c => c.id === form.watch('category_id'))?.name || ''
  const currentSubcategory = subcategories.find(s => s.id === form.watch('subcategory_id'))?.name || ''
  const currentUser = users.find(u => u.id === form.watch('user_id'))?.name || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Modifier la transaction</DialogTitle>
          <DialogDescription>
            Modifiez les détails de la transaction ici. Cliquez sur enregistrer une fois terminé.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[calc(85vh-14rem)] pr-4">
              <div className="space-y-4">
                {!watchIsRefund ? (
                  <>
                    <FormField
                      control={form.control}
                      name="accounting_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date comptable</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-muted-foreground text-sm">
                          Informations détaillées
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="category_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Catégorie</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une catégorie" />
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

                        {filteredSubcategories.length > 0 && (
                          <FormField
                            control={form.control}
                            name="subcategory_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sous-catégorie</FormLabel>
                                <Select
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {filteredSubcategories.map((subcategory) => (
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
                        )}

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Description de la transaction" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="user_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Utilisateur</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un utilisateur" />
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
                      </CollapsibleContent>
                    </Collapsible>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border p-4 text-sm">
                      <p>
                        Votre dépense de <span className="font-semibold">{form.watch('amount')}€</span>
                        {currentSubcategory && <> liée à <span className="font-semibold">{currentSubcategory}</span></>} de la catégorie <span className="font-semibold">{currentCategory}</span> créée par <span className="font-semibold">{currentUser}</span>.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="refund_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant du remboursement</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {existingRefunds.length > 0 && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">Remboursements existants :</p>
                    {existingRefunds.map((refund) => (
                      <div key={refund.id} className="text-sm flex justify-between items-center">
                        <div>
                          <span className="text-muted-foreground">
                            {format(new Date(refund.refund_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="mx-2">par</span>
                          <span className="font-medium">{refund.user.name}</span>
                        </div>
                        <span className="font-medium text-[#0ea5e9]">
                          +{refund.amount.toLocaleString('fr-FR')}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!transaction.is_income && (
                  <FormField
                    control={form.control}
                    name="is_refund"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Remboursement
                          </FormLabel>
                          <FormDescription>
                            Créer une transaction de remboursement
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t">
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
