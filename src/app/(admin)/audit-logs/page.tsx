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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuditLogDetailsModal } from "@/shared/components/admin/dashboard/audit-logs/modal";
import { api } from "@/shared/data/api";
import { IAuditLogs, IPaginatedResponse } from "@/shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// AuditLog actions component
function AuditLogActions(
  row: Readonly<IAuditLogs>,
  onViewDetails: (log: IAuditLogs) => void,
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(row)}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(row.id);
              toast.success("ID copied to clipboard");
            } catch (err) {
              toast.error("Failed to copy ID");
            }
          }}
        >
          Copy ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AuditLogPage() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<IAuditLogs | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const columns: ColumnDef<IAuditLogs>[] = [
    {
      accessorKey: "actorType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actor Type" />
      ),
      cell: ({ row }) => row.getValue("actorType"),
      enableColumnFilter: true,
      meta: {
        label: "Actor Type",
        filterType: "text",
        placeholder: "Search by actor type...",
      },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      enableColumnFilter: true,
      meta: {
        label: "Action",
        filterType: "text",
        placeholder: "Search by action...",
      },
    },
    {
      accessorKey: "resourceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource Type" />
      ),
      enableColumnFilter: true,
      meta: {
        label: "Resource Type",
        filterType: "text",
        placeholder: "Search by resource type...",
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === 'success' ? 'success' : 'destructive'}>
            {status as string}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Status",
        filterType: "select",
        options: [
          { label: "Success", value: "success" },
          { label: "Failure", value: "failure" },
        ],
      },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Timestamp" />
        ),
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt");
            return createdAt ? dayjs(createdAt as string).format("DD/MM/YYYY HH:mm") : "-";
        },
        enableColumnFilter: true,
        meta: {
          filterType: "date",
          label: "Timestamp",
        },
        size: 150,
      },
  ];

  const getAuditLogs = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IAuditLogs>>("/audit", {
      params,
    });
    return response;
  };

  const onViewDetails = (log: IAuditLogs) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Audit Log Management</h1>
        <p className="text-muted-foreground">
          Review system and user activities
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Audit Log Management</h1>
      <p className="text-muted-foreground">Review system and user activities</p>

      <DataTable<IAuditLogs, unknown>
        columns={columns}
        queryKey={["audit-logs"]}
        queryFn={getAuditLogs}
        searchColumn="actorName"
        searchPlaceholder="Search logs..."
        initialFilters={{}}
        emptyMessage="No audit logs found."
        columnActions={(row) => AuditLogActions(row, onViewDetails)}
      />

      <AuditLogDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        log={selectedLog}
      />
    </Card>
  );
}