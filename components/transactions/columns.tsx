import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { cn } from "@/lib/utils"

export interface Transaction {
  id: string
  amount: number
  description: string | null
  transaction_date: string
  accounting_date: string
  category_id: string
  subcategory_id: string | null
  user_id: string
  expense_type: 'individual' | 'couple'
  is_income: boolean
  split_ratio: number | null
  created_at: string
  refunded_amount: number | null
  final_amount: number
  category: {
    id: string
    name: string
  }
  subcategory?: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
    avatar: string
  }
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "accounting_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date comptable" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.accounting_date), 'dd MMM yyyy', { locale: fr })}
      </span>
    ),
    filterFn: "dateRange",
  },
  {
    id: "category",
    accessorFn: row => row.category?.name || '-',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Catégorie" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.category?.name || '-'}</span>
        {row.original.subcategory && (
          <span className="text-muted-foreground text-[10px]">
            {row.original.subcategory.name}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => (
      <div className="text-right flex flex-col items-end min-h-[2.5rem] justify-center">
        <div className={cn(
          "font-medium tabular-nums",
          row.original.is_income ? "text-[#0ea5e9]" : "text-[#f43f5e]"
        )}>
          {row.original.is_income ? "+" : "-"}
          {row.original.final_amount.toLocaleString('fr-FR')}€
        </div>
        {row.original.refunded_amount != null && row.original.refunded_amount > 0 && (
          <div className="text-xs text-muted-foreground">
            Remboursé: {row.original.refunded_amount.toLocaleString('fr-FR')}€
          </div>
        )}
      </div>
    ),
  },
  {
    id: "user",
    accessorFn: row => row.user.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Utilisateur" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-5 w-5">
          <AvatarImage src={row.original.user.avatar} />
          <AvatarFallback className="text-[10px]">
            {row.original.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-muted-foreground">
          {row.original.user.name}
        </span>
      </div>
    ),
  },
] 