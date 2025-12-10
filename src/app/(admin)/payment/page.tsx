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
import { PaymentProviderModal } from "@/shared/components/admin/payment/provider-modal"; // Correct path
import { api } from "@/shared/data/api";
import { IPaginatedResponse, IPaymentProviderInfo } from "@/shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Payment Provider actions component
function PaymentProviderActions(
  row: Readonly<IPaymentProviderInfo>,
  onDelete: (provider: IPaymentProviderInfo) => void,
  onEdit: (provider: IPaymentProviderInfo) => void,
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

const columns: ColumnDef<IPaymentProviderInfo>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider Code" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Provider Code",
      filterType: "text",
      placeholder: "Search by code...",
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider Name" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Provider Name",
      filterType: "text",
      placeholder: "Search by name...",
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <Badge variant={"outline"}>Yes</Badge>
      ) : (
        <Badge variant={"destructive"}>No</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: "Active",
      filterType: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt") as Date).format("DD/MM/YYYY HH:mm"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Created At",
    },
    size: 150,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("updatedAt") as Date).format("DD/MM/YYYY HH:mm"),
    enableColumnFilter: true,
    size: 150,
  },
];

export default function PaymentPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPaymentProviders = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IPaymentProviderInfo>>(
      "/payments/providers",
      {
        params,
      },
    );
    return response;
  };

  const onCreateProvider = () => {
    setType("create");
    setSelectedProviderId(null);
    setOpen(true);
  };

  const onDeleteProvider = (provider: IPaymentProviderInfo) => {
    setType("delete");
    setSelectedProviderId(provider.id);
    setOpen(true);
  };

  const onEditProvider = (provider: IPaymentProviderInfo) => {
    setType("edit");
    setSelectedProviderId(provider.id);
    setOpen(true);
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Payment Provider Management</h1>
        <p className="text-muted-foreground">
          Manage payment gateway integrations
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Payment Provider Management</h1>
      <p className="text-muted-foreground">
        Manage payment gateway integrations
      </p>

      <DataTable<IPaymentProviderInfo, unknown>
        columns={columns}
        queryKey={["payment-providers"]}
        queryFn={getPaymentProviders}
        searchColumn="name"
        searchPlaceholder="Search providers..."
        initialFilters={{}}
        emptyMessage="No payment providers found."
        globalActions={
          <Button onClick={onCreateProvider}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          PaymentProviderActions(row, onDeleteProvider, onEditProvider)
        }
      />

      <PaymentProviderModal
        key={`${type}-${selectedProviderId}`}
        isOpen={open}
        onOpenChange={setOpen}
        type={type}
        selectedProviderId={selectedProviderId}
      />
    </Card>
  );
}
