"use client";

import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { queryClient } from "@/lib/query-client";
import { ConfigModal } from "@/shared/components/admin/config/modal";
import { api } from "@/shared/data/api";
import { IPaginatedResponse } from "@/shared/interfaces";
import { IConfigInfo } from "@/shared/interfaces/config.interface";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  MoreHorizontal,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Config actions component
function ConfigActions(
  row: Readonly<IConfigInfo>,
  onDelete: (config: IConfigInfo) => void,
  onEdit: (config: IConfigInfo) => void,
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

// Batch actions component
interface BatchActionsProps {
  selectedRows: IConfigInfo[];
  isProcessingBatch: boolean;
  onBatchStatusUpdate: (isActive: boolean) => void;
  onBatchDelete: () => void;
}

function BatchActions({
  selectedRows,
  isProcessingBatch,
  onBatchStatusUpdate,
  onBatchDelete,
}: Readonly<BatchActionsProps>) {
  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onBatchStatusUpdate(true)}
        disabled={isProcessingBatch}
      >
        <ToggleRight className="mr-2 h-4 w-4" />
        Activate
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onBatchStatusUpdate(false)}
        disabled={isProcessingBatch}
      >
        <ToggleLeft className="mr-2 h-4 w-4" />
        Deactivate
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onBatchDelete}
        disabled={isProcessingBatch}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}

const columns: ColumnDef<IConfigInfo>[] = [
  {
    accessorKey: "key",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Key" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Key",
      filterType: "text",
      placeholder: "Search by key...",
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Value",
      filterType: "text",
      placeholder: "Search by value...",
    },
    cell: ({ row }) => {
      const value = row.getValue("value");
      const valueType = row.original.valueType;
      if (valueType === "boolean") {
        return value ? (
          <Badge variant={"outline"}>True</Badge>
        ) : (
          <Badge variant={"destructive"}>False</Badge>
        );
      }
      return value;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => row.getValue("description") || "-",
    enableColumnFilter: true,
    meta: {
      label: "Description",
      filterType: "text",
      placeholder: "Search by description...",
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <Badge variant={"success"}>Yes</Badge>
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
    accessorKey: "valueType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value Type" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Value Type",
      filterType: "text",
      placeholder: "Search by value type...",
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY HH:mm"),
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
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY HH:mm"),
    enableColumnFilter: true,
    size: 150,
  },
];

export default function ConfigPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedConfigValueType, setSelectedConfigValueType] = useState<
    string | undefined
  >(undefined);
  const [selectedRows, setSelectedRows] = useState<IConfigInfo[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRowSelectionChange = useCallback(
    (selectedRowsData: IConfigInfo[], clearSelectionFn: () => void) => {
      setSelectedRows(selectedRowsData);
      setClearSelection(() => clearSelectionFn);
    },
    [],
  );

  const getConfigs = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IConfigInfo>>(
      "/configs",
      {
        params,
      },
    );
    return response;
  };

  // Batch operations
  const handleBatchStatusUpdate = async (isActive: boolean) => {
    if (selectedRows.length === 0) return;

    setIsProcessingBatch(true);
    try {
      const configIds = selectedRows.map((config) => config.id);
      await api.patch("/configs/batch/status", {
        ids: configIds,
        isActive,
      });

      toast.success(
        `${selectedRows.length} configurations ${isActive ? "activated" : "deactivated"} successfully`,
      );
      setSelectedRows([]);
      // Clear row selection in table
      if (clearSelection) {
        clearSelection();
      }
      // Refresh the table data by invalidating queries if using react-query
      queryClient.invalidateQueries({ queryKey: ["configs"] });
    } catch (error) {
      toast.error(
        (error as string) || "Failed to update configurations status",
      );
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    setShowDeleteConfirm(false);
    setIsProcessingBatch(true);
    try {
      const configIds = selectedRows.map((config) => config.id);
      await api.delete("/configs/delete-batch", {
        data: { ids: configIds },
      });

      toast.success(
        `${selectedRows.length} configurations deleted successfully`,
      );
      setSelectedRows([]);
      // Clear row selection in table
      if (clearSelection) {
        clearSelection();
      }
      // Refresh the table data
      queryClient.invalidateQueries({ queryKey: ["configs"] });
    } catch (error) {
      toast.error((error as string) || "Failed to delete configurations");
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const onCreateConfig = () => {
    setType("create");
    setSelectedConfigId(null);
    setSelectedConfigValueType(undefined); // Reset value type for new config
    setOpen(true);
  };

  const onDeleteConfig = (config: IConfigInfo) => {
    setType("delete");
    setSelectedConfigId(config.id);
    setSelectedConfigValueType(config.valueType);
    setOpen(true);
  };

  const onEditConfig = (config: IConfigInfo) => {
    setType("edit");
    setSelectedConfigId(config.id);
    setSelectedConfigValueType(config.valueType);
    setOpen(true);
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Configuration Management</h1>
        <p className="text-muted-foreground">Manage system configurations</p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Configuration Management</h1>
      <p className="text-muted-foreground">Manage system configurations</p>

      <DataTable<IConfigInfo, unknown>
        columns={columns}
        queryKey={["configs"]}
        queryFn={getConfigs}
        searchColumn="key"
        searchPlaceholder="Search configurations..."
        initialFilters={{}}
        emptyMessage="No configurations found."
        onRowSelectionChange={handleRowSelectionChange}
        globalActions={
          <div className="flex items-center gap-2">
            <BatchActions
              selectedRows={selectedRows}
              isProcessingBatch={isProcessingBatch}
              onBatchStatusUpdate={handleBatchStatusUpdate}
              onBatchDelete={handleBatchDelete}
            />
            <Button onClick={onCreateConfig}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
        columnActions={(row) =>
          ConfigActions(row, onDeleteConfig, onEditConfig)
        }
      />

      <ConfigModal
        isOpen={open}
        onOpenChange={setOpen}
        type={type}
        selectedConfigId={selectedConfigId}
        selectedConfigValueType={selectedConfigValueType}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configurations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length}{" "}
              configuration(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
