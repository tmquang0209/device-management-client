"use client";

import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionModal } from "@/shared/components/admin/payment/transactions/modal";
import { EPaymentMethod, EPaymentStatus, EReconciliationStatus } from "@/shared/constants/admin/payment";
import { api } from "@/shared/data/api";
import { IPaginatedResponse, IPaymentTransactionInfo } from "@/shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Transaction actions component
function TransactionActions(
  row: Readonly<IPaymentTransactionInfo>,
  onDelete: (transaction: IPaymentTransactionInfo) => void,
  onEdit: (transaction: IPaymentTransactionInfo) => void,
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(row.id);
              toast.success("ID copied to clipboard");
            } catch {
              toast.error("Failed to copy ID");
            }
          }}
        >
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(row)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<IPaymentTransactionInfo>[] = [
  {
    accessorKey: "user.fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Full Name",
      filterType: "text",
      placeholder: "Search by Full Name...",
    },
  },
  {
    accessorKey: "provider.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Provider",
      filterType: "text",
      placeholder: "Search by Provider...",
    },
  },
  {
    accessorKey: "providerTxnId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider Txn" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>,
    enableColumnFilter: true,
    meta: {
      label: "Status",
      filterType: "select",
      options: Object.values(EPaymentStatus).map((status) => ({
        label: status,
        value: status,
      })),
    },
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Method" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Payment Method",
      filterType: "select",
      options: Object.values(EPaymentMethod).map((method) => ({
        label: method,
        value: method,
      })),
    },
  },
  {
    accessorKey: "reconStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recon Status" />
    ),
    cell: ({ row }) => <Badge>{row.getValue("reconStatus")}</Badge>,
    enableColumnFilter: true,
    meta: {
      label: "Recon Status",
      filterType: "select",
      options: Object.values(EReconciliationStatus).map((status) => ({
        label: status,
        value: status,
      })),
    },
  },
  {
    accessorKey: "currency",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Currency" />
    ),
  },
  {
    accessorKey: "amountMinor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amountMinor"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount / 100);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "feeMinor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fee" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("feeMinor"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount / 100);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "netMinor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Net" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("netMinor"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount / 100);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt") as Date).format("DD/MM/YYYY HH:mm"),
  },
];

export default function TransactionPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTransactions = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IPaymentTransactionInfo>>(
      "/payments/transactions",
      {
        params,
      },
    );
    return response;
  };

  const onCreateTransaction = () => {
    setType("create");
    setSelectedTransactionId(null);
    setOpen(true);
  };

  const onDeleteTransaction = (transaction: IPaymentTransactionInfo) => {
    setType("delete");
    setSelectedTransactionId(transaction.id);
    setOpen(true);
  };

  const onEditTransaction = (transaction: IPaymentTransactionInfo) => {
    setType("edit");
    setSelectedTransactionId(transaction.id);
    setOpen(true);
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground">
          Manage payment transactions
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Transaction Management</h1>
      <p className="text-muted-foreground">
        Manage payment transactions
      </p>

      <DataTable<IPaymentTransactionInfo, unknown>
        columns={columns}
        queryKey={["payment-transactions"]}
        queryFn={getTransactions}
        searchColumn="providerTxnId"
        searchPlaceholder="Search transactions..."
        initialFilters={{}}
        emptyMessage="No transactions found."
        globalActions={
          <Button onClick={onCreateTransaction}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          TransactionActions(row, onDeleteTransaction, onEditTransaction)
        }
      />

      <TransactionModal
        key={`${type}-${selectedTransactionId}`}
        isOpen={open}
        onOpenChange={setOpen}
        type={type}
        selectedTransactionId={selectedTransactionId}
      />
    </Card>
  );
}
