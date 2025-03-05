"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  HeaderGroup,
  Header,
  Cell,
} from "@tanstack/react-table"
import { Table as TableIcon, ChevronDown, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { columns, Transaction } from "./columns"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface TransactionsTableProps {
  transactions: Transaction[]
  className?: string
  onTransactionChange?: () => void
}

export function TransactionsTable({ 
  transactions,
  className,
  onTransactionChange,
}: TransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "accounting_date", desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const modalRef = React.useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Extraire les catégories uniques
  const categories = Array.from(new Set(transactions.map(t => t.category.name)))

  // Fermer le popover lors d'un clic à l'extérieur
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) throw error

      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès.",
      })

      onTransactionChange?.()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la transaction.",
        variant: "destructive",
      })
    }
  }

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      dateRange: () => true,
    },
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/accounting" className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
          <TableIcon className="h-4 w-4 text-blue-500" />
        </Link>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Rechercher..."
            value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="max-w-sm text-sm"
          />
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
              <div 
                ref={modalRef}
                className="absolute right-0 top-full mt-1 bg-background rounded-lg shadow-lg w-[200px] max-h-[300px] flex flex-col overflow-hidden border z-50"
              >
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="flex-1 bg-transparent border-none text-xs focus:outline-none placeholder:text-muted-foreground/50"
                      autoFocus
                    />
                  </div>
                </div>

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
                      {categories
                        .filter(category => 
                          category.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((category) => (
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
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<Transaction>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<Transaction, unknown>) => (
                  <TableHead key={header.id} className="text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
        <ScrollArea className="h-[320px]">
          <Table>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<Transaction>) => (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        {row.getVisibleCells().map((cell: Cell<Transaction, unknown>) => (
                          <TableCell key={cell.id} className="text-xs py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    className="h-24 text-center text-sm"
                  >
                    Aucune transaction trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
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
    </Card>
  )
}