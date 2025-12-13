"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
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
import { api } from "@/shared/data/api";
import {
  IPaginatedResponse,
  IResponse,
  IRole,
  RouteInfo,
} from "@/shared/interfaces";
import {
  createRoleSchema,
  updateRoleSchema,
} from "@/shared/schema/admin/role.schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { uniqBy } from "lodash";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const columns: ColumnDef<IRole>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role Code" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Role Code",
      filterType: "text",
      placeholder: "Search by role code...",
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role Name" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Role Name",
      filterType: "text",
      placeholder: "Search by role name...",
    },
    minSize: 250,
    maxSize: 300,
  },
  {
    accessorKey: "isDefault",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Default" />
    ),
    cell: ({ row }) =>
      row.getValue("isDefault") ? (
        <Badge variant={"outline"}>Yes</Badge>
      ) : (
        <Badge variant={"destructive"}>No</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: "Default Role",
      filterType: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    size: 200,
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
    size: 300,
    enableResizing: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY hh:mm"),
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
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY hh:mm"),
    enableColumnFilter: true,
    size: 150,
  },
];

// Role actions component
function RoleActions(
  row: Readonly<IRole>,
  onDelete: (role: IRole) => void,
  onEdit: (role: IRole) => void,
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

export default function RolePage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: routes, error: routesError } = useQuery({
    queryKey: ["routes"],
    queryFn: async (): Promise<RouteInfo[]> => {
      const response =
        await api.get<IResponse<RouteInfo[]>>("/roles/permissions");
      return response.data;
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 4xx errors (client errors)
      if (failureCount < 3) {
        const err = error as Error & { response?: { status?: number } };
        if (
          err?.response?.status &&
          err.response.status >= 400 &&
          err.response.status < 500
        ) {
          return false; // Don't retry client errors
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: mounted, // Only run when component is mounted
  });

  // Handle routes error separately
  useEffect(() => {
    if (routesError) {
      const errorMessage =
        routesError instanceof Error
          ? routesError.message
          : "An error occurred while fetching routes. Please try again.";
      toast.error(errorMessage);
    }
  }, [routesError]);

  const roleFields = useMemo((): IFormFieldConfig[] => {
    const permissionOptions =
      uniqBy(routes ?? [], (r) => `${r.method}:${r.endpoint}`)
        .filter((r) => r.key && !r.isPublic)
        .sort((a, b) => a.controller.localeCompare(b.controller))
        .map((route) => ({
          label: `${route.method.toUpperCase()} ${route.endpoint}`,
          value: route.id,
        })) || [];

    return [
      {
        name: "code",
        label: "Role Code",
        type: "text",
        placeholder: "Enter role code",
        description: "A unique code for the role (e.g., ADMIN, USER)",
      },
      {
        name: "name",
        label: "Role Name",
        type: "text",
        placeholder: "Enter role name",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
      },
      {
        name: "permissions",
        label: "Permissions",
        type: "multiselect",
        placeholder: "Select permissions",
        options: permissionOptions,
        mappingField: "id",
      },
      {
        name: "isDefault",
        label: "Is Default Role",
        type: "checkbox",
      },
    ];
  }, [routes]);

  const getRoles = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IRole>>("/roles", {
      params,
    });
    // Transform the response to match DataTable's expected structure
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateRole = () => {
    setType("create");
    setSelectedRoleId(null);
    setOpen(true);
  };

  const onDeleteRole = (role: IRole) => {
    setType("delete");
    setSelectedRoleId(role.id);
    setOpen(true);
  };

  const onEditRole = (role: IRole) => {
    setType("edit");
    setSelectedRoleId(role.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Create New Role",
      edit: "Edit Role",
      view: "View Role",
      delete: "Delete Role",
    } as const;
    const subtitleMap = {
      create: "Add a new role to the system by filling out the form below.",
      edit: "Modify the role details below.",
      view: "View the role details.",
      delete:
        "Are you sure you want to delete this role? This action cannot be undone.",
    } as const;

    const base = "/roles" as const;
    const idPath = selectedRoleId ? `${base}/${selectedRoleId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedRoleId ? idPath : "",
      schema: isEdit ? updateRoleSchema : createRoleSchema,
    };
  }, [type, selectedRoleId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Role Management</h1>
      <p className="text-muted-foreground">Manage user roles and permissions</p>

      <DataTable<IRole, unknown>
        columns={columns}
        queryKey={["roles"]}
        queryFn={getRoles}
        searchColumn="name"
        searchPlaceholder="Search roles..."
        initialFilters={{}}
        emptyMessage="No roles found."
        globalActions={
          <Button onClick={onCreateRole}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) => RoleActions(row, onDeleteRole, onEditRole)}
      />

      <DynamicModal
        key={`${type}-${selectedRoleId}`}
        open={open}
        onOpenChange={setOpen}
        schema={modalConfig.schema}
        fields={roleFields}
        type={type}
        apiEndpoint={modalConfig.apiEndpoint}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
        onSuccess={() => {
          // Invalidate all role queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
          queryClient.invalidateQueries({
            queryKey: [modalConfig.fetchDetailsEndpoint],
            exact: false,
          });
        }}
        onError={(error) => {
          console.error("Error:", error);
        }}
      />
    </Card>
  );
}
