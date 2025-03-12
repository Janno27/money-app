"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Transaction, columns } from "./columns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "@/components/ui/use-toast"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { MonthRangePicker } from "@/components/ui/month-range-picker"
import { AddTransactionDialog } from "./add-transaction-dialog"

declare module '@tanstack/table-core' {
  interface FilterFns {
    dateRange: FilterFn<Transaction>
  }
}

interface DrawerTransactionsTableProps {
  transactions: Transaction[]
  className?: string
  onTransactionChange?: () => void
}

export function DrawerTransactionsTable({
  transactions,
  className,
  onTransactionChange,
}: DrawerTransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [localSearchQuery, setLocalSearchQuery] = React.useState("")
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = React.useState(false)
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = React.useState(false)
  
  const supabase = createClientComponentClient()

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => 
      transaction.description?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      transaction.category.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      (transaction.subcategory?.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ?? false)
    )
  }, [transactions, localSearchQuery])

  // Extraire les catégories uniques
  const categories = Array.from(new Set(transactions.map(t => t.category.name)))

  // Filtrer les colonnes que nous voulons afficher
  const filteredColumns = React.useMemo<ColumnDef<Transaction>[]>(() => {
    return columns.filter(column => {
      const columnId = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined
      return columnId && ['accounting_date', 'category', 'description', 'amount'].includes(columnId as string)
    })
  }, [])

  const table = useReactTable({
    data: filteredTransactions,
    columns: filteredColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    filterFns: {
      dateRange: (row, id, value: [Date, Date]) => {
        const cellValue = row.getValue(id) as string
        const date = new Date(cellValue)
        return date >= value[0] && date <= value[1]
      },
    },
  })

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    if (range.from && range.to) {
      table.getColumn("accounting_date")?.setFilterValue([range.from, range.to])
    } else {
      table.getColumn("accounting_date")?.setFilterValue(undefined)
    }
  }

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // Vérifier que l'ID existe avant de tenter la suppression
      if (!transaction.id) {
        throw new Error("ID de transaction manquant");
      }

      // 1. D'abord récupérer les remboursements associés à cette transaction
      const { data: refunds, error: refundsError } = await supabase
        .from('refunds')
        .select('id')
        .eq('transaction_id', transaction.id);

      if (refundsError) {
        console.error(`Erreur lors de la récupération des remboursements pour la transaction ${transaction.id}:`, { 
          code: refundsError.code,
          message: refundsError.message,
          details: refundsError.details
        });
        throw refundsError;
      }

      // 2. Si des remboursements existent, les supprimer
      if (refunds && refunds.length > 0) {
        console.info(`Suppression de ${refunds.length} remboursement(s) pour la transaction ${transaction.id}`);
        
        const { error: deleteRefundsError } = await supabase
          .from('refunds')
          .delete()
          .eq('transaction_id', transaction.id);

        if (deleteRefundsError) {
          console.error(`Erreur lors de la suppression des remboursements pour la transaction ${transaction.id}:`, { 
            code: deleteRefundsError.code,
            message: deleteRefundsError.message,
            details: deleteRefundsError.details
          });
          throw deleteRefundsError;
        }
      }

      // 3. Procéder à la suppression de la transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) {
        console.error(`Erreur Supabase lors de la suppression de la transaction ${transaction.id}:`, { 
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      toast({
        title: "Transaction supprimée",
        description: refunds && refunds.length > 0 
          ? `Transaction et ${refunds.length} remboursement(s) associé(s) supprimés avec succès.` 
          : "Transaction supprimée avec succès.",
      });

      onTransactionChange?.();
    } catch (error) {
      // Affiche des informations plus détaillées sur l'erreur
      if (error instanceof Error) {
        console.error(`Erreur lors de la suppression de la transaction ${transaction.id}:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error(`Erreur inconnue lors de la suppression de la transaction ${transaction.id}:`, error);
      }
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la transaction. Veuillez réessayer ou contacter le support.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className={cn("space-y-8 p-6", className)}>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-8"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="justify-between text-muted-foreground text-sm w-[200px]"
            >
              {(table.getColumn("category")?.getFilterValue() as string) || "Toutes les catégories"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {isOpen && (
              <div className="absolute top-full z-50 mt-2 w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <div className="overflow-y-auto flex-1 py-1">
                  <div className="px-2 py-1">
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          table.getColumn("category")?.setFilterValue(undefined)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs",
                          "transition-colors duration-150",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                          !table.getColumn("category")?.getFilterValue() && "text-primary font-medium"
                        )}
                      >
                        <div className="w-3.5" />
                        <span className="flex-1 truncate text-left">Toutes les catégories</span>
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            table.getColumn("category")?.setFilterValue(category)
                            setIsOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs",
                            "transition-colors duration-150",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                            table.getColumn("category")?.getFilterValue() === category && "text-primary font-medium"
                          )}
                        >
                          <div className="w-3.5" />
                          <span className="flex-1 truncate text-left">{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <MonthRangePicker
            onChange={handleDateRangeChange}
            className="w-[250px]"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <ScrollArea className="h-[610px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem 
                        className="text-xs"
                        onClick={() => setEditingTransaction(row.original)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Modifier
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        className="text-xs text-red-500 focus:text-red-500"
                        onClick={() => handleDeleteTransaction(row.original)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500/70" />
                        Supprimer
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Aucune transaction
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={true}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            onTransactionChange?.()
            toast({
              title: "Transaction modifiée",
              description: "La transaction a été modifiée avec succès.",
            })
          }}
        />
      )}

      <AddTransactionDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        isIncome={false}
        onSuccess={() => {
          setIsAddExpenseDialogOpen(false)
          onTransactionChange?.()
          toast({
            title: "Dépense ajoutée",
            description: "La dépense a été ajoutée avec succès.",
          })
        }}
      />

      <AddTransactionDialog
        open={isAddIncomeDialogOpen}
        onOpenChange={setIsAddIncomeDialogOpen}
        isIncome={true}
        onSuccess={() => {
          setIsAddIncomeDialogOpen(false)
          onTransactionChange?.()
          toast({
            title: "Revenu ajouté",
            description: "Le revenu a été ajouté avec succès.",
          })
        }}
      />
    </div>
  )
} 