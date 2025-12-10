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
  IPartner,
  IUserInfo,
  IUserUpdate,
} from "@/shared/interfaces";
import {
  createUserSchema,
  updateUserSchema,
} from "@/shared/schema/admin/user.schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (): ColumnDef<IUserInfo>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Tên",
      filterType: "text",
      placeholder: "Tìm kiếm theo tên...",
    },
    minSize: 200,
    maxSize: 250,
  },
  {
    accessorKey: "userName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên Đăng Nhập" />
    ),
    cell: ({ row }) => row.getValue("userName"),
    enableColumnFilter: true,
    meta: {
      label: "Tên Đăng Nhập",
      filterType: "text",
    },
    size: 150,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => row.getValue("email") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Email",
      filterType: "text",
    },
    minSize: 200,
    maxSize: 250,
  },
  {
    accessorKey: "roleType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại Vai Trò" />
    ),
    cell: ({ row }) => row.getValue("roleType") || "STAFF",
    enableColumnFilter: true,
    meta: {
      label: "Loại Vai Trò",
      filterType: "select",
      options: [
        { label: "Admin", value: "ADMIN" },
        { label: "Staff", value: "STAFF" },
        { label: "User", value: "USER" },
      ],
    },
    size: 150,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) =>
      row.getValue("status") ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="destructive">Inactive</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: "Status",
      filterType: "select",
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
    },
    enableResizing: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY hh:mm:ss"),
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
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY hh:mm:ss"),
    enableColumnFilter: true,
    size: 150,
    meta: {
      filterType: "date",
      label: "Updated At",
    },
  },
];

// User actions component
function UserActions(
  row: Readonly<IUserInfo>,
  onDelete: (role: IUserInfo) => void,
  onEdit: (role: IUserInfo) => void,
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
            } catch (error) {
              console.error("Failed to copy ID:", error);
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

export default function UserPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch partners for selection
  const { data: partnersData } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const response = await api.get<IPaginatedResponse<IPartner>>(
        "/partners",
        { params: { page: 1, pageSize: 1000 } },
      );
      return response;
    },
  });

  const userFields = useMemo((): IFormFieldConfig[] => {
    const partnerOptions =
      partnersData?.data.map((partner) => ({
        label: partner.user?.fullName || partner.id,
        value: partner.id,
      })) || [];

    return [
      {
        name: "name",
        label: "Tên",
        type: "text",
        placeholder: "Nhập tên người dùng",
        description: "Tên hiển thị của người dùng",
      },
      {
        name: "userName",
        label: "Tên Đăng Nhập",
        type: "text",
        placeholder: "Nhập tên đăng nhập",
        description: "Tự động lấy từ email nếu để trống",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Nhập địa chỉ email",
      },
      {
        name: "password",
        label: "Mật Khẩu",
        type: "password",
        placeholder: "Nhập mật khẩu",
        description: "Để trống nếu muốn giữ mật khẩu cũ (khi chỉnh sửa)",
        showPasswordToggle: true,
      },
      {
        name: "roleType",
        label: "Loại Vai Trò",
        type: "select",
        placeholder: "Chọn loại vai trò",
        options: [
          { label: "Admin", value: "ADMIN" },
          { label: "Staff", value: "STAFF" },
          { label: "User", value: "USER" },
        ],
        className: "w-full",
      },
      {
        name: "partnerId",
        label: "Đối Tác",
        type: "select",
        placeholder: "Chọn đối tác (tùy chọn)",
        options: partnerOptions,
        description: "Liên kết người dùng với đối tác",
        className: "w-full",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
        description: "Người dùng có hoạt động không?",
      },
    ];
  }, [partnersData]);

  // Create columns
  const columns = useMemo(() => createColumns(), []);

  const getUsers = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IUserInfo>>(
      "/users/get-list",
      {
        params,
      },
    );
    // Transform the response to match DataTable's expected structure
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateUser = () => {
    setType("create");
    setSelectedUserId(null);
    setOpen(true);
  };

  const onDeleteUser = (user: IUserInfo) => {
    setType("delete");
    setSelectedUserId(user.id);
    setOpen(true);
  };

  const onEditUser = (user: IUserUpdate) => {
    setType("edit");
    setSelectedUserId(user.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Create New User",
      edit: "Edit User",
      view: "View User",
      delete: "Lock User",
    } as const;
    const subtitleMap = {
      create: "Fill in the details below to create a new user.",
      edit: "Modify the user information below.",
      view: "View the user details.",
      delete: "Are you sure you want to lock/unlock this user?",
    } as const;

    const base = "/users" as const;
    const idPath = selectedUserId ? `${base}/${selectedUserId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedUserId ? idPath : "",
      schema: isEdit ? updateUserSchema : createUserSchema,
    };
  }, [type, selectedUserId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and their information
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p className="text-muted-foreground">
        Manage users and their information
      </p>

      <DataTable<IUserInfo, unknown>
        columns={columns}
        queryKey={["users"]}
        queryFn={getUsers}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm người dùng..."
        initialFilters={{}}
        emptyMessage="No users found."
        globalActions={
          <Button onClick={onCreateUser}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) => UserActions(row, onDeleteUser, onEditUser)}
      />

      {open && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={userFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            // Invalidate all user queries to ensure fresh data
            queryClient.invalidateQueries({
              queryKey: ["users"],
              exact: false,
            });
            if (modalConfig.fetchDetailsEndpoint) {
              queryClient.invalidateQueries({
                queryKey: [modalConfig.fetchDetailsEndpoint],
                exact: false,
              });
            }
          }}
          onError={(error) => {
            console.error("Error:", error);
          }}
        />
      )}
    </Card>
  );
}
