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
  IParamInfo,
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

const createColumns = (
  roleOptions: { label: string; value: string }[] = [],
): ColumnDef<IUserInfo>[] => [
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
      options: roleOptions,
    },
    size: 150,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) =>
      row.getValue("status") ? (
        <Badge variant="success">Hoạt động</Badge>
      ) : (
        <Badge variant="destructive">Không hoạt động</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: "Trạng thái",
      filterType: "select",
      options: [
        { label: "Hoạt động", value: true },
        { label: "Không hoạt động", value: false },
      ],
    },
    enableResizing: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày tạo" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY hh:mm:ss"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày tạo",
    },
    size: 150,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày cập nhật" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY hh:mm:ss"),
    enableColumnFilter: true,
    size: 150,
    meta: {
      filterType: "date",
      label: "Ngày cập nhật",
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
        {/* <DropdownMenuItem onClick={() => onDelete(row)}>
          Delete
        </DropdownMenuItem> */}
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

  // Fetch user roles from params API
  const { data: userRoles = [] } = useQuery({
    queryKey: ["params", "user_role"],
    queryFn: async () => {
      const response = await api.get<IPaginatedResponse<IParamInfo>>(
        "/params/type/user_role",
      );
      console.log("🚀 ~ UserPage ~ response:", response);
      return response.data.map((role) => ({
        label: role.value,
        value: role.code,
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const userFields = useMemo((): IFormFieldConfig[] => {
    const baseFields: IFormFieldConfig[] = [
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
    ];

    // Only show password field when creating a new user
    if (type === "create") {
      baseFields.push({
        name: "password",
        label: "Mật Khẩu",
        type: "password",
        placeholder: "Nhập mật khẩu",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        showPasswordToggle: true,
      });
    }

    baseFields.push(
      {
        name: "roleType",
        label: "Loại Vai Trò",
        type: "async-select",
        placeholder: "Chọn loại vai trò",
        endpoint: "/params/type/user_role",
        mappingField: "code",
        transformKey: {
          value: "code",
          label: "value",
        },
        className: "w-full",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
      },
    );

    return baseFields;
  }, [type]);

  // Create columns with role options
  const columns = useMemo(() => createColumns(userRoles), [userRoles]);

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
      create: "Thêm Người Dùng Mới",
      edit: "Chỉnh Sửa Người Dùng",
      view: "Xem Thông Tin Người Dùng",
      delete: "Bật/Tắt Trạng Thái Người Dùng",
    } as const;
    const subtitleMap = {
      create: "Điền thông tin để tạo người dùng mới.",
      edit: "Chỉnh sửa thông tin người dùng (không thể thay đổi mật khẩu ở đây).",
      view: "Xem chi tiết thông tin người dùng.",
      delete:
        "Bạn có chắc chắn muốn thay đổi trạng thái hoạt động của người dùng này?",
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
        <h1 className="text-foreground text-2xl font-bold">
          Quản lý người dùng
        </h1>
        <p className="text-muted-foreground">
          Quản lý người dùng và thông tin của họ
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      <p className="text-muted-foreground">
        Quản lý người dùng và thông tin của họ
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
